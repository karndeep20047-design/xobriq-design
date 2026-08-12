// apps/ai/app/api/careers/consultant-application/route.ts
//
// Public REST equivalent of submitConsultantApplicationAction, for xobriq.com
// (a separate Vite/React app that can't call a Next.js Server Action
// directly). Wraps the exact same shared logic in lib/consultant — this
// route only adds the CORS/request-parsing glue a cross-origin caller needs.
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { submitConsultantApplication } from "@/lib/consultant/submit-application";
import { isIpRateLimited } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const formData = await req.formData();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = req.headers.get("user-agent") || null;

    if (await isIpRateLimited(createAdminClient(), ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests — please try again in a minute." },
        { status: 429, headers }
      );
    }

    const result = await submitConsultantApplication(formData, {
      sourceSite: "xobriq.com",
      sourcePage: "/careers/consultants",
      ip,
      userAgent,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers });
  } catch (err) {
    console.error("[consultant-application/api] fatal:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500, headers });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405, headers: corsHeaders(req.headers.get("origin")) }
  );
}
