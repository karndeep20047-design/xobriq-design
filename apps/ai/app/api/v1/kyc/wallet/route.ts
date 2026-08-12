import { NextResponse } from "next/server";
import { requireKycClientAccess } from "@/lib/kyc/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveClientPrice, getWalletBalance } from "@/lib/kyc/wallet";

export async function GET() {
  const auth = await requireKycClientAccess();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const [wallet, identity, phone, business] = await Promise.all([
    getWalletBalance(admin, auth.organizationId),
    getActiveClientPrice(admin, auth.organizationId, "identity"),
    getActiveClientPrice(admin, auth.organizationId, "phone"),
    getActiveClientPrice(admin, auth.organizationId, "business"),
  ]);

  return NextResponse.json({
    balance: wallet.balance,
    currency: wallet.currency,
    pricing: {
      identity: identity?.amount ?? null,
      phone: phone?.amount ?? null,
      business: business?.amount ?? null,
    },
  });
}
