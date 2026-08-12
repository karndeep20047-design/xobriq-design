import { NextRequest, NextResponse } from "next/server";
import { getStaffAccess } from "@/lib/staff-permissions";
import { requireStaff } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { parseApiUsageFilters } from "@/lib/api-usage/filters";
import { getOrgUsagePage } from "@/lib/api-usage/queries";
import { streamCsvResponse } from "@/lib/api-usage/csv";
import { API_USAGE_EXPORT_HEADERS, orgUsageRowToCsvFields } from "@/lib/api-usage/export-format";

// GET /console/api-usage/export?<same filters as the page> — never exports
// raw API secrets, identity documents, or unmasked personal information;
// this is exactly the operational/billing rollup already shown in the org
// table, re-queried server-side with the same filters rather than the
// browser's already-rendered rows (so a very large result isn't limited to
// whatever page size the page happened to load).
export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  const access = await getStaffAccess(staff.id);
  if (!access?.isSuperAdmin && !access?.permissions.api_usage_export) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const { filters } = parseApiUsageFilters(sp);
  const admin = createAdminClient();

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: filters.organizationId,
    action: "api_usage.exported",
    resource_type: "api_usage_export",
    metadata: { filters },
  });

  return streamCsvResponse(
    `api-usage-${filters.to.slice(0, 10)}.csv`,
    API_USAGE_EXPORT_HEADERS,
    // getOrgUsagePage() is 1-indexed and already returns [] past the last
    // page — the loop in streamCsvResponse stops there, so pages just need
    // to be requested in order.
    async (page) => {
      const { rows } = await getOrgUsagePage(admin, { ...filters, page: page + 1 });
      return rows;
    },
    orgUsageRowToCsvFields
  );
}
