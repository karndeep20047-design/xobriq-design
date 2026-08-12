import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGraphToken } from "@/lib/email/graph";
import { creditinfoMissingEnvVars } from "@/lib/kyc/providers/creditinfo/config";

// Public liveness/health endpoint for uptime monitoring (UptimeRobot,
// Vercel monitors, a status page, etc) — deliberately cheap and safe to
// poll frequently: a plain DB query and a Graph token fetch (cached
// internally, so repeated calls don't re-hit Microsoft's token endpoint
// every time). Never triggers a real, billable Creditinfo call — that
// one stays behind the manual, throttled "Run health check" button in
// console/kyc (runHealthCheck() in lib/kyc/verify-and-record.ts), exactly
// because it costs real money per call and shouldn't fire on every
// monitoring ping. Reports only ok/error per dependency, never error
// details, since this route is intentionally unauthenticated.
export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("organizations").select("id", { count: "exact", head: true }).limit(1);
    checks.database = error ? "error" : "ok";
  } catch {
    checks.database = "error";
  }

  try {
    await getGraphToken();
    checks.email = "ok";
  } catch {
    checks.email = "error";
  }

  // Only sandbox is checked here — this is an unauthenticated liveness
  // endpoint, and sandbox credentials being present is what every current
  // real KYC call actually depends on today. Production readiness has its
  // own explicit gate (CREDITINFO_PRODUCTION_ENABLED) that this
  // deliberately doesn't report on, so this endpoint can't be used to
  // probe Production activation status from the outside.
  checks.creditinfo_configured = creditinfoMissingEnvVars("sandbox").length === 0 ? "ok" : "error";

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
