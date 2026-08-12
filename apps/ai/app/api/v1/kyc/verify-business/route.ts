import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireKycClientAccess } from "@/lib/kyc/api-auth";
import { isRateLimited } from "@/lib/kyc/rate-limit";
import { checkWalletBalance } from "@/lib/kyc/wallet";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAndRecord } from "@/lib/kyc/verify-and-record";

export const maxDuration = 30;

const bodySchema = z.object({
  registrationNumber: z.string().trim().min(1).max(60),
});

export async function POST(req: NextRequest) {
  const auth = await requireKycClientAccess("kyc_verify");
  if (!auth.ok) return auth.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const admin = createAdminClient();
  if (await isRateLimited(admin, auth.organizationId)) {
    return NextResponse.json({ error: "Too many verifications — try again in a minute." }, { status: 429 });
  }

  const walletCheck = await checkWalletBalance(admin, auth.organizationId, "business");
  if (!walletCheck.ok) {
    return NextResponse.json({ error: walletCheck.reason }, { status: 402 });
  }

  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
  const userAgent = hdrs.get("user-agent") || null;
  const idempotencyKey = hdrs.get("idempotency-key")?.trim() || null;

  let record;
  try {
    record = await verifyAndRecord(
      { kind: "business", input: parsed.data },
      {
        organizationId: auth.organizationId,
        apiKeyId: auth.apiKeyId,
        environment: auth.environment,
        requestedBy: auth.userId,
        requestedByEmail: auth.email,
        ipAddress,
        userAgent,
        idempotencyKey,
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 409 }
    );
  }

  return NextResponse.json(record);
}
