// apps/ai/lib/email/send-subscription-renewal.ts
import "server-only";
import { sendGraphMail } from "./graph";
import { SENDER_ADDRESS } from "./routing";
import { subscriptionRenewalEmail } from "./subscription-renewal-template";
import { createAdminClient } from "@/lib/supabase/admin";

export type SendSubscriptionRenewalInput = {
  organization_id: string;
  product_slug: string;
  email: string;
  full_name: string | null;
  days_remaining: number;
  billing_url: string;
};

export async function sendSubscriptionRenewalEmail(
  input: SendSubscriptionRenewalInput
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { subject, html } = subscriptionRenewalEmail({
    full_name: input.full_name,
    product_slug: input.product_slug,
    days_remaining: input.days_remaining,
    billing_url: input.billing_url,
  });

  try {
    await sendGraphMail({ from: SENDER_ADDRESS, to: input.email, subject, html });

    await admin.from("email_events").insert({
      from_address: SENDER_ADDRESS,
      to_address: input.email,
      subject,
      template: "subscription_renewal",
      status: "sent",
      provider: "microsoft_graph",
      organization_id: input.organization_id,
      metadata: { product_slug: input.product_slug, days_remaining: input.days_remaining },
      sent_at: new Date().toISOString(),
    });

    return { ok: true };
  } catch (err) {
    console.error("[subscription-renewal] send failed:", err instanceof Error ? err.message : String(err));

    await admin.from("email_events").insert({
      from_address: SENDER_ADDRESS,
      to_address: input.email,
      subject,
      template: "subscription_renewal",
      status: "failed",
      provider: "microsoft_graph",
      error: err instanceof Error ? err.message : String(err),
      organization_id: input.organization_id,
      metadata: { product_slug: input.product_slug, days_remaining: input.days_remaining },
    });

    return { ok: false, error: "Failed to send renewal reminder" };
  }
}
