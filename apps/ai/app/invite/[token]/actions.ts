"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { isAuthActionRateLimited } from "@/lib/rate-limit";

const AcceptSchema = z.object({
  token: z.string().min(10),
  full_name: z.string().min(2).max(120),
  password: z.string().min(12).max(200),
});

export async function acceptInviteAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = AcceptSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
  if (await isAuthActionRateLimited(admin, ip, ["staff.invitation_accepted"], { windowMs: 60 * 60_000, max: 10 })) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  const { data: invite } = await admin
    .from("invitations")
    .select("id, email, xobriq_staff_role, organization_id, role, expires_at, accepted_at")
    .eq("token", parsed.data.token)
    .maybeSingle();

  if (!invite) return { ok: false, error: "Invitation not found" };
  if (invite.accepted_at) return { ok: false, error: "Invitation already accepted. Please sign in normally." };
  if (new Date(invite.expires_at) < new Date()) return { ok: false, error: "Invitation expired" };

  // ─── SESSION ISOLATION ─────────────────────────────────────────
  // Before creating the invitee's session, KILL any existing session
  // in this browser. This prevents session mix-up if the same tab
  // was previously used to log in as someone else.
  const supabase = await createClient();
  const { data: { user: existingUser } } = await supabase.auth.getUser();

  if (existingUser && existingUser.email?.toLowerCase() !== invite.email.toLowerCase()) {
    // Different user in the tab — force-sign them out first
    await supabase.auth.signOut({ scope: "global" });

    // Nuke all sb-* cookies
    const cookieStore = await cookies();
    for (const c of cookieStore.getAll()) {
      if (c.name.startsWith("sb-") || c.name.includes("supabase")) {
        cookieStore.delete(c.name);
      }
    }

    await logAudit({
      actor_id: existingUser.id,
      actor_email: existingUser.email,
      action: "auth.forced_logout",
      metadata: { reason: "invite_accepted_by_different_user", invitee: invite.email },
    });
  }

  // ─── CREATE OR UPDATE USER ─────────────────────────────────────
  // By this point, existingUser is either null or already matches
  // invite.email (any mismatched session was force-signed-out above) —
  // so that check is proof of ownership, not a guess.
  const alreadySignedInAsInvitee = existingUser?.email?.toLowerCase() === invite.email.toLowerCase();
  let userId: string | undefined;
  let skipPasswordSignIn = false;

  const { data: created, error: signUpErr } = await admin.auth.admin.createUser({
    email: invite.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });

  if (created?.user) {
    userId = created.user.id;
  } else {
    // Email already belongs to an existing account. Never overwrite that
    // account's password just because an anonymous form-submitter typed
    // one in — only proceed if the browser is already authenticated as
    // that exact account (proven above), otherwise this is the
    // account-takeover path: reject and leave the invitation pending so
    // the legitimate "sign in first, then reopen this link" flow works.
    if (!alreadySignedInAsInvitee) {
      return {
        ok: false,
        error: "An account with this email already exists. Sign in first, then open this invite link again to accept it.",
      };
    }

    const { data: existing } = await admin.auth.admin.listUsers();
    const existingUserRow = existing.users.find((u) => u.email?.toLowerCase() === invite.email.toLowerCase());

    if (!existingUserRow) return { ok: false, error: signUpErr?.message || "Failed to create user" };

    userId = existingUserRow.id;
    skipPasswordSignIn = true;
  }

  if (!userId) return { ok: false, error: "Failed to resolve user" };

  // ─── PROMOTE + LINK ─────────────────────────────────────────
  await admin.from("profiles").upsert({
    id: userId,
    email: invite.email,
    full_name: parsed.data.full_name,
    xobriq_staff_role: invite.xobriq_staff_role,
    default_org_id: invite.organization_id,
  }, { onConflict: "id" });

  await admin.from("organization_members").upsert({
    organization_id: invite.organization_id,
    user_id: userId,
    role: invite.role,
  }, { onConflict: "organization_id,user_id" });

  await admin.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

  await logAudit({
    actor_id: userId,
    actor_email: invite.email,
    organization_id: invite.organization_id,
    action: "staff.invitation_accepted",
    resource_type: "invitation",
    resource_id: invite.id,
    metadata: { role: invite.xobriq_staff_role },
  });

  // ─── SIGN THEM IN (fresh session, isolated) ────────────────────
  // Skipped when the browser was already authenticated as this exact
  // account (the pre-existing-account branch above) — they're already in
  // a valid session, and this account's password was never touched.
  if (!skipPasswordSignIn) {
    await supabase.auth.signInWithPassword({
      email: invite.email,
      password: parsed.data.password,
    });
  }

  // This one function handles both staff invites (xobriq_staff_role set)
  // and client-org owner invites (organization_id/role set) — landing a
  // client owner on /console isn't a security issue (requireStaff() there
  // immediately bounces them to /dashboard anyway) but it's a pointless
  // extra redirect hop for every client-org owner accepting an invite.
  redirect(invite.xobriq_staff_role ? "/console" : "/dashboard");
}