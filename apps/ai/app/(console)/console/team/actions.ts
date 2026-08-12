"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { ROLE_LABELS, type StaffRole } from "@/lib/session-types";
import { requireStaffPermission, getDefaultCustomRoleIdForLegacyRole } from "@/lib/staff-permissions";
import { sendStaffInviteEmail } from "@/lib/email/send-staff-invite";

const INVITE_EXPIRES_DAYS = 30;

const InviteSchema = z.object({
  email: z.string().email().max(200),
  full_name: z.string().min(2).max(120),
  xobriq_staff_role: z.enum([
    "super_admin", "cto", "tech_lead", "senior_dev", "developer",
    "ml_lead", "cyber_sec", "product_manager", "finance_hr",
    "marketing_head", "content_admin", "content_writer"
  ]),
  role: z.enum(["owner", "admin", "member"]).default("member"),
  custom_staff_role_id: z.string().uuid().optional().or(z.literal("")),
});

export async function inviteStaffAction(formData: FormData) {
  let ctx;
  try {
    ctx = await requireStaffPermission("team");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const raw = Object.fromEntries(formData.entries());
  const parsed = InviteSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();

  // A role id from the client is never trusted on its own — confirm it
  // still exists before attaching it to an invite or a profile.
  let customStaffRoleId: string | null = null;
  if (parsed.data.custom_staff_role_id) {
    const { data: customRole } = await admin
      .from("staff_roles")
      .select("id")
      .eq("id", parsed.data.custom_staff_role_id)
      .maybeSingle();
    if (!customRole) return { ok: false, error: "That permission role no longer exists" };
    customStaffRoleId = customRole.id;
  } else {
    // No explicit permission role picked — fall back to whichever seeded
    // role reproduces the chosen fixed role's default access, so a new
    // hire never lands on NO_ACCESS just because this optional field was
    // left blank.
    customStaffRoleId = await getDefaultCustomRoleIdForLegacyRole(admin, parsed.data.xobriq_staff_role);
  }

  // Find Xobriq org
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", "xobriq")
    .single();

  if (!org) return { ok: false, error: "Xobriq organization not found" };

  // Check if this email is already a profile
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, xobriq_staff_role")
    .eq("email", parsed.data.email.toLowerCase())
    .maybeSingle();

  if (existingProfile?.xobriq_staff_role) {
    return { ok: false, error: "This person is already a Xobriq staff member." };
  }

  // If they already exist as a profile, just promote them directly
  if (existingProfile) {
    await admin.from("profiles").update({
      xobriq_staff_role: parsed.data.xobriq_staff_role,
      custom_staff_role_id: customStaffRoleId,
      default_org_id: org.id,
      full_name: parsed.data.full_name,
    }).eq("id", existingProfile.id);

    await admin.from("organization_members").insert({
      organization_id: org.id,
      user_id: existingProfile.id,
      role: parsed.data.role,
      invited_by: staff.id,
    });

    await logAudit({
      actor_id: staff.id,
      actor_email: staff.email,
      action: "staff.promoted",
      resource_type: "profile",
      resource_id: existingProfile.id,
      metadata: { email: parsed.data.email, role: parsed.data.xobriq_staff_role },
    });

    revalidatePath("/console/team");
    return { ok: true, message: "User promoted to " + parsed.data.xobriq_staff_role };
  }

  // Otherwise create an invitation
  // Delete any existing pending invitation for this email
  await admin.from("invitations").delete()
    .eq("email", parsed.data.email.toLowerCase())
    .is("accepted_at", null);

  const { data: invite, error: inviteErr } = await admin
    .from("invitations")
    .insert({
      organization_id: org.id,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      xobriq_staff_role: parsed.data.xobriq_staff_role,
      custom_staff_role_id: customStaffRoleId,
      invited_by: staff.id,
      expires_at: new Date(Date.now() + INVITE_EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id, token")
    .single();

  if (inviteErr) return { ok: false, error: inviteErr.message };

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "staff.invited",
    resource_type: "invitation",
    resource_id: invite.id,
    metadata: {
      email: parsed.data.email,
      staff_role: parsed.data.xobriq_staff_role,
      org_role: parsed.data.role,
    },
  });

  const inviteLink =
    (process.env.NEXT_PUBLIC_APP_URL || "https://xobriq-ai-psi.vercel.app") + "/invite/" + invite.token;

  const emailResult = await sendStaffInviteEmail({
    invitation_id: invite.id,
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    role_label: ROLE_LABELS[parsed.data.xobriq_staff_role],
    invited_by_name: staff.full_name || staff.email,
    invite_url: inviteLink,
    expires_days: INVITE_EXPIRES_DAYS,
  });

  revalidatePath("/console/team");
  return {
    ok: true,
    message: emailResult.ok
      ? "Invitation sent to " + parsed.data.email
      : "Invitation created, but the email failed to send — share the link below manually",
    inviteLink,
  };
}

export async function revokeInviteAction(inviteId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("team");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: invite } = await admin.from("invitations").select("email").eq("id", inviteId).single();

  await admin.from("invitations").delete().eq("id", inviteId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "staff.invite_revoked",
    resource_type: "invitation",
    resource_id: inviteId,
    metadata: { email: invite?.email },
  });

  revalidatePath("/console/team");
  return { ok: true };
}

