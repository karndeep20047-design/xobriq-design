import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireKycPermission } from "@/lib/permissions";
import { getWalletBalance, getActiveClientPrice, getKycTrialUntil, isKycTrialActive } from "@/lib/kyc/wallet";
import { PageShell } from "@/components/kyc/page-shell";
import { VerifyClient } from "./VerifyClient";

export const metadata: Metadata = {
  title: "New Verification — XOBRIQ KYC",
  description:
    "Run a real IPRS identity, phone or business (KYB) verification for a Kenyan customer.",
};

// Wallet balance + per-kind pricing fetched here, server-side, and passed
// down — the ported form still submits via a plain client-side fetch to the
// existing /api/v1/kyc/verify-* routes (unchanged, still real HTTP endpoints
// since external API-key callers depend on them too).
export default async function VerifyPage() {
  const { organizationId: orgId } = await requireKycPermission("kyc_verify");
  const admin = createAdminClient();

  const [wallet, identityPrice, phonePrice, businessPrice, trialUntil] = await Promise.all([
    getWalletBalance(admin, orgId),
    getActiveClientPrice(admin, orgId, "identity"),
    getActiveClientPrice(admin, orgId, "phone"),
    getActiveClientPrice(admin, orgId, "business"),
    getKycTrialUntil(admin, orgId),
  ]);

  return (
    <PageShell
      title="New Verification"
      subtitle="Real-time identity, phone and business verification via IPRS"
    >
      <VerifyClient
        walletBalance={wallet.balance}
        pricing={{
          identity: identityPrice?.amount ?? null,
          phone: phonePrice?.amount ?? null,
          business: businessPrice?.amount ?? null,
        }}
        trialActive={isKycTrialActive(trialUntil)}
        trialUntil={trialUntil}
      />
    </PageShell>
  );
}
