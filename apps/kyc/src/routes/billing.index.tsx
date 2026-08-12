import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, CreditCard, Download, Plus, Wallet } from "lucide-react";

import { PageShell } from "@/components/kyc/page-shell";
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
import { meOptions, walletOptions, walletTransactionsOptions } from "@/lib/kyc-queries";
import { useMounted } from "@/lib/use-mounted";
import type { WalletTransaction } from "@/lib/xobriq-api";

export const Route = createFileRoute("/billing/")({
  head: () => ({
    meta: [
      { title: "Billing & Wallet — XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Track your XOBRIQ KYC wallet balance, top-ups, invoices and per-verification usage in KES.",
      },
      { property: "og:title", content: "Billing & Wallet — XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Wallet, invoices and usage for your XOBRIQ KYC account.",
      },
    ],
  }),
  component: BillingIndexPage,
});

const kes = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

function txLabel(t: WalletTransaction): {
  desc: string;
  type: "Top-up" | "Verification" | "Adjustment";
} {
  if (t.type === "topup") return { desc: t.note || "Wallet top-up", type: "Top-up" };
  if (t.type === "debit") return { desc: t.note || "Verification charge", type: "Verification" };
  return { desc: t.note || "Manual adjustment", type: "Adjustment" };
}

function BillingIndexPage() {
  const mounted = useMounted();
  const { data: me } = useQuery(meOptions(mounted));
  const { data: wallet } = useQuery(walletOptions(mounted));
  const { data: transactions } = useQuery(walletTransactionsOptions(mounted));

  const balance = wallet?.balance ?? 0;
  const identityPrice = wallet?.pricing.identity ?? null;
  const remainingChecks = identityPrice ? Math.round(balance / identityPrice) : null;

  const now = new Date();
  const monthDebits = (transactions || []).filter(
    (t) =>
      t.type === "debit" &&
      new Date(t.created_at).getMonth() === now.getMonth() &&
      new Date(t.created_at).getFullYear() === now.getFullYear(),
  );
  const verificationsMtd = monthDebits.length;
  const avgCost = monthDebits.length
    ? monthDebits.reduce((sum, t) => sum + Number(t.amount), 0) / monthDebits.length
    : null;
  const totalToppedUp = (transactions || [])
    .filter((t) => t.type === "topup")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <PageShell
      activePath="/billing"
      title="Billing & Wallet"
      subtitle="Prepaid balance, invoices and per-check usage"
      actions={
        <Button variant="outline" className="hidden gap-2 sm:inline-flex">
          <Download className="h-4 w-4" /> Statements
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" /> Wallet balance
                </div>
                <div className="mt-1 text-3xl font-bold tracking-tight">{kes(balance)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {remainingChecks !== null
                    ? `≈ ${remainingChecks.toLocaleString()} verifications remaining at ${kes(identityPrice!)} / check`
                    : "Enable pricing to estimate remaining verifications"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="gap-2" asChild>
                  <Link to="/billing/top-up">
                    <Plus className="h-4 w-4" /> Top up
                  </Link>
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <Link to="/billing/history">
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
              <div className="text-lg font-semibold capitalize">{me?.orgPlan || "—"}</div>
              <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                Active
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {identityPrice
                ? `${kes(identityPrice)} / verification · pay as you go`
                : "Pay as you go"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Verifications (MTD)", value: verificationsMtd.toLocaleString() },
          { label: "Avg cost / check", value: avgCost !== null ? kes(avgCost) : "—" },
          { label: "Failed charges", value: "0", tone: "text-success" },
          { label: "Total topped up", value: kes(totalToppedUp) },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
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
                {(transactions || []).slice(0, 10).map((t) => {
                  const { desc, type } = txLabel(t);
                  const signedAmount = t.type === "debit" ? -Number(t.amount) : Number(t.amount);
                  return (
                    <TableRow key={t.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">{t.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{desc}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {type}
                        </Badge>
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
                {(transactions || []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
