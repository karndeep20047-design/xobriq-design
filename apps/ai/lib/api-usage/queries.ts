import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";
import { previousPeriod, bucketForRange } from "./metrics";
import type {
  ApiUsageFilters,
  ApiKeyDbEnvironment,
  SummaryCardsData,
  SummaryTotals,
  TimeseriesPoint,
  ServiceDistributionRow,
  OrgUsagePage,
  OrgUsageRow,
  ApiKeyUsageRow,
  RecentRequestRow,
  WalletLedgerRow,
  WalletSummary,
  OrganizationOverview,
  VerificationType,
  VerificationStatus,
} from "./types";

type Admin = ReturnType<typeof createAdminClient>;

const PAGE_SIZE = 20;

function rpcFilters(f: ApiUsageFilters) {
  return {
    p_environment: f.environment,
    p_verification_type: f.verificationType,
    p_status: f.status,
    p_api_key_id: f.apiKeyId,
  };
}

async function totalsForWindow(
  admin: Admin,
  from: string,
  to: string,
  f: ApiUsageFilters
): Promise<SummaryTotals> {
  const { data, error } = await admin
    .rpc("api_usage_summary_totals", {
      p_from: from,
      p_to: to,
      p_organization_id: f.organizationId,
      ...rpcFilters(f),
    })
    .single();

  if (error || !data) {
    console.error("[api-usage] summary_totals failed:", error?.message);
    return { totalRequests: 0, successful: 0, failed: 0, pending: 0, amountConsumed: 0 };
  }
  const row = data as {
    total_requests: number; successful: number; failed: number; pending: number; amount_consumed: number;
  };
  return {
    totalRequests: Number(row.total_requests),
    successful: Number(row.successful),
    failed: Number(row.failed),
    pending: Number(row.pending),
    amountConsumed: Number(row.amount_consumed),
  };
}

export async function getSummaryCards(admin: Admin, f: ApiUsageFilters): Promise<SummaryCardsData> {
  const prev = previousPeriod(f.from, f.to);

  const [current, previous, activeKeysNow, activeKeysPrev, wallets] = await Promise.all([
    totalsForWindow(admin, f.from, f.to, f),
    totalsForWindow(admin, prev.from, prev.to, f),
    countActiveApiKeys(admin, f, f.to),
    countActiveApiKeys(admin, f, prev.to),
    combinedWalletBalance(admin, f),
  ]);

  return {
    current,
    previous,
    activeApiKeys: activeKeysNow,
    activeApiKeysPrevious: activeKeysPrev,
    combinedWalletBalance: wallets,
    // Wallet balance is a point-in-time snapshot, not a ledger you can
    // rewind to an arbitrary past instant without replaying every
    // transaction — no "balance as of end of previous period" figure
    // exists, so this is intentionally not comparable rather than guessed.
    combinedWalletBalancePrevious: null,
  };
}

async function countActiveApiKeys(admin: Admin, f: ApiUsageFilters, asOf: string): Promise<number> {
  let query = admin
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .lte("created_at", asOf);
  if (f.organizationId) query = query.eq("organization_id", f.organizationId);
  if (f.environment) query = query.eq("environment", f.environment);
  const { count } = await query;
  return count ?? 0;
}

async function combinedWalletBalance(admin: Admin, f: ApiUsageFilters): Promise<number> {
  let query = admin.from("kyc_wallets").select("balance");
  if (f.organizationId) query = query.eq("organization_id", f.organizationId);
  const { data } = await query;
  return (data || []).reduce((sum, row) => sum + Number(row.balance), 0);
}

type TimeseriesRpcRow = {
  bucket_start: string; total: number; successful: number; failed: number; pending: number;
  amount_charged: number; billable_count: number;
};

export async function getTimeseries(admin: Admin, f: ApiUsageFilters): Promise<TimeseriesPoint[]> {
  const bucket = bucketForRange(f.from, f.to);
  const { data, error } = await admin.rpc("api_usage_timeseries", {
    p_from: f.from,
    p_to: f.to,
    p_bucket: bucket,
    p_organization_id: f.organizationId,
    ...rpcFilters(f),
  });
  if (error) {
    console.error("[api-usage] timeseries failed:", error.message);
    return [];
  }
  return ((data || []) as TimeseriesRpcRow[]).map((row) => ({
    bucketStart: row.bucket_start,
    total: Number(row.total),
    successful: Number(row.successful),
    failed: Number(row.failed),
    pending: Number(row.pending),
    amountCharged: Number(row.amount_charged),
    billableCount: Number(row.billable_count),
  }));
}

type ServiceDistributionRpcRow = {
  verification_type: VerificationType; total: number; successful: number; failed: number;
  pending: number; amount_charged: number; avg_response_ms: number | null;
};

