import { KeyRound } from "lucide-react";
import { ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import { maskedKeyDisplay, formatKes, successRate } from "@/lib/api-usage/metrics";
import type { ApiKeyUsageRow } from "@/lib/api-usage/types";

export function ApiKeysSection({ keys, canViewWallet }: { keys: ApiKeyUsageRow[]; canViewWallet: boolean }) {
  return (
    <ConsoleCard>
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">API Keys</h2>
        <p className="mt-0.5 text-xs text-fg-subtle">
          {keys.length} key{keys.length === 1 ? "" : "s"} issued. Full secrets are never shown here — only the masked prefix stored at creation time.
        </p>
      </div>

      {keys.length === 0 ? (
        <EmptyState Icon={KeyRound} title="No API keys" message="This organization hasn't created an API key yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Key</th>
                <th className="px-4 py-2.5">Environment</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Created</th>
                <th className="px-4 py-2.5">Last used</th>
                <th className="px-4 py-2.5">Requests</th>
                <th className="px-4 py-2.5">Success rate</th>
                {canViewWallet ? <th className="px-4 py-2.5">Amount consumed</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map((k) => {
                const rate = successRate(k.successful, k.failed);
                return (
                  <tr key={k.id}>
                    <td className="px-4 py-3 font-medium">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-subtle">{maskedKeyDisplay(k.keyPrefix)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-fg-subtle/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-fg-muted">
                        {k.environment === "production" ? "Production" : "Sandbox"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={
                        "rounded px-2 py-0.5 text-[10px] font-semibold uppercase " +
                        (k.status === "active" ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500")
                      }>
                        {k.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted">{new Date(k.createdAt).toLocaleDateString("en-KE")}</td>
                    <td className="px-4 py-3 text-xs text-fg-muted">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("en-KE") : "Never used"}</td>
                    <td className="px-4 py-3 tabular-nums">{k.totalRequests.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">{rate !== null ? `${rate.toFixed(1)}%` : "—"}</td>
                    {canViewWallet ? <td className="px-4 py-3 tabular-nums">{formatKes(k.amountConsumed)}</td> : null}
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
