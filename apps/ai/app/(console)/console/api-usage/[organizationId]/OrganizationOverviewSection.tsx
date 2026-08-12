import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { ConsoleCard } from "@/components/console/ConsolePageHeader";
import { formatKes } from "@/lib/api-usage/metrics";
import type { OrganizationOverview } from "@/lib/api-usage/types";

export function OrganizationOverviewSection({
  overview,
  canViewWallet,
  walletBalance,
  amountConsumed,
  backHref,
}: {
  overview: OrganizationOverview;
  canViewWallet: boolean;
  walletBalance: number | null;
  amountConsumed: number;
  backHref: string;
}) {
  return (
    <ConsoleCard className="p-5">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to API Usage
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-primary/10 text-enterprise-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{overview.name}</h1>
            <p className="text-xs text-fg-subtle">
              {overview.type === "client_company" ? "Company" : "Individual"} · {overview.slug} · Client ID {overview.id}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-fg-subtle/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
          {overview.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Billing email" value={overview.billingEmail || "—"} />
        <Field label="Created" value={new Date(overview.createdAt).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })} />
        <Field label="Amount consumed (current filter window)" value={canViewWallet ? formatKes(amountConsumed) : "Restricted"} />
        <Field label="Wallet balance" value={canViewWallet && walletBalance !== null ? formatKes(walletBalance) : "Restricted"} />
      </div>
    </ConsoleCard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
