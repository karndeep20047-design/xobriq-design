"use client";

import { useMemo, useState } from "react";
import { Search, FileClock, Activity, Users, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

export type AuditRow = {
  id: string;
  actorEmail: string | null;
  actorName: string | null;
  role: "owner" | "admin" | "member" | null;
  customRoleName: string | null;
  action: string;
  resourceType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const roleStyles: Record<string, string> = {
  owner: "border-enterprise-primary/30 bg-enterprise-primary/10 text-enterprise-primary",
  admin: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  member: "border-border bg-bg text-fg-muted",
};

function roleLabel(row: AuditRow): string {
  if (!row.role) return "Unknown";
  if (row.role !== "member") return row.role;
  return row.customRoleName || "Member";
}

function roleBadgeClass(row: AuditRow): string {
  if (!row.role) return roleStyles.member;
  if (row.role === "owner" || row.role === "admin") return roleStyles[row.role];
  return roleStyles.member;
}

function actorDisplayName(row: AuditRow): string {
  return row.actorName || row.actorEmail || "System";
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
}

type Tone = "success" | "danger" | "neutral";

function toneForAction(action: string): Tone {
  const a = action.toLowerCase();
  if (a.includes("failed") || a.includes("rejected") || a.includes("revoked") || a.includes("denied") || a.includes("flagged")) return "danger";
  if (a.includes("completed") || a.includes("approved") || a.includes("success") || a.includes("granted") || a.includes("started")) return "success";
  return "neutral";
}

const toneDot: Record<Tone, string> = {
  success: "bg-emerald-400",
  danger: "bg-red-400",
  neutral: "bg-fg-subtle",
};

function formatAction(action: string): string {
  return action.replace(/\./g, " · ").replace(/_/g, " ");
}

export function AuditLogClient({ rows }: { rows: AuditRow[] }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [actorFilter, setActorFilter] = useState("All");
  const [page, setPage] = useState(1);

  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(roleLabel(r)));
    return ["All", ...Array.from(set).sort()];
  }, [rows]);

  const actorOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(actorDisplayName(r)));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (roleFilter !== "All" && roleLabel(r) !== roleFilter) return false;
    if (actorFilter !== "All" && actorDisplayName(r) !== actorFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      actorDisplayName(r).toLowerCase().includes(q) ||
      (r.actorEmail || "").toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      (r.resourceType || "").toLowerCase().includes(q)
    );
  });

  const uniqueActors = useMemo(() => new Set(rows.map((r) => actorDisplayName(r))).size, [rows]);
  const flagged = useMemo(() => rows.filter((r) => toneForAction(r.action) === "danger").length, [rows]);

  const hasActiveFilters = query !== "" || roleFilter !== "All" || actorFilter !== "All";

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-enterprise-accent">Your Organization</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="mt-2 text-sm text-fg-muted">Every action taken within your organization.</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard Icon={Activity} label="Total events" value={rows.length} tone="info" />
        <StatCard Icon={Users} label="Team members active" value={uniqueActors} tone="neutral" />
        <StatCard Icon={ShieldAlert} label="Failed / flagged" value={flagged} tone={flagged > 0 ? "danger" : "success"} />
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-bg-subtle p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by actor, action, or resource..."
            className="w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-3 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="audit-role-filter">Filter by role</label>
          <select
            id="audit-role-filter"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r === "All" ? "All roles" : r}</option>
            ))}
          </select>

          <label className="sr-only" htmlFor="audit-actor-filter">Filter by team member</label>
          <select
            id="audit-actor-filter"
            value={actorFilter}
            onChange={(e) => { setActorFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
          >
            {actorOptions.map((a) => (
              <option key={a} value={a}>{a === "All" ? "All team members" : a}</option>
            ))}
          </select>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => { setQuery(""); setRoleFilter("All"); setActorFilter("All"); setPage(1); }}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-fg-muted hover:bg-bg"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-3 text-xs text-fg-subtle">
        Showing {rangeStart}–{rangeEnd} of {filtered.length} events
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-subtle">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <FileClock className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm font-medium">{rows.length === 0 ? "No activity yet" : "No matches"}</p>
            <p className="text-xs text-fg-muted">
              {rows.length === 0 ? "Actions taken in your organization will appear here." : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pageRows.map((r) => {
              const tone = toneForAction(r.action);
              const name = actorDisplayName(r);
              return (
                <div key={r.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-bg/60 sm:px-6">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-enterprise-primary/10 text-xs font-bold text-enterprise-primary">
                    {initialsFor(name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + toneDot[tone]} />
                      <p className="truncate text-sm font-medium">{formatAction(r.action)}</p>
                      {r.resourceType ? (
                        <span className="hidden shrink-0 rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] font-medium text-fg-subtle sm:inline">
                          {r.resourceType}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="truncate text-xs text-fg-muted">{name}</span>
                      <span className={"shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider " + roleBadgeClass(r)}>
                        {roleLabel(r)}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 text-xs text-fg-subtle">
                    {new Date(r.createdAt).toLocaleString("en-KE")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-fg-muted transition hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>

          <span className="text-xs text-fg-subtle">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-fg-muted transition hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  Icon, label, value, tone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "info" | "success" | "danger" | "neutral";
}) {
  const toneStyles = {
    info: "text-enterprise-primary bg-enterprise-primary/10",
    success: "text-emerald-400 bg-emerald-500/10",
    danger: "text-red-400 bg-red-500/10",
    neutral: "text-fg-subtle bg-bg-subtle",
  };

  return (
    <div className="group rounded-2xl border border-border bg-bg-subtle p-4 transition-all hover:border-enterprise-primary/30 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-subtle">{label}</p>
        <div className={"grid h-8 w-8 place-items-center rounded-lg transition-transform group-hover:scale-105 " + toneStyles[tone]}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
