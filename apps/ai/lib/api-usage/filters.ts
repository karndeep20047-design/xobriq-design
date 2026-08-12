import { resolveDateRange } from "./metrics";
import type { ApiUsageFilters, DateRangePreset, OrgSortKey, SortDir } from "./types";

const VALID_RANGES: DateRangePreset[] = ["24h", "7d", "30d", "90d", "custom"];
const VALID_SORTS: OrgSortKey[] = ["total_requests", "organization_name", "amount_consumed", "last_activity_at"];

export type RawFilterParams = {
  range?: string;
  from?: string;
  to?: string;
  org?: string;
  apiKey?: string;
  environment?: string;
  service?: string;
  status?: string;
  keyStatus?: string;
  provider?: string;
  wallet?: string;
  q?: string;
  page?: string;
  sort?: string;
  sortDir?: string;
};

/** Single source of truth for turning raw URL query params into
 * ApiUsageFilters — shared by the page (server render) and the CSV export
 * route, so "what's currently filtered" and "what gets exported" can never
 * silently drift apart from independently-written parsing logic. */
export function parseApiUsageFilters(sp: RawFilterParams): { filters: ApiUsageFilters; rangePreset: DateRangePreset } {
  const rangePreset: DateRangePreset = VALID_RANGES.includes(sp.range as DateRangePreset)
    ? (sp.range as DateRangePreset)
    : "30d";
  const { from, to } = resolveDateRange(rangePreset, sp.from || null, sp.to || null);

  const filters: ApiUsageFilters = {
    from,
    to,
    organizationId: sp.org || null,
    apiKeyId: sp.apiKey || null,
    environment: sp.environment === "sandbox" || sp.environment === "production" ? sp.environment : null,
    verificationType:
      sp.service === "identity" || sp.service === "phone" || sp.service === "business" ? sp.service : null,
    status: sp.status === "pending" || sp.status === "completed" || sp.status === "failed" ? sp.status : null,
    keyStatus: sp.keyStatus === "active" || sp.keyStatus === "revoked" ? sp.keyStatus : null,
    provider: sp.provider === "creditinfo" ? sp.provider : null,
    walletState: sp.wallet === "healthy" || sp.wallet === "low" || sp.wallet === "zero" ? sp.wallet : null,
    search: sp.q || "",
    page: Math.max(1, parseInt(sp.page || "1", 10) || 1),
    sort: VALID_SORTS.includes(sp.sort as OrgSortKey) ? (sp.sort as OrgSortKey) : "total_requests",
    sortDir: sp.sortDir === "asc" ? "asc" : ("desc" as SortDir),
  };

  return { filters, rangePreset };
}
