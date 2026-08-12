"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Inbox,
  Mail,
  Phone,
  Building2,
  AlertCircle,
} from "lucide-react";
import {
  ConsolePageHeader,
  ConsoleCard,
  EmptyState,
} from "@/components/console/ConsolePageHeader";

type Inquiry = {
  id: string;
  type: string;
  department: string | null;
  source_site: string;
  source_page: string | null;
  full_name: string;
  email: string;
  company: string | null;
  phone: string | null;
  industry: string | null;
  message: string | null;
  urgency: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  contact: "Contact",
  demo_request: "Demo Request",
  pricing_inquiry: "Pricing",
  discovery_call: "Discovery",
  partnership: "Partnership",
  press: "Press",
  security_disclosure: "Security",
  support: "Support",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  hr: "HR",
  sales: "Sales",
  general: "General",
  partnerships: "Partnerships",
};

const DEPARTMENT_TONES: Record<string, string> = {
  hr: "bg-violet-500/15 text-violet-400",
  sales: "bg-enterprise-primary/15 text-enterprise-primary",
  general: "bg-fg-subtle/15 text-fg-subtle",
  partnerships: "bg-enterprise-accent/15 text-enterprise-accent",
};

const STATUS_TONES: Record<string, string> = {
  new: "bg-emerald-500/15 text-emerald-400",
  contacted: "bg-enterprise-primary/15 text-enterprise-primary",
  qualified: "bg-enterprise-accent/15 text-enterprise-accent",
  won: "bg-emerald-500/20 text-emerald-300",
  lost: "bg-fg-subtle/15 text-fg-subtle",
  spam: "bg-red-500/15 text-red-400",
  archived: "bg-fg-subtle/10 text-fg-subtle",
};

export function InquiriesListClient(props: {
  inquiries: Inquiry[];
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const inquiries = props.inquiries;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Only offer departments this viewer actually has rows for — a sales-only
  // role should never see an "HR" option, even one that filters to nothing.
  const departmentOptions = useMemo(() => {
    const present = new Set(inquiries.map((item) => item.department).filter(Boolean));
    return Array.from(present) as string[];
  }, [inquiries]);

  const filtered = inquiries.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (departmentFilter !== "all" && item.department !== departmentFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      const fields: (string | null)[] = [
        item.full_name,
        item.email,
        item.company,
        item.message,
      ];
      const matches = fields.some((f) => f && f.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const stats = {
    newCount: inquiries.filter((item) => item.status === "new").length,
    contactedCount: inquiries.filter((item) => item.status === "contacted")
      .length,
    qualifiedCount: inquiries.filter((item) => item.status === "qualified")
      .length,
    urgentCount: inquiries.filter(
      (item) => item.urgency === "urgent" && item.status === "new"
    ).length,
  };

  const rowClass =
    "flex items-start gap-3 p-4 transition hover:bg-bg-elevated/50 sm:px-6";

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow={props.eyebrow ?? "Sales & Support"}
        title={props.title ?? "Inquiries"}
        description={props.description ?? "Every lead, demo request, and support ticket from xobriq.com and xobriq.ai."}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatBox label="New" value={stats.newCount} tone="success" />
        <StatBox label="Contacted" value={stats.contactedCount} tone="info" />
        <StatBox label="Qualified" value={stats.qualifiedCount} tone="accent" />
        <StatBox label="Urgent" value={stats.urgentCount} tone="danger" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, company, or message..."
            className="w-full rounded-lg border border-border bg-bg-subtle py-2 pl-9 pr-3 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>
        {departmentOptions.length > 1 ? (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none"
          >
            <option value="all">All teams</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {DEPARTMENT_LABELS[dept] || dept}
              </option>
            ))}
          </select>
        ) : null}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none"
        >
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <ConsoleCard>
        {filtered.length === 0 ? (
          <EmptyState
            Icon={Inbox}
            title={inquiries.length === 0 ? "No inquiries yet" : "No matches"}
            message={
              inquiries.length === 0
                ? "New inquiries from xobriq.com will appear here."
                : "Try adjusting your filters."
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => (
              <InquiryRow key={item.id} item={item} rowClass={rowClass} />
            ))}
          </div>
        )}
      </ConsoleCard>
    </div>
  );
}

function InquiryRow(props: { item: Inquiry; rowClass: string }) {
  const item = props.item;
  const href = "/console/inquiries/" + item.id;
  const createdLabel = new Date(item.created_at).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={href} className={props.rowClass}>
      <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-enterprise-primary/10">
        {item.urgency === "urgent" ? (
          <AlertCircle className="h-4 w-4 text-red-400" />
        ) : (
          <Mail className="h-4 w-4 text-enterprise-primary" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{item.full_name}</p>
          <span
            className={
              "rounded px-2 py-0.5 text-[10px] font-semibold " +
              (STATUS_TONES[item.status] || "bg-fg-subtle/15 text-fg-subtle")
            }
          >
            {item.status}
          </span>
          <span className="rounded bg-fg-subtle/10 px-2 py-0.5 text-[10px] font-semibold text-fg-muted">
            {TYPE_LABELS[item.type] || item.type}
          </span>
          {item.department ? (
            <span
              className={
                "rounded px-2 py-0.5 text-[10px] font-semibold " +
                (DEPARTMENT_TONES[item.department] || "bg-fg-subtle/15 text-fg-subtle")
              }
            >
              {DEPARTMENT_LABELS[item.department] || item.department}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap gap-3 text-xs text-fg-muted">
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3 w-3" /> {item.email}
          </span>
          {item.company ? (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {item.company}
            </span>
          ) : null}
          {item.phone ? (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" /> {item.phone}
            </span>
          ) : null}
        </div>

        {item.message ? (
          <p className="mt-2 line-clamp-2 text-xs text-fg-muted">
            {item.message}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-fg-subtle">
        <span>{createdLabel}</span>
        <span className="text-[10px]">{item.source_site}</span>
      </div>
    </Link>
  );
}

function StatBox(props: {
  label: string;
  value: number;
  tone: "success" | "info" | "accent" | "danger";
}) {
  const dot =
    props.tone === "success"
      ? "bg-emerald-400"
      : props.tone === "info"
      ? "bg-enterprise-primary"
      : props.tone === "accent"
      ? "bg-enterprise-accent"
      : "bg-red-400";

  return (
    <div className="rounded-2xl border border-border bg-bg-subtle p-4">
      <div className="flex items-center gap-2">
        <div className={"h-1.5 w-1.5 rounded-full " + dot} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
          {props.label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{props.value}</p>
    </div>
  );
}