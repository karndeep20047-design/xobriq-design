"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrgPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const topupSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  method: z.enum(["mpesa", "bank", "card"]),
  contactReference: z.string().trim().max(120).optional(),
});

// Moved from app/(kyc)/dashboard/xobriqKYC/actions.ts along with the rest of
// billing — the wallet is the org's billing regardless of which product's
// usage it's paying for. Requests a real wallet top-up; a staff member
// approves/denies it at /console/clients (approveTopupRequestAction /
// rejectTopupRequestAction), same as before.
export async function submitTopupRequestAction(input: {
  amount: number;
  method: "mpesa" | "bank" | "card";
  contactReference?: string;
}) {
  let ctx;
  try {
    ctx = await requireOrgPermission("billing");
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = topupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid top-up request." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("kyc_wallet_topup_requests")
    .insert({
      organization_id: ctx.organizationId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      contact_reference: parsed.data.contactReference || null,
      requested_by: ctx.userId,
    })
    .select("id, status, created_at")
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message || "Failed to submit request" };
  }

  revalidatePath("/billing");
  revalidatePath("/billing/history");
  return { ok: true as const, request: data };
}
