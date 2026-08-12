import { NextResponse } from "next/server";
import { requireKycOpsApiAccess } from "@/lib/kyc/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const VERIFICATION_COLUMNS =
  "id, ref, organization_id, verification_type, status, matched, error_message, " +
  "duration_ms, requested_by_email, created_at, completed_at";

const REQUEST_COLUMNS = "id, request_type, success, error_message, duration_ms, created_at";

const BILLING_COLUMNS =
  "id, organization_id, verification_id, verification_type, client_price, currency, created_at";

const COST_COLUMNS = "billing_transaction_id, provider_cost, profit";

const TOPUP_REQUEST_COLUMNS =
  "id, organization_id, amount, currency, method, contact_reference, status, created_at";

export async function GET() {
  const auth = await requireKycOpsApiAccess();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const [{ data: verifications }, { data: providerRequests }, { data: orgs }, { data: billingTxns }, { data: topupRequests }] =
    await Promise.all([
      admin.from("kyc_verifications").select(VERIFICATION_COLUMNS).order("created_at", { ascending: false }).limit(200),
      admin.from("kyc_provider_requests").select(REQUEST_COLUMNS).order("created_at", { ascending: false }).limit(300),
      admin.from("organizations").select("id, name"),
      // Financial data is skipped entirely (not just hidden client-side) for
      // a viewer without kyc_ops_financial — same boundary as the initial
      // page load in console/kyc/page.tsx; this polling route is the other
      // place that data could otherwise leak to.
      auth.canSeeFinancial
        ? admin.from("kyc_billing_transactions").select(BILLING_COLUMNS).order("created_at", { ascending: false }).limit(500)
        : Promise.resolve({ data: [] as any[] }),
      auth.canSeeFinancial
        ? admin.from("kyc_wallet_topup_requests").select(TOPUP_REQUEST_COLUMNS).eq("status", "pending").order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);

  const txnIds = (billingTxns || []).map((t) => t.id);
  const { data: costs } = auth.canSeeFinancial && txnIds.length
    ? await admin.from("kyc_transaction_costs").select(COST_COLUMNS).in("billing_transaction_id", txnIds)
    : { data: [] as { billing_transaction_id: string; provider_cost: number; profit: number }[] };

  const orgNameById = new Map((orgs || []).map((o) => [o.id, o.name as string]));
  const costByTxnId = new Map((costs || []).map((c) => [c.billing_transaction_id, c]));

  const verificationRows = (verifications || []).map((v) => ({
    ...v,
    organizationName: orgNameById.get(v.organization_id) || "Unknown org",
  }));

  const billingRows = (billingTxns || []).map((t) => {
    const cost = costByTxnId.get(t.id);
    return {
      ...t,
      organizationName: orgNameById.get(t.organization_id) || "Unknown org",
      providerCost: cost?.provider_cost ?? null,
      profit: cost?.profit ?? null,
    };
  });

  const topupRequestRows = (topupRequests || []).map((r) => ({
    ...r,
    organizationName: orgNameById.get(r.organization_id) || "Unknown org",
  }));

  return NextResponse.json({
    verifications: verificationRows,
    providerRequests: providerRequests || [],
    billing: billingRows,
    topupRequests: topupRequestRows,
  });
}
