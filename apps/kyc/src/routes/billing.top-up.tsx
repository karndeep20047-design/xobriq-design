import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Landmark,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/kyc/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { walletOptions } from "@/lib/kyc-queries";
import { useMounted } from "@/lib/use-mounted";
import { submitTopupRequest, XobriqApiError } from "@/lib/xobriq-api";

export const Route = createFileRoute("/billing/top-up")({
  head: () => ({
    meta: [
      { title: "Top Up Wallet — XOBRIQ KYC" },
      {
        name: "description",
        content: "Add funds to your XOBRIQ KYC wallet via M-Pesa, card or bank transfer.",
      },
      { property: "og:title", content: "Top Up Wallet — XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Top up your prepaid XOBRIQ KYC wallet in KES.",
      },
    ],
  }),
  component: TopUpPage,
});

const presets = [
  { amount: 1000, popular: false },
  { amount: 5000, popular: true },
  { amount: 10000, popular: false },
  { amount: 25000, popular: false },
  { amount: 50000, popular: false },
  { amount: 100000, popular: false },
];

const kes = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

function TopUpPage() {
  const mounted = useMounted();
  const { data: wallet } = useQuery(walletOptions(mounted));
  const [amount, setAmount] = useState<number>(5000);
  const [custom, setCustom] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [method, setMethod] = useState<"mpesa" | "card" | "bank">("mpesa");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectPreset = (value: number) => {
    setAmount(value);
    setCustom("");
  };

  const handleCustom = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setCustom(digits);
    setAmount(digits ? Number(digits) : 0);
  };

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await submitTopupRequest({ amount, method, contactReference: reference || undefined });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof XobriqApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      activePath="/billing"
      title="Top up wallet"
      subtitle="Add funds to your prepaid balance"
      actions={
        <Button variant="outline" className="gap-2" asChild>
          <Link to="/billing">
            <ArrowLeft className="h-4 w-4" /> Back to billing
          </Link>
        </Button>
      }
    >
      {submitted ? (
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold">Top-up request submitted</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              A request for {kes(amount)} via{" "}
              {method === "mpesa" ? "M-Pesa" : method === "card" ? "Card" : "Bank transfer"} is
              pending review. Your wallet will be credited once our team confirms the payment
              arrived — this can take up to one business day.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/billing/history">View history</Link>
              </Button>
              <Button asChild>
                <Link to="/billing">Back to wallet</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Choose amount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {presets.map((p) => {
                    const active = amount === p.amount && custom === "";
                    return (
                      <button
                        key={p.amount}
                        onClick={() => selectPreset(p.amount)}
                        className={cn(
                          "relative flex flex-col items-center justify-center rounded-xl border p-4 text-left transition",
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
                        )}
                      >
                        <span className="text-lg font-semibold">{kes(p.amount)}</span>
                        {p.popular && (
                          <Badge
                            variant="outline"
                            className="absolute -top-2 left-1/2 -translate-x-1/2 border-primary/30 bg-primary/10 text-primary"
                          >
                            Popular
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom">Custom amount</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      KES
                    </span>
                    <Input
                      id="custom"
                      inputMode="numeric"
                      placeholder=""
                      value={custom}
                      onChange={(e) => handleCustom(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Amount to pay</span>
                    <span className="font-semibold text-foreground">{kes(amount)}</span>
                  </div>
                  {wallet?.pricing.identity ? (
                    <div className="mt-2 flex items-center justify-between">
                      <span>Estimated checks</span>
                      <span className="font-medium text-foreground">
                        ≈ {Math.round(amount / wallet.pricing.identity)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Payment method</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={method}
                  onValueChange={(v) => setMethod(v as typeof method)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="mpesa" className="gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="hidden sm:inline">M-Pesa</span>
                    </TabsTrigger>
                    <TabsTrigger value="card" className="gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">Card</span>
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="gap-2">
                      <Landmark className="h-4 w-4" />
                      <span className="hidden sm:inline">Bank</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="mpesa" className="mt-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      Send {kes(amount)} to Paybill 4045211, then enter the M-Pesa confirmation code
                      below so we can match it to your account.
                    </div>
                  </TabsContent>

                  <TabsContent value="card" className="mt-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      Card top-ups aren't automated yet. Contact your account manager to arrange a
                      card payment, then enter their reference below.
                    </div>
                  </TabsContent>

                  <TabsContent value="bank" className="mt-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      Transfer {kes(amount)} to Xobriq's bank account (details sent to your billing
                      email), then enter your transfer reference below. Bank transfers are usually
                      confirmed within 1 business day.
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="reference">Payment reference</Label>
                  <Input
                    id="reference"
                    placeholder={
                      method === "mpesa" ? "M-Pesa confirmation code" : "Reference / phone number"
                    }
                    value={reference}
                    onChange={(e) => setReference(e.target.value.slice(0, 120))}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              This submits a request for review — your wallet is credited once staff confirm the
              payment arrived.
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 shadow-[var(--shadow-card)] bg-gradient-to-br from-primary/5 to-primary/0">
              <CardContent className="p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current balance
                </div>
                <div className="mt-1 text-3xl font-bold tracking-tight">
                  {wallet ? kes(wallet.balance) : "—"}
                </div>
                {wallet ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    After approval: {kes(wallet.balance + amount)}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Order summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Top-up amount</span>
                  <span className="font-medium">{kes(amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing fee</span>
                  <span className="font-medium">KES 0.00</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>{kes(amount)}</span>
                  </div>
                </div>
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={amount <= 0 || submitting}
                >
                  {submitting ? "Submitting…" : `Submit request for ${kes(amount)}`}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/billing/history">View history</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}
