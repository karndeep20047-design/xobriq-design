"use server";

import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { runHealthCheck } from "@/lib/kyc/verify-and-record";

// Every health check is a real, billable Creditinfo call — see
// runHealthCheck()'s own doc comment in lib/kyc/verify-and-record.ts.
// The client only ever enforced a 30s cooldown in React state, which
// resets on a page refresh and isn't shared across staff members — not
// a real cost control. This server-side check looks at the most recent
// health_check row in kyc_provider_requests directly (the same table
// every health check already writes to) and refuses to run another one
// too soon, no matter who's asking or whether their tab was reloaded.
const MIN_INTERVAL_MS = 30 * 60_000;

export async function runKycHealthCheck(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  await requireStaffPermission("kyc_ops");
  const admin = createAdminClient();

  const { data: last } = await admin
    .from("kyc_provider_requests")
    .select("created_at")
    .eq("request_type", "health_check")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last) {
    const elapsedMs = Date.now() - new Date(last.created_at).getTime();
    if (elapsedMs < MIN_INTERVAL_MS) {
      const retryInSec = Math.ceil((MIN_INTERVAL_MS - elapsedMs) / 1000);
      return { ok: false, error: `A health check already ran recently — try again in ${retryInSec}s.` };
    }
  }

  await runHealthCheck();
  return { ok: true };
}
