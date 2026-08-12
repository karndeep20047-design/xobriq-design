import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireKycPermission } from "@/lib/permissions";
import { PageShell } from "@/components/kyc/page-shell";
import type { VerificationListItem } from "@/lib/kyc/client-api";
import { VerificationsListClient } from "./VerificationsListClient";

export const metadata: Metadata = {
  title: "Verifications — XOBRIQ KYC",
  description:
    "Search, filter and review real IPRS KYC verifications processed through XOBRIQ KYC.",
};

const LIST_COLUMNS =
  "id, ref, verification_type, provider, status, identifier_type, identifier_number, " +
  "last_name, matched, result, error_message, duration_ms, requested_by_email, " +
  "created_at, completed_at";

// Queries kyc_verifications directly (same columns/limit as
// app/api/v1/kyc/verifications/route.ts) instead of round-tripping through
// that route from our own server — filtering/search stays client-side in
// VerificationsListClient, matching the original UI exactly.
export default async function VerificationsPage() {
  const { organizationId: orgId } = await requireKycPermission("kyc_verifications");
  const admin = createAdminClient();

  const { data } = await admin
    .from("kyc_verifications")
    .select(LIST_COLUMNS)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <PageShell
      title="Verifications"
      subtitle="All real IPRS KYC checks processed through XOBRIQ KYC"
    >
      <VerificationsListClient verifications={(data as VerificationListItem[] | null) || []} />
    </PageShell>
  );
}
