"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, Building2, KeyRound,
  ShieldCheck, CheckCircle2, XCircle, Wallet, Filter, X,
} from "lucide-react";
import { ConsolePageHeader, ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { successRate, percentDelta, formatKes } from "@/lib/api-usage/metrics";
import { VERIFICATION_TYPE_LABELS } from "@/lib/api-usage/types";
import type {
  ApiUsageFilters, SummaryCardsData, TimeseriesPoint, ServiceDistributionRow, OrgUsagePage,
  DateRangePreset, OrgSortKey, SortDir,
} from "@/lib/api-usage/types";

const STATUS_COLORS = { successful: "#10b981", failed: "#ef4444", pending: "#f59e0b" };
const SERVICE_COLORS: Record<string, string> = { identity: "#3b82f6", phone: "#8b5cf6", business: "#14b8a6" };
const COST_COLOR = "#0ea5e9";

const CHART_AXIS_PROPS = {
  stroke: "var(--color-fg-muted)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

const CHART_TOOLTIP_STYLE = {
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
} as const;

type FilterOptions = {
  organizations: { id: string; name: string }[];
  apiKeys: { id: string; name: string; organization_id: string; environment: string; status: string }[];
};

export function ApiUsageClient({
  filters,
  rangePreset,
  summary,
  timeseries,
  serviceDistribution,
  orgPage,
  filterOptions,
  canExport,
  canViewWallet,
}: {
  filters: ApiUsageFilters;
  rangePreset: DateRangePreset;
  summary: SummaryCardsData;
  timeseries: TimeseriesPoint[];
  serviceDistribution: ServiceDistributionRow[];
  orgPage: OrgUsagePage;
  filterOptions: FilterOptions;
  canExport: boolean;
  canViewWallet: boolean;
}) {
  const statusDistribution = [
    { name: "Successful", key: "successful", value: summary.current.successful },
    { name: "Failed", key: "failed", value: summary.current.failed },
    { name: "Pending", key: "pending", value: summary.current.pending },
  ].filter((d) => d.value > 0);

  const serviceChartData = serviceDistribution
    .filter((s) => s.total > 0)
    .map((s) => ({ name: VERIFICATION_TYPE_LABELS[s.verificationType], value: s.total, key: s.verificationType }));

  const chartData = timeseries.map((p) => ({
    ...p,
    label: formatBucketLabel(p.bucketStart),
  }));

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow="Product Enablement"
        title="API Usage"
        description="Monitor client API activity, KYC consumption, verification performance, and wallet balances."
        actions={
          canExport ? (
            <a
              href={"/console/api-usage/export?" + filtersToSearchParams(filters, rangePreset).toString()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-subtle px-4 py-2 text-sm font-medium hover:bg-bg-elevated"
            >
              <Download className="h-4 w-4" /> Export CSV
            </a>
          ) : undefined
        }
      />

      <FilterBar filters={filters} rangePreset={rangePreset} filterOptions={filterOptions} />

      <SummaryCards summary={summary} canViewWallet={canViewWallet} />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <ConsoleCard className="p-5">
          <h2 className="text-sm font-semibold">API Requests Over Time</h2>
          <p className="mt-0.5 text-xs text-fg-subtle">Grouped automatically based on the selected range.</p>
          <div className="mt-4 h-[240px]">
            {chartData.length === 0 ? (
              <NoChartData />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={STATUS_COLORS.successful} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={STATUS_COLORS.successful} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={STATUS_COLORS.failed} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={STATUS_COLORS.failed} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={STATUS_COLORS.pending} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={STATUS_COLORS.pending} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" {...CHART_AXIS_PROPS} />
                  <YAxis {...CHART_AXIS_PROPS} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="successful" stroke={STATUS_COLORS.successful} strokeWidth={2} fill="url(#gSuccess)" />
                  <Area type="monotone" dataKey="failed" stroke={STATUS_COLORS.failed} strokeWidth={2} fill="url(#gFailed)" />
                  <Area type="monotone" dataKey="pending" stroke={STATUS_COLORS.pending} strokeWidth={2} fill="url(#gPending)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ConsoleCard>

        <ConsoleCard className="p-5">
          <h2 className="text-sm font-semibold">Verification Status Distribution</h2>
          <p className="mt-0.5 text-xs text-fg-subtle">Successful, failed, and pending in the selected range.</p>
          <div className="mt-4 flex h-[240px] items-center justify-center gap-8">
            {statusDistribution.length === 0 ? (
              <NoChartData />
            ) : (
              <>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                      {statusDistribution.map((d) => (
                        <Cell key={d.key} fill={STATUS_COLORS[d.key as keyof typeof STATUS_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <ChartLegend items={statusDistribution.map((d) => ({ label: d.name, value: d.value, color: STATUS_COLORS[d.key as keyof typeof STATUS_COLORS] }))} />
              </>
            )}
          </div>
        </ConsoleCard>

        <ConsoleCard className="p-5">
          <h2 className="text-sm font-semibold">KYC Service Distribution</h2>
          <p className="mt-0.5 text-xs text-fg-subtle">Requests grouped by verification service.</p>
          <div className="mt-4 flex h-[240px] items-center justify-center gap-8">
            {serviceChartData.length === 0 ? (
              <NoChartData />
            ) : (
              <>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={serviceChartData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                      {serviceChartData.map((d) => (
                        <Cell key={d.key} fill={SERVICE_COLORS[d.key] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <ChartLegend items={serviceChartData.map((d) => ({ label: d.name, value: d.value, color: SERVICE_COLORS[d.key] || "#94a3b8" }))} />
              </>
            )}
          </div>
        </ConsoleCard>

        {canViewWallet ? (
          <ConsoleCard className="p-5">
            <h2 className="text-sm font-semibold">Cost &amp; Consumption Over Time</h2>
            <p className="mt-0.5 text-xs text-fg-subtle">Wallet debits and billable verifications.</p>
            <div className="mt-4 h-[240px]">
              {chartData.length === 0 ? (
                <NoChartData />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COST_COLOR} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={COST_COLOR} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" {...CHART_AXIS_PROPS} />
                    <YAxis {...CHART_AXIS_PROPS} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => formatKes(value)} />
                    <Area type="monotone" dataKey="amountCharged" name="Amount charged" stroke={COST_COLOR} strokeWidth={2} fill="url(#gCost)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </ConsoleCard>
        ) : null}
      </div>

      <OrgTable orgPage={orgPage} filters={filters} rangePreset={rangePreset} canViewWallet={canViewWallet} />
    </div>
  );
}

function NoChartData() {
  return <div className="flex h-full items-center justify-center text-sm text-fg-subtle">No data in this range.</div>;
}

function ChartLegend({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.color }} />
          <span className="text-fg-muted">{i.label}</span>
          <span className="font-semibold tabular-nums">{i.value.toLocaleString()}</span>
          <span className="text-fg-subtle">({total > 0 ? Math.round((i.value / total) * 100) : 0}%)</span>
        </div>
      ))}
    </div>
  );
}

function formatBucketLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}

function filtersToSearchParams(filters: ApiUsageFilters, rangePreset: DateRangePreset): URLSearchParams {
  const params = new URLSearchParams();
  params.set("range", rangePreset);
  if (rangePreset === "custom") {
    params.set("from", filters.from);
    params.set("to", filters.to);
  }
  if (filters.organizationId) params.set("org", filters.organizationId);
  if (filters.apiKeyId) params.set("apiKey", filters.apiKeyId);
  if (filters.environment) params.set("environment", filters.environment);
  if (filters.verificationType) params.set("service", filters.verificationType);
  if (filters.status) params.set("status", filters.status);
  if (filters.keyStatus) params.set("keyStatus", filters.keyStatus);
  if (filters.provider) params.set("provider", filters.provider);
  if (filters.walletState) params.set("wallet", filters.walletState);
  if (filters.search) params.set("q", filters.search);
  if (filters.sort !== "total_requests") params.set("sort", filters.sort);
  if (filters.sortDir !== "desc") params.set("sortDir", filters.sortDir);
  return params;
}

function SummaryCards({ summary, canViewWallet }: { summary: SummaryCardsData; canViewWallet: boolean }) {
  const rate = successRate(summary.current.successful, summary.current.failed);
  const cards = [
    {
      label: "Total API Requests",
      value: summary.current.totalRequests.toLocaleString(),
      delta: percentDelta(summary.current.totalRequests, summary.previous.totalRequests),
      Icon: ShieldCheck,
      tone: "info" as const,
    },
    {
      label: "Successful KYC Verifications",
      value: summary.current.successful.toLocaleString(),
      delta: percentDelta(summary.current.successful, summary.previous.successful),
      sub: rate !== null ? `${rate.toFixed(1)}% success rate` : "No completed attempts yet",
      Icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: "Failed KYC Verifications",
      value: summary.current.failed.toLocaleString(),
      delta: percentDelta(summary.current.failed, summary.previous.failed),
      deltaIsBad: true,
      Icon: XCircle,
      tone: "danger" as const,
    },
    {
      label: "Active API Keys",
      value: summary.activeApiKeys.toLocaleString(),
      delta: percentDelta(summary.activeApiKeys, summary.activeApiKeysPrevious),
      Icon: KeyRound,
      tone: "neutral" as const,
    },
  ];

  const walletCards = [
    {
      label: "Total Amount Consumed",
      value: formatKes(summary.current.amountConsumed),
      delta: percentDelta(summary.current.amountConsumed, summary.previous.amountConsumed),
      Icon: Wallet,
      tone: "info" as const,
    },
    {
      label: "Combined Client Wallet Balance",
      value: formatKes(summary.combinedWalletBalance),
      delta: null,
      sub: "Current balance — not comparable to a past period",
      Icon: Wallet,
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <SummaryCard key={c.label} {...c} />
      ))}
      {canViewWallet ? (
        walletCards.map((c) => <SummaryCard key={c.label} {...c} />)
      ) : (
        <div className="col-span-2 flex items-center justify-center rounded-2xl border border-dashed border-border p-4 text-center text-xs text-fg-subtle xl:col-span-2">
          Wallet and cost figures are restricted to Finance/Product roles.
        </div>
      )}
    </div>
  );
}

function SummaryCard(props: {
  label: string;
  value: string;
  delta: number | null;
  sub?: string;
  deltaIsBad?: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "info" | "success" | "danger" | "neutral";
}) {
  const { label, value, delta, sub, deltaIsBad, Icon, tone } = props;
  const toneClass = {
    info: "bg-enterprise-primary/10 text-enterprise-primary",
    success: "bg-emerald-500/10 text-emerald-500",
    danger: "bg-red-500/10 text-red-500",
    neutral: "bg-fg-subtle/10 text-fg-subtle",
  }[tone];

  const deltaGood = delta !== null && (deltaIsBad ? delta <= 0 : delta >= 0);

  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">{label}</p>
        <div className={"grid h-7 w-7 place-items-center rounded-lg " + toneClass}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-[11px] text-fg-subtle">{sub}</p> : null}
      {delta !== null ? (
        <p className={"mt-1 text-[11px] font-medium " + (deltaGood ? "text-emerald-500" : "text-red-500")}>
          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}% vs previous period
        </p>
      ) : null}
    </div>
  );
}

const ENVIRONMENTS = ["sandbox", "production"] as const;
const SERVICES = ["identity", "phone", "business"] as const;
const STATUSES = ["pending", "completed", "failed"] as const;
const KEY_STATUSES = ["active", "revoked"] as const;
const WALLET_STATES = ["healthy", "low", "zero"] as const;

function FilterBar({
  filters,
  rangePreset,
  filterOptions,
}: {
  filters: ApiUsageFilters;
  rangePreset: DateRangePreset;
  filterOptions: FilterOptions;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [draft, setDraft] = useState(filters);
  const [draftRange, setDraftRange] = useState<DateRangePreset>(rangePreset);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  // Search auto-applies (debounced) — every other filter waits for "Apply"
  // so changing several dropdowns doesn't trigger a server round trip each.
  useEffect(() => {
    if (debouncedSearch === filters.search) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set("q", debouncedSearch);
    else params.delete("q");
    params.delete("page");
    router.push(pathname + "?" + params.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const applyFilters = useCallback(() => {
    const params = filtersToSearchParams({ ...draft, search: searchInput, page: 1 }, draftRange);
    router.push(pathname + "?" + params.toString());
  }, [draft, draftRange, searchInput, pathname, router]);

  const resetFilters = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  const activeFilterCount = [
    draft.organizationId, draft.apiKeyId, draft.environment, draft.verificationType,
    draft.status, draft.keyStatus, draft.provider, draft.walletState,
    draftRange !== "30d" ? draftRange : null,
  ].filter(Boolean).length;

  const visibleApiKeys = filterOptions.apiKeys.filter((k) => {
    if (draft.organizationId && k.organization_id !== draft.organizationId) return false;
    if (draft.keyStatus && k.status !== draft.keyStatus) return false;
    return true;
  });

  return (
    <ConsoleCard className="mb-6 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search org name, API key name, request ID, or client ID..."
            className="w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-3 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>

        <Select label="Range" value={draftRange} onChange={(v) => setDraftRange(v as DateRangePreset)} options={[
          { value: "24h", label: "24h" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "90d", label: "90 days" },
        ]} />
        <Select label="Organization" value={draft.organizationId || ""} onChange={(v) => setDraft((d) => ({ ...d, organizationId: v || null, apiKeyId: null }))} options={[
          { value: "", label: "All organizations" },
          ...filterOptions.organizations.map((o) => ({ value: o.id, label: o.name })),
        ]} />
        <Select label="API key" value={draft.apiKeyId || ""} onChange={(v) => setDraft((d) => ({ ...d, apiKeyId: v || null }))} options={[
          { value: "", label: "All API keys" },
          ...visibleApiKeys.map((k) => ({ value: k.id, label: k.name })),
        ]} />
        <Select label="Environment" value={draft.environment || ""} onChange={(v) => setDraft((d) => ({ ...d, environment: (v || null) as typeof d.environment }))} options={[
          { value: "", label: "All environments" },
          ...ENVIRONMENTS.map((e) => ({ value: e, label: e === "sandbox" ? "Sandbox" : "Production" })),
        ]} />
        <Select label="Service" value={draft.verificationType || ""} onChange={(v) => setDraft((d) => ({ ...d, verificationType: (v || null) as typeof d.verificationType }))} options={[
          { value: "", label: "All services" },
          ...SERVICES.map((s) => ({ value: s, label: VERIFICATION_TYPE_LABELS[s] })),
        ]} />
        <Select label="Status" value={draft.status || ""} onChange={(v) => setDraft((d) => ({ ...d, status: (v || null) as typeof d.status }))} options={[
          { value: "", label: "All statuses" },
          ...STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
        ]} />
        <Select label="Key status" value={draft.keyStatus || ""} onChange={(v) => setDraft((d) => ({ ...d, keyStatus: (v || null) as typeof d.keyStatus }))} options={[
          { value: "", label: "Any key status" },
          ...KEY_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
        ]} />
        <Select label="Provider" value={draft.provider || ""} onChange={(v) => setDraft((d) => ({ ...d, provider: v || null }))} options={[
          { value: "", label: "All providers" },
          { value: "creditinfo", label: "Creditinfo" },
        ]} />
        <Select label="Wallet" value={draft.walletState || ""} onChange={(v) => setDraft((d) => ({ ...d, walletState: (v || null) as typeof d.walletState }))} options={[
          { value: "", label: "Any wallet balance" },
          ...WALLET_STATES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) + " balance" })),
        ]} />

        <div className="ml-auto flex items-center gap-2">
          {activeFilterCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-enterprise-primary/10 px-2.5 py-1 text-xs font-semibold text-enterprise-primary">
              <Filter className="h-3 w-3" /> {activeFilterCount} active
            </span>
          ) : null}
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium hover:bg-bg-elevated"
          >
            <X className="h-3 w-3" /> Reset
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex items-center gap-1.5 rounded-lg bg-enterprise-primary px-3 py-2 text-xs font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover"
          >
            Apply filters
          </button>
        </div>
      </div>
    </ConsoleCard>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-bg px-2.5 py-2 text-xs font-medium outline-none focus:border-enterprise-primary"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

const ORG_SORT_COLUMNS: { key: OrgSortKey; label: string }[] = [
  { key: "organization_name", label: "Organization" },
  { key: "total_requests", label: "Total requests" },
  { key: "amount_consumed", label: "Amount consumed" },
  { key: "last_activity_at", label: "Last activity" },
];

function OrgTable({
  orgPage, filters, rangePreset, canViewWallet,
}: {
  orgPage: OrgUsagePage;
  filters: ApiUsageFilters;
  rangePreset: DateRangePreset;
  canViewWallet: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(orgPage.totalCount / PAGE_SIZE));

  function goToPage(page: number) {
    const params = filtersToSearchParams(filters, rangePreset);
    params.set("page", String(page));
    router.push(pathname + "?" + params.toString());
  }

  function sortBy(key: OrgSortKey) {
    const nextDir: SortDir = filters.sort === key && filters.sortDir === "desc" ? "asc" : "desc";
    const params = filtersToSearchParams({ ...filters, sort: key, sortDir: nextDir }, rangePreset);
    router.push(pathname + "?" + params.toString());
  }

  return (
    <ConsoleCard>
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">Client Organizations</h2>
        <p className="mt-0.5 text-xs text-fg-subtle">{orgPage.totalCount} organization{orgPage.totalCount === 1 ? "" : "s"} matching current filters.</p>
      </div>

      {orgPage.rows.length === 0 ? (
        <EmptyState Icon={Building2} title="No matching organizations" message="Try widening the date range or clearing a filter." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                {ORG_SORT_COLUMNS.map((col) => (
                  <th key={col.key} className="px-4 py-2.5">
                    <button type="button" onClick={() => sortBy(col.key)} className="inline-flex items-center gap-1 hover:text-fg">
                      {col.label} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-2.5">Environment / Keys</th>
                <th className="px-4 py-2.5">Successful</th>
                <th className="px-4 py-2.5">Failed</th>
                <th className="px-4 py-2.5">Success rate</th>
                {canViewWallet ? <th className="px-4 py-2.5">Wallet balance</th> : null}
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orgPage.rows.map((row) => {
                const rate = successRate(row.successful, row.failed);
                return (
                  <tr key={row.organizationId} className="hover:bg-bg-elevated/50">
                    <td className="px-4 py-3 font-medium">{row.organizationName}</td>
                    <td className="px-4 py-3 tabular-nums">{row.totalRequests.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">{canViewWallet ? formatKes(row.amountConsumed) : "—"}</td>
                    <td className="px-4 py-3 text-xs text-fg-muted">{row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString("en-KE") : "Never"}</td>
                    <td className="px-4 py-3 text-xs text-fg-muted">{row.activeApiKeys} active</td>
                    <td className="px-4 py-3 tabular-nums text-emerald-500">{row.successful.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums text-red-500">{row.failed.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">{rate !== null ? `${rate.toFixed(1)}%` : "—"}</td>
                    {canViewWallet ? (
                      <td className="px-4 py-3 tabular-nums">{formatKes(row.walletBalance)}</td>
                    ) : null}
                    <td className="px-4 py-3">
                      <span className="rounded bg-fg-subtle/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-fg-muted">{row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/console/api-usage/${row.organizationId}?` + filtersToSearchParams(filters, rangePreset).toString()}
                        className="text-xs font-medium text-enterprise-primary hover:underline"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-fg-subtle">Page {filters.page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => goToPage(filters.page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              type="button"
              disabled={filters.page >= totalPages}
              onClick={() => goToPage(filters.page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </ConsoleCard>
  );
}
