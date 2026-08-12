// Pure calculation helpers for the API Usage analytics module — no I/O, no
// "server-only", safe to import from both server and client code, and the
// natural place to unit-test success-rate/formatting/masking logic without
// spinning up a database.
import { LOW_BALANCE_THRESHOLD_KES, type DateRangePreset, type TimeseriesBucket, type WalletState } from "./types";

/**
 * successful / (successful + failed) * 100 — pending requests are excluded
 * from the denominator entirely, since they haven't reached a terminal
 * state yet and including them would understate a currently-healthy org
 * mid-burst of new requests. Returns null (not 0) when there's no
 * completed-or-failed request yet, so callers can render "No data" instead
 * of a misleading "0%".
 */
export function successRate(successful: number, failed: number): number | null {
  const completedAttempts = successful + failed;
  if (completedAttempts <= 0) return null;
  return (successful / completedAttempts) * 100;
}

/** Percentage change from `previous` to `current`. Null when there's no
 * previous-period baseline to compare against (avoids a misleading "+100%"
 * or divide-by-zero when the previous period was genuinely zero). */
export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/** Coarsens a bucket choice to what's actually sensible for the span being
 * viewed — an hour-by-hour chart over 90 days would be thousands of
 * unreadable points, and a monthly bucket over 24h would collapse to a
 * single point. */
export function bucketForRange(fromIso: string, toIso: string): TimeseriesBucket {
  const spanMs = new Date(toIso).getTime() - new Date(fromIso).getTime();
  const hour = 3_600_000;
  const day = 24 * hour;
  if (spanMs <= 2 * day) return "hour";
  if (spanMs <= 45 * day) return "day";
  if (spanMs <= 180 * day) return "week";
  return "month";
}

/** The immediately-preceding window of the same length, for "vs previous
 * period" comparisons — e.g. [Jan 8–15) compares against [Jan 1–8). */
export function previousPeriod(fromIso: string, toIso: string): { from: string; to: string } {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  const span = to - from;
  return { from: new Date(from - span).toISOString(), to: fromIso };
}

const PRESET_SPAN_MS: Record<Exclude<DateRangePreset, "custom">, number> = {
  "24h": 24 * 3_600_000,
  "7d": 7 * 24 * 3_600_000,
  "30d": 30 * 24 * 3_600_000,
  "90d": 90 * 24 * 3_600_000,
};

/** Turns a range preset (or explicit custom bounds) into a concrete
 * [from, to) ISO window — the one place "now" gets read for this feature,
 * kept out of any React component body (calling Date.now() there trips
 * the react-hooks/purity lint rule even in a Server Component). */
export function resolveDateRange(
  preset: DateRangePreset,
  customFrom: string | null,
  customTo: string | null
): { from: string; to: string } {
  if (preset === "custom" && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }
  const to = new Date();
  const span = PRESET_SPAN_MS[preset === "custom" ? "30d" : preset];
  return { from: new Date(to.getTime() - span).toISOString(), to: to.toISOString() };
}

export function walletStateFor(balance: number): WalletState {
  if (balance <= 0) return "zero";
  if (balance <= LOW_BALANCE_THRESHOLD_KES) return "low";
  return "healthy";
}

export function maskedKeyDisplay(keyPrefix: string): string {
  return `${keyPrefix}••••••••`;
}

export function formatKes(amount: number): string {
  return "KES " + amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Safe pagination math shared by the org table and any other
 * server-paginated list in this feature. */
export function paginationInfo(totalCount: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);
  return { totalPages, currentPage, rangeStart, rangeEnd, offset: (currentPage - 1) * pageSize };
}
