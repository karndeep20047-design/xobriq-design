import Link from "next/link";
import {
  Users, Building2, Newspaper, Activity, FileText,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, ArrowRight,
  UserCog, Shield, Cog, Sparkles,
} from "lucide-react";
import { requireStaff, ROLE_LABELS } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StaffRole } from "@/lib/session-types";

export const metadata = { title: "Console Overview — Xobriq" };

export default async function ConsoleOverview() {
  const staff = await requireStaff();
  const admin = createAdminClient();

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalStaff },
    { count: totalClients },
    { count: pendingInvites },
    { count: events24h },
    { count: failedLogins },
    { count: newClients7d },
    { data: recentActivity },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).not("xobriq_staff_role", "is", null),
    admin.from("organizations").select("*", { count: "exact", head: true }).in("type", ["client_company", "client_individual"]),
    admin.from("invitations").select("*", { count: "exact", head: true }).is("accepted_at", null),
    admin.from("audit_logs").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
    admin.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "auth.login.failed").gte("created_at", dayAgo),
    admin.from("organizations").select("*", { count: "exact", head: true }).in("type", ["client_company", "client_individual"]).gte("created_at", weekAgo),
    admin.from("audit_logs").select("id, actor_email, action, resource_type, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const firstName = (staff.full_name || staff.email).split(/[\s@]/)[0];
  const role = staff.xobriq_staff_role;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-enterprise-accent">{ROLE_LABELS[role]}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {firstName}.</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Everything you need to run Xobriq — scoped to your role.
        </p>
      </div>

      {/* Metrics grid — role-aware */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Xobriq Staff" value={totalStaff ?? 0} Icon={Users} accent="primary" />
        <MetricCard label="Client Orgs" value={totalClients ?? 0} Icon={Building2} accent="accent" delta={newClients7d ? "+" + newClients7d + " this week" : undefined} />
        <MetricCard label="Pending Invites" value={pendingInvites ?? 0} Icon={Clock} accent="warn" />
        {failedLogins && failedLogins > 0 ? (
          <MetricCard label="Failed Logins (24h)" value={failedLogins} Icon={AlertTriangle} accent="danger" />
        ) : (
          <MetricCard label="Events (24h)" value={events24h ?? 0} Icon={Activity} accent="primary" />
        )}
      </div>

      {/* Two-column: role-specific insights + activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">

        {/* Left: role-specific widgets */}
        <div className="space-y-6 lg:col-span-1">
          <QuickActionsForRole role={role} />
          <RoleContextCard role={role} />
        </div>

        {/* Right: recent activity */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-bg-subtle">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Recent activity</h2>
              <Link href="/console/audit" className="inline-flex items-center gap-1 text-xs font-medium text-enterprise-primary hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {(recentActivity || []).length === 0 ? (
                <div className="p-8 text-center text-sm text-fg-muted">
                  No activity yet.
                </div>
              ) : ((recentActivity || []).map((row) => (
                <div key={row.id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{row.action}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {row.actor_email || "system"}{row.resource_type ? " · " + row.resource_type : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-fg-subtle">
                    {new Date(row.created_at).toLocaleString("en-KE", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                  </span>
                </div>
              )))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════

function MetricCard({
  label, value, Icon, accent, delta,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "accent" | "warn" | "danger";
  delta?: string;
}) {
  const iconCls =
    accent === "primary" ? "bg-enterprise-primary/10 text-enterprise-primary" :
    accent === "accent" ? "bg-enterprise-accent/15 text-enterprise-accent" :
    accent === "danger" ? "bg-red-500/10 text-red-400" :
    "bg-amber-500/10 text-amber-400";

  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-fg-subtle">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
          {delta ? <p className="mt-1 text-[10px] font-medium text-emerald-400">{delta}</p> : null}
        </div>
        <div className={"grid h-9 w-9 place-items-center rounded-lg " + iconCls}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function QuickActionsForRole({ role }: { role: StaffRole }) {
  const actions: { href: string; label: string; Icon: any }[] = [];

  if (role === "super_admin") {
    actions.push(
      { href: "/console/team", label: "Manage team", Icon: UserCog },
      { href: "/console/clients", label: "View clients", Icon: Building2 },
      { href: "/console/audit", label: "Audit log", Icon: FileText },
    );
  } else if (role === "finance_hr") {
    actions.push(
      { href: "/console/clients", label: "Clients & billing", Icon: Building2 },
      { href: "/console/audit", label: "Audit log", Icon: FileText },
    );
  } else if (role === "cto" || role === "tech_lead" || role === "senior_dev" || role === "developer" || role === "ml_lead") {
    actions.push(
      { href: "/console/metrics", label: "Platform metrics", Icon: Activity },
      { href: "/console/audit", label: "Deployment log", Icon: FileText },
    );
  } else if (role === "cyber_sec") {
    actions.push(
      { href: "/console/metrics", label: "Security metrics", Icon: Shield },
      { href: "/console/audit", label: "Security audit", Icon: FileText },
    );
  } else if (role === "content_admin" || role === "content_writer" || role === "marketing_head") {
    actions.push(
      { href: "/console/blog", label: "Blog queue", Icon: Newspaper },
    );
  } else if (role === "product_manager") {
    actions.push(
      { href: "/console/clients", label: "Client insights", Icon: Building2 },
      { href: "/console/metrics", label: "Product metrics", Icon: Activity },
    );
  }

  actions.push({ href: "/console/settings", label: "Settings", Icon: Cog });

  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Quick actions</h2>
      <div className="mt-4 space-y-2">
        {actions.map((a) => {
          const Icon = a.Icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-3 py-2.5 transition hover:border-enterprise-primary/30"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-fg-muted transition group-hover:text-enterprise-primary" />
                <span className="text-sm font-medium">{a.label}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-fg-subtle transition group-hover:translate-x-0.5 group-hover:text-enterprise-primary" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function RoleContextCard({ role }: { role: StaffRole }) {
  const context: Record<StaffRole, { icon: any; title: string; body: string; tone: string }> = {
    super_admin: { icon: Shield, tone: "primary", title: "You have full platform access", body: "You control team, clients, billing, deployments, and security." },
    cto: { icon: Cog, tone: "primary", title: "Engineering oversight", body: "Monitor deployment health, model performance, and platform metrics. You can view all technical audit events." },
    tech_lead: { icon: Cog, tone: "primary", title: "Technical leadership", body: "Guide engineering execution. Review deployments, model registry, and platform reliability metrics." },
    senior_dev: { icon: Cog, tone: "primary", title: "Senior engineering", body: "Access platform metrics, deployment logs, and technical audit events." },
    developer: { icon: Cog, tone: "primary", title: "Engineering access", body: "View metrics and deployment history. Contact your tech lead for access to sensitive systems." },
    ml_lead: { icon: Sparkles, tone: "accent", title: "ML operations", body: "Model registry, inference metrics, training pipelines. GPU utilization dashboards live in Metrics." },
    cyber_sec: { icon: Shield, tone: "danger", title: "Security operations", body: "Audit every action. Watch for failed logins, forced logouts, and privilege escalations." },
    product_manager: { icon: TrendingUp, tone: "accent", title: "Product oversight", body: "Client engagement, feature adoption, and roadmap indicators. Deep-link into any client for a full activity view." },
    finance_hr: { icon: Building2, tone: "primary", title: "Finance & operations", body: "Client billing, subscription status, and team payroll. Add clients and manage their plans." },
    marketing_head: { icon: Newspaper, tone: "accent", title: "Content & marketing", body: "Publish blog posts, review the queue, and manage the editorial calendar." },
    content_admin: { icon: Newspaper, tone: "accent", title: "Editorial control", body: "Review drafts submitted by writers. Approve, request changes, or publish directly." },
    content_writer: { icon: Newspaper, tone: "accent", title: "Content creation", body: "Draft blog posts and submit them for review. Track your posts through the editorial workflow." },
  };

  const info = context[role];
  const Icon = info.icon;
  const toneCls =
    info.tone === "primary" ? "bg-enterprise-primary/10 text-enterprise-primary" :
    info.tone === "danger" ? "bg-red-500/10 text-red-400" :
    "bg-enterprise-accent/15 text-enterprise-accent";

  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-6">
      <div className="flex items-start gap-3">
        <div className={"grid h-9 w-9 shrink-0 place-items-center rounded-lg " + toneCls}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{info.title}</p>
          <p className="mt-1 text-xs leading-5 text-fg-muted">{info.body}</p>
        </div>
      </div>
    </div>
  );
}