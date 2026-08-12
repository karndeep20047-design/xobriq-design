"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";

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
import { retryVerificationAction, type RetryResult } from "./actions";

const BASE = "/dashboard/xobriqKYC";

export type AlertRow = {
  id: string;
  ref: string;
  identifierType: string | null;
  lastName: string | null;
  verificationType: "identity" | "phone" | "business";
  status: "pending" | "completed" | "failed";
  matched: boolean | null;
  errorMessage: string | null;
  retryable: boolean | null;
  createdAt: string;
};

type Signal = "Failed" | "Not matched";

function signalFor(a: AlertRow): Signal {
  return a.status === "failed" ? "Failed" : "Not matched";
}

const signalStyles: Record<Signal, string> = {
  Failed: "bg-destructive/15 text-destructive border-destructive/30",
  "Not matched": "bg-warning/15 text-warning-foreground border-warning/30",
};

const filters = ["All", "Failed", "Not matched"] as const;

export function AlertsClient({ initialAlerts }: { initialAlerts: AlertRow[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [tab, setTab] = useState<(typeof filters)[number]>("All");
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const filtered = alerts.filter((a) => tab === "All" || signalFor(a) === tab);

  const failedCount = alerts.filter((a) => a.status === "failed").length;
  const notMatchedCount = alerts.filter((a) => a.status !== "failed").length;
  const retryableFailed = alerts.filter((a) => a.status === "failed" && a.retryable);

  const stats = [
    { label: "Failed checks", value: failedCount, icon: AlertTriangle, tone: "text-destructive" },
    { label: "Not matched", value: notMatchedCount, icon: ShieldAlert, tone: "text-warning-foreground" },
    { label: "Total flagged", value: alerts.length, icon: ShieldCheck, tone: "text-foreground" },
  ];

  // Applies a retry result to local state so the row updates immediately
  // without a full page reload — a resolved match (completed + matched)
  // no longer belongs on this page at all (this list is "failed or not
  // matched"), so it's dropped from view entirely, same as a fresh page
  // load's own query would no longer return it.
  function applyResult(id: string, result: RetryResult) {
    if (result.ok) {
      if (result.status === "completed" && result.matched) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      } else {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, status: result.status, matched: result.matched, retryable: result.retryable ?? null }
              : a,
          ),
        );
      }
    } else {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, errorMessage: result.error } : a)));
    }
  }

  async function retryOne(id: string): Promise<RetryResult> {
    setRetryingIds((prev) => new Set(prev).add(id));
    const result = await retryVerificationAction(id);
    setRetryingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    applyResult(id, result);
    return result;
  }

  // One-shot, sequential — no automatic backoff/scheduling here (that's a
  // later feature). Meant to be clicked once the client believes Creditinfo
  // is back up; anything still failing afterward just stays in the list for
  // the next click.
  async function retryAllFailed() {
    const targets = retryableFailed;
    if (targets.length === 0 || bulkRetrying) return;

    setBulkRetrying(true);
    setBulkMessage(null);
    let resolved = 0;
    let stillFailing = 0;

    for (const target of targets) {
      const result = await retryOne(target.id);
      if (result.ok && result.status === "completed") resolved += 1;
      else stillFailing += 1;

      if (!result.ok && "insufficientBalance" in result && result.insufficientBalance) {
        setBulkMessage(result.error);
        setBulkRetrying(false);
        return;
      }
    }

    setBulkRetrying(false);
    setBulkMessage(`Retried ${targets.length}: ${resolved} resolved, ${stillFailing} still failing.`);
  }

  return (
    <PageShell title="Alerts" subtitle="Verifications that failed or did not match, for your organization">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/60 shadow-[var(--shadow-card)]">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </div>
                  <div className={cn("mt-1 text-2xl font-bold tracking-tight", s.tone)}>
                    {s.value}
                  </div>
                </div>
                <Icon className={cn("h-5 w-5", s.tone)} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
          <CardTitle className="text-base">Flagged verifications</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {retryableFailed.length > 0 ? (
              <Button size="sm" variant="secondary" onClick={retryAllFailed} disabled={bulkRetrying} className="gap-1.5">
                {bulkRetrying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Retrying…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" /> Retry all failed ({retryableFailed.length})
                  </>
                )}
              </Button>
            ) : null}
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setTab(f)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition",
                    tab === f
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        {bulkMessage ? (
          <div className="border-b border-border/60 px-5 py-2 text-xs text-muted-foreground sm:px-6">
            {bulkMessage}
          </div>
        ) : null}
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {alerts.length === 0
                ? "Nothing flagged — every verification so far has completed and matched."
                : "No alerts match this filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Raised</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => {
                    const isRetrying = retryingIds.has(a.id);
                    const canRetry = a.status === "failed" && a.retryable;
                    return (
                      <TableRow key={a.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">{a.ref}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{a.lastName || "Unnamed"}</div>
                          <div className="text-xs text-muted-foreground">{a.identifierType || "unknown"}</div>
                        </TableCell>
                        <TableCell className="text-sm capitalize">{a.verificationType}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("font-medium", signalStyles[signalFor(a)])}>
                            {signalFor(a)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {a.errorMessage || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canRetry ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isRetrying || bulkRetrying}
                                onClick={() => retryOne(a.id)}
                                className="gap-1"
                              >
                                {isRetrying ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3.5 w-3.5" />
                                )}
                                Retry
                              </Button>
                            ) : null}
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`${BASE}/verifications/${encodeURIComponent(a.ref)}`}>
                                Investigate
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
