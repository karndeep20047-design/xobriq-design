"use client";

import Link from "next/link";
import { Activity, ShieldAlert, Zap, TrendingUp, LogOut, KeyRound, Building2, ShieldCheck, PackageCheck, Key, FlaskConical, Rocket, Mail } from "lucide-react";
import { ConsolePageHeader, ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import type { StaffRole } from "@/lib/session-types";

type Stats = {
  totalEvents: number;
  events24h: number;
  events7d: number;
  failedLogins24h: number;
  forcedLogouts24h: number;
  passwordChanges7d: number;
};

type ProductAdoption = { slug: string; count: number };

type ApiKeyStats = {
  total: number;
  sandbox: number;
  production: number;
  byProduct: ProductAdoption[];
};

type EmailHealth = {
  sent24h: number;
  failed24h: number;
  sent7d: number;
  failed7d: number;
};

type Business = {
  totalOrgs: number;
  newOrgs7d: number;
  totalKycVerifications: number;
  kycVerifications7d: number;
  productAdoption: ProductAdoption[];
  apiKeys: ApiKeyStats;
  emailHealth: EmailHealth;
};

type SecurityEvent = {
  id: string;
  actor_email: string | null;
  action: string;
  ip_address: string | null;
  created_at: string;
  metadata: Record<string, any>;
};

type TimelinePoint = { day: string; count: number };

const PRODUCT_LABELS: Record<string, string> = {
  kyc: "KYC",
  guard: "Guard",
  cloud: "Cloud",
  agentic: "Agentic AI",
  consult: "Consult",
  cyber: "Cyber",
};

export function MetricsClient({
  role,
  roleLabel,
  stats,
  business,
  recentSecurityEvents,
  timeline,
}: {
  role: StaffRole;
  roleLabel: string;
  stats: Stats;
  business: Business;
  recentSecurityEvents: SecurityEvent[];
  timeline: TimelinePoint[];
}) {
  const isSecurity = role === "cyber_sec" || role === "super_admin";

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow={isSecurity ? "Security Operations" : "Engineering"}
        title="Platform Metrics"
        description={"Real-time insights scoped to " + roleLabel + " responsibilities."}
      />

      {/* Primary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStatCard
          label="Total events tracked"
          value={stats.totalEvents.toLocaleString()}
          Icon={Activity}
          hint="All-time audit trail"
        />
        <BigStatCard
          label="Events (24h)"
          value={stats.events24h.toLocaleString()}
          Icon={Zap}
          hint="Last 24 hours"
          tone="primary"
        />
        <BigStatCard
          label="Events (7d)"
          value={stats.events7d.toLocaleString()}
          Icon={TrendingUp}
          hint="Rolling weekly volume"
          tone="accent"
        />
        <BigStatCard
          label="Failed logins (24h)"
          value={stats.failedLogins24h}
          Icon={ShieldAlert}
          hint={stats.failedLogins24h > 5 ? "Elevated — investigate" : "Within baseline"}
          tone={stats.failedLogins24h > 5 ? "danger" : "muted"}
        />
      </div>

      {/* 30-day timeline chart */}
      <div className="mt-8">
        <ConsoleCard>
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Platform activity · 30 days</h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                Daily audit event volume across all actions
              </p>
            </div>
          </div>
          <div className="p-6">
            <TimelineChart data={timeline} />
          </div>
        </ConsoleCard>
      </div>

      {/* Two-column: security events + engineering placeholder */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">

        {/* Security events */}
        {isSecurity ? (
          <ConsoleCard>
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Recent security events</h2>
              <div className="mt-3 flex gap-4 text-xs">
                <div>
                  <p className="text-fg-subtle">Forced logouts 24h</p>
                  <p className="mt-0.5 text-lg font-bold">{stats.forcedLogouts24h}</p>
                </div>
                <div>
                  <p className="text-fg-subtle">Password changes 7d</p>
                  <p className="mt-0.5 text-lg font-bold">{stats.passwordChanges7d}</p>
                </div>
              </div>
            </div>
            {recentSecurityEvents.length === 0 ? (
              <EmptyState Icon={ShieldAlert} title="No recent security events" message="Nothing unusual to review right now." />
            ) : (
              <div className="divide-y divide-border">
                {recentSecurityEvents.map((e) => <SecurityEventRow key={e.id} event={e} />)}
              </div>
            )}
          </ConsoleCard>
        ) : null}

        {/* Business overview — replaces the old hardcoded "Engineering health"
            placeholder panel with genuinely queried numbers. */}
        <ConsoleCard>
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Business overview</h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              Organizations, KYC volume, and product adoption
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniStat label="Client organizations" value={business.totalOrgs.toLocaleString()} Icon={Building2} tone="primary" />
              <MiniStat label="New orgs (7d)" value={"+" + business.newOrgs7d.toLocaleString()} Icon={TrendingUp} tone="accent" />
              <MiniStat label="KYC verifications" value={business.totalKycVerifications.toLocaleString()} Icon={ShieldCheck} tone="primary" />
              <MiniStat label="KYC verifications (7d)" value={business.kycVerifications7d.toLocaleString()} Icon={Zap} tone="muted" />
            </div>
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Product adoption</p>
              <div className="space-y-2">
                {business.productAdoption.map((p) => (
                  <div key={p.slug} className="flex items-center gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-enterprise-primary/10 text-enterprise-primary">
                      <PackageCheck className="h-3.5 w-3.5" />
                    </div>
                    <span className="w-28 shrink-0 text-xs font-medium">{PRODUCT_LABELS[p.slug] || p.slug}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                      <div
                        className="h-full rounded-full bg-enterprise-primary/60"
                        style={{ width: (business.totalOrgs > 0 ? Math.min(100, (p.count / business.totalOrgs) * 100) : 0) + "%" }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs tabular-nums text-fg-muted">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">API keys</p>
                <Link href="/console/api-usage" className="text-[11px] font-medium text-enterprise-primary hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-bg p-3">
                  <div className="flex items-center gap-1.5 text-fg-subtle"><Key className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider">Active</span></div>
                  <p className="mt-1.5 text-lg font-bold tabular-nums">{business.apiKeys.total.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border bg-bg p-3">
                  <div className="flex items-center gap-1.5 text-fg-subtle"><FlaskConical className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider">Sandbox</span></div>
                  <p className="mt-1.5 text-lg font-bold tabular-nums">{business.apiKeys.sandbox.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border bg-bg p-3">
                  <div className="flex items-center gap-1.5 text-fg-subtle"><Rocket className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider">Production</span></div>
                  <p className="mt-1.5 text-lg font-bold tabular-nums">{business.apiKeys.production.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-fg-muted">
                {business.apiKeys.byProduct.filter((p) => p.count > 0).map((p) => (
                  <span key={p.slug}>{PRODUCT_LABELS[p.slug] || p.slug}: <span className="font-semibold text-fg">{p.count}</span></span>
                ))}
                {business.apiKeys.byProduct.every((p) => p.count === 0) ? <span>No active keys per product yet</span> : null}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Email delivery health</p>
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const total7d = business.emailHealth.sent7d + business.emailHealth.failed7d;
                  const rate7d = total7d === 0 ? null : Math.round((business.emailHealth.sent7d / total7d) * 100);
                  return (
                    <>
                      <div className="rounded-lg border border-border bg-bg p-3">
                        <div className="flex items-center gap-1.5 text-fg-subtle"><Mail className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider">Sent (7d)</span></div>
                        <p className="mt-1.5 text-lg font-bold tabular-nums">{business.emailHealth.sent7d.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-bg p-3">
                        <div className="flex items-center gap-1.5 text-fg-subtle"><ShieldAlert className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider">Failed (7d)</span></div>
                        <p className={"mt-1.5 text-lg font-bold tabular-nums " + (business.emailHealth.failed7d > 0 ? "text-red-400" : "")}>
                          {business.emailHealth.failed7d.toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2 text-[11px] text-fg-muted">
                        {rate7d === null
                          ? "No email activity in the last 7 days"
                          : `${rate7d}% delivery success (7d) · ${business.emailHealth.sent24h} sent / ${business.emailHealth.failed24h} failed in the last 24h`}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </ConsoleCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════

function BigStatCard({
  label, value, Icon, hint, tone,
}: {
  label: string;
  value: string | number;
  Icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  tone?: "primary" | "accent" | "danger" | "muted";
}) {
  const iconCls =
    tone === "danger" ? "bg-red-500/10 text-red-400" :
    tone === "accent" ? "bg-enterprise-accent/15 text-enterprise-accent" :
    tone === "muted" ? "bg-fg-subtle/10 text-fg-subtle" :
    "bg-enterprise-primary/10 text-enterprise-primary";

  const hintCls = tone === "danger" ? "text-red-400" : "text-fg-subtle";

  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-fg-subtle">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
          {hint ? <p className={"mt-1 text-[10px] font-medium " + hintCls}>{hint}</p> : null}
        </div>
        <div className={"grid h-9 w-9 place-items-center rounded-lg " + iconCls}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, Icon, tone }: { label: string; value: string; Icon: any; tone: string }) {
  const iconCls =
    tone === "danger" ? "text-red-400" :
    tone === "accent" ? "text-enterprise-accent" :
    tone === "muted" ? "text-fg-subtle" :
    "text-enterprise-primary";

  return (
    <div className="rounded-lg border border-border bg-bg p-3">
      <div className="flex items-center gap-2">
        <Icon className={"h-3.5 w-3.5 " + iconCls} />
        <p className="text-[10px] uppercase tracking-wider text-fg-subtle">{label}</p>
      </div>
      <p className="mt-2 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function SecurityEventRow({ event }: { event: SecurityEvent }) {
  const actionIcon: Record<string, any> = {
    "auth.login.failed": ShieldAlert,
    "auth.forced_logout": LogOut,
    "auth.password_changed": KeyRound,
    "auth.password_change.failed": ShieldAlert,
  };
  const Icon = actionIcon[event.action] || ShieldAlert;
  const isDanger = event.action.includes("failed") || event.action.includes("forced");

  return (
    <div className="flex items-center gap-3 px-6 py-3">
      <div className={"grid h-7 w-7 shrink-0 place-items-center rounded-md " + (isDanger ? "bg-red-500/10 text-red-400" : "bg-fg-subtle/10 text-fg-subtle")}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[11px] font-medium">{event.action}</p>
        <p className="mt-0.5 truncate text-xs text-fg-muted">
          {event.actor_email || (event.metadata?.email as string) || "unknown"}
          {event.ip_address ? " · " + event.ip_address : ""}
        </p>
      </div>
      <span className="shrink-0 text-xs text-fg-subtle">
        {new Date(event.created_at).toLocaleString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

function TimelineChart({ data }: { data: TimelinePoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const avg = Math.round(total / data.length);

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-4">
        <div>
          <p className="text-2xl font-bold tabular-nums">{total.toLocaleString()}</p>
          <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Total events</p>
        </div>
        <div className="border-l border-border pl-4">
          <p className="text-2xl font-bold tabular-nums">{avg.toLocaleString()}</p>
          <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Daily average</p>
        </div>
      </div>
      <div className="flex h-32 items-end gap-0.5">
        {data.map((point) => {
          const height = point.count === 0 ? 2 : Math.max(4, (point.count / max) * 100);
          return (
            <div
              key={point.day}
              className="group flex-1 rounded-t bg-enterprise-primary/60 transition hover:bg-enterprise-primary"
              style={{ height: height + "%" }}
              title={point.day + ": " + point.count + " events"}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-fg-subtle">
        <span>{data[0]?.day}</span>
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}
