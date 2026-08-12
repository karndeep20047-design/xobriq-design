import { NextRequest, NextResponse } from "next/server";
import { requireKycClientAccess } from "@/lib/kyc/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const DETAIL_COLUMNS =
  "id, ref, organization_id, verification_type, provider, status, identifier_type, " +
  "identifier_number, last_name, matched, result, raw_response, error_message, " +
  "duration_ms, requested_by_email, ip_address, user_agent, created_at, completed_at";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireKycClientAccess("kyc_verifications");
  if (!auth.ok) return auth.response;

  const { id } = await props.params;
  const admin = createAdminClient();

  // `id` is matched against either the internal uuid or the display ref
  // (HKY-XXXXXXXX) — the dashboard always links by ref.
  const column = /^[0-9a-f-]{36}$/i.test(id) ? "id" : "ref";
  const { data, error } = await admin
    .from("kyc_verifications")
    .select(DETAIL_COLUMNS)
    .eq(column, id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (data.organization_id !== auth.organizationId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ verification: data });
}
