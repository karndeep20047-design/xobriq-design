// apps/ai/app/api/careers/consultant-roles/route.ts
//
// Public read-only endpoint exposing CONSULTANT_ROLES so xobriq.com's role
// picker can stay in sync with the single source of truth in
// lib/consultant/roles.ts instead of holding its own copy that can drift.
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { CONSULTANT_ROLES } from "@/lib/consultant/roles";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin"), METHODS),
  });
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { ok: true, roles: CONSULTANT_ROLES },
    { headers: corsHeaders(req.headers.get("origin"), METHODS) }
  );
}
