import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { TeamPageClient } from "./TeamPageClient";

export const metadata = { title: "Team — Xobriq Console" };

export default async function TeamPage() {
  const { user: currentStaff } = await requireStaffPermission("team");
  const admin = createAdminClient();

  const [{ data: activeStaff }, { data: pendingInvites }, { data: staffRoles }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, avatar_url, xobriq_staff_role, custom_staff_role_id, created_at")
      .not("xobriq_staff_role", "is", null)
      .order("created_at", { ascending: true }),
    admin
      .from("invitations")
      .select("id, email, role, xobriq_staff_role, custom_staff_role_id, created_at, expires_at, token")
      .is("accepted_at", null)
      .not("xobriq_staff_role", "is", null)
      .order("created_at", { ascending: false }),
    admin
      .from("staff_roles")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  const roleNameById: Record<string, string> = {};
  (staffRoles || []).forEach((r) => { roleNameById[r.id] = r.name; });

  const pendingWithRoleName = (pendingInvites || []).map((i) => ({
    ...i,
    custom_staff_role_name: i.custom_staff_role_id ? roleNameById[i.custom_staff_role_id] || null : null,
  }));

  return (
    <TeamPageClient
      currentUserId={currentStaff.id}
      activeStaff={(activeStaff || []) as any}
      pendingInvites={pendingWithRoleName as any}
      staffRoles={(staffRoles || []) as { id: string; name: string }[]}
    />
  );
}
