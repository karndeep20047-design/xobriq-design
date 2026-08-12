import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubscriptionsClient } from "./SubscriptionsClient";

export const metadata = { title: "Subscriptions — Xobriq Console" };

export default async function SubscriptionsPage() {
  await requireStaffPermission("subscriptions");
  const admin = createAdminClient();

  const { data: requests } = await admin
    .from("product_access_requests")
    .select("id, organization_id, product_slug, valid_until")
    .eq("status", "approved")
    .order("valid_until", { ascending: true, nullsFirst: false });

  const orgIds = Array.from(new Set((requests || []).map((r) => r.organization_id)));
  const orgNames: Record<string, string> = {};
  if (orgIds.length > 0) {
    const { data: orgs } = await admin.from("organizations").select("id, name").in("id", orgIds);
    (orgs || []).forEach((o) => { orgNames[o.id] = o.name; });
  }

  const rows = (requests || []).map((r) => ({
    id: r.id,
    organizationId: r.organization_id,
    organizationName: orgNames[r.organization_id] || "Unknown organization",
    productSlug: r.product_slug,
    validUntil: r.valid_until,
  }));

  return <SubscriptionsClient subscriptions={rows} />;
}
