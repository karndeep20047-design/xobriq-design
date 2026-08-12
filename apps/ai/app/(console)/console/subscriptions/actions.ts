"use server";

import { revalidatePath } from "next/cache";
import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { sendSubscriptionRenewalEmail } from "@/lib/email/send-subscription-renewal";

export async function renewSubscriptionAction(requestId: string, validUntil: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("subscriptions");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: before } = await admin
    .from("product_access_requests")
    .select("organization_id, product_slug, valid_until")
    .eq("id", requestId)
    .maybeSingle();
  if (!before) return { ok: false, error: "Not found" };

  const { error } = await admin
    .from("product_access_requests")
    .update({ valid_until: validUntil })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: before.organization_id,
    action: "product_access.renewed",
    resource_type: "product_access_request",
    resource_id: requestId,
    metadata: { product_slug: before.product_slug, from: before.valid_until, to: validUntil },
  });

  revalidatePath("/console/subscriptions");
  return { ok: true, validUntil };
}

// No cron exists in this repo, so "30-day alert" is a staff-triggered
// batch send rather than an automatic daily job — a real automatic
// version is a v2 item once a scheduling mechanism exists. Checks every
// approved product currently 0-30 days from expiry and emails whoever
// originally requested it.
export async function sendRenewalRemindersAction() {
  let ctx;
  try {
    ctx = await requireStaffPermission("subscriptions");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const now = new Date();
  const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: expiring } = await admin
    .from("product_access_requests")
    .select("id, organization_id, product_slug, valid_until, requested_by")
    .eq("status", "approved")
    .not("valid_until", "is", null)
    .gte("valid_until", now.toISOString())
    .lte("valid_until", in30d);

  let sent = 0;
  for (const req of expiring || []) {
    if (!req.requested_by || !req.valid_until) continue;

    const { data: requester } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", req.requested_by)
      .maybeSingle();
    if (!requester?.email) continue;

    const daysRemaining = Math.max(
      1,
      Math.ceil((new Date(req.valid_until).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    );

    const result = await sendSubscriptionRenewalEmail({
      organization_id: req.organization_id,
      product_slug: req.product_slug,
      email: requester.email,
      full_name: requester.full_name,
      days_remaining: daysRemaining,
      billing_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });
    if (result.ok) sent++;
  }

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "subscriptions.renewal_reminders_sent",
    resource_type: "product_access_request",
    metadata: { sent, checked: (expiring || []).length },
  });

  revalidatePath("/console/subscriptions");
  return { ok: true, sent, checked: (expiring || []).length };
}