export async function changeStaffRoleAction(profileId: string, newRole: StaffRole) {
  let ctx;
  try {
    ctx = await requireStaffPermission("team");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: target } = await admin.from("profiles").select("email, xobriq_staff_role").eq("id", profileId).single();

  // Changing the fixed role also resets the permission role to that role's
  // default — otherwise this person's *actual* access (governed by
  // custom_staff_role_id) would silently stay on their old permission set.
  // super_admin ignores custom_staff_role_id entirely (it's the bootstrap
  // tier), so it's cleared rather than defaulted.
  const defaultCustomRoleId = newRole === "super_admin" ? null : await getDefaultCustomRoleIdForLegacyRole(admin, newRole);

  await admin.from("profiles").update({ xobriq_staff_role: newRole, custom_staff_role_id: defaultCustomRoleId }).eq("id", profileId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "staff.role_changed",
    resource_type: "profile",
    resource_id: profileId,
    metadata: { email: target?.email, from: target?.xobriq_staff_role, to: newRole },
  });

  revalidatePath("/console/team");
  return { ok: true };
}

export async function changeStaffCustomRoleAction(profileId: string, customStaffRoleId: string | null) {
  let ctx;
  try {
    ctx = await requireStaffPermission("team");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  let roleName: string | null = null;
  if (customStaffRoleId) {
    const { data: role } = await admin.from("staff_roles").select("id, name").eq("id", customStaffRoleId).maybeSingle();
    if (!role) return { ok: false, error: "That permission role no longer exists" };
    roleName = role.name;
  }

  const { data: target } = await admin.from("profiles").select("email").eq("id", profileId).single();

  await admin.from("profiles").update({ custom_staff_role_id: customStaffRoleId }).eq("id", profileId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "staff.custom_role_changed",
    resource_type: "profile",
    resource_id: profileId,
    metadata: { email: target?.email, custom_staff_role: roleName },
  });

  revalidatePath("/console/team");
  return { ok: true };
}

export async function revokeStaffAction(profileId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("team");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  if (staff.id === profileId) {
    return { ok: false, error: "You cannot revoke your own access" };
  }

  const { data: target } = await admin.from("profiles").select("email, xobriq_staff_role").eq("id", profileId).single();

  await admin.from("profiles").update({ xobriq_staff_role: null }).eq("id", profileId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "staff.access_revoked",
    resource_type: "profile",
    resource_id: profileId,
    metadata: { email: target?.email, previous_role: target?.xobriq_staff_role },
  });

  revalidatePath("/console/team");
  return { ok: true };
}