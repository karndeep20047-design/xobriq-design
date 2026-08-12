import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireKycClientAccess } from "@/lib/kyc/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  amount: z.number().positive().max(10_000_000),
  method: z.enum(["mpesa", "bank", "card"]),
  contactReference: z.string().trim().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireKycClientAccess();
  if (!auth.ok) return auth.response;

  // A top-up request is attributed to a real dashboard user, not an org —
  // an API key has no Supabase Auth user behind it to attribute this to.
  if (!auth.userId) {
    return NextResponse.json(
      { error: "Top-up requests require a signed-in dashboard user." },
      { status: 403 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("kyc_wallet_topup_requests")
    .insert({
      organization_id: auth.organizationId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      contact_reference: parsed.data.contactReference || null,
      requested_by: auth.userId,
    })
    .select("id, status, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Failed to submit request" }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}
