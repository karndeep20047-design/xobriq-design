import { NextRequest, NextResponse } from "next/server";
import { requireKycClientAccess } from "@/lib/kyc/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const LIST_COLUMNS =
  "id, ref, verification_type, provider, status, identifier_type, identifier_number, " +
  "last_name, matched, result, error_message, duration_ms, requested_by_email, " +
  "created_at, completed_at";

export async function GET(req: NextRequest) {
  const auth = await requireKycClientAccess("kyc_verifications");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  // PostgREST's .or() takes one comma-separated filter string with no
  // built-in escaping — strip the characters that have syntactic meaning
  // there so user input can't break out into extra conditions.
  const q = searchParams.get("q")?.trim().replace(/[,()]/g, "");
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);

  const admin = createAdminClient();
  let query = admin
    .from("kyc_verifications")
    .select(LIST_COLUMNS)
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("verification_type", type);
  if (q) {
    query = query.or(`ref.ilike.%${q}%,identifier_number.ilike.%${q}%,last_name.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ verifications: data || [] });
}
