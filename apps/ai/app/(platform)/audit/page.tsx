import { requireOrgPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuditLogClient, type AuditRow } from "./AuditLogClient";

export const metadata = { title: "Audit Log — Xobriq" };

export default async function AuditPage() {
  const { organizationId: orgId } = await requireOrgPermission("audit_log");
  const admin = createAdminClient();

  const [{ data: rows }, { data: memberships }, { data: customRoles }] = await Promise.all([
    admin
      .from("audit_logs")
      .select("id, actor_id, actor_email, action, resource_type, metadata, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("organization_members")
      .select("user_id, role, custom_role_id")
      .eq("organization_id", orgId),
    admin
      .from("organization_roles")
      .select("id, name")
      .eq("organization_id", orgId),
  ]);

  const customRoleNameById: Record<string, string> = {};
  (customRoles || []).forEach((r) => { customRoleNameById[r.id] = r.name; });

  // role/name only cover CURRENT members — an audit row from someone who
  // has since left the org still shows their email (below) but falls back
  // to "Member" for role since there's no membership row left to read.
  const roleByUserId: Record<string, { role: "owner" | "admin" | "member"; customRoleName: string | null }> = {};
  (memberships || []).forEach((m) => {
    roleByUserId[m.user_id] = {
      role: m.role as "owner" | "admin" | "member",
      customRoleName: m.custom_role_id ? customRoleNameById[m.custom_role_id] || null : null,
    };
  });

  const actorIds = Array.from(new Set((rows || []).map((r) => r.actor_id).filter((id): id is string => !!id)));
  const profileMap: Record<string, { full_name: string | null }> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", actorIds);
    (profiles || []).forEach((p) => { profileMap[p.id] = { full_name: p.full_name }; });
  }

  const enriched: AuditRow[] = (rows || []).map((r) => {
    const membership = r.actor_id ? roleByUserId[r.actor_id] : undefined;
    return {
      id: r.id,
      actorEmail: r.actor_email,
      actorName: (r.actor_id ? profileMap[r.actor_id]?.full_name : null) || null,
      role: membership?.role || null,
      customRoleName: membership?.customRoleName || null,
      action: r.action,
      resourceType: r.resource_type,
      metadata: r.metadata as Record<string, unknown> | null,
      createdAt: r.created_at,
    };
  });

  return <AuditLogClient rows={enriched} />;
}
