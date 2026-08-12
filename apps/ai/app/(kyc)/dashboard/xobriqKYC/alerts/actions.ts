"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkWalletBalance } from "@/lib/kyc/wallet";
import { isRateLimited } from "@/lib/kyc/rate-limit";
import { verifyAndRecord, type VerificationKind } from "@/lib/kyc/verify-and-record";

export type RetryResult =
  | { ok: true; status: "completed" | "failed"; matched: boolean | null; retryable?: boolean }
  | { ok: false; rateLimited: true; error: string }
  | { ok: false; insufficientBalance: true; error: string }
  | { ok: false; error: string };

// Re-runs one already-failed verification from its own stored row — the
// same shape as a bulk-upload retry, just for a single verification that
// was left unretried (e.g. the client closed the tab before clicking Retry
// on the live result page). check_input carries everything needed to
// rebuild the original request regardless of verification_type; the row's
// own idempotency_key is what makes verifyAndRecord() reset this exact row
// instead of billing/creating a second one.
export async function retryVerificationAction(verificationId: string): Promise<RetryResult> {
  const user = await requireAuth("/login?redirectTo=/dashboard/xobriqKYC/alerts");
  if (!user.default_org_id) return { ok: false, error: "No organization on this account." };

  const admin = createAdminClient();

  const { data: verification } = await admin
    .from("kyc_verifications")
    .select("id, verification_type, status, retryable, idempotency_key, check_input")
    .eq("id", verificationId)
    .eq("organization_id", user.default_org_id)
    .maybeSingle();

  if (!verification) return { ok: false, error: "Verification not found." };
  if (verification.status !== "failed") {
    return { ok: false, error: "Only failed verifications can be retried." };
  }
  if (!verification.idempotency_key || !verification.check_input) {
    return { ok: false, error: "This verification predates retry support and can't be retried automatically." };
  }

  if (await isRateLimited(admin, user.default_org_id)) {
    return { ok: false, rateLimited: true, error: "Rate limited — waiting for the window to clear." };
  }

  const walletCheck = await checkWalletBalance(
    admin,
    user.default_org_id,
    verification.verification_type as VerificationKind
  );
  if (!walletCheck.ok) {
    return { ok: false, insufficientBalance: true, error: walletCheck.reason };
  }

  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
  const userAgent = hdrs.get("user-agent") || null;
  const input = verification.check_input as Record<string, unknown>;

  let record;
  try {
    if (verification.verification_type === "identity") {
      record = await verifyAndRecord(
        {
          kind: "identity",
          input: {
            identifierType: input.identifierType as any,
            identifierNumber: input.identifierNumber as string,
          },
          lastName: (input.lastName as string) || undefined,
        },
        {
          organizationId: user.default_org_id,
          requestedBy: user.id,
          requestedByEmail: user.email,
          ipAddress,
          userAgent,
          idempotencyKey: verification.idempotency_key,
        }
      );
    } else if (verification.verification_type === "phone") {
      record = await verifyAndRecord(
        {
          kind: "phone",
          input: {
            nationalId: input.nationalId as string,
            mobileNumber: input.mobileNumber as string,
          },
        },
        {
          organizationId: user.default_org_id,
          requestedBy: user.id,
          requestedByEmail: user.email,
          ipAddress,
          userAgent,
          idempotencyKey: verification.idempotency_key,
        }
      );
    } else {
      record = await verifyAndRecord(
        {
          kind: "business",
          input: { registrationNumber: input.registrationNumber as string },
        },
        {
          organizationId: user.default_org_id,
          requestedBy: user.id,
          requestedByEmail: user.email,
          ipAddress,
          userAgent,
          idempotencyKey: verification.idempotency_key,
        }
      );
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Retry failed" };
  }

  revalidatePath("/dashboard/xobriqKYC/alerts");
  revalidatePath("/dashboard/xobriqKYC/verifications");

  return { ok: true, status: record.status, matched: record.matched, retryable: record.retryable };
}
