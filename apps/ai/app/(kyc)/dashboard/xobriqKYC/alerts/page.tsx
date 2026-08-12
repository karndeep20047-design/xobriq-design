import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireKycPermission } from "@/lib/permissions";
import { AlertsClient, type AlertRow } from "./AlertsClient";

export const metadata: Metadata = {
  title: "Alerts — XOBRIQ KYC",
  description: "Verifications that failed or did not match, for your organization.",
};

const COLUMNS = "id, ref, identifier_type, last_name, verification_type, status, matched, error_message, retryable, created_at";

// There is no fraud-scoring/watchlist engine anywhere in this codebase — the
// real, honest substitute for "alerts" is the org's own verifications that
// came back failed or not-matched. No severity/channel/investigation
// workflow is invented; those fields don't exist for real anywhere.
export default async function AlertsPage() {
  const { organizationId: orgId } = await requireKycPermission("kyc_alerts");

  const admin = createAdminClient();
  const { data } = await admin
    .from("kyc_verifications")
    .select(COLUMNS)
    .eq("organization_id", orgId)
    .or("status.eq.failed,matched.eq.false")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows: AlertRow[] = (data || []).map((v) => ({
    id: v.id,
    ref: v.ref,
    identifierType: v.identifier_type,
    lastName: v.last_name,
    verificationType: v.verification_type,
    status: v.status,
    matched: v.matched,
    errorMessage: v.error_message,
    retryable: v.retryable,
    createdAt: v.created_at,
  }));

  return <AlertsClient initialAlerts={rows} />;
}
