import { requireOrgPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWalletBalance, getActiveClientPrice } from "@/lib/kyc/wallet";
import { TopUpClient } from "./TopUpClient";

export const metadata = { title: "Top Up Wallet — Xobriq" };

export default async function BillingTopUpPage() {
  const { organizationId } = await requireOrgPermission("billing");
  const admin = createAdminClient();

  const [wallet, identityPrice] = await Promise.all([
    getWalletBalance(admin, organizationId),
    getActiveClientPrice(admin, organizationId, "identity"),
  ]);

  return <TopUpClient walletBalance={wallet.balance} identityPrice={identityPrice?.amount ?? null} organizationId={organizationId} />;
}
