import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { GuardDashboardClient, type GuardHit, type GuardSummary } from "./GuardDashboardClient";

export const metadata = { title: "Guard Live — Xobriq Console" };

const HIT_COLUMNS = "id, created_at, type, amount, rule_action, model_score, action";

export default async function GuardPage() {
  await requireStaffPermission("guard");
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("guard_decisions")
    .select(HIT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);

  const hits = (rows || []) as GuardHit[];
  const summary: GuardSummary = { total: hits.length, BLOCK: 0, REVIEW: 0, ALLOW: 0 };
  for (const hit of hits) {
    if (hit.action in summary) summary[hit.action as "BLOCK" | "REVIEW" | "ALLOW"]++;
  }

  return <GuardDashboardClient initialHits={hits} initialSummary={summary} />;
}
