import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { debitWallet } from "@/lib/kyc/wallet";
import { CreditinfoAdapter } from "@/lib/kyc/providers/creditinfo";
import { CreditinfoTransientError } from "@/lib/kyc/providers/creditinfo/client";
import { CreditinfoResponseFormatError } from "@/lib/kyc/providers/creditinfo/errors";
import type {
  BusinessVerificationInput,
  BusinessVerificationResult,
  IdentityVerificationInput,
  IdentityVerificationResult,
  PhoneVerificationInput,
  PhoneVerificationResult,
  ProviderEnvironment,
} from "@/lib/kyc/providers/provider.interface";

export type VerificationKind = "identity" | "phone" | "business";

type VerifyAndRecordArgs =
  | { kind: "identity"; input: IdentityVerificationInput; lastName?: string }
  | { kind: "phone"; input: PhoneVerificationInput }
  | { kind: "business"; input: BusinessVerificationInput };

export type VerifyAndRecordContext = {
  organizationId: string;
  requestedBy: string | null;
  requestedByEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  // Optional caller-supplied key (single-form submit, a per-row hash in
  // bulk upload, or an external API caller's Idempotency-Key header) —
  // when present, a retried request with the same key returns the
  // original result instead of running a second real Creditinfo call
  // and billing/debiting twice. See kyc_verifications_idempotency_idx.
  idempotencyKey?: string | null;
  // Set only for calls authenticated via a real bearer-token API key
  // (see lib/kyc/api-auth.ts's requireKycClientAccess) — null for
  // session-authenticated calls from the KYC dashboard itself (the /verify
  // form, bulk CSV upload), which never had a key to attribute to. Powers
  // the internal console's per-API-key usage breakdown.
  apiKeyId?: string | null;
  // Which Creditinfo credential set to use — defaults to "sandbox" when
  // omitted, so every session-authenticated caller (dashboard /verify
  // form, bulk CSV upload, Alerts retry) is unaffected by Production
  // support existing at all. Only the bearer-token API-key route handlers
  // pass this explicitly, sourced from the resolved key's own environment.
  environment?: ProviderEnvironment;
};

export type VerificationRecord = {
  id: string;
  ref: string;
  verificationType: VerificationKind;
  status: "completed" | "failed";
  matched: boolean | null;
  result: IdentityVerificationResult | PhoneVerificationResult | BusinessVerificationResult | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  durationMs: number | null;
  // Only meaningful when status is "failed" — true when the failure was
  // Creditinfo being unreachable/overloaded (network error, 5xx/429,
  // EndQuery timeout) rather than a bad request. Callers (bulk upload) use
  // this to decide what's safe to automatically retry.
  retryable?: boolean;
  // Which Creditinfo environment this specific call actually used — the
  // one source of truth the UI should read instead of assuming. See
  // kyc_verifications.environment.
  environment: ProviderEnvironment;
  // Only set for failures with a stable, known cause — currently just
  // CreditinfoResponseFormatError. errorMessage is sanitized to a generic
  // client-safe string whenever this is set; the raw provider error (which
  // may reference internal shape details) still goes to error_message in
  // the DB for engineering diagnosis, never to the caller.
  errorCode?: string;
};

// Excludes ambiguous characters (0/O, 1/I/L) since refs are read aloud/typed
// by support staff.
const REF_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateRef(): string {
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  }
  return `HKY-${suffix}`;
}

function identifierNumberFor(args: VerifyAndRecordArgs): string {
  if (args.kind === "identity") return args.input.identifierNumber;
  if (args.kind === "phone") return args.input.mobileNumber;
  return args.input.registrationNumber;
}

// The full original request, kept verbatim in the otherwise-unused
// check_input jsonb column — the one thing that makes a verification
// re-runnable from just its own row later (e.g. from the Alerts page,
// long after the client/session that submitted it is gone). Identity's
// identifier_type/identifier_number/last_name columns only cover that one
// kind; phone's nationalId in particular has no column of its own at all.
function checkInputFor(args: VerifyAndRecordArgs): Record<string, unknown> {
  if (args.kind === "identity") {
    return {
      identifierType: args.input.identifierType,
      identifierNumber: args.input.identifierNumber,
      lastName: args.lastName || null,
    };
  }
  if (args.kind === "phone") {
    return { nationalId: args.input.nationalId, mobileNumber: args.input.mobileNumber };
  }
  return { registrationNumber: args.input.registrationNumber };
}

