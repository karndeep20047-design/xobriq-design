"use client";

import { useState, useTransition } from "react";
import { Building2, UserPlus, Check, X, AlertCircle, Copy, Search, Fingerprint, Wallet, Clock } from "lucide-react";
import { ConsolePageHeader, ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import {
  createClientOrgAction,
  changeClientPlanAction,
  changeClientStatusAction,
  enableKycForClientAction,
  topUpWalletAction,
  setKycTrialAction,
} from "./actions";

function kes(amount: number) {
  return "KES " + amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type ClientOrg = {
  id: string;
  name: string;
  slug: string;
  type: "client_company" | "client_individual";
  industry: string | null;
  country: string | null;
  plan: string;
  status: string;
  billing_email: string | null;
  created_at: string;
  kyc_trial_until: string | null;
};

const PLANS = ["free", "sandbox", "growth", "enterprise"];
const STATUSES = ["trial", "active", "past_due", "suspended", "cancelled"];

export function ClientsPageClient({
  orgs,
  memberCounts,
  kycEnabledOrgIds,
  walletBalances,
}: {
  orgs: ClientOrg[];
  memberCounts: Record<string, number>;
  kycEnabledOrgIds: string[];
  walletBalances: Record<string, number>;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string; inviteLink?: string } | null>(null);
  const [query, setQuery] = useState("");
  const [kycEnabled, setKycEnabled] = useState(() => new Set(kycEnabledOrgIds));
  const [balances, setBalances] = useState(() => ({ ...walletBalances }));
  const [trialUntil, setTrialUntil] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(orgs.map((o) => [o.id, o.kyc_trial_until])),
  );

  const filtered = orgs.filter((o) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return o.name.toLowerCase().includes(q) || (o.billing_email || "").toLowerCase().includes(q) || (o.industry || "").toLowerCase().includes(q);
  });

  const activeCount = orgs.filter((o) => o.status === "active").length;
  const trialCount = orgs.filter((o) => o.status === "trial").length;
  const pastDueCount = orgs.filter((o) => o.status === "past_due").length;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow="Client Portfolio"
        title="Clients"
        description="Every company and individual using Xobriq. Filter by plan, status, or industry."
        actions={
          <button
            onClick={() => { setCreateOpen(true); setBanner(null); }}
            className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover"
          >
            <UserPlus className="h-4 w-4" /> Add client
          </button>
        }
      />

      {/* Stat row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatBox label="Total" value={orgs.length} />
        <StatBox label="Active" value={activeCount} tone="success" />
        <StatBox label="Trial" value={trialCount} tone="info" />
        <StatBox label="Past due" value={pastDueCount} tone="warn" />
      </div>

      {/* Banner */}
      {banner ? (
        <div className={"mb-6 rounded-lg border p-4 " + (banner.type === "success" ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10")}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {banner.type === "success" ? <Check className="mt-0.5 h-4 w-4 text-emerald-400" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-red-400" />}
              <div>
                <p className={"text-sm font-medium " + (banner.type === "success" ? "text-emerald-200" : "text-red-200")}>{banner.message}</p>
                {banner.inviteLink ? <InviteLinkBox link={banner.inviteLink} /> : null}
              </div>
            </div>
            <button onClick={() => setBanner(null)} className="text-fg-muted hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or industry..."
          className="w-full rounded-lg border border-border bg-bg-subtle py-2 pl-9 pr-3 text-sm outline-none focus:border-enterprise-primary"
        />
      </div>

      {/* Create dialog */}
      {createOpen ? (
        <CreateClientDialog
          onClose={() => setCreateOpen(false)}
          onResult={(result) => {
            setCreateOpen(false);
            setBanner(result);
          }}
        />
      ) : null}

      {/* Client list */}
      <ConsoleCard>
        {filtered.length === 0 ? (
          <EmptyState
            Icon={Building2}
            title={orgs.length === 0 ? "No clients yet" : "No matches"}
            message={orgs.length === 0 ? "Add your first client to get started." : "Try a different search term."}
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((org) => (
              <ClientRow
                key={org.id}
                org={org}
                memberCount={memberCounts[org.id] || 0}
                kycEnabled={kycEnabled.has(org.id)}
                onKycEnabled={() => {
                  setKycEnabled((prev) => new Set(prev).add(org.id));
                  setBalances((prev) => ({ ...prev, [org.id]: prev[org.id] ?? 0 }));
                }}
                balance={balances[org.id]}
                onToppedUp={(newBalance) => setBalances((prev) => ({ ...prev, [org.id]: newBalance }))}
                trialUntil={trialUntil[org.id] ?? null}
                onTrialChanged={(until) => setTrialUntil((prev) => ({ ...prev, [org.id]: until }))}
              />
            ))}
          </div>
        )}
      </ConsoleCard>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone?: "success" | "info" | "warn" }) {
  const dot = tone === "success" ? "bg-emerald-400" : tone === "info" ? "bg-enterprise-primary" : tone === "warn" ? "bg-amber-400" : "bg-fg-subtle";
  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-4">
      <div className="flex items-center gap-2">
        <div className={"h-1.5 w-1.5 rounded-full " + dot} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function ClientRow({
  org,
  memberCount,
  kycEnabled,
  onKycEnabled,
  balance,
  onToppedUp,
  trialUntil,
  onTrialChanged,
}: {
  org: ClientOrg;
  memberCount: number;
  kycEnabled: boolean;
  onKycEnabled: () => void;
  balance: number | undefined;
  onToppedUp: (newBalance: number) => void;
  trialUntil: string | null;
  onTrialChanged: (until: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [kycPending, setKycPending] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

  function handleEnableKyc() {
    setKycPending(true);
    setKycError(null);
    startTransition(async () => {
      const result = await enableKycForClientAction(org.id);
      setKycPending(false);
      if (result.ok) {
        onKycEnabled();
      } else {
        setKycError(result.error || "Failed to enable KYC");
      }
    });
  }

  const statusTone: Record<string, string> = {
    trial: "bg-enterprise-primary/15 text-enterprise-primary",
    active: "bg-emerald-500/15 text-emerald-400",
    past_due: "bg-amber-500/15 text-amber-400",
    suspended: "bg-red-500/15 text-red-400",
    cancelled: "bg-fg-subtle/15 text-fg-subtle",
  };

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-enterprise-primary/10 text-enterprise-primary">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{org.name}</p>
            <span className="text-[10px] uppercase tracking-wider text-fg-subtle">
              {org.type === "client_company" ? "Company" : "Individual"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-fg-muted">
            {org.billing_email}
            {org.industry ? " · " + org.industry : ""}
            {memberCount > 0 ? " · " + memberCount + " member" + (memberCount === 1 ? "" : "s") : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={org.plan}
            disabled={isPending}
            onChange={(e) => {
              startTransition(async () => {
                await changeClientPlanAction(org.id, e.target.value);
              });
            }}
            className="rounded-md border border-border bg-bg-subtle px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={org.status}
            disabled={isPending}
            onChange={(e) => {
              startTransition(async () => {
                await changeClientStatusAction(org.id, e.target.value);
              });
            }}
            className={"rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 " + (statusTone[org.status] || "bg-bg-subtle")}
          >
            {STATUSES.map((s) => <option key={s} value={s} className="bg-bg text-fg">{s}</option>)}
          </select>
          {kycEnabled ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-400">
                <Fingerprint className="h-3.5 w-3.5" />
                KYC enabled
              </span>
              <button
                type="button"
                onClick={() => setTopUpOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-subtle px-2 py-1 text-xs font-medium hover:bg-bg"
              >
                <Wallet className="h-3.5 w-3.5" />
                {kes(balance ?? 0)}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={kycPending}
              onClick={handleEnableKyc}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-subtle px-2 py-1 text-xs font-medium hover:bg-bg disabled:opacity-50"
            >
              <Fingerprint className="h-3.5 w-3.5" />
              {kycPending ? "Enabling…" : "Enable KYC"}
            </button>
          )}
        </div>
        {kycError ? <p className="text-[11px] text-red-400">{kycError}</p> : null}
        {kycEnabled ? <TrialControl orgId={org.id} trialUntil={trialUntil} onChanged={onTrialChanged} /> : null}
      </div>
      {topUpOpen ? (
        <TopUpDialog
          orgId={org.id}
          orgName={org.name}
          onClose={() => setTopUpOpen(false)}
          onSuccess={(newBalance) => {
            setTopUpOpen(false);
            onToppedUp(newBalance);
          }}
        />
      ) : null}
    </div>
  );
}

function TrialControl({
  orgId,
  trialUntil,
  onChanged,
}: {
  orgId: string;
  trialUntil: string | null;
  onChanged: (until: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(trialUntil ? trialUntil.slice(0, 10) : "");
  const [editing, setEditing] = useState(false);
  const active = !!trialUntil && new Date(trialUntil).getTime() > Date.now();

  function startOrExtend() {
    if (!date) return;
    startTransition(async () => {
      const until = new Date(date + "T23:59:59").toISOString();
      const result = await setKycTrialAction(orgId, until);
      if (result.ok) {
        onChanged(until);
        setEditing(false);
      }
    });
  }

  function end() {
    startTransition(async () => {
      const result = await setKycTrialAction(orgId, null);
      if (result.ok) {
        setDate("");
        onChanged(null);
        setEditing(false);
      }
    });
  }

  // Active trials collapse to a single pill + "Manage" — the date input,
  // Extend, and End controls only appear once staff actually asks to change
  // something, instead of always occupying the row.
  if (active && !editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/15 px-2 py-1 text-xs font-medium text-sky-400">
          <Clock className="h-3.5 w-3.5" />
          Trial until {new Date(trialUntil!).toLocaleDateString()}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md border border-border bg-bg-subtle px-2 py-1 text-xs font-medium hover:bg-bg"
        >
          Manage
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="date"
        value={date}
        disabled={isPending}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-md border border-border bg-bg-subtle px-2 py-1 text-xs disabled:opacity-50"
      />
      <button
        type="button"
        disabled={isPending || !date}
        onClick={startOrExtend}
        className="rounded-md border border-border bg-bg-subtle px-2 py-1 text-xs font-medium hover:bg-bg disabled:opacity-50"
      >
        {isPending ? "Saving…" : active ? "Extend trial" : "Start trial"}
      </button>
      {active ? (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setEditing(false)}
            className="px-1 text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={end}
            className="px-1 text-xs font-medium text-red-400 hover:underline disabled:opacity-50"
          >
            End trial
          </button>
        </>
      ) : null}
    </div>
  );
}

function TopUpDialog({
  orgId,
  orgName,
  onClose,
  onSuccess,
}: {
  orgId: string;
  orgName: string;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">Top up wallet</h2>
        <p className="mt-1 text-sm text-fg-muted">
          {orgName} — only use this after confirming payment arrived (bank/M-Pesa reconciliation). There&apos;s
          no payment gateway behind this yet.
        </p>
        <form
          action={(fd) => {
            setError(null);
            const amount = Number(fd.get("amount"));
            const note = String(fd.get("note") || "");
            startTransition(async () => {
              const result = await topUpWalletAction(orgId, amount, note);
              if (result.ok) {
                onSuccess(result.balance ?? 0);
              } else {
                setError(result.error || "Failed to top up");
              }
            });
          }}
          className="mt-4 space-y-4"
        >
          <Field name="amount" label="Amount (KES)" type="number" required placeholder="5000" />
          <Field name="note" label="Note (optional)" placeholder="Bank ref / M-Pesa code" />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border bg-bg-subtle px-4 py-2 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary disabled:opacity-50">
              {isPending ? "Crediting…" : "Credit wallet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateClientDialog({
  onClose,
  onResult,
}: {
  onClose: () => void;
  onResult: (r: { type: "success" | "error"; message: string; inviteLink?: string }) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Add a new client</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Their owner will get an invitation link to activate the account.
          </p>
        </div>
        <form
          action={(fd) => {
            startTransition(async () => {
              const result = await createClientOrgAction(fd);
              if (result.ok) {
                onResult({ type: "success", message: result.message || "Created", inviteLink: (result as any).inviteLink });
              } else {
                onResult({ type: "error", message: result.error || "Failed" });
              }
            });
          }}
          className="space-y-4"
        >
          <Field name="name" label="Company / individual name" required placeholder="Equity Bank Kenya" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Type</label>
              <select name="type" defaultValue="client_company" className="mt-2 w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm">
                <option value="client_company">Company</option>
                <option value="client_individual">Individual</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Plan</label>
              <select name="plan" defaultValue="sandbox" className="mt-2 w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm">
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="industry" label="Industry" placeholder="Banking" />
            <Field name="country" label="Country" defaultValue="KE" maxLength={2} />
          </div>
          <Field name="billing_email" label="Billing email" type="email" required placeholder="ap@equitybank.co.ke" />
          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Primary contact (owner)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="owner_name" label="Full name" required placeholder="Jane Doe" />
              <Field name="owner_email" label="Email" type="email" required placeholder="jane@equitybank.co.ke" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border bg-bg-subtle px-4 py-2 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary disabled:opacity-50">
              {isPending ? "Creating..." : "Create client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  name, label, type = "text", required, placeholder, defaultValue, maxLength,
}: {
  name: string; label: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string; maxLength?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-fg-subtle">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        maxLength={maxLength}
        className="mt-2 w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
      />
    </div>
  );
}

function InviteLinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="mt-3 rounded-md border border-border bg-bg-elevated p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Owner invitation link</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-bg-subtle px-2 py-1 text-xs">{link}</code>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-subtle px-2.5 py-1 text-xs font-medium">
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}