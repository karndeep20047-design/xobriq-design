import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stkPush } from "@/lib/daraja";
import { requireKycClientAccess } from "@/lib/kyc/api-auth";
import { normalizeMsisdn, isValidKenyanPhone, maskPhone } from "@/lib/mpesa-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// Safaricom's STK Push round-trip is slower than Vercel's 10s default —
// same reasoning as the KYC verify routes.
export const maxDuration = 30;

// organizationId is deliberately NOT part of this schema. It comes from the
// authenticated session/API key, never from the request body — otherwise any
// caller could push a charge against an arbitrary org.
const bodySchema = z.object({
  amount: z.number().int().min(1).max(300_000),
  phoneNumber: z.string().trim().min(9).max(15),
});

export async function POST(req: NextRequest) {
  const auth = await requireKycClientAccess();
  if (!auth.ok) return auth.response;

  // Mirrors /api/v1/kyc/wallet/topup-request: a top-up is attributed to a
  // real dashboard user. An API key has no Supabase Auth user behind it, and
  // an unattributable money movement isn't something to accept quietly.
  if (!auth.userId) {
    return NextResponse.json(
      { error: "Top-ups require a signed-in dashboard user." },
      { status: 403 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Validate against the normalised form — the raw input can be any of
  // 07XXXXXXXX / 7XXXXXXXX / +2547XXXXXXXX and still be perfectly valid.
  const phoneNumber = normalizeMsisdn(parsed.data.phoneNumber);
  if (!isValidKenyanPhone(phoneNumber)) {
    return NextResponse.json(
      { error: "Enter a valid Safaricom number (07XX XXX XXX)." },
      { status: 400 }
    );
  }

  const { amount } = parsed.data;
  const organizationId = auth.organizationId;

  const callbackBase = process.env.DARAJA_CALLBACK_BASE_URL;
  const callbackSecret = process.env.DARAJA_CALLBACK_SECRET;
  if (!callbackBase || !callbackSecret) {
    console.error("[STK PUSH] Missing DARAJA_CALLBACK_BASE_URL or DARAJA_CALLBACK_SECRET");
    return NextResponse.json(
      { error: "Payments are not configured on this environment." },
      { status: 500 }
    );
  }

  const admin = createAdminClient();

  // The top-up request is created FIRST and left 'pending'. It is the
  // client-facing record of intent, and it is what the callback later flips
  // to 'approved' — reusing the same table (and therefore the same console
  // review UI and wallet-crediting semantics) as manual bank/card top-ups,
  // rather than inventing a parallel M-Pesa-only ledger.
  const { data: topupRequest, error: topupError } = await admin
    .from("kyc_wallet_topup_requests")
    .insert({
      organization_id: organizationId,
      amount,
      method: "mpesa",
      contact_reference: maskPhone(phoneNumber),
      requested_by: auth.userId,
    })
    .select("id")
    .single();

  if (topupError || !topupRequest) {
    console.error("[STK PUSH] Failed to create top-up request:", topupError?.message);
    return NextResponse.json({ error: "Could not start the payment." }, { status: 500 });
  }

  // AccountReference is what the customer sees on their M-Pesa statement and
  // what reconciliation keys off, so it's derived from the real request id.
  // Daraja caps this field at 12 characters.
  const accountReference = `XQ-${topupRequest.id.slice(0, 8).toUpperCase()}`;

  const { data: stkRow, error: stkError } = await admin
    .from("mpesa_stk_transactions")
    .insert({
      organization_id: organizationId,
      user_id: auth.userId,
      amount,
      phone_number: phoneNumber,
      status: "PENDING",
      topup_request_id: topupRequest.id,
    })
    .select("id")
    .single();

  if (stkError || !stkRow) {
    console.error("[STK PUSH] Failed to create transaction row:", stkError?.message);
    return NextResponse.json({ error: "Could not start the payment." }, { status: 500 });
  }

  try {
    const response = await stkPush({
      amount,
      phoneNumber,
      accountReference,
      transactionDesc: "Xobriq wallet top-up",
      callbackUrl: `${callbackBase}/api/mpesa/stkpush-callback?secret=${callbackSecret}`,
    });

    await admin
      .from("mpesa_stk_transactions")
      .update({
        merchant_request_id: response.MerchantRequestID,
        checkout_request_id: response.CheckoutRequestID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stkRow.id);

    await logAudit({
      actor_id: auth.userId,
      actor_email: auth.email,
      organization_id: organizationId,
      action: "wallet.topup.stk_initiated",
      resource_type: "mpesa_stk_transaction",
      resource_id: stkRow.id,
      metadata: { amount, phone: maskPhone(phoneNumber), reference: accountReference },
    });

    return NextResponse.json({
      id: stkRow.id,
      topupRequestId: topupRequest.id,
      checkoutRequestId: response.CheckoutRequestID,
      customerMessage: response.CustomerMessage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[STK PUSH FAILED] ${maskPhone(phoneNumber)}: ${message}`);

    await admin
      .from("mpesa_stk_transactions")
      .update({ status: "FAILED", result_desc: message, updated_at: new Date().toISOString() })
      .eq("id", stkRow.id);

    // The intent record is closed out too, so a failed push doesn't leave a
    // 'pending' top-up sitting in the console review queue forever.
    await admin
      .from("kyc_wallet_topup_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", topupRequest.id);

    // Safaricom's raw error text is not shown to the client — it leaks
    // shortcode/config detail and means nothing to an end user.
    return NextResponse.json(
      { error: "Could not reach M-Pesa. Please try again." },
      { status: 502 }
    );
  }
}