const EXISTING_VERIFICATION_COLUMNS =
  "id, ref, verification_type, status, matched, result, error_message, error_code, created_at, completed_at, duration_ms, retryable, environment";

type ExistingVerificationRow = {
  id: string;
  ref: string;
  verification_type: VerificationKind;
  status: "pending" | "completed" | "failed";
  matched: boolean | null;
  result: unknown;
  error_message: string | null;
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  retryable: boolean | null;
  environment: ProviderEnvironment | null;
};

// Only ever called on a row already in a terminal state — a "pending" row
// found via the idempotency-key lookup means an earlier attempt with this
// same key is still mid-flight (or crashed before reaching completed/
// failed), which the caller handles separately rather than fabricating a
// fake result for it.
function toVerificationRecord(row: ExistingVerificationRow): VerificationRecord {
  return {
    id: row.id,
    ref: row.ref,
    verificationType: row.verification_type,
    status: row.status === "failed" ? "failed" : "completed",
    matched: row.matched,
    // A row with error_code set was already sanitized to a generic message
    // by verify-and-record.ts's catch block at the moment it failed — that
    // message, not the raw one, is what got stored. See error_code's own
    // comment for why this can't be re-derived from error_message alone.
    errorMessage: row.error_message,
    result: row.result as VerificationRecord["result"],
    createdAt: row.created_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
    retryable: row.retryable ?? undefined,
    // Historical rows from before this column existed have environment
    // === null — sandbox is the only thing that could have run before
    // Production support existed, so that's the correct backfill-free
    // default rather than leaving it unknown.
    environment: row.environment ?? "sandbox",
    errorCode: row.error_code ?? undefined,
  };
}

/**
 * Consumption-based billing: one kyc_billing_transactions row (client-
 * facing revenue) + one kyc_transaction_costs row (Xobriq-only cost/
 * profit) + a wallet debit for the same amount, per completed verification.
 * Only called from the success path — a failed verification is never
 * billed (see the "Not billed" copy in apps/kyc's verify.tsx). If the org
 * has no active kyc_client_pricing row yet (KYC not "enabled" for them via
 * the console onboarding action), this skips billing (and the wallet
 * debit) entirely rather than failing the verification itself — a missing
 * billing config shouldn't block a client from getting their result. The
 * wallet-balance *check* that actually prevents an unaffordable
 * verification from being attempted lives upstream, in each route handler
 * (lib/kyc/wallet.ts's checkWalletBalance) — by the time this function
 * runs, Creditinfo has already been charged, so the debit here always
 * applies.
 */
async function recordBillingTransaction(
  admin: ReturnType<typeof createAdminClient>,
  args: { organizationId: string; verificationId: string; verificationType: VerificationKind }
): Promise<void> {
  try {
    const [{ data: clientPricing }, { data: providerPricing }] = await Promise.all([
      admin
        .from("kyc_client_pricing")
        .select("price_amount, currency")
        .eq("organization_id", args.organizationId)
        .eq("verification_type", args.verificationType)
        .is("effective_to", null)
        .maybeSingle(),
      admin
        .from("kyc_provider_pricing")
        .select("cost_amount, currency")
        .eq("provider", "creditinfo")
        .eq("verification_type", args.verificationType)
        .is("effective_to", null)
        .maybeSingle(),
    ]);

    if (!clientPricing) return; // org not yet enabled for KYC billing

    const clientPrice = Number(clientPricing.price_amount);
    const providerCost = Number(providerPricing?.cost_amount ?? 0);

    const { data: txn, error: txnError } = await admin
      .from("kyc_billing_transactions")
      .insert({
        organization_id: args.organizationId,
        verification_id: args.verificationId,
        verification_type: args.verificationType,
        client_price: clientPrice,
        currency: clientPricing.currency,
      })
      .select("id")
      .single();

    if (txnError || !txn) {
      console.error("[billing] failed to record transaction:", txnError?.message);
      return;
    }

    await admin.from("kyc_transaction_costs").insert({
      billing_transaction_id: txn.id,
      provider_cost: providerCost,
      client_price: clientPrice,
      profit: clientPrice - providerCost,
      currency: clientPricing.currency,
    });

    await debitWallet(admin, {
      organizationId: args.organizationId,
      amount: clientPrice,
      verificationId: args.verificationId,
    });
  } catch (err) {
    // Billing is a side effect of a successful verification, not a
    // precondition for returning one — never let this throw upstream.
    console.error("[billing] unexpected error:", err instanceof Error ? err.message : err);
  }
}

