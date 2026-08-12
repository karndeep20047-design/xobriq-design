import { notFound } from "next/navigation";
import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { parseApiUsageFilters, type RawFilterParams } from "@/lib/api-usage/filters";
import {
  getOrganizationOverview,
  getApiKeysForOrg,
  getServiceDistribution,
  getClientPricingForOrg,
  getRecentRequestsForOrg,
  getWalletSummaryForOrg,
  getWalletLedgerForOrg,
} from "@/lib/api-usage/queries";
import { OrganizationOverviewSection } from "./OrganizationOverviewSection";
import { ApiKeysSection } from "./ApiKeysSection";
import { ServiceUsageSection } from "./ServiceUsageSection";
import { RecentRequestsSection } from "./RecentRequestsSection";
import { WalletSection } from "./WalletSection";

export const metadata = { title: "Organization Usage — Xobriq Console" };

type Params = Promise<{ organizationId: string }>;
type SearchParams = Promise<RawFilterParams & { requestsPage?: string; walletPage?: string }>;

export default async function OrganizationUsagePage(props: { params: Params; searchParams: SearchParams }) {
  const { user: staff, access } = await requireStaffPermission("api_usage");
  const { organizationId } = await props.params;
  const sp = await props.searchParams;
  const admin = createAdminClient();

  const overview = await getOrganizationOverview(admin, organizationId);
  if (!overview) notFound();

  const { filters, rangePreset } = parseApiUsageFilters(sp);
  const canViewWallet = access.isSuperAdmin || access.permissions.api_usage_wallet;
  const requestsPage = Math.max(1, parseInt(sp.requestsPage || "1", 10) || 1);
  const walletPage = Math.max(1, parseInt(sp.walletPage || "1", 10) || 1);

  const [apiKeys, serviceDistribution, pricing, recentRequests, walletSummary, walletLedger] = await Promise.all([
    getApiKeysForOrg(admin, organizationId, filters.from, filters.to),
    getServiceDistribution(admin, { ...filters, organizationId }),
    getClientPricingForOrg(admin, organizationId),
    getRecentRequestsForOrg(admin, organizationId, requestsPage),
    canViewWallet ? getWalletSummaryForOrg(admin, organizationId) : Promise.resolve(null),
    canViewWallet ? getWalletLedgerForOrg(admin, organizationId, walletPage) : Promise.resolve(null),
  ]);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: organizationId,
    action: "api_usage.request_details_viewed",
    resource_type: "organization",
    resource_id: organizationId,
  });
  if (canViewWallet) {
    await logAudit({
      actor_id: staff.id,
      actor_email: staff.email,
      organization_id: organizationId,
      action: "api_usage.wallet_viewed",
      resource_type: "organization",
      resource_id: organizationId,
    });
  }

  const amountConsumed = serviceDistribution.reduce((sum, row) => sum + row.amountCharged, 0);

  const baseParams = new URLSearchParams();
  baseParams.set("range", rangePreset);
  if (rangePreset === "custom") {
    baseParams.set("from", filters.from);
    baseParams.set("to", filters.to);
  }

  function buildRequestsHref(page: number) {
    const params = new URLSearchParams(baseParams);
    params.set("requestsPage", String(page));
    if (sp.walletPage) params.set("walletPage", sp.walletPage);
    return `?${params.toString()}`;
  }

  function buildWalletHref(page: number) {
    const params = new URLSearchParams(baseParams);
    params.set("walletPage", String(page));
    if (sp.requestsPage) params.set("requestsPage", sp.requestsPage);
    return `?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-6 lg:px-8">
      <OrganizationOverviewSection
        overview={overview}
        canViewWallet={canViewWallet}
        walletBalance={walletSummary?.balance ?? null}
        amountConsumed={amountConsumed}
        backHref={`/console/api-usage?${baseParams.toString()}`}
      />

      <ApiKeysSection keys={apiKeys} canViewWallet={canViewWallet} />

      <ServiceUsageSection rows={serviceDistribution} pricing={pricing} canViewWallet={canViewWallet} />

      <RecentRequestsSection
        rows={recentRequests.rows}
        totalCount={recentRequests.totalCount}
        page={requestsPage}
        canViewWallet={canViewWallet}
        buildHref={buildRequestsHref}
      />

      <WalletSection
        canViewWallet={canViewWallet}
        summary={walletSummary}
        ledger={walletLedger?.rows ?? []}
        totalCount={walletLedger?.totalCount ?? 0}
        page={walletPage}
        buildHref={buildWalletHref}
      />
    </div>
  );
}
