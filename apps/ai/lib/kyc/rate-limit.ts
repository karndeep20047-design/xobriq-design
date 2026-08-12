import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

// Best-effort, soft per-org rate limit — a plain Postgres count, not a hard
// guarantee (a small TOCTOU race exists under true concurrency). There's no
// Redis/Upstash anywhere in this stack; this is enough to stop a runaway
// loop from burning through Creditinfo sandbox quota, not a security
// boundary.
export async function isRateLimited(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await admin
    .from("kyc_verifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);
  return (count ?? 0) >= MAX_PER_WINDOW;
}
