import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { RolesPageClient } from "./RolesPageClient";

export const metadata = { title: "Staff Roles — Xobriq Console" };

export default async function StaffRolesPage() {
  await requireStaffPermission("manage_roles");
  const admin = createAdminClient();

  const { data: roles } = await admin
    .from("staff_roles")
    .select("id, name, permissions")
    .order("name", { ascending: true });

  return <RolesPageClient roles={(roles || []) as any} />;
}
