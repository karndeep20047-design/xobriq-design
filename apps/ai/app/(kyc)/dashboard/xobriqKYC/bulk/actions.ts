"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { requireAuth } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkWalletBalance } from "@/lib/kyc/wallet";
import { isRateLimited } from "@/lib/kyc/rate-limit";
import { verifyAndRecord } from "@/lib/kyc/verify-and-record";

export type BulkDocType = "national_id" | "krapinalien_id" | "krapin" | "bank" | "plate" | "dl";

export const BULK_DOC_TYPE_LABELS: Record<BulkDocType, string> = {
  national_id: "National ID",
  krapinalien_id: "Alien ID",
  krapin: "KRA PIN",
  bank: "Bank Account",
  dl: "Driving License",
  plate: "Vehicle Plate",
};

export type BulkRowResult =
  | { ok: true; ref: string; status: "completed" | "failed"; matched: boolean | null; errorMessage: string | null; retryable?: boolean }
  | { ok: false; rateLimited: true; error: string }
  | { ok: false; insufficientBalance: true; error: string }
  | { ok: false; error: string };

// One real Creditinfo identity check per call — mirrors
// app/api/v1/kyc/verify-identity/route.ts's own pre-flight order (rate
// limit, then wallet balance) exactly, so a bulk run can never bypass either
// guard just because it's driven from this page instead of that route.
// Bulk only ever runs identity checks — the CSV format doesn't carry phone/
// business fields, matching what the original mock UI's columns implied.
export async function verifyBulkRowAction(row: {
  docType: BulkDocType;
  docNumber: string;
  lastName: string;
}): Promise<BulkRowResult> {
  const user = await requireAuth("/login?redirectTo=/dashboard/xobriqKYC/bulk");
  if (!user.default_org_id) return { ok: false, error: "No organization on this account." };

  if (!row.docNumber || !row.lastName) {
    return { ok: false, error: "Missing required field." };
  }

  const admin = createAdminClient();

  if (await isRateLimited(admin, user.default_org_id)) {
    return { ok: false, rateLimited: true, error: "Rate limited — waiting for the window to clear." };
  }

  const walletCheck = await checkWalletBalance(admin, user.default_org_id, "identity");
  if (!walletCheck.ok) {
    return { ok: false, insufficientBalance: true, error: walletCheck.reason };
  }

  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
  const userAgent = hdrs.get("user-agent") || null;

  // Derived from the row's own content (not random) — re-uploading the
  // same CSV, or a client-side retry re-submitting the same row, reuses
  // this exact key so the row already processed returns its original
  // result instead of running (and billing for) a second real check.
  // Genuinely different row content always hashes to a different key.
  const idempotencyKey = createHash("sha256")
    .update(`${user.default_org_id}|${row.docType}|${row.docNumber}|${row.lastName}`)
    .digest("hex");

  let record;
  try {
    record = await verifyAndRecord(
      {
        kind: "identity",
        input: { identifierType: row.docType, identifierNumber: row.docNumber },
        lastName: row.lastName,
      },
      {
        organizationId: user.default_org_id,
        requestedBy: user.id,
        requestedByEmail: user.email,
        ipAddress,
        userAgent,
        idempotencyKey,
      },
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Verification failed" };
  }

  return {
    ok: true,
    ref: record.ref,
    status: record.status,
    matched: record.matched,
    errorMessage: record.errorMessage,
    retryable: record.retryable,
  };
}
