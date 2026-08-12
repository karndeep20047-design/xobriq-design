"use client";

import { useState, useTransition } from "react";
import { Bell, Calendar, Clock, RefreshCw } from "lucide-react";
import { ConsolePageHeader, ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import { renewSubscriptionAction, sendRenewalRemindersAction } from "./actions";

const PRODUCT_LABELS: Record<string, string> = {
  kyc: "Xobriq KYC",
  guard: "Xobriq Guard",
  cloud: "Xobriq Cloud",
  agentic: "Xobriq Agentic",
  consult: "Xobriq Consult",
  cyber: "Xobriq Cyber",
};

type Subscription = {
  id: string;
  organizationId: string;
  organizationName: string;
  productSlug: string;
  validUntil: string | null;
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function SubscriptionsClient({ subscriptions }: { subscriptions: Subscription[] }) {
  const [rows, setRows] = useState(subscriptions);
  const [isPending, startTransition] = useTransition();
  const [reminderResult, setReminderResult] = useState<string | null>(null);

  const dueSoon = rows.filter((r) => {
    const d = daysUntil(r.validUntil);
    return d !== null && d <= 30;
  });

  function handleSendReminders() {
    setReminderResult(null);
    startTransition(async () => {
      const result = await sendRenewalRemindersAction();
      setReminderResult(`Sent ${result.sent} of ${result.checked} due-soon reminders.`);
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow="Product Enablement"
        title="Subscriptions"
        description="Per-product access validity across every client organization, soonest-expiring first."
        actions={
          <button
            onClick={handleSendReminders}
            disabled={isPending || dueSoon.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            {isPending ? "Sending…" : `Send renewal reminders (${dueSoon.length})`}
          </button>
        }
      />

      {reminderResult ? (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {reminderResult}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-bg-subtle p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Total active</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{rows.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Due within 30 days</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-amber-400">{dueSoon.length}</p>
        </div>
      </div>

      <ConsoleCard>
        {rows.length === 0 ? (
          <EmptyState title="No active subscriptions" message="Approved product access will show up here." Icon={Calendar} />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <SubscriptionRow
                key={r.id}
                sub={r}
                onRenewed={(validUntil) =>
                  setRows((prev) => prev.map((p) => (p.id === r.id ? { ...p, validUntil } : p)))
                }
              />
            ))}
          </div>
        )}
      </ConsoleCard>
    </div>
  );
}

function SubscriptionRow({
  sub,
  onRenewed,
}: {
  sub: Subscription;
  onRenewed: (validUntil: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(sub.validUntil ? sub.validUntil.slice(0, 10) : "");
  const days = daysUntil(sub.validUntil);
  const dueSoon = days !== null && days <= 30;
  const overdue = days !== null && days < 0;

  function renew() {
    if (!date) return;
    startTransition(async () => {
      const iso = new Date(date + "T23:59:59").toISOString();
      const result = await renewSubscriptionAction(sub.id, iso);
      if (result.ok) onRenewed(iso);
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{sub.organizationName}</p>
          <span className="rounded bg-bg px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-fg-subtle">
            {PRODUCT_LABELS[sub.productSlug] || sub.productSlug}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
          <Clock className="h-3 w-3" />
          {sub.validUntil ? (
            <span className={overdue ? "font-medium text-red-400" : dueSoon ? "font-medium text-amber-400" : ""}>
              {overdue
                ? `Expired ${new Date(sub.validUntil).toLocaleDateString()}`
                : `Valid until ${new Date(sub.validUntil).toLocaleDateString()} (${days}d)`}
            </span>
          ) : (
            <span>No expiry set</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          disabled={isPending}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-border bg-bg px-2 py-1.5 text-xs disabled:opacity-50"
        />
        <button
          disabled={isPending || !date}
          onClick={renew}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs font-semibold hover:bg-bg-elevated disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> {isPending ? "Saving…" : "Renew"}
        </button>
      </div>
    </div>
  );
}
