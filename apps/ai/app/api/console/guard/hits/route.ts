import { NextResponse } from "next/server";
import { requireGuardApiAccess } from "@/lib/guard/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const HIT_COLUMNS = "id, created_at, type, amount, rule_action, model_score, action";

export async function GET() {
  const auth = await requireGuardApiAccess();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("guard_decisions")
    .select(HIT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);

  const hits = rows || [];
  const summary = { total: hits.length, BLOCK: 0, REVIEW: 0, ALLOW: 0 };
  for (const hit of hits as any[]) {
    if (hit.action in summary) summary[hit.action as "BLOCK" | "REVIEW" | "ALLOW"]++;
  }

  return NextResponse.json({ summary, hits });
}