async function recordProviderAttempt<T>(
  admin: ReturnType<typeof createAdminClient>,
  verificationId: string | null,
  organizationId: string | null,
  requestType: VerificationKind | "health_check",
  fn: () => Promise<T>,
  // healthCheck() never throws — it resolves with { healthy: false } on
  // failure — so "the promise resolved" isn't "success" for that case.
  // Every other verify* call throws on failure, so the default (always
  // true on resolve) is correct for them.
  isSuccess: (result: T) => boolean = () => true
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    await admin.from("kyc_provider_requests").insert({
      verification_id: verificationId,
      organization_id: organizationId,
      provider: "creditinfo",
      request_type: requestType,
      success: isSuccess(result),
      duration_ms: Date.now() - start,
    });
    return result;
  } catch (err) {
    await admin.from("kyc_provider_requests").insert({
      verification_id: verificationId,
      organization_id: organizationId,
      provider: "creditinfo",
      request_type: requestType,
      success: false,
      error_message: err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - start,
    });
    throw err;
  }
}

/**
 * Runs a real Creditinfo verification call and persists the full lifecycle:
 * pending row -> timed provider call (logged to kyc_provider_requests) ->
 * completed/failed row -> audit log entry. This is the only path that
 * should ever call CreditinfoAdapter.verify* outside of healthCheck().
 */
