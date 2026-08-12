import { NextRequest, NextResponse } from "next/server";
import { requireKycClientAccess } from "@/lib/kyc/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stkPushQuery } from "@/lib/daraja";

/**
 * Polled by the top-up UI while the customer is entering their PIN.
 *
 * The authoritative status transition happens in the callback route, not
 * here — this only reads. The one exception is the fallback query below,
 * which exists because Safaricom's callback occasionally never arrives
 * (a tunnel dropped, a transient outage) and a customer who has already
 * paid must not be left staring at a spinner forever.
 */
export async function GET(req: NextRequest) {
  const auth = await requireKycClientAccess();
  if (!auth.ok) return auth.response;

  const checkoutRequestId = req.nextUrl.searchParams.get("checkoutRequestId");
  if (!checkoutRequestId) {
    return NextResponse.json({ error: "Missing checkoutRequestId" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Scoped to the caller's own organization. Without this filter a known
  // CheckoutRequestID would expose another org's payment activity — these
  // ids come back to the browser, so they are not secrets.
  const { data: stkRow } = await admin
    .from("mpesa_stk_transactions")
    .select("id, status, result_desc, mpesa_receipt_number")
    .eq("checkout_request_id", checkoutRequestId)
    .eq("organization_id", auth.organizationId)
    .maybeSingle();

  if (!stkRow) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (stkRow.status !== "PENDING") {
    return NextResponse.json({
      status: stkRow.status,
      resultDesc: stkRow.result_desc,
      mpesaReceiptNumber: stkRow.mpesa_receipt_number,
    });
  }

  // Still pending — ask Safaricom directly in case the callback was lost.
  try {
    const queryRes = await stkPushQuery(checkoutRequestId);

    if (queryRes.ResultCode !== undefined) {
      const resultDesc = queryRes.ResultDesc || "";

      // Safaricom answers HTTP 200 with a non-zero ResultCode while the
      // transaction is still in flight. Treating that as failure would tell
      // a customer their payment failed while their phone is still prompting.
      const isProcessing = /processing/i.test(resultDesc);
      if (isProcessing) {
        return NextResponse.json({
          status: "PENDING",
          resultDesc,
          mpesaReceiptNumber: null,
        });
      }

      // Only FAILED is written back from here. A success is deliberately
      // left for the callback to record: this query response carries no
      // receipt number, and writing SUCCESS without one would close the row
      // to the callback that does have it — and skip crediting the wallet.
      if (String(queryRes.ResultCode) !== "0") {
        await admin
          .from("mpesa_stk_transactions")
          .update({
            status: "FAILED",
            result_code: String(queryRes.ResultCode),
            result_desc: resultDesc,
            updated_at: new Date().toISOString(),
          })
          .eq("id", stkRow.id)
          .eq("status", "PENDING");

        return NextResponse.json({
          status: "FAILED",
          resultDesc,
          mpesaReceiptNumber: null,
        });
      }
    }
  } catch (err) {
    // Safaricom returns 500 for in-flight transactions more often than not.
    // Staying PENDING is the correct outcome — the callback is still coming.
    console.error(`[STK QUERY] ${checkoutRequestId}:`, err instanceof Error ? err.message : err);
  }

  return NextResponse.json({
    status: stkRow.status,
    resultDesc: stkRow.result_desc,
    mpesaReceiptNumber: stkRow.mpesa_receipt_number,
  });
}