export async function getServiceDistribution(admin: Admin, f: ApiUsageFilters): Promise<ServiceDistributionRow[]> {
  const { data, error } = await admin.rpc("api_usage_service_distribution", {
    p_from: f.from,
    p_to: f.to,
    p_organization_id: f.organizationId,
    p_environment: f.environment,
    p_status: f.status,
    p_api_key_id: f.apiKeyId,
  });
  if (error) {
    console.error("[api-usage] service_distribution failed:", error.message);
    return [];
  }
  return ((data || []) as ServiceDistributionRpcRow[]).map((row) => ({
    verificationType: row.verification_type,
    total: Number(row.total),
    successful: Number(row.successful),
    failed: Number(row.failed),
    pending: Number(row.pending),
    amountCharged: Number(row.amount_charged),
    avgResponseMs: row.avg_response_ms === null ? null : Number(row.avg_response_ms),
  }));
}

type OrgRollupRpcRow = {
  organization_id: string; organization_name: string; organization_status: string;
  total_requests: number; successful: number; failed: number; pending: number;
  amount_consumed: number; active_api_keys: number; last_activity_at: string | null;
  wallet_balance: number; total_count: number;
};

export async function getOrgUsagePage(admin: Admin, f: ApiUsageFilters): Promise<OrgUsagePage> {
  const { data, error } = await admin.rpc("api_usage_org_rollup", {
    p_from: f.from,
    p_to: f.to,
    p_environment: f.environment,
    p_verification_type: f.verificationType,
    p_status: f.status,
    p_search: f.search || null,
    p_wallet_state: f.walletState,
    p_sort: f.sort,
    p_sort_dir: f.sortDir,
    p_limit: PAGE_SIZE,
    p_offset: (Math.max(1, f.page) - 1) * PAGE_SIZE,
  });

  if (error) {
    console.error("[api-usage] org_rollup failed:", error.message);
    return { rows: [], totalCount: 0 };
  }

  const rawRows = (data || []) as OrgRollupRpcRow[];
  const rows: OrgUsageRow[] = rawRows.map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    totalRequests: Number(row.total_requests),
    successful: Number(row.successful),
    failed: Number(row.failed),
    pending: Number(row.pending),
    amountConsumed: Number(row.amount_consumed),
    activeApiKeys: Number(row.active_api_keys),
    lastActivityAt: row.last_activity_at,
    walletBalance: Number(row.wallet_balance),
    status: row.organization_status,
  }));

  return { rows, totalCount: rawRows.length > 0 ? Number(rawRows[0].total_count) : 0 };
}

export async function getFilterOptions(admin: Admin) {
  const [{ data: orgs }, { data: keys }] = await Promise.all([
    admin.from("organizations").select("id, name").order("name", { ascending: true }),
    admin.from("api_keys").select("id, name, organization_id, environment, status").order("name", { ascending: true }),
  ]);
  return {
    organizations: (orgs || []) as { id: string; name: string }[],
    apiKeys: (keys || []) as { id: string; name: string; organization_id: string; environment: string; status: string }[],
  };
}

export async function getOrganizationOverview(admin: Admin, organizationId: string): Promise<OrganizationOverview | null> {
  const { data } = await admin
    .from("organizations")
    .select("id, name, slug, type, status, billing_email, created_at")
    .eq("id", organizationId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    type: data.type,
    status: data.status,
    billingEmail: data.billing_email,
    createdAt: data.created_at,
  };
}

type ApiKeyRollupRpcRow = {
  api_key_id: string; total_requests: number; successful: number; failed: number;
  pending: number; amount_consumed: number;
};

