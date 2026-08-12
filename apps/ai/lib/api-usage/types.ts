// Shared shapes for the internal console's API Usage analytics module
// (app/(console)/console/api-usage/**). Kept dependency-free (no
// "server-only") so both server pages and client components can import it.

export type VerificationType = "identity" | "phone" | "business";
export type VerificationStatus = "pending" | "completed" | "failed";
export type ApiKeyDbEnvironment = "sandbox" | "production";
export type ApiKeyStatus = "active" | "revoked";
export type WalletState = "healthy" | "low" | "zero";
export type DateRangePreset = "24h" | "7d" | "30d" | "90d" | "custom";
export type SortDir = "asc" | "desc";
export type OrgSortKey = "total_requests" | "organization_name" | "amount_consumed" | "last_activity_at";

export type ApiUsageFilters = {
  from: string;
  to: string;
  organizationId: string | null;
  apiKeyId: string | null;
  environment: ApiKeyDbEnvironment | null;
  verificationType: VerificationType | null;
  status: VerificationStatus | null;
  keyStatus: ApiKeyStatus | null;
  provider: string | null;
  walletState: WalletState | null;
  search: string;
  page: number;
  sort: OrgSortKey;
  sortDir: SortDir;
};

export type SummaryTotals = {
  totalRequests: number;
  successful: number;
  failed: number;
  pending: number;
  amountConsumed: number;
};

export type SummaryCardsData = {
  current: SummaryTotals;
  previous: SummaryTotals;
  activeApiKeys: number;
  activeApiKeysPrevious: number;
  combinedWalletBalance: number;
  combinedWalletBalancePrevious: number | null; // balance has no historical snapshot; null = "not comparable"
};

export type TimeseriesBucket = "hour" | "day" | "week" | "month";

export type TimeseriesPoint = {
  bucketStart: string;
  total: number;
  successful: number;
  failed: number;
  pending: number;
  amountCharged: number;
  billableCount: number;
};

export type ServiceDistributionRow = {
  verificationType: VerificationType;
  total: number;
  successful: number;
  failed: number;
  pending: number;
  amountCharged: number;
  avgResponseMs: number | null;
};

export type OrgUsageRow = {
  organizationId: string;
  organizationName: string;
  totalRequests: number;
  successful: number;
  failed: number;
  pending: number;
  amountConsumed: number;
  activeApiKeys: number;
  lastActivityAt: string | null;
  walletBalance: number;
  status: string;
};

export type OrgUsagePage = {
  rows: OrgUsageRow[];
  totalCount: number;
};

export type ApiKeyUsageRow = {
  id: string;
  name: string;
  keyPrefix: string;
  environment: ApiKeyDbEnvironment;
  status: ApiKeyStatus;
  createdAt: string;
  lastUsedAt: string | null;
  totalRequests: number;
  successful: number;
  failed: number;
  pending: number;
  amountConsumed: number;
};

export type RecentRequestRow = {
  id: string;
  ref: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  environment: ApiKeyDbEnvironment | null;
  apiKeyName: string | null;
  provider: string;
  durationMs: number | null;
  amountCharged: number | null;
  createdAt: string;
  completedAt: string | null;
};

export type WalletLedgerRow = {
  id: string;
  type: "topup" | "debit" | "adjustment";
  amount: number;
  balanceAfter: number;
  reference: string | null;
  note: string | null;
  verificationId: string | null;
  createdAt: string;
};

export type WalletSummary = {
  balance: number;
  currency: string;
  totalCredits: number;
  totalDebits: number;
  lastTopupAt: string | null;
  lastDebitAt: string | null;
  pendingTopupAmount: number;
};

export type OrganizationOverview = {
  id: string;
  name: string;
  slug: string;
  type: "client_company" | "client_individual";
  status: string;
  billingEmail: string | null;
  createdAt: string;
};

// No per-org configurable low-balance threshold exists in the schema today
// — this is a platform-wide placeholder used only for the wallet-state
// filter/badge, not a stored setting. Easy to promote to a real per-org
// column later if that's wanted.
export const LOW_BALANCE_THRESHOLD_KES = 500;

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  identity: "National ID verification",
  phone: "Phone verification",
  business: "Business verification",
};
