import { successRate } from "./metrics";
import type { OrgUsageRow } from "./types";

// Kept separate from the export route.ts (which, as a Next.js route file,
// may only export recognized handler names) so the actual row-shaping
// logic is unit-testable in isolation — the thing worth locking down here
// is that this list never grows a secret/identity field by accident.
export const API_USAGE_EXPORT_HEADERS = [
  "Organization", "Organization ID", "Total Requests", "Successful", "Failed", "Pending",
  "Success Rate (%)", "Amount Consumed (KES)", "Wallet Balance (KES)", "Active API Keys",
  "Last Activity (UTC)", "Account Status",
];

export function orgUsageRowToCsvFields(row: OrgUsageRow): (string | number)[] {
  const rate = successRate(row.successful, row.failed);
  return [
    row.organizationName,
    row.organizationId,
    row.totalRequests,
    row.successful,
    row.failed,
    row.pending,
    rate !== null ? rate.toFixed(1) : "",
    row.amountConsumed.toFixed(2),
    row.walletBalance.toFixed(2),
    row.activeApiKeys,
    row.lastActivityAt || "",
    row.status,
  ];
}
