"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { sendOrgInviteEmail } from "@/lib/email/send-org-invite";
import { ORG_PERMISSION_KEYS, type OrgPermissions } from "@/lib/permissions-shared";

// Only the org owner or an admin can manage team membership — this is a
// fixed org-management authority, distinct from the togglable
// organization_roles permissions (a custom role is about what data someone
// can SEE, not whether they can manage other people).
async function requireOrgOwnerOrAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  if (!user.default_org_id) throw new Error("No organization");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", user.default_org_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("You don't have permission to manage the team");
  }

  return { user, orgId: user.default_org_id as string };
}

const InviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  assignment: z.enum(["admin", "member", "custom"], { message: "Select a role" }),
  custom_role_id: z.string().uuid().optional().or(z.literal("")),
});

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

// Org-level guard, not a role permission: whether invitations are restricted
// to a company domain (e.g. only @sacco.co.ke) is a property of the whole
// organization's onboarding process, unrelated to what any one member can
// see. An org with no domains set (the default — most solo devs and small
// teams) can still invite any address, gmail/yahoo included.
//
// Uses organizations.email_domains — NOT "allowed_invite_domains", which
// doesn't exist as a real column (confirmed live) and would fail every call
// with a Postgres 42703 error.
export async function updateInviteDomainsAction(formData: FormData) {
  let ctx;
  try {
    ctx = await requireOrgOwnerOrAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user, orgId } = ctx;

  const raw = (formData.get("domains") as string | null) || "";
  const domains = Array.from(
    new Set(
      raw
        .split(/[\n,]/)
        .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean)
    )
  );

  for (const d of domains) {
    if (!DOMAIN_RE.test(d)) {
      return { ok: false, error: `"${d}" doesn't look like a valid domain (e.g. sacco.co.ke)` };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ email_domains: domains.length > 0 ? domains : null })
    .eq("id", orgId);

  if (error) {
    console.error("[team] update invite domains failed:", error.message);
    return { ok: false, error: "Failed to save. Please try again." };
  }

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: orgId,
    action: "team.invite_domains_updated",
    resource_type: "organization",
    resource_id: orgId,
    metadata: { domains },
  });

  revalidatePath("/team");
  return { ok: true, domains };
}

export async function inviteTeamMemberAction(formData: FormData) {
  let ctx: { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; orgId: string };
  try {
    ctx = await requireOrgOwnerOrAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user, orgId } = ctx;

  const raw = Object.fromEntries(formData.entries());
  const parsed = InviteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();

  const { data: orgDomainCheck } = await admin
    .from("organizations")
    .select("email_domains, name")
    .eq("id", orgId)
    .maybeSingle();

  const allowedDomains = orgDomainCheck?.email_domains as string[] | null;
  if (allowedDomains && allowedDomains.length > 0 && !allowedDomains.includes(emailDomain(parsed.data.email))) {
    return {
      ok: false,
      error: "Invitations for this organization are restricted to: " + allowedDomains.map((d) => "@" + d).join(", "),
    };
  }

  let customRoleId: string | null = null;
  let roleLabel = parsed.data.assignment === "admin" ? "Admin" : "Member";

  if (parsed.data.assignment === "custom") {
    if (!parsed.data.custom_role_id) {
      return { ok: false, error: "Select a role" };
    }
    // Never trust a role id from the client without confirming it actually
    // belongs to THIS org — otherwise someone could invite a teammate into
    // a permission set defined by a completely different organization.
    const { data: customRole } = await admin
      .from("organization_roles")
      .select("id, name, organization_id")
      .eq("id", parsed.data.custom_role_id)
      .maybeSingle();

    if (!customRole || customRole.organization_id !== orgId) {
      return { ok: false, error: "That role no longer exists" };
    }
    customRoleId = customRole.id;
    roleLabel = customRole.name;
  }

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, default_org_id")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (existingProfile?.default_org_id === orgId) {
    return { ok: false, error: "This person is already on your team." };
  }

  // Any other existing account (a different org's member, or Xobriq staff)
  // also gets blocked here, not just a same-org duplicate — inviting them
  // used to route through the accept-invite flow's password-overwrite bug.
  // A client org owner/admin is a less-trusted caller than internal staff,
  // so the safe default is to block and explain rather than silently
  // granting membership to a pre-existing, possibly-unrelated account.
  if (existingProfile) {
    return {
      ok: false,
      error: "An account with this email already exists. Ask them to request access to your organization from their own dashboard instead.",
    };
  }

  await admin
    .from("invitations")
    .delete()
    .eq("email", parsed.data.email)
    .eq("organization_id", orgId)
    .is("accepted_at", null);

  const { data: invite, error: inviteErr } = await admin
    .from("invitations")
    .insert({
      organization_id: orgId,
      email: parsed.data.email,
      role: parsed.data.assignment === "admin" ? "admin" : "member",
      custom_role_id: customRoleId,
      xobriq_staff_role: null,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id, token")
    .single();

  if (inviteErr || !invite) {
    console.error("[team] invite creation failed:", inviteErr?.message);
    return { ok: false, error: "Failed to create invitation" };
  }

  const inviteLink =
    (process.env.NEXT_PUBLIC_APP_URL || "https://xobriq-ai-psi.vercel.app") + "/invite/" + invite.token;

  const emailResult = await sendOrgInviteEmail({
    invitation_id: invite.id,
    email: parsed.data.email,
    full_name: parsed.data.email.split("@")[0],
    organization_name: orgDomainCheck?.name || "your organization",
    role_label: roleLabel,
    invited_by_name: user.full_name || user.email,
    invite_url: inviteLink,
    expires_days: 30,
  });

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: orgId,
    action: "team.member_invited",
    resource_type: "invitation",
    resource_id: invite.id,
    metadata: { email: parsed.data.email, assignment: parsed.data.assignment, role_label: roleLabel },
  });

  revalidatePath("/team");
  return {
    ok: true,
    message: emailResult.ok
      ? "Invitation sent to " + parsed.data.email
      : "Invitation created, but the email failed to send — share the link below manually",
    inviteLink,
  };
}

