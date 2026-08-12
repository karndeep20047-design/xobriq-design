import Link from "next/link";
import { ChevronLeft, ChevronRight, Wallet, Lock } from "lucide-react";
import { ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import { formatKes } from "@/lib/api-usage/metrics";
import type { WalletSummary, WalletLedgerRow } from "@/lib/api-usage/types";

const PAGE_SIZE = 20;

export function WalletSection({
  canViewWallet,
  summary,
  ledger,
  totalCount,
  page,
  buildHref,
}: {
  canViewWallet: boolean;
  summary: WalletSummary | null;
  ledger: WalletLedgerRow[];
  totalCount: number;
  page: number;
  buildHref: (page: number) => string;
}) {
  if (!canViewWallet || !summary) {
    return (
      <ConsoleCard className="p-8 text-center">
        <Lock className="mx-auto mb-3 h-5 w-5 text-fg-subtle" />
        <p className="text-sm font-medium">Wallet information is restricted</p>
        <p className="mt-1 text-xs text-fg-subtle">Only Finance/HR, Product, and Super Admin roles can view client wallet balances and ledger transactions.</p>
      </ConsoleCard>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <ConsoleCard>
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">Wallet</h2>
      </div>

      <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-3 lg:grid-cols-6">
        <WalletStat label="Current balance" value={formatKes(summary.balance)} />
        <WalletStat label="Total credits" value={formatKes(summary.totalCredits)} />
        <WalletStat label="Total debits" value={formatKes(summary.totalDebits)} />
        <WalletStat label="Pending top-up" value={formatKes(summary.pendingTopupAmount)} />
        <WalletStat label="Last top-up" value={summary.lastTopupAt ? new Date(summary.lastTopupAt).toLocaleDateString("en-KE") : "None yet"} />
        <WalletStat label="Last debit" value={summary.lastDebitAt ? new Date(summary.lastDebitAt).toLocaleDateString("en-KE") : "None yet"} />
      </div>

      {ledger.length === 0 ? (
        <EmptyState Icon={Wallet} title="No wallet transactions" message="No credits or debits have been recorded yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5">Transaction</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">Balance after</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Related request</th>
                <th className="px-4 py-2.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledger.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-3 font-mono text-xs text-fg-subtle">{tx.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <span className={
                      "rounded px-2 py-0.5 text-[10px] font-semibold uppercase " +
                      (tx.type === "topup" ? "bg-emerald-500/15 text-emerald-500" : tx.type === "debit" ? "bg-red-500/15 text-red-500" : "bg-fg-subtle/15 text-fg-muted")
                    }>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{tx.type === "topup" ? "+" : "-"}{formatKes(tx.amount)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatKes(tx.balanceAfter)}</td>
                  <td className="px-4 py-3 text-xs text-fg-muted">{tx.note || tx.reference || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-subtle">{tx.verificationId ? tx.verificationId.slice(0, 8) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-fg-muted">{new Date(tx.createdAt).toLocaleString("en-KE")}</td>
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
              className={"inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium " + (page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-bg-elevated")}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Link>
            <Link
              href={buildHref(Math.min(totalPages, page + 1))}
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

function WalletStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
