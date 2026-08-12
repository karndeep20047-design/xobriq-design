import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";

export type WalletVerificationType = "identity" | "phone" | "business";

export type ClientPrice = { amount: number; currency: string };

export async function getActiveClientPrice(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  verificationType: WalletVerificationType
): Promise<ClientPrice | null> {
  const { data } = await admin
    .from("kyc_client_pricing")
    .select("price_amount, currency")
    .eq("organization_id", organizationId)
    .eq("verification_type", verificationType)
    .is("effective_to", null)
    .maybeSingle();

  if (!data) return null;
  return { amount: Number(data.price_amount), currency: data.currency };
}

export async function getWalletBalance(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<{ balance: number; currency: string }> {
  const { data } = await admin
    .from("kyc_wallets")
    .select("balance, currency")
    .eq("organization_id", organizationId)
    .maybeSingle();

  return { balance: Number(data?.balance ?? 0), currency: data?.currency ?? "KES" };
}

export type WalletCheckResult = { ok: true } | { ok: false; reason: string };

/**
 * organizations.kyc_trial_until — a bounded pilot window a staff member
 * grants explicitly (app/(console)/console/clients's setKycTrialAction),
 * separate from the "no client_pricing row yet" state. A future date means
 * the org can run KYC checks with zero wallet funds until it passes; NULL
 * or a past date means normal wallet-balance rules apply. This is the only
 * way to bypass the "no cash, no check" gate below.
 */
export async function getKycTrialUntil(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<string | null> {
  const { data } = await admin
    .from("organizations")
    .select("kyc_trial_until")
    .eq("id", organizationId)
    .maybeSingle();
  return data?.kyc_trial_until ?? null;
}

export function isKycTrialActive(trialUntil: string | null): boolean {
  return !!trialUntil && new Date(trialUntil).getTime() > Date.now();
}

/**
 * Pre-flight gate — call before attempting a verification, not after. A
 * verification is real money out the door to Creditinfo the moment it's
 * attempted, so an org with a zero/empty wallet is blocked here regardless
 * of whether staff have configured client_pricing for it yet — there is no
 * free/unmetered tier, unless a staff-granted trial window (above) is
 * active. Once pricing exists, the balance must additionally cover that
 * specific price. Note this only gates *whether a check can run at all* —
 * an unpriced, non-trial org that clears this (has any balance) still
 * isn't billed/debited for the check, since recordBillingTransaction in
 * verify-and-record.ts skips billing entirely when there's no
 * kyc_client_pricing row; that's a separate, pre-existing tier this
 * function doesn't change.
 */
export async function checkWalletBalance(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  verificationType: WalletVerificationType
): Promise<WalletCheckResult> {
  const trialUntil = await getKycTrialUntil(admin, organizationId);
  if (isKycTrialActive(trialUntil)) return { ok: true };

  const wallet = await getWalletBalance(admin, organizationId);
  if (wallet.balance <= 0) {
    return {
      ok: false,
      reason: "Your wallet has no funds — top up before running a verification.",
    };
  }

  const price = await getActiveClientPrice(admin, organizationId, verificationType);
  if (price && wallet.balance < price.amount) {
    return {
      ok: false,
      reason: `Insufficient wallet balance — this verification costs ${price.currency} ${price.amount.toFixed(2)}, your balance is ${wallet.currency} ${wallet.balance.toFixed(2)}. Top up to continue.`,
    };
  }
  return { ok: true };
}

/**
 * Debits the wallet for a verification that has already run and been
 * billed. Never throws — same "billing is a side effect, not a
 * precondition for returning a result" philosophy as
 * recordBillingTransaction; the caller wraps this in its own try/catch.
 */
export async function debitWallet(
  admin: ReturnType<typeof createAdminClient>,
  args: { organizationId: string; amount: number; verificationId: string }
): Promise<void> {
  const { error } = await admin.rpc("kyc_wallet_apply_transaction", {
    p_organization_id: args.organizationId,
    p_type: "debit",
    p_amount: args.amount,
    p_verification_id: args.verificationId,
  });
  if (error) {
    console.error("[wallet] failed to debit wallet:", error.message);
  }
}

/** Credits the wallet — used by staff top-up and top-up request approval. */
export async function creditWallet(
  admin: ReturnType<typeof createAdminClient>,
  args: {
    organizationId: string;
    amount: number;
    reference?: string | null;
    note?: string | null;
    createdBy?: string | null;
  }
): Promise<number> {
  const { data, error } = await admin.rpc("kyc_wallet_apply_transaction", {
    p_organization_id: args.organizationId,
    p_type: "topup",
    p_amount: args.amount,
    p_reference: args.reference ?? null,
    p_note: args.note ?? null,
    p_created_by: args.createdBy ?? null,
  });
  if (error) throw new Error(`Failed to credit wallet: ${error.message}`);
  return Number(data);
}
