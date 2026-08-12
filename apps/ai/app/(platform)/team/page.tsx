import { requireOrgPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { TeamPageClient, type TeamMemberRow, type PendingInviteRow, type CustomRoleOption } from "./TeamPageClient";

export const metadata = { title: "Team — Xobriq" };

export default async function TeamPage() {
  const { userId, organizationId: orgId } = await requireOrgPermission("team");
  const admin = createAdminClient();

  const [{ data: memberships }, { data: customRoles }, { data: orgRow }] = await Promise.all([
    admin
      .from("organization_members")
      .select("user_id, role, custom_role_id, joined_at, permission_overrides")
      .eq("organization_id", orgId)
      .order("joined_at", { ascending: true }),
    admin
      .from("organization_roles")
      .select("id, name, permissions")
      .eq("organization_id", orgId)
      .order("name", { ascending: true }),
    admin
      .from("organizations")
      .select("email_domains")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  const roleNameById: Record<string, string> = {};
  (customRoles || []).forEach((r) => { roleNameById[r.id] = r.name; });

  const userIds = (memberships || []).map((m) => m.user_id);
  let profileMap: Record<string, { email: string; full_name: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await admin.from("profiles").select("id, email, full_name").in("id", userIds);
    (profiles || []).forEach((p) => { profileMap[p.id] = { email: p.email, full_name: p.full_name }; });
  }

  const members: TeamMemberRow[] = (memberships || []).map((m) => ({
    userId: m.user_id,
    role: m.role as "owner" | "admin" | "member",
    customRoleId: m.custom_role_id,
    customRoleName: m.custom_role_id ? roleNameById[m.custom_role_id] || null : null,
    joinedAt: m.joined_at,
    email: profileMap[m.user_id]?.email || "unknown",
    name: profileMap[m.user_id]?.full_name || profileMap[m.user_id]?.email || "Unknown",
  }));

  const { data: pendingInvites } = await admin
    .from("invitations")
    .select("id, email, role, custom_role_id, created_at, expires_at, token")
    .eq("organization_id", orgId)
    .is("accepted_at", null)
    .is("xobriq_staff_role", null)
    .order("created_at", { ascending: false });

  const pendingRows: PendingInviteRow[] = (pendingInvites || []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    customRoleName: i.custom_role_id ? roleNameById[i.custom_role_id] || null : null,
    createdAt: i.created_at,
    expiresAt: i.expires_at,
  }));

  const currentUserRole = members.find((m) => m.userId === userId)?.role || null;

  return (
    <TeamPageClient
      currentUserId={userId}
      currentUserRole={currentUserRole}
      members={members}
      pendingInvites={pendingRows}
      customRoles={(customRoles || []) as CustomRoleOption[]}
      emailDomains={(orgRow?.email_domains as string[] | null) || null}
    />
  );
}
