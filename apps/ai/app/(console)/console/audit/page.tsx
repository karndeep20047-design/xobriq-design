import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuditLogClient } from "./AuditLogClient";

export const metadata = { title: "Audit Log — Xobriq Console" };

type SearchParams = Promise<{
  q?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
  org?: string;
  page?: string;
}>;

const PAGE_SIZE = 50;

export default async function AuditPage(props: { searchParams: SearchParams }) {
  await requireStaffPermission("audit");
  const sp = await props.searchParams;
  const admin = createAdminClient();

  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  let query = admin
    .from("audit_logs")
    .select("id, actor_id, actor_email, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at, organization_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (sp.q) {
    query = query.or(`actor_email.ilike.%${sp.q}%,action.ilike.%${sp.q}%,resource_type.ilike.%${sp.q}%`);
  }
  if (sp.action) {
    query = query.eq("action", sp.action);
  }
  if (sp.actor) {
    query = query.ilike("actor_email", `%${sp.actor}%`);
  }
  if (sp.from) {
    query = query.gte("created_at", sp.from);
  }
  if (sp.to) {
    query = query.lte("created_at", sp.to);
  }
  if (sp.org) {
    query = query.eq("organization_id", sp.org);
  }

  const [{ data: rows, count }, { data: actionRows }, { data: organizations }] = await Promise.all([
    query,
    // Get distinct actions for the filter dropdown
    admin.from("audit_logs").select("action").limit(1000),
    admin.from("organizations").select("id, name").order("name", { ascending: true }),
  ]);

  const distinctActions = Array.from(new Set((actionRows || []).map((r) => r.action))).sort();

  const orgNameById: Record<string, string> = {};
  (organizations || []).forEach((o) => { orgNameById[o.id] = o.name; });

  const rowsWithOrgName = (rows || []).map((r) => ({
    ...r,
    organization_name: r.organization_id ? orgNameById[r.organization_id] || null : null,
  }));

  return (
    <AuditLogClient
      rows={rowsWithOrgName as any}
      total={count || 0}
      pageSize={PAGE_SIZE}
      page={page}
      distinctActions={distinctActions}
      organizations={(organizations || []) as { id: string; name: string }[]}
      filters={sp}
    />
  );
}
