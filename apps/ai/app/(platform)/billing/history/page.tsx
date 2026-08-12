import type { Metadata } from "next";
import { requireOrgPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WalletTransaction } from "@/lib/kyc/client-api";
import { HistoryClient } from "./HistoryClient";

export const metadata: Metadata = {
  title: "Transaction History — Xobriq",
  description: "View your wallet top-ups, verification charges and refunds.",
};

export default async function BillingHistoryPage() {
  const { organizationId } = await requireOrgPermission("billing");
  const admin = createAdminClient();

  const { data } = await admin
    .from("kyc_wallet_transactions")
    .select("id, type, amount, balance_after, verification_id, reference, note, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(200);

  return <HistoryClient transactions={(data as WalletTransaction[] | null) || []} />;
}
