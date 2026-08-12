import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import { formatKes } from "@/lib/api-usage/metrics";
import { VERIFICATION_TYPE_LABELS } from "@/lib/api-usage/types";
import type { RecentRequestRow } from "@/lib/api-usage/types";

const PAGE_SIZE = 20;

const STATUS_TONE: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-500",
  failed: "bg-red-500/15 text-red-500",
  pending: "bg-amber-500/15 text-amber-500",
};

export function RecentRequestsSection({
  rows,
  totalCount,
  page,
  canViewWallet,
  buildHref,
}: {
  rows: RecentRequestRow[];
  totalCount: number;
  page: number;
  canViewWallet: boolean;
  buildHref: (page: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <ConsoleCard>
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">Recent KYC Requests</h2>
        <p className="mt-0.5 text-xs text-fg-subtle">
          Operational metadata only — identity documents and personal data are never shown here.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState Icon={Inbox} title="No requests yet" message="No verification requests have been recorded for this organization." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5">Service</th>
                <th className="px-4 py-2.5">Environment</th>
                <th className="px-4 py-2.5">API key</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Provider</th>
                <th className="px-4 py-2.5">Response time</th>
                {canViewWallet ? <th className="px-4 py-2.5">Amount</th> : null}
                <th className="px-4 py-2.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-mono text-xs">{r.ref}</td>
                  <td className="px-4 py-3">{VERIFICATION_TYPE_LABELS[r.verificationType]}</td>
                  <td className="px-4 py-3 text-xs text-fg-muted">{r.environment ? (r.environment === "production" ? "Production" : "Sandbox") : "Dashboard"}</td>
                  <td className="px-4 py-3 text-xs text-fg-muted">{r.apiKeyName || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded px-2 py-0.5 text-[10px] font-semibold uppercase " + (STATUS_TONE[r.status] || "bg-fg-subtle/15 text-fg-muted")}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">{r.provider}</td>
                  <td className="px-4 py-3 text-xs text-fg-muted">{r.durationMs !== null ? `${r.durationMs}ms` : "—"}</td>
                  {canViewWallet ? (
                    <td className="px-4 py-3 tabular-nums">{r.amountCharged !== null ? formatKes(r.amountCharged) : "—"}</td>
                  ) : null}
                  <td className="px-4 py-3 text-xs text-fg-muted">{new Date(r.createdAt).toLocaleString("en-KE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-fg-subtle">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Link
              href={buildHref(Math.max(1, page - 1))}
              aria-disabled={page <= 1}
              className={"inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium " + (page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-bg-elevated")}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Link>
            <Link
              href={buildHref(Math.min(totalPages, page + 1))}
              aria-disabled={page >= totalPages}
              className={"inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium " + (page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-bg-elevated")}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : null}
    </ConsoleCard>
  );
}
