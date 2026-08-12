import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { RolesPageClient } from "./RolesPageClient";

export const metadata = { title: "Roles — Xobriq" };

export default async function RolesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/team/roles");
  if (!user.default_org_id) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", user.default_org_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    redirect("/team");
  }

  const { data: roles } = await admin
    .from("organization_roles")
    .select("id, name, permissions")
    .eq("organization_id", user.default_org_id)
    .order("name", { ascending: true });

  return <RolesPageClient roles={(roles || []) as any} />;
}
