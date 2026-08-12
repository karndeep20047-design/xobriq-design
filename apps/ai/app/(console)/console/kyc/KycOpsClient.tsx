"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  Activity, AlertTriangle, Building2, CheckCircle2, Check, Fingerprint, Phone, RefreshCcw, ShieldCheck, Wallet, X,
} from "lucide-react";
import { ConsolePageHeader, ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import { StatCard } from "../guard/GuardDashboardClient";
import { runKycHealthCheck } from "./actions";
import { approveTopupRequestAction, rejectTopupRequestAction } from "../clients/actions";

export type KycVerificationRow = {
  id: string;
  ref: string;
  organization_id: string;
  organizationName: string;
  verification_type: "identity" | "phone" | "business";
  status: "pending" | "completed" | "failed";
  matched: boolean | null;
  error_message: string | null;
  duration_ms: number | null;
  requested_by_email: string | null;
  created_at: string;
  completed_at: string | null;
};

export type KycProviderRequestRow = {
  id: string;
  request_type: "identity" | "phone" | "business" | "health_check";
  success: boolean;
  error_message: string | null;
  duration_ms: number;
  created_at: string;
};

export type KycBillingRow = {
  id: string;
  organization_id: string;
  organizationName: string;
  verification_id: string;
  verification_type: "identity" | "phone" | "business";
  client_price: number;
  currency: string;
  created_at: string;
  providerCost: number | null;
  profit: number | null;
};

export type KycTopupRequestRow = {
  id: string;
  organization_id: string;
  organizationName: string;
  amount: number;
  currency: string;
  method: "mpesa" | "bank" | "card";
  contact_reference: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const POLL_MS = 5000;
const TREND_DAYS = 14;
// Matches the server-side minimum interval in ./actions.ts's
// runKycHealthCheck — this is just the client-side reflection of that
// real guard (disables the button locally), not the actual enforcement.
const HEALTH_CHECK_COOLDOWN_MS = 30 * 60_000;

export function KycOpsClient({
  initialVerifications,
  initialProviderRequests,
  initialBilling,
  initialTopupRequests,
  canSeeFinancial,
}: {
  initialVerifications: KycVerificationRow[];
  initialProviderRequests: KycProviderRequestRow[];
  initialBilling: KycBillingRow[];
  initialTopupRequests: KycTopupRequestRow[];
  canSeeFinancial: boolean;
}) {
  const [verifications, setVerifications] = useState(initialVerifications);
  const [providerRequests, setProviderRequests] = useState(initialProviderRequests);
  const [billing, setBilling] = useState(initialBilling);
  const [topupRequests, setTopupRequests] = useState(initialTopupRequests);
  const [checking, setChecking] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const [healthCheckError, setHealthCheckError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/console/kyc/stats");
    if (!res.ok) return;
    const data = await res.json();
    setVerifications(data.verifications);
    setProviderRequests(data.providerRequests);
    setBilling(data.billing);
    setTopupRequests(data.topupRequests);
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  function handleRunHealthCheck() {
    setChecking(true);
    setHealthCheckError(null);
    startTransition(async () => {
      const result = await runKycHealthCheck();
      if (!result.ok) {
        setHealthCheckError(result.error);
        setChecking(false);
        return;
      }
      await refresh();
      setChecking(false);
      setCoolingDown(true);
      setTimeout(() => setCoolingDown(false), HEALTH_CHECK_COOLDOWN_MS);
    });
  }

  const health = useMemo(() => computeHealth(providerRequests), [providerRequests]);
  const usage = useMemo(() => computeUsage(verifications), [verifications]);
  const revenue = useMemo(() => computeRevenue(billing), [billing]);
  const orgUsage = useMemo(() => computeOrgUsage(verifications, billing), [verifications, billing]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow="Xobriq KYC"
        title="KYC Operations"
        description="Real Creditinfo sandbox integration · auto-refreshes every 5s · last 200 verifications"
        actions={
          <button
            onClick={handleRunHealthCheck}
            disabled={checking || coolingDown}
            title="Makes a real, billed Creditinfo call — limited to once every 30 minutes"
            className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-medium text-enterprise-on-primary transition hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" />
            {checking ? "Checking…" : coolingDown ? "Checked" : "Run health check now"}
          </button>
        }
      />

      {healthCheckError ? (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          {healthCheckError}
        </div>
      ) : null}

      {/* Provider health */}
      <ConsoleCard className="mb-8">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
            Creditinfo provider status
          </h2>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <HealthStat
            label="Success rate"
            value={health.successRate === null ? "—" : `${health.successRate}%`}
            tone={health.successRate === null ? "muted" : health.successRate >= 95 ? "success" : health.successRate >= 80 ? "warning" : "danger"}
          />
          <HealthStat
            label="Avg latency"
            value={health.avgLatencyMs === null ? "—" : `${(health.avgLatencyMs / 1000).toFixed(1)}s`}
            tone="muted"
          />
          <HealthStat
            label="Requests (rolling)"
            value={String(health.sampleSize)}
            tone="muted"
          />
          <HealthStat
            label="Last error"
            value={health.lastFailure ? new Date(health.lastFailure.created_at).toLocaleString() : "None recorded"}
            tone={health.lastFailure ? "danger" : "success"}
            detail={health.lastFailure?.error_message || undefined}
          />
        </div>
        {health.lastHealthCheck ? (
          <div className="border-t border-border px-6 py-3 text-xs text-fg-subtle">
            Last manual check: {new Date(health.lastHealthCheck.created_at).toLocaleString()} ·{" "}
            {health.lastHealthCheck.success ? "healthy" : `unhealthy — ${health.lastHealthCheck.error_message}`}
          </div>
        ) : null}
      </ConsoleCard>

      {/* Usage */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total verifications" value={usage.total} Icon={ShieldCheck} tone="muted" />
        <StatCard label="Matched" value={usage.byOutcome.matched} Icon={CheckCircle2} tone="success" />
        <StatCard label="Not matched" value={usage.byOutcome.notMatched} Icon={AlertTriangle} tone="warning" />
        <StatCard label="Failed" value={usage.byOutcome.failed} Icon={AlertTriangle} tone="danger" />
      </div>

      {/* Revenue & profit — omitted entirely for a viewer without
          kyc_ops_financial, not just visually hidden */}
      {canSeeFinancial ? (
        <div className="mt-8">
          <ConsoleCard>
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                Revenue &amp; profit · last {revenue.sampleSize} billed verifications
              </h2>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <HealthStat label="Revenue" value={formatMoney(revenue.totalRevenue, revenue.currency)} tone="muted" />
              <HealthStat label="Provider cost" value={formatMoney(revenue.totalCost, revenue.currency)} tone="muted" />
              <HealthStat
                label="Profit"
                value={formatMoney(revenue.totalProfit, revenue.currency)}
                tone={revenue.totalProfit >= 0 ? "success" : "danger"}
              />
              <HealthStat
                label="Margin"
                value={revenue.marginPct === null ? "—" : `${revenue.marginPct}%`}
                tone={revenue.marginPct === null ? "muted" : revenue.marginPct >= 0 ? "success" : "danger"}
              />
            </div>
          </ConsoleCard>
        </div>
      ) : null}

      <div className="mt-8">
        <ConsoleCard>
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
              Verifications per day · last {TREND_DAYS} days
            </h2>
            <div className="flex items-center gap-4 text-xs text-fg-subtle">
              <TypeLegendDot Icon={Fingerprint} label={`Identity · ${usage.byType.identity}`} />
              <TypeLegendDot Icon={Phone} label={`Phone · ${usage.byType.phone}`} />
              <TypeLegendDot Icon={Building2} label={`Business · ${usage.byType.business}`} />
            </div>
          </div>
          <div className="p-6">
            <DailyTrendChart verifications={verifications} />
          </div>
        </ConsoleCard>
      </div>

      <div className="mt-8">
        <ConsoleCard>
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Usage by client</h2>
          </div>
          {orgUsage.length === 0 ? (
            <EmptyState
              Icon={Building2}
              title="No verifications yet"
              message="Client usage will appear here once an organization runs a real Creditinfo verification."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-subtle">
                    <th className="px-6 py-3">Organization</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Matched</th>
                    <th className="px-6 py-3">Not matched</th>
                    <th className="px-6 py-3">Failed</th>
                    {canSeeFinancial ? (
                      <>
                        <th className="px-6 py-3">Revenue</th>
                        <th className="px-6 py-3">Profit</th>
                      </>
                    ) : null}
                    <th className="px-6 py-3">Last activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orgUsage.map((o) => (
                    <tr key={o.organizationId}>
                      <td className="px-6 py-3 font-medium">{o.organizationName}</td>
                      <td className="px-6 py-3 tabular-nums">{o.total}</td>
                      <td className="px-6 py-3 tabular-nums text-emerald-400">{o.matched}</td>
                      <td className="px-6 py-3 tabular-nums text-amber-400">{o.notMatched}</td>
                      <td className="px-6 py-3 tabular-nums text-red-400">{o.failed}</td>
                      {canSeeFinancial ? (
                        <>
                          <td className="px-6 py-3 tabular-nums">
                            {o.revenue > 0 ? formatMoney(o.revenue, o.currency) : "—"}
                          </td>
                          <td className={"px-6 py-3 tabular-nums " + (o.profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {o.revenue > 0 ? formatMoney(o.profit, o.currency) : "—"}
                          </td>
                        </>
                      ) : null}
                      <td className="px-6 py-3 text-fg-muted">{new Date(o.lastActivity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConsoleCard>
      </div>

      {canSeeFinancial ? (
        <div className="mt-8">
          <ConsoleCard>
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                Pending top-up requests
              </h2>
            </div>
            {topupRequests.length === 0 ? (
              <EmptyState
                Icon={Wallet}
                title="Nothing pending"
                message="Client-submitted wallet top-up requests will show up here for approval."
              />
            ) : (
              <div className="divide-y divide-border">
                {topupRequests.map((r) => (
                  <TopupRequestRow
                    key={r.id}
                    request={r}
                    onReviewed={() => setTopupRequests((prev) => prev.filter((p) => p.id !== r.id))}
                  />
                ))}
              </div>
            )}
          </ConsoleCard>
        </div>
      ) : null}

      <div className="mt-8">
        <ConsoleCard>
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Recent verifications</h2>
          </div>
          {verifications.length === 0 ? (
            <EmptyState
              Icon={Activity}
              title="No verifications yet"
              message="Real Creditinfo verifications submitted from the Xobriq KYC dashboard will show up here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-subtle">
                    <th className="px-6 py-3">Time (UTC)</th>
                    <th className="px-6 py-3">Organization</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Ref</th>
                    <th className="px-6 py-3">Requested by</th>
                    <th className="px-6 py-3">Latency</th>
                    <th className="px-6 py-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {verifications.slice(0, 50).map((v) => (
                    <tr key={v.id}>
                      <td className="px-6 py-3 text-fg-muted">{new Date(v.created_at).toLocaleString()}</td>
                      <td className="px-6 py-3">{v.organizationName}</td>
                      <td className="px-6 py-3 capitalize">{v.verification_type}</td>
                      <td className="px-6 py-3 font-mono text-xs">{v.ref}</td>
                      <td className="px-6 py-3 text-fg-muted">{v.requested_by_email || "—"}</td>
                      <td className="px-6 py-3 tabular-nums">{v.duration_ms ? `${(v.duration_ms / 1000).toFixed(1)}s` : "—"}</td>
                      <td className="px-6 py-3">
                        <OutcomeBadge status={v.status} matched={v.matched} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConsoleCard>
      </div>
    </div>
  );
}

function TopupRequestRow({
  request,
  onReviewed,
}: {
  request: KycTopupRequestRow;
  onReviewed: () => void;
}) {
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function review(action: "approve" | "reject") {
    setPending(action);
    setError(null);
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveTopupRequestAction(request.id)
          : await rejectTopupRequestAction(request.id);
      setPending(null);
      if (result.ok) {
        onReviewed();
      } else {
        setError(result.error || "Failed to review request");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <p className="text-sm font-medium">{request.organizationName}</p>
        <p className="mt-0.5 text-xs text-fg-muted">
          {formatMoney(Number(request.amount), request.currency)} via {request.method}
          {request.contact_reference ? ` · ref ${request.contact_reference}` : ""} ·{" "}
          {new Date(request.created_at).toLocaleString()}
        </p>
        {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => review("reject")}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-xs font-medium hover:bg-bg disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          {pending === "reject" ? "Rejecting…" : "Reject"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => review("approve")}
          className="inline-flex items-center gap-1.5 rounded-md bg-enterprise-primary px-2.5 py-1.5 text-xs font-medium text-enterprise-on-primary disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          {pending === "approve" ? "Approving…" : "Approve"}
        </button>
      </div>
    </div>
  );
}

function HealthStat({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string;
  tone: "muted" | "success" | "warning" | "danger";
  detail?: string;
}) {
  const cls =
    tone === "danger" ? "text-red-400" :
    tone === "warning" ? "text-amber-400" :
    tone === "success" ? "text-emerald-400" :
    "text-fg";

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-fg-subtle">{label}</p>
      <p className={"mt-1 text-lg font-bold " + cls}>{value}</p>
      {detail ? <p className="mt-1 truncate text-xs text-fg-subtle" title={detail}>{detail}</p> : null}
    </div>
  );
}

function TypeLegendDot({ Icon, label }: { Icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function OutcomeBadge({ status, matched }: { status: KycVerificationRow["status"]; matched: boolean | null }) {
  if (status === "pending") {
    return <span className="rounded-full bg-fg-subtle/10 px-2.5 py-0.5 text-xs font-bold text-fg-subtle">PENDING</span>;
  }
  if (status === "failed") {
    return <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-400">FAILED</span>;
  }
  return matched ? (
    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">MATCHED</span>
  ) : (
    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400">NOT MATCHED</span>
  );
}

function DailyTrendChart({ verifications }: { verifications: KycVerificationRow[] }) {
  const buckets = useMemo(() => {
    const counts = new Array(TREND_DAYS).fill(0);
    const todayIdx = Math.floor(new Date().getTime() / 86_400_000);
    for (const v of verifications) {
      const dayIdx = Math.floor(new Date(v.created_at).getTime() / 86_400_000);
      const idx = TREND_DAYS - 1 - (todayIdx - dayIdx);
      if (idx >= 0 && idx < TREND_DAYS) counts[idx]++;
    }
    return counts;
  }, [verifications]);

  const max = Math.max(1, ...buckets);

  return (
    <div className="flex h-24 items-end gap-1">
      {buckets.map((count, i) => {
        const height = count === 0 ? 2 : Math.max(6, (count / max) * 100);
        const isLatest = i === buckets.length - 1;
        return (
          <div
            key={i}
            className={
              "group relative flex-1 rounded-t transition " +
              (isLatest ? "bg-enterprise-primary" : "bg-enterprise-primary/40 hover:bg-enterprise-primary/70")
            }
            style={{ height: `${height}%` }}
            title={`${count} verification${count === 1 ? "" : "s"}`}
          />
        );
      })}
    </div>
  );
}

function computeHealth(requests: KycProviderRequestRow[]) {
  const recent = requests.slice(0, 50);
  const sampleSize = recent.length;
  const successes = recent.filter((r) => r.success).length;
  const successRate = sampleSize === 0 ? null : Math.round((successes / sampleSize) * 100);
  const successfulLatencies = recent.filter((r) => r.success).map((r) => r.duration_ms);
  const avgLatencyMs = successfulLatencies.length
    ? Math.round(successfulLatencies.reduce((a, b) => a + b, 0) / successfulLatencies.length)
    : null;
  const lastFailure = requests.find((r) => !r.success) || null;
  const lastHealthCheck = requests.find((r) => r.request_type === "health_check") || null;
  return { sampleSize, successRate, avgLatencyMs, lastFailure, lastHealthCheck };
}

function computeUsage(verifications: KycVerificationRow[]) {
  const byType = { identity: 0, phone: 0, business: 0 };
  const byOutcome = { matched: 0, notMatched: 0, failed: 0, pending: 0 };
  for (const v of verifications) {
    byType[v.verification_type]++;
    if (v.status === "failed") byOutcome.failed++;
    else if (v.status === "pending") byOutcome.pending++;
    else if (v.matched) byOutcome.matched++;
    else byOutcome.notMatched++;
  }
  return { total: verifications.length, byType, byOutcome };
}

function computeOrgUsage(verifications: KycVerificationRow[], billing: KycBillingRow[]) {
  const map = new Map<
    string,
    {
      organizationId: string;
      organizationName: string;
      total: number;
      matched: number;
      notMatched: number;
      failed: number;
      revenue: number;
      profit: number;
      currency: string;
      lastActivity: string;
    }
  >();
  for (const v of verifications) {
    const entry = map.get(v.organization_id) || {
      organizationId: v.organization_id,
      organizationName: v.organizationName,
      total: 0,
      matched: 0,
      notMatched: 0,
      failed: 0,
      revenue: 0,
      profit: 0,
      currency: "KES",
      lastActivity: v.created_at,
    };
    entry.total++;
    if (v.status === "failed") entry.failed++;
    else if (v.status === "completed" && v.matched) entry.matched++;
    else if (v.status === "completed") entry.notMatched++;
    if (v.created_at > entry.lastActivity) entry.lastActivity = v.created_at;
    map.set(v.organization_id, entry);
  }
  for (const b of billing) {
    const entry = map.get(b.organization_id);
    if (!entry) continue; // billing row for an org outside the current verifications window
    entry.revenue += Number(b.client_price);
    entry.profit += b.profit ?? 0;
    entry.currency = b.currency;
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function computeRevenue(billing: KycBillingRow[]) {
  const totalRevenue = billing.reduce((sum, b) => sum + Number(b.client_price), 0);
  const totalCost = billing.reduce((sum, b) => sum + (b.providerCost ?? 0), 0);
  const totalProfit = billing.reduce((sum, b) => sum + (b.profit ?? 0), 0);
  const marginPct = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : null;
  const currency = billing[0]?.currency || "KES";
  return { sampleSize: billing.length, totalRevenue, totalCost, totalProfit, marginPct, currency };
}

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