export async function verifyAndRecord(
  args: VerifyAndRecordArgs,
  ctx: VerifyAndRecordContext
): Promise<VerificationRecord> {
  const admin = createAdminClient();
  const idempotencyKey = ctx.idempotencyKey || null;
  const environment: ProviderEnvironment = ctx.environment ?? "sandbox";

  let pending: { id: string; ref: string; created_at: string } | undefined;

  if (idempotencyKey) {
    const { data: existing } = await admin
      .from("kyc_verifications")
      .select(EXISTING_VERIFICATION_COLUMNS)
      .eq("organization_id", ctx.organizationId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      if (existing.status === "pending") {
        throw new Error("A verification with this reference is already in progress.");
      }
      if (existing.status === "completed") {
        return toVerificationRecord(existing as ExistingVerificationRow);
      }
      // status === "failed": the earlier attempt never got a real result
      // from Creditinfo (a thrown error, not a completed-but-rejected
      // verification — those are status "completed" with matched: false).
      // Retrying under the same idempotency key must reuse this row rather
      // than insert a second one (the unique index on
      // (organization_id, idempotency_key) would reject a second insert
      // anyway) — reset it to pending and re-attempt below instead of
      // returning the stale failure forever.
      await admin
        .from("kyc_verifications")
        .update({
          status: "pending",
          error_message: null,
          error_code: null,
          retryable: null,
          matched: null,
          result: null,
          raw_response: null,
          duration_ms: null,
          completed_at: null,
          requested_by: ctx.requestedBy,
          requested_by_email: ctx.requestedByEmail,
          ip_address: ctx.ipAddress,
          user_agent: ctx.userAgent,
          check_input: checkInputFor(args),
          api_key_id: ctx.apiKeyId ?? null,
          environment,
        })
        .eq("id", existing.id);
      pending = { id: existing.id, ref: existing.ref, created_at: existing.created_at };
    }
  }

  if (!pending) {
    const ref = generateRef();
    const { data: inserted, error: insertError } = await admin
      .from("kyc_verifications")
      .insert({
        organization_id: ctx.organizationId,
        requested_by: ctx.requestedBy,
        requested_by_email: ctx.requestedByEmail,
        ref,
        verification_type: args.kind,
        identifier_type: args.kind === "identity" ? args.input.identifierType : null,
        identifier_number: identifierNumberFor(args),
        last_name: args.kind === "identity" ? args.lastName || null : null,
        ip_address: ctx.ipAddress,
        user_agent: ctx.userAgent,
        idempotency_key: idempotencyKey,
        check_input: checkInputFor(args),
        api_key_id: ctx.apiKeyId ?? null,
        environment,
      })
      .select("id, ref, created_at")
      .single();

    if (insertError || !inserted) {
      // A unique-violation on kyc_verifications_idempotency_idx means a
      // concurrent request with the same key won the race — recover by
      // returning its result instead of surfacing a confusing insert error.
      if (idempotencyKey && insertError?.code === "23505") {
        const { data: existing } = await admin
          .from("kyc_verifications")
          .select(EXISTING_VERIFICATION_COLUMNS)
          .eq("organization_id", ctx.organizationId)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        if (existing && existing.status !== "pending") {
          return toVerificationRecord(existing as ExistingVerificationRow);
        }
        throw new Error("A verification with this reference is already in progress.");
      }
      throw new Error(`Failed to create verification record: ${insertError?.message}`);
    }
    pending = inserted;
  }

  const ref = pending.ref;
  const start = Date.now();
  try {
    const result = await recordProviderAttempt(admin, pending.id, ctx.organizationId, args.kind, () => {
      if (args.kind === "identity") return CreditinfoAdapter.verifyIdentity(args.input, environment);
      if (args.kind === "phone") return CreditinfoAdapter.verifyPhone(args.input, environment);
      return CreditinfoAdapter.verifyBusiness(args.input, environment);
    });

    const durationMs = Date.now() - start;
    const completedAt = new Date().toISOString();

    await admin
      .from("kyc_verifications")
      .update({
        status: "completed",
        matched: result.matched,
        result,
        raw_response: result.raw,
        duration_ms: durationMs,
        completed_at: completedAt,
        retryable: null,
      })
      .eq("id", pending.id);

    await logAudit({
      actor_id: ctx.requestedBy,
      actor_email: ctx.requestedByEmail,
      organization_id: ctx.organizationId,
      action: "kyc.verification.completed",
      resource_type: "kyc_verification",
      resource_id: pending.id,
      metadata: { ref, verification_type: args.kind, matched: result.matched },
    });

    await recordBillingTransaction(admin, {
      organizationId: ctx.organizationId,
      verificationId: pending.id,
      verificationType: args.kind,
    });

    return {
      id: pending.id,
      ref,
      verificationType: args.kind,
      status: "completed",
      matched: result.matched,
      result,
      errorMessage: null,
      createdAt: pending.created_at,
      completedAt,
      durationMs,
      environment,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const completedAt = new Date().toISOString();
    const rawMessage = err instanceof Error ? err.message : String(err);
    const retryable = err instanceof CreditinfoTransientError;
    const errorCode = err instanceof CreditinfoResponseFormatError ? err.code : undefined;
    // error_message is read directly (not just via this function's return
    // value) by several client-org-facing pages — Alerts, Verification
    // Detail, Bulk Upload — so the sanitized string, not the raw one, is
    // what has to land in the DB. The raw message (which can reference
    // internal response-shape details) only ever goes to the audit log
    // (staff/ops-only) and the structured console logs already added in
    // client.ts/mapper.ts. Every other error already had a human-safe
    // message by construction (bad auth, wallet balance, validation), so
    // this only narrows what CreditinfoResponseFormatError exposes.
    const errorMessage = errorCode
      ? "Creditinfo returned an unexpected response structure. Our engineering team has been notified."
      : rawMessage;

    await admin
      .from("kyc_verifications")
      .update({
        status: "failed",
        error_message: errorMessage,
        error_code: errorCode ?? null,
        retryable,
        duration_ms: durationMs,
        completed_at: completedAt,
      })
      .eq("id", pending.id);

    await logAudit({
      actor_id: ctx.requestedBy,
      actor_email: ctx.requestedByEmail,
      organization_id: ctx.organizationId,
      action: "kyc.verification.failed",
      resource_type: "kyc_verification",
      resource_id: pending.id,
      metadata: { ref, verification_type: args.kind, error: rawMessage },
    });

    return {
      id: pending.id,
      ref,
      verificationType: args.kind,
      status: "failed",
      matched: null,
      result: null,
      errorMessage,
      createdAt: pending.created_at,
      completedAt,
      durationMs,
      retryable,
      environment,
      errorCode,
    };
  }
}

/**
 * Manual, on-demand provider health check for the ops dashboard. This is a
 * real billable Creditinfo round-trip (see CreditinfoAdapter.healthCheck),
 * not a cheap ping — callers must throttle/gate this themselves (no
 * auto-polling) so it never gets called often enough to pollute usage
 * analytics or run up sandbox costs. Logged with request_type
 * "health_check" so usage queries can filter it out.
 */
export async function runHealthCheck() {
  const admin = createAdminClient();
  return recordProviderAttempt(
    admin,
    null,
    null,
    "health_check",
    () => CreditinfoAdapter.healthCheck(),
    (result) => result.healthy
  );
}
