import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

// Best-effort, soft per-IP rate limit for public, unauthenticated
// endpoints that write to the `inquiries` table — same shape and same
// caveats as lib/kyc/rate-limit.ts's per-org limiter (a plain Postgres
// count, not a hard guarantee; there's no Redis/Upstash anywhere in this
// stack). Enough to stop a scripted burst from spamming real emails and
// filling the table, not a security boundary. Skips the check entirely
// when no IP was resolved (never trust an empty IP as "under the limit
// forever," but there's nothing meaningful to count against either).
export async function isIpRateLimited(
  admin: ReturnType<typeof createAdminClient>,
  ipAddress: string | null
): Promise<boolean> {
  if (!ipAddress) return false;

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await admin
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ipAddress)
    .gte("created_at", since);

  return (count ?? 0) >= MAX_PER_WINDOW;
}

// Generic per-IP rate limit for authenticated-flow actions (login,
// register, password reset, invite accept), counted against audit_logs
// instead of a dedicated table — logAudit() already resolves and stores a
// real ip_address on every one of these actions' rows regardless of what
// the caller passes, so this needs no new table or column. Same soft,
// best-effort caveat as isIpRateLimited above.
export async function isAuthActionRateLimited(
  admin: ReturnType<typeof createAdminClient>,
  ipAddress: string | null,
  actions: string[],
  opts?: { windowMs?: number; max?: number }
): Promise<boolean> {
  if (!ipAddress) return false;

  const windowMs = opts?.windowMs ?? 5 * 60_000;
  const max = opts?.max ?? 10;
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count } = await admin
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ipAddress)
    .in("action", actions)
    .gte("created_at", since);

  return (count ?? 0) >= max;
}
