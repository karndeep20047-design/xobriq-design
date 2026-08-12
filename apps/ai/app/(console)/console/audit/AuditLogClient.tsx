"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, X, FileText, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { ConsolePageHeader, ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  organization_id: string | null;
  organization_name: string | null;
};

export function AuditLogClient({
  rows,
  total,
  pageSize,
  page,
  distinctActions,
  organizations,
  filters,
}: {
  rows: AuditRow[];
  total: number;
  pageSize: number;
  page: number;
  distinctActions: string[];
  organizations: { id: string; name: string }[];
  filters: { q?: string; action?: string; actor?: string; from?: string; to?: string; org?: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(!!filters.action || !!filters.actor || !!filters.from);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push("/console/audit?" + params.toString());
  };

  const clearFilters = () => router.push("/console/audit");

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push("/console/audit?" + params.toString());
  };

  const hasActiveFilters = !!(filters.q || filters.action || filters.actor || filters.from || filters.to || filters.org);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow="Security"
        title="Audit Log"
        description={"Every action logged, indexed, and searchable. " + total.toLocaleString() + " events tracked."}
        actions={
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm font-medium hover:bg-bg-elevated"
          >
            <Filter className="h-4 w-4" /> Filters
            {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        }
      />

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            defaultValue={filters.q}
            placeholder="Search by email, action, or resource..."
            className="w-full rounded-lg border border-border bg-bg-subtle py-2 pl-9 pr-3 text-sm outline-none focus:border-enterprise-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter") updateFilter("q", (e.target as HTMLInputElement).value);
            }}
          />
        </div>
        {hasActiveFilters ? (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-xs font-medium text-fg-muted hover:bg-bg-elevated"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        ) : null}
      </div>

      {/* Filter panel */}
      {showFilters ? (
        <ConsoleCard className="mb-6 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Organization</label>
              <select
                value={filters.org || ""}
                onChange={(e) => updateFilter("org", e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-sm outline-none"
              >
                <option value="">All organizations</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Action</label>
              <select
                value={filters.action || ""}
                onChange={(e) => updateFilter("action", e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-sm outline-none"
              >
                <option value="">All actions</option>
                {distinctActions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Actor email</label>
              <input
                type="text"
                defaultValue={filters.actor}
                placeholder="user@xobriq.com"
                className="mt-1.5 w-full rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-sm outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateFilter("actor", (e.target as HTMLInputElement).value);
                }}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">From</label>
              <input
                type="date"
                defaultValue={filters.from}
                onChange={(e) => updateFilter("from", e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">To</label>
              <input
                type="date"
                defaultValue={filters.to}
                onChange={(e) => updateFilter("to", e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-sm outline-none"
              />
            </div>
          </div>
        </ConsoleCard>
      ) : null}

      {/* Events */}
      <ConsoleCard>
        {rows.length === 0 ? (
          <EmptyState
            Icon={FileText}
            title="No events found"
            message={hasActiveFilters ? "Try adjusting your filters." : "Events will appear here as actions happen."}
          />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => <AuditRowItem key={row.id} row={row} />)}
          </div>
        )}

        {/* Pagination */}
        {rows.length > 0 ? (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-fg-muted">
              Page {page} of {totalPages} · {total.toLocaleString()} total
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="grid h-8 w-8 place-items-center rounded-md border border-border bg-bg-subtle text-fg-muted hover:bg-bg-elevated disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="grid h-8 w-8 place-items-center rounded-md border border-border bg-bg-subtle text-fg-muted hover:bg-bg-elevated disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </ConsoleCard>
    </div>
  );
}

function AuditRowItem({ row }: { row: AuditRow }) {
  const [expanded, setExpanded] = useState(false);
  const hasMetadata = row.metadata && Object.keys(row.metadata).length > 0;
  const canExpand = hasMetadata || row.ip_address || row.user_agent;

  const tone = getActionTone(row.action);

  return (
    <div className="hover:bg-bg-elevated/50">
      <button
        onClick={() => canExpand && setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-6"
        disabled={!canExpand}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className={"h-2 w-2 shrink-0 rounded-full " + tone.dot} />
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-medium">{row.action}</p>
            <p className="mt-0.5 truncate text-xs text-fg-muted">
              {row.actor_email || "system"}
              {row.resource_type ? " · " + row.resource_type : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-fg-subtle">
          {row.organization_name ? (
            <span className="rounded-full border border-border bg-bg-subtle px-2 py-0.5 text-[10px] font-medium text-fg-muted">
              {row.organization_name}
            </span>
          ) : null}
          <span>{formatDateTime(row.created_at)}</span>
          {canExpand ? (expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : null}
        </div>
      </button>
      {expanded && canExpand ? (
        <div className="border-t border-border bg-bg px-4 py-3 sm:px-6">
          <dl className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
            {row.ip_address ? (
              <div>
                <dt className="text-fg-subtle">IP Address</dt>
                <dd className="mt-0.5 font-mono">{row.ip_address}</dd>
              </div>
            ) : null}
            {row.user_agent ? (
              <div className="sm:col-span-2 lg:col-span-2">
                <dt className="text-fg-subtle">User Agent</dt>
                <dd className="mt-0.5 truncate text-fg-muted">{row.user_agent}</dd>
              </div>
            ) : null}
            {row.resource_id ? (
              <div>
                <dt className="text-fg-subtle">Resource ID</dt>
                <dd className="mt-0.5 font-mono truncate">{row.resource_id}</dd>
              </div>
            ) : null}
          </dl>
          {hasMetadata ? (
            <pre className="mt-3 overflow-x-auto rounded-md bg-bg-elevated p-3 text-[11px] font-mono">
              {JSON.stringify(row.metadata, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getActionTone(action: string): { dot: string } {
  if (action.includes("failed") || action.includes("revoked") || action.includes("deleted") || action.includes("forced")) {
    return { dot: "bg-red-400" };
  }
  if (action.includes("login") || action.includes("logout") || action.includes("session")) {
    return { dot: "bg-emerald-400" };
  }
  if (action.includes("invited") || action.includes("accepted")) {
    return { dot: "bg-enterprise-primary" };
  }
  if (action.includes("changed") || action.includes("updated")) {
    return { dot: "bg-enterprise-accent" };
  }
  return { dot: "bg-fg-subtle" };
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
