import { NextRequest, NextResponse } from "next/server";
import { requireKycClientAccess } from "@/lib/kyc/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const COLUMNS = "id, type, amount, balance_after, verification_id, reference, note, created_at";

export async function GET(req: NextRequest) {
  const auth = await requireKycClientAccess();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("kyc_wallet_transactions")
    .select(COLUMNS)
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ transactions: data || [] });
}