export async function revokeTeamInviteAction(inviteId: string) {
  let ctx;
  try {
    ctx = await requireOrgOwnerOrAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user, orgId } = ctx;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invitations")
    .select("organization_id, email")
    .eq("id", inviteId)
    .maybeSingle();

  // organization_id must match the caller's own org — a "just trust the id"
  // shortcut here would let one org revoke another's pending invite.
  if (!invite || invite.organization_id !== orgId) return { ok: false, error: "Not found" };

  await admin.from("invitations").delete().eq("id", inviteId);

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: orgId,
    action: "team.invite_revoked",
    resource_type: "invitation",
    resource_id: inviteId,
    metadata: { email: invite.email },
  });

  revalidatePath("/team");
  return { ok: true };
}

export async function removeTeamMemberAction(memberId: string) {
  let ctx;
  try {
    ctx = await requireOrgOwnerOrAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user, orgId } = ctx;

  if (memberId === user.id) {
    return { ok: false, error: "You cannot remove yourself" };
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", memberId)
    .maybeSingle();

  if (!member) return { ok: false, error: "Not found" };
  if (member.role === "owner") return { ok: false, error: "Cannot remove the organization owner" };

  await admin.from("organization_members").delete().eq("organization_id", orgId).eq("user_id", memberId);
  await admin.from("profiles").update({ default_org_id: null }).eq("id", memberId).eq("default_org_id", orgId);

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: orgId,
    action: "team.member_removed",
    resource_type: "profile",
    resource_id: memberId,
  });

  revalidatePath("/team");
  return { ok: true };
}

export async function changeTeamMemberRoleAction(memberId: string, newRole: "admin" | "member", customRoleId: string | null) {
  let ctx;
  try {
    ctx = await requireOrgOwnerOrAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user, orgId } = ctx;

  if (memberId === user.id) return { ok: false, error: "You can't change your own role" };

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", memberId)
    .maybeSingle();

  if (!member) return { ok: false, error: "Not found" };
  if (member.role === "owner") return { ok: false, error: "The organization owner's role can't be changed" };

  if (customRoleId) {
    const { data: customRole } = await admin
      .from("organization_roles")
      .select("id, organization_id")
      .eq("id", customRoleId)
      .maybeSingle();
    if (!customRole || customRole.organization_id !== orgId) {
      return { ok: false, error: "That role no longer exists" };
    }
  }

  const { error } = await admin
    .from("organization_members")
    .update({ role: newRole, custom_role_id: customRoleId })
    .eq("organization_id", orgId)
    .eq("user_id", memberId);

  if (error) return { ok: false, error: error.message };

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: orgId,
    action: "team.member_role_changed",
    resource_type: "profile",
    resource_id: memberId,
    metadata: { to: newRole, custom_role_id: customRoleId },
  });

  revalidatePath("/team");
  return { ok: true };
}

// Lets an owner/admin grant or strip one specific permission for one
// specific member without touching their role — e.g. a member on a role
// that doesn't include audit_log can be given it individually, or an admin
// can have billing specifically taken away. `overrides` only ever contains
// keys the caller explicitly set to Grant/Deny; anything left "Inherit" is
// omitted so we never persist a redundant no-op override.
export async function updateMemberPermissionOverridesAction(
  memberId: string,
  overrides: Partial<OrgPermissions>
) {
  let ctx;
  try {
    ctx = await requireOrgOwnerOrAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user, orgId } = ctx;
  const admin = createAdminClient();

  const { data: member } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", memberId)
    .maybeSingle();

  if (!member) return { ok: false, error: "Not found" };
  if (member.role === "owner") {
    return { ok: false, error: "The organization owner's access cannot be overridden" };
  }

  const cleaned: Partial<OrgPermissions> = {};
  for (const key of ORG_PERMISSION_KEYS) {
    const value = overrides[key];
    if (value === true || value === false) cleaned[key] = value;
  }

  const { error } = await admin
    .from("organization_members")
    .update({ permission_overrides: cleaned })
    .eq("organization_id", orgId)
    .eq("user_id", memberId);

  if (error) return { ok: false, error: "Failed to save. Please try again." };

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: orgId,
    action: "team.permission_override_changed",
    resource_type: "profile",
    resource_id: memberId,
    metadata: { overrides: cleaned },
  });

  revalidatePath("/team");
  return { ok: true };
}
