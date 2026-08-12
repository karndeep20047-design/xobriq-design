"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { PRODUCT_SLUGS, type ProductSlug } from "@/lib/product-access";

// Only statuses a client is allowed to request FROM. "pending",
// "approved", and "suspended" must go through staff review to change —
// resubmitting from those states is exactly the workflow bypass this
// action exists to prevent.
const REQUESTABLE_FROM = new Set(["not_requested", "rejected", "more_information_required"]);

export async function requestProductionAccessAction(
  productSlug: ProductSlug
): Promise<{ ok: boolean; error?: string }> {
  if (!PRODUCT_SLUGS.includes(productSlug)) {
    return { ok: false, error: "Unknown product" };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!user.default_org_id) return { ok: false, error: "Set up your organization first." };

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("product_access_requests")
    .select("id, production_status")
    .eq("organization_id", user.default_org_id)
    .eq("product_slug", productSlug)
    .maybeSingle();

  if (existing && !REQUESTABLE_FROM.has(existing.production_status)) {
    return { ok: false, error: "A production access request is already in progress or already approved." };
  }

  if (existing) {
    const { error } = await admin
      .from("product_access_requests")
      .update({
        production_status: "pending",
        production_requested_at: now,
        production_requested_by: user.id,
        // Clear the previous reviewer message/notes — they applied to the
        // request that's now being superseded, not this new one.
        production_client_message: null,
        production_review_notes: null,
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: "Failed to submit request. Please try again." };
  } else {
    // No product_access_requests row exists yet for this org+product at
    // all (general/sandbox-tier access was never requested either) —
    // insert one. "status" (the pre-existing sandbox-tier column) defaults
    // to "pending" here rather than being left unset, matching what a
    // fresh row from requestProductAccessAction would also produce.
    const { error } = await admin.from("product_access_requests").insert({
      organization_id: user.default_org_id,
      product_slug: productSlug,
      status: "pending",
      requested_by: user.id,
      requested_at: now,
      production_status: "pending",
      production_requested_at: now,
      production_requested_by: user.id,
    });
    if (error) return { ok: false, error: "Failed to submit request. Please try again." };
  }

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: user.default_org_id,
    action: "production_access.requested",
    resource_type: "product_access_request",
    metadata: { product_slug: productSlug },
  });

  revalidatePath(`/developer/${productSlug}/production`);
  return { ok: true };
}