export async function getApiKeysForOrg(admin: Admin, organizationId: string, from: string, to: string): Promise<ApiKeyUsageRow[]> {
  const [{ data: keys }, { data: rollup }] = await Promise.all([
    admin
      .from("api_keys")
      .select("id, name, key_prefix, environment, status, created_at, last_used_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    admin.rpc("api_usage_api_key_rollup", { p_organization_id: organizationId, p_from: from, p_to: to }),
  ]);

  const rollupById = new Map<string, ApiKeyRollupRpcRow>(
    ((rollup || []) as ApiKeyRollupRpcRow[]).map((r) => [r.api_key_id, r])
  );

  return (keys || []).map((k) => {
    const r = rollupById.get(k.id);
    return {
      id: k.id,
      name: k.name,
      keyPrefix: k.key_prefix,
      environment: k.environment as ApiKeyDbEnvironment,
      status: k.status as "active" | "revoked",
      createdAt: k.created_at,
      lastUsedAt: k.last_used_at,
      totalRequests: Number(r?.total_requests ?? 0),
      successful: Number(r?.successful ?? 0),
      failed: Number(r?.failed ?? 0),
      pending: Number(r?.pending ?? 0),
      amountConsumed: Number(r?.amount_consumed ?? 0),
    };
  });
}

const RECENT_REQUESTS_PAGE_SIZE = 20;

type RecentRequestJoinRow = {
  id: string;
  ref: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  duration_ms: number | null;
  created_at: string;
  completed_at: string | null;
  api_key_id: string | null;
  environment: ApiKeyDbEnvironment | null;
  api_keys: { name: string; environment: ApiKeyDbEnvironment } | null;
};

export async function getRecentRequestsForOrg(
  admin: Admin,
  organizationId: string,
  page: number
): Promise<{ rows: RecentRequestRow[]; totalCount: number }> {
  const offset = (Math.max(1, page) - 1) * RECENT_REQUESTS_PAGE_SIZE;
  const { data, count, error } = await admin
    .from("kyc_verifications")
    .select(
      "id, ref, verification_type, status, duration_ms, created_at, completed_at, api_key_id, environment, api_keys(name, environment)",
      { count: "exact" }
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + RECENT_REQUESTS_PAGE_SIZE - 1);

  if (error) {
    console.error("[api-usage] recent requests failed:", error.message);
    return { rows: [], totalCount: 0 };
  }

  const rawRows = (data || []) as unknown as RecentRequestJoinRow[];
  const ids = rawRows.map((r) => r.id);
  const amountByVerification = new Map<string, number>();
  if (ids.length > 0) {
    const { data: billing } = await admin
      .from("kyc_billing_transactions")
      .select("verification_id, client_price")
      .in("verification_id", ids);
    (billing || []).forEach((b) => amountByVerification.set(b.verification_id, Number(b.client_price)));
  }

  const rows: RecentRequestRow[] = rawRows.map((r) => ({
    id: r.id,
    ref: r.ref,
    verificationType: r.verification_type,
    status: r.status,
    // Prefer the real per-verification environment (works for both API-key
    // and dashboard-originated calls); fall back to the api_keys join only
    // for rows written before the kyc_verifications.environment column existed.
    environment: r.environment ?? r.api_keys?.environment ?? null,
    apiKeyName: r.api_keys?.name ?? null,
    provider: "creditinfo",
    durationMs: r.duration_ms,
    amountCharged: amountByVerification.get(r.id) ?? null,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));

  return { rows, totalCount: count ?? 0 };
}

export async function getWalletSummaryForOrg(admin: Admin, organizationId: string): Promise<WalletSummary> {
  const [{ data: wallet }, { data: ledger }, { data: pendingTopups }] = await Promise.all([
    admin.from("kyc_wallets").select("balance, currency").eq("organization_id", organizationId).maybeSingle(),
    admin
      .from("kyc_wallet_transactions")
      .select("type, amount, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("kyc_wallet_topup_requests")
      .select("amount")
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
  ]);

  const rows = ledger || [];
  const totalCredits = rows.filter((r) => r.type === "topup").reduce((s, r) => s + Number(r.amount), 0);
  const totalDebits = rows.filter((r) => r.type === "debit").reduce((s, r) => s + Number(r.amount), 0);
  const lastTopup = rows.find((r) => r.type === "topup");
  const lastDebit = rows.find((r) => r.type === "debit");

  return {
    balance: Number(wallet?.balance ?? 0),
    currency: wallet?.currency ?? "KES",
    totalCredits,
    totalDebits,
    lastTopupAt: lastTopup?.created_at ?? null,
    lastDebitAt: lastDebit?.created_at ?? null,
    pendingTopupAmount: (pendingTopups || []).reduce((s, r) => s + Number(r.amount), 0),
  };
}

const WALLET_LEDGER_PAGE_SIZE = 20;

export async function getWalletLedgerForOrg(
  admin: Admin,
  organizationId: string,
  page: number
): Promise<{ rows: WalletLedgerRow[]; totalCount: number }> {
  const offset = (Math.max(1, page) - 1) * WALLET_LEDGER_PAGE_SIZE;
  const { data, count, error } = await admin
    .from("kyc_wallet_transactions")
    .select("id, type, amount, balance_after, reference, note, verification_id, created_at", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + WALLET_LEDGER_PAGE_SIZE - 1);

  if (error) {
    console.error("[api-usage] wallet ledger failed:", error.message);
    return { rows: [], totalCount: 0 };
  }

  const rows: WalletLedgerRow[] = (data || []).map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    balanceAfter: Number(r.balance_after),
    reference: r.reference,
    note: r.note,
    verificationId: r.verification_id,
    createdAt: r.created_at,
  }));

  return { rows, totalCount: count ?? 0 };
}

export async function getClientPricingForOrg(
  admin: Admin,
  organizationId: string
): Promise<Record<VerificationType, { amount: number; currency: string } | null>> {
  const { data } = await admin
    .from("kyc_client_pricing")
    .select("verification_type, price_amount, currency")
    .eq("organization_id", organizationId)
    .is("effective_to", null);

  const byType: Record<VerificationType, { amount: number; currency: string } | null> = {
    identity: null, phone: null, business: null,
  };
  (data || []).forEach((row) => {
    byType[row.verification_type as VerificationType] = { amount: Number(row.price_amount), currency: row.currency };
  });
  return byType;
}
