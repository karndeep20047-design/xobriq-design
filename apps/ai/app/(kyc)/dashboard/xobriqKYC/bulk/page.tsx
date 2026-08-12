import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireKycPermission } from "@/lib/permissions";
import { getWalletBalance, getActiveClientPrice, getKycTrialUntil, isKycTrialActive } from "@/lib/kyc/wallet";
import { BulkUploadClient } from "./BulkUploadClient";

export const metadata: Metadata = {
  title: "Bulk CSV Upload · XOBRIQ KYC",
  description:
    "Upload a CSV of Kenyan IDs to run real bulk KYC identity verifications against IPRS.",
};

// Creditinfo's poll cycle can take up to ~20s per row (see verify-identity's
// own maxDuration) — each row here is one full round trip through the same
// verifyAndRecord path, driven one at a time from the client, so this page
// needs the same allowance.
export const maxDuration = 30;

export default async function BulkUploadPage() {
  const { organizationId: orgId } = await requireKycPermission("kyc_bulk");
  const admin = createAdminClient();

  const [wallet, identityPrice, trialUntil] = await Promise.all([
    getWalletBalance(admin, orgId),
    getActiveClientPrice(admin, orgId, "identity"),
    getKycTrialUntil(admin, orgId),
  ]);

  return (
    <BulkUploadClient
      walletBalance={wallet.balance}
      identityPrice={identityPrice?.amount ?? null}
      trialActive={isKycTrialActive(trialUntil)}
      trialUntil={trialUntil}
    />
  );
}
