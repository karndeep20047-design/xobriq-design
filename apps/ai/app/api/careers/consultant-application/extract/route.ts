// apps/ai/app/api/careers/consultant-application/extract/route.ts
//
// Public REST equivalent of extractCVFieldsAction, for xobriq.com's
// pre-fill-on-file-select UX. No DB writes — re-validates and re-parses the
// file independently, same as the Server Action version.
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { extractCVFields } from "@/lib/consultant/extract-fields";

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
    const result = await extractCVFields(formData);
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers });
  } catch (err) {
    console.error("[consultant-application/extract/api] fatal:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "Could not read this file" }, { status: 500, headers });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405, headers: corsHeaders(req.headers.get("origin")) }
  );
}
