"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { submitTopupRequestAction } from "../actions";

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

// ---------------------------------------------------------------------------
// M-Pesa STK Push states
// ---------------------------------------------------------------------------
type StkState =
  | { step: "input" }
  | { step: "sending" }
  | { step: "waiting"; checkoutRequestId: string }
  | { step: "success"; mpesaReceiptNumber: string | null }
  | { step: "failed"; error: string };

export function TopUpClient({
  walletBalance,
  identityPrice,
  organizationId,
}: {
  walletBalance: number;
  identityPrice: number | null;
  organizationId: string;
}) {
  const [amount, setAmount] = useState<number>(5000);
  const [custom, setCustom] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [method, setMethod] = useState<"mpesa" | "card" | "bank">("mpesa");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // M-Pesa STK Push state
  const [phone, setPhone] = useState("");
  const [stkState, setStkState] = useState<StkState>({ step: "input" });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectPreset = (value: number) => {
    setAmount(value);
    setCustom("");
  };

  const handleCustom = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setCustom(digits);
    setAmount(digits ? Number(digits) : 0);
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Poll for STK Push status
  const startPolling = useCallback((checkoutRequestId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    let attempts = 0;
    const maxAttempts = 40; // ~2 minutes at 3s intervals

    pollingRef.current = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setStkState({
          step: "failed",
          error: "Payment timed out. Please try again or check your M-Pesa messages.",
        });
        return;
      }

      try {
        const res = await fetch(
          `/api/mpesa/stkpush/status?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}`,
        );
        if (!res.ok) return; // transient error, keep polling

        const data = await res.json();

        if (data.status === "SUCCESS") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setStkState({
            step: "success",
            mpesaReceiptNumber: data.mpesaReceiptNumber,
          });
        } else if (data.status === "FAILED") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setStkState({
            step: "failed",
            error: data.resultDesc || "Payment was not completed.",
          });
        }
        // PENDING → keep polling
      } catch {
        // Network error — keep polling
      }
    }, 3000);
  }, []);

  // Initiate STK Push
  async function handleStkPush() {
    if (!phone.trim() || amount <= 0) return;

    setStkState({ step: "sending" });

    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // organizationId is deliberately not sent — the route derives it
        // from the session, so the browser cannot nominate which org gets
        // charged.
        body: JSON.stringify({
          amount,
          phoneNumber: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.fieldErrors
              ? Object.values(data.error.fieldErrors).flat().join(", ")
              : "Failed to initiate payment.";
        setStkState({ step: "failed", error: errorMsg });
        return;
      }

      setStkState({ step: "waiting", checkoutRequestId: data.checkoutRequestId });
      startPolling(data.checkoutRequestId);
    } catch {
      setStkState({ step: "failed", error: "Network error. Please try again." });
    }
  }

  // Handle non-mpesa submit (card/bank — existing flow)
  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitTopupRequestAction({
        amount,
        method,
        contactReference: reference || undefined,
      });
      if (!result.ok) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Reset STK state for retry
  function resetStkState() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setStkState({ step: "input" });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Top up wallet</h1>
          <p className="mt-1 text-sm text-fg-muted">Add funds to your prepaid balance</p>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <Link href="/billing">
            <ArrowLeft className="h-4 w-4" /> Back to billing
          </Link>
        </Button>
      </div>

      {/* STK Push success (M-Pesa automated payment completed) */}
      {stkState.step === "success" ? (
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold">Payment received!</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Your M-Pesa payment of {kes(amount)} has been confirmed and your wallet has been
              credited automatically.
            </p>
            {stkState.mpesaReceiptNumber && (
              <div className="mt-3 rounded-lg border border-border/60 bg-muted/50 px-4 py-2 text-xs font-mono text-muted-foreground">
                M-Pesa Receipt: {stkState.mpesaReceiptNumber}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/billing/history">View history</Link>
              </Button>
              <Button asChild>
                <Link href="/billing">Back to wallet</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : submitted ? (
        /* Non-M-Pesa success (card/bank — manual review) */
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
                <Link href="/billing/history">View history</Link>
              </Button>
              <Button asChild>
                <Link href="/billing">Back to wallet</Link>
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
                  {identityPrice ? (
                    <div className="mt-2 flex items-center justify-between">
                      <span>Estimated checks</span>
                      <span className="font-medium text-foreground">
                        ≈ {Math.round(amount / identityPrice)}
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
                  onValueChange={(v) => {
                    setMethod(v as typeof method);
                    // Reset STK state when switching tabs
                    if (v !== "mpesa") resetStkState();
                  }}
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

                  <TabsContent value="mpesa" className="mt-4 space-y-4">
                    {stkState.step === "input" || stkState.step === "sending" ? (
                      <>
                        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Instant payment:</span>{" "}
                          Enter your M-Pesa phone number below and click pay. You&apos;ll receive a
                          PIN prompt on your phone to confirm the payment of{" "}
                          <span className="font-semibold text-foreground">{kes(amount)}</span>.
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                              +254
                            </span>
                            <Input
                              id="mpesa-phone"
                              inputMode="tel"
                              placeholder="7XXXXXXXX"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, "").slice(0, 12))}
                              className="pl-14"
                              disabled={stkState.step === "sending"}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Enter the number registered with M-Pesa (e.g. 0712345678 or 254712345678)
                          </p>
                        </div>
                      </>
                    ) : stkState.step === "waiting" ? (
                      <div className="flex flex-col items-center gap-4 py-6">
                        <div className="relative flex h-16 w-16 items-center justify-center">
                          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Smartphone className="h-6 w-6 text-primary animate-pulse" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">Check your phone</p>
                          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                            An M-Pesa PIN prompt has been sent to your phone. Enter your PIN to
                            complete the payment of {kes(amount)}.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Waiting for confirmation...
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground"
                          onClick={resetStkState}
                        >
                          Cancel and try again
                        </Button>
                      </div>
                    ) : stkState.step === "failed" ? (
                      <div className="flex flex-col items-center gap-4 py-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                          <XCircle className="h-7 w-7 text-destructive" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">Payment not completed</p>
                          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                            {stkState.error}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={resetStkState}>
                          Try again
                        </Button>
                      </div>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="card" className="mt-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      Card top-ups aren&apos;t automated yet. Contact your account manager to
                      arrange a card payment, then enter their reference below.
                    </div>
                  </TabsContent>

                  <TabsContent value="bank" className="mt-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      Transfer {kes(amount)} to Xobriq&apos;s bank account (details sent to your
                      billing email), then enter your transfer reference below. Bank transfers are
                      usually confirmed within 1 business day.
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Reference input — only shown for card/bank methods */}
                {method !== "mpesa" && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="reference">Payment reference</Label>
                    <Input
                      id="reference"
                      placeholder={
                        method === "card" ? "Reference / phone number" : "Bank transfer reference"
                      }
                      value={reference}
                      onChange={(e) => setReference(e.target.value.slice(0, 120))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              {method === "mpesa"
                ? "M-Pesa payments are instant — your wallet is credited automatically once you confirm with your PIN."
                : "This submits a request for review — your wallet is credited once staff confirm the payment arrived."}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 shadow-[var(--shadow-card)] bg-gradient-to-br from-primary/5 to-primary/0">
              <CardContent className="p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current balance
                </div>
                <div className="mt-1 text-3xl font-bold tracking-tight">{kes(walletBalance)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  After top-up: {kes(walletBalance + amount)}
                </div>
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

                {method === "mpesa" ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleStkPush}
                    disabled={
                      amount <= 0 ||
                      !phone.trim() ||
                      stkState.step === "sending" ||
                      stkState.step === "waiting"
                    }
                  >
                    {stkState.step === "sending" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending prompt...
                      </>
                    ) : stkState.step === "waiting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Waiting for PIN...
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-4 w-4" />
                        Pay {kes(amount)} with M-Pesa
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={amount <= 0 || submitting}
                  >
                    {submitting ? "Submitting…" : `Submit request for ${kes(amount)}`}
                  </Button>
                )}

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/billing/history">View history</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
