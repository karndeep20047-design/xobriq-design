import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductAccessClient } from "./ProductAccessClient";

export const metadata = { title: "Product Access — Xobriq Console" };

export default async function ProductAccessPage() {
  await requireStaffPermission("product_access");
  const admin = createAdminClient();

  const { data: requests } = await admin
    .from("product_access_requests")
    .select(
      "id, organization_id, product_slug, status, requested_at, reviewed_at, notes, " +
        "production_status, production_requested_at, production_reviewed_at, production_client_message, production_review_notes"
    )
    .order("requested_at", { ascending: false });

  const orgIds = Array.from(new Set((requests || []).map((r) => r.organization_id)));
  let orgNames: Record<string, string> = {};

  if (orgIds.length > 0) {
    const { data: orgs } = await admin
      .from("organizations")
      .select("id, name")
      .in("id", orgIds);
    (orgs || []).forEach((o) => { orgNames[o.id] = o.name; });
  }

  const rows = (requests || []).map((r) => ({
    ...r,
    organization_name: orgNames[r.organization_id] || "Unknown organization",
  }));

  return <ProductAccessClient requests={rows as any} />;
}
