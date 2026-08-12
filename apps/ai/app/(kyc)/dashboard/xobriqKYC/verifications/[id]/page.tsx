import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireKycPermission } from "@/lib/permissions";
import type { VerificationDetail } from "@/lib/kyc/client-api";
import { VerificationDetailClient } from "./VerificationDetailClient";

export const metadata: Metadata = {
  title: "Verification — XOBRIQ KYC",
};

const DETAIL_COLUMNS =
  "id, ref, organization_id, verification_type, provider, status, identifier_type, " +
  "identifier_number, last_name, matched, result, raw_response, error_message, " +
  "duration_ms, requested_by_email, ip_address, user_agent, created_at, completed_at";

// `id` is matched against either the internal uuid or the display ref
// (HKY-XXXXXXXX) — the dashboard always links by ref. Same lookup as
// app/api/v1/kyc/verifications/[id]/route.ts, queried directly here instead
// of round-tripping through that route from our own server.
export default async function VerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId: orgId } = await requireKycPermission("kyc_verifications");
  const admin = createAdminClient();

  const column = /^[0-9a-f-]{36}$/i.test(id) ? "id" : "ref";
  const { data } = await admin
    .from("kyc_verifications")
    .select(DETAIL_COLUMNS)
    .eq(column, id)
    .maybeSingle();

  const verification =
    data && data.organization_id === orgId ? (data as VerificationDetail) : null;

  return <VerificationDetailClient verification={verification} />;
}
