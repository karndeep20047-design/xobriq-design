import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";

export type DashboardRange = "24h" | "7d" | "30d" | "90d";

export const DASHBOARD_RANGES: DashboardRange[] = ["24h", "7d", "30d", "90d"];

const RANGE_MS: Record<DashboardRange, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

export type TrendPoint = { label: string; approved: number; pending: number; rejected: number };
export type DocTypeSlice = { name: string; value: number; color: string };

export type DashboardStats = {
  total: number;
  totalDeltaPct: number | null;
  approved: number;
  approvedRate: number | null;
  pending: number;
  pendingRate: number | null;
  rejected: number;
  rejectedRate: number | null;
  alerts: number;
  alertsDeltaPct: number | null;
  trend: TrendPoint[];
  docTypes: DocTypeSlice[];
};

// Real identifier_type vocabulary from lib/kyc/providers/creditinfo/types.ts
// — there is no "passport"/"Huduma Namba" in the actual data, unlike the
// original mock chart's categories.
const DOC_TYPE_META: Record<string, { label: string; color: string }> = {
  national_id: { label: "National ID", color: "#2563eb" },
  krapinalien_id: { label: "Alien ID", color: "#0d9488" },
  krapin: { label: "KRA PIN", color: "#7c3aed" },
  bank: { label: "Bank Account", color: "#4f46e5" },
  dl: { label: "Driving License", color: "#0891b2" },
  plate: { label: "Vehicle Plate", color: "#db2777" },
};

function pct(part: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((part / total) * 1000) / 10;
}

function deltaPct(current: number, prior: number): number | null {
  if (prior === 0) return current > 0 ? 100 : null;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

type Row = {
  status: "pending" | "completed" | "failed";
  matched: boolean | null;
  verification_type: "identity" | "phone" | "business";
  identifier_type: string | null;
  created_at: string;
};

function buildBuckets(since: Date, now: Date, range: DashboardRange) {
  const bucketMs =
    range === "24h" ? 60 * 60 * 1000 : range === "90d" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const count = Math.max(1, Math.round((now.getTime() - since.getTime()) / bucketMs));
  const buckets = Array.from({ length: count }, (_, i) => {
    const start = new Date(since.getTime() + i * bucketMs);
    const label =
      range === "24h"
        ? start.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })
        : start.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
    return { label, approved: 0, pending: 0, rejected: 0 };
  });
  return { buckets, bucketMs };
}

/**
 * All real, none of it invented: counts/rates/trend come straight from
 * kyc_verifications. "Alerts" reuses the exact same definition as
 * app/(kyc)/dashboard/xobriqKYC/alerts/page.tsx (status failed OR
 * matched false) — there's no fraud-scoring engine anywhere in this
 * codebase, so that's the honest substitute rather than a fabricated
 * number.
 */
export async function getDashboardStats(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  range: DashboardRange
): Promise<DashboardStats> {
  const now = new Date();
  const since = new Date(now.getTime() - RANGE_MS[range]);
  const sincePrior = new Date(since.getTime() - RANGE_MS[range]);

  const { data } = await admin
    .from("kyc_verifications")
    .select("status, matched, verification_type, identifier_type, created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", sincePrior.toISOString())
    .limit(10000);

  const rows = (data || []) as Row[];
  const sinceMs = since.getTime();
  const current = rows.filter((r) => new Date(r.created_at).getTime() >= sinceMs);
  const prior = rows.filter((r) => {
    const t = new Date(r.created_at).getTime();
    return t < sinceMs;
  });

  const total = current.length;
  const approved = current.filter((r) => r.status === "completed" && r.matched === true).length;
  const rejected = current.filter((r) => r.status === "completed" && r.matched === false).length;
  const pending = current.filter((r) => r.status === "pending").length;
  const alerts = current.filter((r) => r.status === "failed" || r.matched === false).length;

  const priorTotal = prior.length;
  const priorAlerts = prior.filter((r) => r.status === "failed" || r.matched === false).length;

  const { buckets, bucketMs } = buildBuckets(since, now, range);
  for (const r of current) {
    const t = new Date(r.created_at).getTime();
    const idx = Math.min(buckets.length - 1, Math.max(0, Math.floor((t - sinceMs) / bucketMs)));
    if (r.status === "pending") buckets[idx].pending += 1;
    else if (r.status === "completed" && r.matched === true) buckets[idx].approved += 1;
    else if (r.status === "completed" && r.matched === false) buckets[idx].rejected += 1;
  }

  const docCounts = new Map<string, number>();
  for (const r of current) {
    if (r.verification_type !== "identity" || !r.identifier_type) continue;
    docCounts.set(r.identifier_type, (docCounts.get(r.identifier_type) || 0) + 1);
  }
  const docTypes: DocTypeSlice[] = Array.from(docCounts.entries())
    .map(([key, value]) => ({
      name: DOC_TYPE_META[key]?.label ?? key,
      value,
      color: DOC_TYPE_META[key]?.color ?? "#64748b",
    }))
    .sort((a, b) => b.value - a.value);

  return {
    total,
    totalDeltaPct: deltaPct(total, priorTotal),
    approved,
    approvedRate: pct(approved, total),
    pending,
    pendingRate: pct(pending, total),
    rejected,
    rejectedRate: pct(rejected, total),
    alerts,
    alertsDeltaPct: deltaPct(alerts, priorAlerts),
    trend: buckets.map((b) => ({ label: b.label, approved: b.approved, pending: b.pending, rejected: b.rejected })),
    docTypes,
  };
}
