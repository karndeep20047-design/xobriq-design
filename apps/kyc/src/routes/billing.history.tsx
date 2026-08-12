import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Download, Filter } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/kyc/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { walletTransactionsOptions } from "@/lib/kyc-queries";
import { useMounted } from "@/lib/use-mounted";
import type { WalletTransaction } from "@/lib/xobriq-api";

export const Route = createFileRoute("/billing/history")({
  head: () => ({
    meta: [
      { title: "Transaction History — XOBRIQ KYC" },
      {
        name: "description",
        content: "View your XOBRIQ KYC wallet top-ups, verification charges and refunds.",
      },
      { property: "og:title", content: "Transaction History — XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Wallet transaction history for your XOBRIQ KYC account.",
      },
    ],
  }),
  component: HistoryPage,
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

function HistoryPage() {
  const mounted = useMounted();
  const { data: allTransactions } = useQuery(walletTransactionsOptions(mounted));
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const rows = (allTransactions || []).map((t) => ({ raw: t, ...txLabel(t) }));
  const filtered = rows.filter((t) => typeFilter === "all" || t.type === typeFilter);

  const totals = {
    topUps: rows
      .filter((t) => t.type === "Top-up")
      .reduce((acc, t) => acc + Number(t.raw.amount), 0),
    spent: rows
      .filter((t) => t.type === "Verification")
      .reduce((acc, t) => acc + Number(t.raw.amount), 0),
  };

  return (
    <PageShell
      activePath="/billing"
      title="Transaction history"
      subtitle="Wallet top-ups, verification charges and refunds"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 hidden sm:inline-flex">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/billing">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total top-ups
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight text-success">
              {kes(totals.topUps)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total spent
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight text-destructive">
              {kes(totals.spent)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">All transactions</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="Top-up">Top-up</SelectItem>
                <SelectItem value="Verification">Verification</SelectItem>
                <SelectItem value="Adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No transactions match the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => {
                    const signedAmount =
                      t.raw.type === "debit" ? -Number(t.raw.amount) : Number(t.raw.amount);
                    return (
                      <TableRow key={t.raw.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">{t.raw.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{t.desc}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(t.raw.created_at).toLocaleString()}
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
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
