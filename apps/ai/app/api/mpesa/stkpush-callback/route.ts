import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { creditWallet } from "@/lib/kyc/wallet";
import { logAudit } from "@/lib/audit";

/**
 * Safaricom's result callback for STK Push. This is the ONLY path that turns
 * a customer's PIN entry into actual wallet balance.
 *
 * Two rules govern everything here:
 *
 * 1. Always answer 200 with ResultCode 0, even for junk we reject. Safaricom
 *    retries anything else on a schedule we don't control, and a retry storm
 *    against a request we've already refused helps nobody. Rejection is
 *    logged, not signalled.
 * 2. Credit the wallet exactly once. The idempotency guard below is the only
 *    thing standing between a duplicate delivery and free money.
 */

// Safaricom sends the receipt inside a loosely-typed Item array rather than
// named fields, so this has to be dug out positionally by name.
type CallbackItem = { Name?: string; Value?: string | number };

function findItem(items: CallbackItem[] | undefined, name: string): string | null {
  const hit = items?.find((i) => i.Name === name);
  return hit?.Value != null ? String(hit.Value) : null;
}

function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, so that's checked separately —
  // length is not itself a secret.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.DARAJA_CALLBACK_SECRET;
  if (!expectedSecret) {
    console.error("[STK CALLBACK] DARAJA_CALLBACK_SECRET is not set — rejecting all callbacks");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!secretMatches(req.nextUrl.searchParams.get("secret"), expectedSecret)) {
    console.warn("[STK CALLBACK] Rejected: invalid or missing secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const callback = body?.Body?.stkCallback;
  if (!callback?.CheckoutRequestID) {
    console.warn("[STK CALLBACK] Rejected: unrecognised payload shape");
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;
  const admin = createAdminClient();

  const { data: stkRow } = await admin
    .from("mpesa_stk_transactions")
    .select("id, organization_id, amount, status, topup_request_id")
    .eq("checkout_request_id", CheckoutRequestID)
    .maybeSingle();

  if (!stkRow) {
    console.warn(`[STK CALLBACK] Unknown CheckoutRequestID: ${CheckoutRequestID}`);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // Idempotency. Safaricom re-delivers, and a second delivery of a SUCCESS
  // must not credit the wallet twice. Once a row is terminal it is frozen.
  if (stkRow.status !== "PENDING") {
    console.log(`[STK CALLBACK] Ignoring ${CheckoutRequestID} — already ${stkRow.status}`);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Already processed" });
  }

  // ResultCode arrives as a number in production and occasionally as a
  // string in sandbox; compare loosely on purpose.
  const isSuccess = String(ResultCode) === "0";
  const items: CallbackItem[] | undefined = CallbackMetadata?.Item;
  const mpesaReceiptNumber = isSuccess ? findItem(items, "MpesaReceiptNumber") : null;

  // Trust Safaricom's confirmed figure over our own requested amount — they
  // are authoritative on what the customer actually paid, and a partial or
  // adjusted payment must not credit the full requested value.
  const paidAmountRaw = isSuccess ? findItem(items, "Amount") : null;
  const creditedAmount = Number(paidAmountRaw ?? stkRow.amount);

  // Claim the row before doing anything with money. The status guard in the
  // WHERE clause means two concurrent deliveries race here, and only the one
  // that actually flips PENDING gets a row back — the loser credits nothing.
  const { data: claimed } = await admin
    .from("mpesa_stk_transactions")
    .update({
      status: isSuccess ? "SUCCESS" : "FAILED",
      result_code: String(ResultCode),
      result_desc: ResultDesc ?? null,
      mpesa_receipt_number: mpesaReceiptNumber,
      raw_callback: body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stkRow.id)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();

  if (!claimed) {
    console.log(`[STK CALLBACK] Lost race for ${CheckoutRequestID} — another delivery won`);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Already processed" });
  }

  if (!isSuccess) {
    if (stkRow.topup_request_id) {
      await admin
        .from("kyc_wallet_topup_requests")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", stkRow.topup_request_id);
    }
    console.log(`[STK CALLBACK] ${CheckoutRequestID} failed: ${ResultDesc}`);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // Money confirmed received. Unlike bank/card top-ups there is nothing for
  // staff to reconcile by hand — Safaricom has already told us the cash
  // landed, so this credits immediately and marks the request approved.
  try {
    const newBalance = await creditWallet(admin, {
      organizationId: stkRow.organization_id,
      amount: creditedAmount,
      reference: mpesaReceiptNumber,
      note: "M-Pesa STK Push top-up",
      createdBy: null,
    });

    if (stkRow.topup_request_id) {
      await admin
        .from("kyc_wallet_topup_requests")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", stkRow.topup_request_id);
    }

    await logAudit({
      organization_id: stkRow.organization_id,
      action: "wallet.topup.stk_completed",
      resource_type: "mpesa_stk_transaction",
      resource_id: stkRow.id,
      metadata: {
        amount: creditedAmount,
        receipt: mpesaReceiptNumber,
        balance_after: newBalance,
      },
    });
  } catch (err) {
    // The row is already SUCCESS and cannot be replayed by a retry, so a
    // failure here means real money arrived that the wallet does not yet
    // reflect. That needs a human, loudly — but Safaricom still gets its 200,
    // since retrying would not fix a failure on our side of the line.
    console.error(
      `[STK CALLBACK] PAID BUT NOT CREDITED — org=${stkRow.organization_id} ` +
        `receipt=${mpesaReceiptNumber} amount=${creditedAmount}:`,
      err instanceof Error ? err.message : err
    );
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
