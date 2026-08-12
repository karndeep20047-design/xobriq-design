import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { requireOrgPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWalletBalance } from "@/lib/kyc/wallet";
import { PUBLIC_API_BASE_URL, API_VERSION } from "@/lib/public-api-config";
import { DEVELOPER_PRODUCTS, KYC_CAPABILITIES, isDeveloperProductSlug } from "../../product-config";
import { notFound } from "next/navigation";

export default async function OverviewPage({ params }: { params: Promise<{ product: string }> }) {
  const { organizationId } = await requireOrgPermission("api_keys");
  const { product } = await params;
  if (!isDeveloperProductSlug(product)) notFound();
  const config = DEVELOPER_PRODUCTS[product];

  if (config.comingSoon) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <Clock className="mx-auto mb-3 h-6 w-6 text-fg-subtle" />
        <p className="text-sm font-medium">{config.name}&apos;s developer API isn&apos;t available yet</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-fg-muted">
          {config.description} Request access on the Developer Platform hub to be notified when it ships.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();
  const [{ count: sandboxKeys }, { count: productionKeys }, wallet] = await Promise.all([
    admin.from("api_keys").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("environment", "sandbox"),
    admin.from("api_keys").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("environment", "production"),
    getWalletBalance(admin, organizationId),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Sandbox keys" value={sandboxKeys ?? 0} />
        <Stat label="Production keys" value={productionKeys ?? 0} />
        <Stat label="Wallet balance" value={`${wallet.currency} ${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
        <Stat label="API version" value={API_VERSION} />
      </div>

      <div className="rounded-2xl border border-border bg-bg-subtle p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Base URL</p>
        <code className="mt-1.5 block rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm">
          {PUBLIC_API_BASE_URL}/api/{API_VERSION}/kyc
        </code>
      </div>

      <div>
        <h2 className="text-sm font-semibold">Available capabilities</h2>
        <p className="mt-1 text-xs text-fg-muted">Every capability below is real and already live — none of this is planned/future functionality.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KYC_CAPABILITIES.map((cap) => (
            <div key={cap.key} className="rounded-xl border border-border bg-bg-subtle p-4">
              <p className="text-sm font-semibold">{cap.name}</p>
              <p className="mt-1 text-xs text-fg-muted">{cap.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/developer/kyc/quick-start" className="inline-flex items-center gap-1.5 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover">
          Quick Start <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link href="/developer/kyc/api-keys" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-subtle px-4 py-2 text-sm font-medium hover:bg-bg-elevated">
          Generate an API key
        </Link>
        <Link href="/developer/kyc/api-reference" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-subtle px-4 py-2 text-sm font-medium hover:bg-bg-elevated">
          View API Reference
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">{label}</p>
      <p className="mt-1.5 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
