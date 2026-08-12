"use server";

import { revalidatePath } from "next/cache";
import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { sendProductAccessApprovedEmail } from "@/lib/email/send-product-access-approved";

export async function approveProductAccessAction(requestId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("product_access");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("product_access_requests")
    .select("organization_id, product_slug, requested_by")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) return { ok: false, error: "Request not found" };

  // Default 1-year term — adjustable any time from /console/subscriptions
  // (extend, or set a custom date). NULL was the only option before this
  // column existed, so every pre-existing approved row stays perpetual
  // unless staff explicitly set a validity for it there.
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  await admin
    .from("product_access_requests")
    .update({
      status: "approved",
      reviewed_by: staff.id,
      reviewed_at: new Date().toISOString(),
      valid_until: validUntil,
    })
    .eq("id", requestId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "product_access.approved",
    resource_type: "product_access_request",
    resource_id: requestId,
    metadata: { organization_id: request.organization_id, product_slug: request.product_slug, valid_until: validUntil },
  });

  // This was previously a completely silent approval — the requester had
  // no way to know except by refreshing their dashboard. Never lets a
  // mail failure block the approval itself.
  if (request.requested_by) {
    const { data: requester } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", request.requested_by)
      .maybeSingle();

    if (requester?.email) {
      await sendProductAccessApprovedEmail({
        organization_id: request.organization_id,
        product_slug: request.product_slug,
        email: requester.email,
        full_name: requester.full_name,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });
    }
  }

  revalidatePath("/console/product-access");
  return { ok: true };
}

// Shared by the four production-status transitions below — every one of
// them needs the same "load current status, apply the change, write both
// the DB row and an audit entry recording previous -> new status" shape.
// Kept private so the exported actions each stay a one-purpose call with
// a signature matching exactly what the review UI needs.
async function changeProductionStatus(
  requestId: string,
  newStatus: "approved" | "rejected" | "more_information_required" | "suspended",
  opts: { clientMessage?: string | null; internalNotes?: string | null } = {}
) {
  let ctx;
  try {
    ctx = await requireStaffPermission("product_access");
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("product_access_requests")
    .select("organization_id, product_slug, production_status")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) return { ok: false as const, error: "Request not found" };

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    production_status: newStatus,
    production_reviewed_at: now,
    production_reviewed_by: staff.id,
    production_client_message: opts.clientMessage ?? null,
    production_review_notes: opts.internalNotes ?? null,
  };
  if (newStatus === "suspended") update.production_suspended_at = now;

  const { error } = await admin.from("product_access_requests").update(update).eq("id", requestId);
  if (error) return { ok: false as const, error: error.message };

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: request.organization_id,
    action: `production_access.${newStatus}`,
    resource_type: "product_access_request",
    resource_id: requestId,
    metadata: {
      organization_id: request.organization_id,
      product_slug: request.product_slug,
      previous_status: request.production_status,
      new_status: newStatus,
      client_message: opts.clientMessage ?? null,
    },
  });

  revalidatePath("/console/product-access");
  return { ok: true as const };
}

export async function approveProductionAccessAction(requestId: string) {
  return changeProductionStatus(requestId, "approved");
}

export async function rejectProductionAccessAction(requestId: string, rejectionReason?: string, internalNotes?: string) {
  return changeProductionStatus(requestId, "rejected", { clientMessage: rejectionReason, internalNotes });
}

export async function requestMoreProductionInfoAction(requestId: string, message: string, internalNotes?: string) {
  return changeProductionStatus(requestId, "more_information_required", { clientMessage: message, internalNotes });
}

export async function suspendProductionAccessAction(requestId: string, message?: string, internalNotes?: string) {
  return changeProductionStatus(requestId, "suspended", { clientMessage: message, internalNotes });
}

export async function denyProductAccessAction(requestId: string, notes?: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("product_access");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("product_access_requests")
    .select("organization_id, product_slug")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) return { ok: false, error: "Request not found" };

  await admin
    .from("product_access_requests")
    .update({
      status: "denied",
      reviewed_by: staff.id,
      reviewed_at: new Date().toISOString(),
      notes: notes || null,
    })
    .eq("id", requestId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "product_access.denied",
    resource_type: "product_access_request",
    resource_id: requestId,
    metadata: { organization_id: request.organization_id, product_slug: request.product_slug, notes },
  });

  revalidatePath("/console/product-access");
  return { ok: true };
}
