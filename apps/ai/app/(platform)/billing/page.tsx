import { Activity, ArrowDownRight, ArrowUpRight, Clock, CreditCard, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatementsButton } from "./StatementsButton";
import { requireOrgPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWalletBalance, getActiveClientPrice, getKycTrialUntil, isKycTrialActive } from "@/lib/kyc/wallet";
import { PRODUCT_SLUGS, getProductAccessDetail, daysUntil } from "@/lib/product-access";
import type { WalletTransaction } from "@/lib/kyc/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Billing — Xobriq" };

const PRODUCT_LABELS: Record<string, string> = {
  kyc: "Xobriq KYC",
  guard: "Xobriq Guard",
  cloud: "Xobriq Cloud",
  agentic: "Xobriq Agentic",
  consult: "Xobriq Consult",
  cyber: "Xobriq Cyber",
};

const kes = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

function txLabel(t: WalletTransaction): { desc: string; type: "Top-up" | "Verification" | "Adjustment" } {
  if (t.type === "topup") return { desc: t.note || "Wallet top-up", type: "Top-up" };
  if (t.type === "debit") return { desc: t.note || "Verification charge", type: "Verification" };
  return { desc: t.note || "Manual adjustment", type: "Adjustment" };
}

// Real billing data was previously siloed inside the KYC product's own
// dashboard (app/(kyc)/dashboard/xobriqKYC/billing) — moved here since the
// org's wallet IS its billing regardless of which product incurred the
// charge, and this page already has a real nav entry + permission gate with
// nothing behind it.
export default async function BillingPage() {
  await requireOrgPermission("billing");

  const user = await getCurrentUser();
  const admin = createAdminClient();
  const orgId = user!.default_org_id!;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [wallet, identityPrice, { data: txData }, { data: org }, trialUntil, { data: providerRequests }, { count: activeApiKeys }] =
    await Promise.all([
      getWalletBalance(admin, orgId),
      getActiveClientPrice(admin, orgId, "identity"),
      admin
        .from("kyc_wallet_transactions")
        .select("id, type, amount, balance_after, verification_id, reference, note, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200),
      admin.from("organizations").select("plan").eq("id", orgId).single(),
      getKycTrialUntil(admin, orgId),
      admin
        .from("kyc_provider_requests")
        .select("success, created_at")
        .eq("organization_id", orgId)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false }),
      admin.from("api_keys").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "active"),
    ]);
  const transactions = (txData as WalletTransaction[] | null) || [];
  const orgPlan = org?.plan ?? null;
  const trialActive = isKycTrialActive(trialUntil);

  const requests7d = providerRequests || [];
  const successRate7d =
    requests7d.length === 0 ? null : Math.round((requests7d.filter((r) => r.success).length / requests7d.length) * 100);
  const lastCheckAt = requests7d[0]?.created_at ?? null;

  const productDetails = await Promise.all(
    PRODUCT_SLUGS.map(async (slug) => ({ slug, ...(await getProductAccessDetail(orgId, slug)) })),
  );
  const approvedProducts = productDetails.filter((p) => p.status === "approved");

  const balance = wallet.balance;
  const remainingChecks = identityPrice ? Math.round(balance / identityPrice.amount) : null;

  const now = new Date();
  const monthDebits = transactions.filter(
    (t) =>
      t.type === "debit" &&
      new Date(t.created_at).getMonth() === now.getMonth() &&
      new Date(t.created_at).getFullYear() === now.getFullYear(),
  );
  const verificationsMtd = monthDebits.length;
  const avgCost = monthDebits.length
    ? monthDebits.reduce((sum, t) => sum + Number(t.amount), 0) / monthDebits.length
    : null;
  const totalToppedUp = transactions
    .filter((t) => t.type === "topup")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-5 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          Icon={CreditCard}
          title="Billing"
          subtitle="Prepaid wallet balance, invoices, and per-check usage."
        />
        <StatementsButton transactions={transactions} />
      </div>

      {trialActive ? (
        <div className="flex items-center gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-xs font-medium text-info">
          <Clock className="h-3.5 w-3.5" />
          Free KYC trial active{trialUntil ? ` until ${new Date(trialUntil).toLocaleDateString()}` : ""} — verifications
          don&apos;t require wallet funds until then.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Wallet balance
                </div>
                <div className="mt-1 text-3xl font-bold tracking-tight">{kes(balance)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {remainingChecks !== null
                    ? `≈ ${remainingChecks.toLocaleString()} verifications remaining at ${kes(identityPrice!.amount)} / check`
                    : "Enable pricing to estimate remaining verifications"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="gap-2" asChild>
                  <Link href="/billing/top-up">
                    <Plus className="h-4 w-4" /> Top up
                  </Link>
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <Link href="/billing/history">
                    <CreditCard className="h-4 w-4" /> History
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Current plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold capitalize">{orgPlan || "—"}</div>
              <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                Active
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {identityPrice ? `${kes(identityPrice.amount)} / verification · pay as you go` : "Pay as you go"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" /> System status
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Verification success (7d)
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">
                {successRate7d === null ? "—" : `${successRate7d}%`}
              </span>
              {successRate7d !== null ? (
                <Badge
                  variant="outline"
                  className={
                    successRate7d >= 95
                      ? "border-success/30 bg-success/10 text-success"
                      : successRate7d >= 80
                        ? "border-warning/30 bg-warning/10 text-warning"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                  }
                >
                  <ShieldCheck className="mr-1 h-3 w-3" /> {requests7d.length} checks
                </Badge>
              ) : null}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last check</div>
            <div className="mt-1 text-xl font-bold tracking-tight">
              {lastCheckAt ? new Date(lastCheckAt).toLocaleString() : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active API keys</div>
            <div className="mt-1 text-xl font-bold tracking-tight">{activeApiKeys ?? 0}</div>
          </div>
        </CardContent>
      </Card>

      {approvedProducts.length > 0 ? (
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Product access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedProducts.map((p) => {
              const days = daysUntil(p.validUntil);
              const dueSoon = days !== null && days <= 30;
              return (
                <div key={p.slug} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium capitalize">{PRODUCT_LABELS[p.slug] || p.slug}</span>
                  {p.validUntil ? (
                    <Badge
                      variant="outline"
                      className={
                        dueSoon
                          ? "border-warning/30 bg-warning/10 text-warning"
                          : "border-success/30 bg-success/10 text-success"
                      }
                    >
                      {dueSoon ? `Renews in ${days}d` : `Valid until ${new Date(p.validUntil).toLocaleDateString()}`}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                      Active
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Verifications (MTD)", value: verificationsMtd.toLocaleString() },
          { label: "Avg cost / check", value: avgCost !== null ? kes(avgCost) : "—" },
          { label: "Failed charges", value: "0", tone: "text-success" },
          { label: "Total topped up", value: kes(totalToppedUp) },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className={cn("mt-1 text-xl font-bold tracking-tight", s.tone)}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((t) => {
                  const { desc, type } = txLabel(t);
                  const signedAmount = t.type === "debit" ? -Number(t.amount) : Number(t.amount);
                  return (
                    <TableRow key={t.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">{t.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{desc}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">{type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          signedAmount < 0 ? "text-destructive" : "text-success",
                        )}
                      >
                        <span className="inline-flex items-center gap-1">
                          {signedAmount < 0 ? (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                          {kes(Math.abs(signedAmount))}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">Completed</TableCell>
                    </TableRow>
                  );
                })}
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
