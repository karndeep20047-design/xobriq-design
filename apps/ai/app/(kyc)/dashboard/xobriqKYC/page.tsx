import { createAdminClient } from "@/lib/supabase/admin";
import { requireKycPermission } from "@/lib/permissions";
import { getWalletBalance, getActiveClientPrice } from "@/lib/kyc/wallet";
import { getDashboardStats, type DashboardRange, DASHBOARD_RANGES } from "@/lib/kyc/dashboard-stats";
import type { VerificationListItem } from "@/lib/kyc/client-api";
import { DashboardClient } from "./DashboardClient";

type SearchParams = Promise<{ range?: string }>;

const RECENT_COLUMNS =
  "id, ref, verification_type, provider, status, identifier_type, identifier_number, " +
  "last_name, matched, result, error_message, duration_ms, requested_by_email, " +
  "created_at, completed_at";

// Server Component: fetches everything the dashboard shows — greeting name,
// wallet balance, identity price, verification stats/trend/document-type
// breakdown for the selected range, and the recent-verifications table — all
// straight from Supabase. Nothing here is demo/mock data; the "range" tabs
// are plain links (?range=24h|7d|30d|90d) so switching them re-runs this
// Server Component against real data instead of just re-rendering a static
// client-side array.
export default async function XobriqKycDashboardPage(props: { searchParams: SearchParams }) {
  const sp = await props.searchParams;
  const range: DashboardRange = DASHBOARD_RANGES.includes(sp.range as DashboardRange)
    ? (sp.range as DashboardRange)
    : "7d";

  const { user, organizationId: orgId } = await requireKycPermission("kyc_dashboard");
  const firstName = (user.full_name || "there").split(" ")[0];

  const admin = createAdminClient();

  const [wallet, identityPrice, stats, recent] = await Promise.all([
    getWalletBalance(admin, orgId),
    getActiveClientPrice(admin, orgId, "identity"),
    getDashboardStats(admin, orgId, range),
    admin
      .from("kyc_verifications")
      .select(RECENT_COLUMNS)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return (
    <DashboardClient
      firstName={firstName}
      walletBalance={wallet.balance}
      identityPrice={identityPrice?.amount ?? null}
      range={range}
      stats={stats}
      recentVerifications={(recent.data as VerificationListItem[] | null) || []}
    />
  );
}
