import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseApiUsageFilters, type RawFilterParams } from "@/lib/api-usage/filters";
import {
  getSummaryCards,
  getTimeseries,
  getServiceDistribution,
  getOrgUsagePage,
  getFilterOptions,
} from "@/lib/api-usage/queries";
import { ApiUsageClient } from "./ApiUsageClient";

export const metadata = { title: "API Usage — Xobriq Console" };

type SearchParams = Promise<RawFilterParams>;

export default async function ApiUsagePage(props: { searchParams: SearchParams }) {
  const { access } = await requireStaffPermission("api_usage");
  const sp = await props.searchParams;
  const admin = createAdminClient();

  const { filters, rangePreset } = parseApiUsageFilters(sp);

  const [summary, timeseries, serviceDistribution, orgPage, filterOptions] = await Promise.all([
    getSummaryCards(admin, filters),
    getTimeseries(admin, filters),
    getServiceDistribution(admin, filters),
    getOrgUsagePage(admin, filters),
    getFilterOptions(admin),
  ]);

  return (
    <ApiUsageClient
      filters={filters}
      rangePreset={rangePreset}
      summary={summary}
      timeseries={timeseries}
      serviceDistribution={serviceDistribution}
      orgPage={orgPage}
      filterOptions={filterOptions}
      canExport={access.isSuperAdmin || access.permissions.api_usage_export}
      canViewWallet={access.isSuperAdmin || access.permissions.api_usage_wallet}
    />
  );
}
