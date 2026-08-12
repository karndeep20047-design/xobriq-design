"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Send, RotateCcw } from "lucide-react";
import { ConsolePageHeader, ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import { sendTestGuardTransaction, resetGuardHits } from "./actions";
import { ScanPanel } from "./ScanPanel";

export type GuardHit = {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  rule_action: "BLOCK" | "REVIEW" | "ALLOW";
  model_score: number | null;
  action: "BLOCK" | "REVIEW" | "ALLOW";
};

export type GuardSummary = { total: number; BLOCK: number; REVIEW: number; ALLOW: number };

const POLL_MS = 3000;
const ACTIVITY_BUCKETS = 15; // last 15 minutes

export function GuardDashboardClient({
  initialHits,
  initialSummary,
}: {
  initialHits: GuardHit[];
  initialSummary: GuardSummary;
}) {
  const [hits, setHits] = useState(initialHits);
  const [summary, setSummary] = useState(initialSummary);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/console/guard/hits");
    if (!res.ok) return;
    const data = await res.json();
    setHits(data.hits);
    setSummary(data.summary);
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  function handleSendTest() {
    setSending(true);
    startTransition(async () => {
      await sendTestGuardTransaction();
      await refresh();
      setSending(false);
    });
  }

  function handleReset() {
    if (!window.confirm("Clear all recorded Guard hits? This cannot be undone.")) return;
    setResetting(true);
    startTransition(async () => {
      await resetGuardHits();
      await refresh();
      setResetting(false);
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow="Xobriq Guard"
        title={
          <span className="inline-flex items-center gap-3">
            Xobriq Guard Live
            <LiveBadge />
          </span>
        }
        description="Auto-refreshes every 3s · most recent first · last 200 hits"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              {resetting ? "Resetting…" : "Reset"}
            </button>
            <button
              onClick={handleSendTest}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-medium text-enterprise-on-primary transition hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : "Send test transaction"}
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total hits" value={summary.total} Icon={ShieldCheck} tone="muted" />
        <StatCard label="Blocked" value={summary.BLOCK} Icon={ShieldAlert} tone="danger" />
        <StatCard label="Review" value={summary.REVIEW} Icon={ShieldQuestion} tone="warning" />
        <StatCard label="Allowed" value={summary.ALLOW} Icon={ShieldCheck} tone="success" />
      </div>

      <div className="mt-8">
        <ConsoleCard>
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Live activity · last 15 minutes</h2>
          </div>
          <div className="p-6">
            <ActivityChart hits={hits} />
          </div>
        </ConsoleCard>
      </div>

      <div className="mt-8">
        <ConsoleCard>
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Recent transactions</h2>
          </div>
          {hits.length === 0 ? (
            <EmptyState
              Icon={ShieldCheck}
              title="No hits yet"
              message="Send a test transaction, or wait for real Guard /assess traffic to arrive."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-subtle">
                    <th className="px-6 py-3">Time (UTC)</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Rule</th>
                    <th className="px-6 py-3">Model score</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {hits.map((hit) => (
                    <tr key={hit.id}>
                      <td className="px-6 py-3 text-fg-muted">{hit.created_at}</td>
                      <td className="px-6 py-3">{hit.type}</td>
                      <td className="px-6 py-3 tabular-nums">
                        {hit.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3">{hit.rule_action}</td>
                      <td className="px-6 py-3 tabular-nums">
                        {hit.model_score === null ? "—" : hit.model_score.toFixed(4)}
                      </td>
                      <td className="px-6 py-3">
                        <ActionBadge action={hit.action} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConsoleCard>
      </div>

      <div className="mt-8">
        <ScanPanel />
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      Live
    </span>
  );
}

function ActivityChart({ hits }: { hits: GuardHit[] }) {
  const buckets = useMemo(() => {
    const now = new Date();
    const counts = new Array(ACTIVITY_BUCKETS).fill(0);
    const nowMinute = Math.floor(now.getTime() / 60000);
    for (const hit of hits) {
      const hitMinute = Math.floor(new Date(hit.created_at).getTime() / 60000);
      const idx = ACTIVITY_BUCKETS - 1 - (nowMinute - hitMinute);
      if (idx >= 0 && idx < ACTIVITY_BUCKETS) counts[idx]++;
    }
    return counts;
  }, [hits]);

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
            title={`${count} hit${count === 1 ? "" : "s"}`}
          />
        );
      })}
    </div>
  );
}

export function StatCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "muted" | "danger" | "warning" | "success";
}) {
  const iconCls =
    tone === "danger" ? "bg-red-500/10 text-red-400" :
    tone === "warning" ? "bg-amber-500/10 text-amber-400" :
    tone === "success" ? "bg-emerald-500/10 text-emerald-400" :
    "bg-fg-subtle/10 text-fg-subtle";

  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-fg-subtle">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
        </div>
        <div className={"grid h-9 w-9 place-items-center rounded-lg " + iconCls}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function ActionBadge({ action }: { action: "BLOCK" | "REVIEW" | "ALLOW" }) {
  const cls =
    action === "BLOCK" ? "bg-red-500/10 text-red-400" :
    action === "REVIEW" ? "bg-amber-500/10 text-amber-400" :
    "bg-emerald-500/10 text-emerald-400";

  return <span className={"rounded-full px-2.5 py-0.5 text-xs font-bold " + cls}>{action}</span>;
}
