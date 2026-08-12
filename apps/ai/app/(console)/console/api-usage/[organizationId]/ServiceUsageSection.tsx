import { Fingerprint } from "lucide-react";
import { ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import { formatKes, successRate } from "@/lib/api-usage/metrics";
import { VERIFICATION_TYPE_LABELS } from "@/lib/api-usage/types";
import type { ServiceDistributionRow, VerificationType } from "@/lib/api-usage/types";

export function ServiceUsageSection({
  rows,
  pricing,
  canViewWallet,
}: {
  rows: ServiceDistributionRow[];
  pricing: Record<VerificationType, { amount: number; currency: string } | null>;
  canViewWallet: boolean;
}) {
  const visible = rows.filter((r) => r.total > 0 || pricing[r.verificationType]);

  return (
    <ConsoleCard>
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">KYC Usage Summary</h2>
        <p className="mt-0.5 text-xs text-fg-subtle">Usage by verification service, in the selected date range.</p>
      </div>

      {visible.length === 0 ? (
        <EmptyState Icon={Fingerprint} title="No usage yet" message="No verifications have been run in this range." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5">Service</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">Successful</th>
                <th className="px-4 py-2.5">Failed</th>
                <th className="px-4 py-2.5">Pending</th>
                <th className="px-4 py-2.5">Success rate</th>
                <th className="px-4 py-2.5">Unit price</th>
                {canViewWallet ? <th className="px-4 py-2.5">Amount charged</th> : null}
                <th className="px-4 py-2.5">Avg response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((r) => {
                const rate = successRate(r.successful, r.failed);
                const price = pricing[r.verificationType];
                return (
                  <tr key={r.verificationType}>
                    <td className="px-4 py-3 font-medium">{VERIFICATION_TYPE_LABELS[r.verificationType]}</td>
                    <td className="px-4 py-3 tabular-nums">{r.total.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums text-emerald-500">{r.successful.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums text-red-500">{r.failed.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums text-amber-500">{r.pending.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">{rate !== null ? `${rate.toFixed(1)}%` : "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{price ? formatKes(price.amount) : "Not enabled"}</td>
                    {canViewWallet ? <td className="px-4 py-3 tabular-nums">{formatKes(r.amountCharged)}</td> : null}
                    <td className="px-4 py-3 tabular-nums text-fg-muted">{r.avgResponseMs !== null ? `${Math.round(r.avgResponseMs)}ms` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ConsoleCard>
  );
}
