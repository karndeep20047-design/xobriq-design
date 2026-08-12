// apps/ai/lib/email/send-product-access-approved.ts
import "server-only";
import { sendGraphMail } from "./graph";
import { SENDER_ADDRESS } from "./routing";
import { productAccessApprovedEmail } from "./product-access-approved-template";
import { createAdminClient } from "@/lib/supabase/admin";

export type SendProductAccessApprovedInput = {
  organization_id: string;
  product_slug: string;
  email: string;
  full_name: string | null;
  dashboard_url: string;
};

export async function sendProductAccessApprovedEmail(
  input: SendProductAccessApprovedInput
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { subject, html } = productAccessApprovedEmail({
    full_name: input.full_name,
    product_slug: input.product_slug,
    dashboard_url: input.dashboard_url,
  });

  try {
    await sendGraphMail({ from: SENDER_ADDRESS, to: input.email, subject, html });

    await admin.from("email_events").insert({
      from_address: SENDER_ADDRESS,
      to_address: input.email,
      subject,
      template: "product_access_approved",
      status: "sent",
      provider: "microsoft_graph",
      organization_id: input.organization_id,
      metadata: { product_slug: input.product_slug },
      sent_at: new Date().toISOString(),
    });

    return { ok: true };
  } catch (err) {
    console.error("[product-access-approved] send failed:", err instanceof Error ? err.message : String(err));

    await admin.from("email_events").insert({
      from_address: SENDER_ADDRESS,
      to_address: input.email,
      subject,
      template: "product_access_approved",
      status: "failed",
      provider: "microsoft_graph",
      error: err instanceof Error ? err.message : String(err),
      organization_id: input.organization_id,
      metadata: { product_slug: input.product_slug },
    });

    return { ok: false, error: "Failed to send approval email" };
  }
}
