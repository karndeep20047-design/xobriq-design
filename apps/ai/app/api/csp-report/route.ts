import { NextRequest, NextResponse } from "next/server";

// Receives violation reports from the Content-Security-Policy-Report-Only
// header set in middleware.ts. This only logs — it's the difference between
// "reports exist somewhere in each visitor's devtools console" and "we can
// actually see what's being flagged before deciding to enforce the policy."
// Browsers POST a JSON body shaped like { "csp-report": { ... } } for the
// legacy report-uri directive used here.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.warn("[csp-report]", JSON.stringify(body));
  } catch {
    // Malformed/empty report body — nothing to log, not worth failing on.
  }
  return NextResponse.json({ ok: true });
}
