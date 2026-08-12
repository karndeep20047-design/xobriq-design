// apps/ai/lib/email/send-inquiry-mails.ts
import "server-only";
import { sendGraphMail } from "./graph";
import { routeInquiry } from "./routing";
import { internalNotificationEmail, acknowledgmentEmail, type InquiryEmailData } from "./templates";
import { createAdminClient } from "@/lib/supabase/admin";

export type SendInquiryMailsInput = InquiryEmailData & {
  type: string;
  interest?: string | null;
  interested_products?: string[] | null;
};

/**
 * Send both the internal notification and the acknowledgment.
 * Both emails are sent FROM the routed department mailbox (sales@ / hr@ /
 * info@) — confirmed all three can send via Graph app-only auth. This makes
 * the "From" address the customer sees match the team actually handling
 * their inquiry, not just the Reply-To.
 */
export async function sendInquiryMails(input: SendInquiryMailsInput): Promise<void> {
  // The caller (api/inquiries/route.ts, contact/actions.ts, careers/actions.ts)
  // already ran classifyDepartment() — which itself calls routeInquiry() — to
  // decide what `department` to persist on the inquiry row, before this
  // function was ever invoked. It's recomputed here rather than passed in
  // because this function only needs the mailbox *address* to send to, not
  // the stored department value — but since both derive from the same
  // routeInquiry() call with the same inputs, they can't disagree with each
  // other even though they're computed independently.
  const route = routeInquiry({
    type: input.type,
    interest: input.interest || null,
    message: input.message || null,
    interested_products: input.interested_products || null,
  });

  const admin = createAdminClient();

  // Both sends below are try/caught individually and logged to email_events
  // rather than thrown — the inquiry row is already saved by this point, so a
  // Graph API failure here shouldn't be treated as the whole submission
  // failing. Each failure is still recorded (status: "failed") so it's
  // visible/auditable, just not retried automatically.

  // 1. Internal notification — sent FROM and TO the routed team inbox
  // (sales@, info@, or hr@) — an inbox notifying itself, which is normal for
  // an automated system message and keeps the sender identity honest.
  const internal = internalNotificationEmail(input);
  try {
    await sendGraphMail({
      from: route.address,
      to: route.address,
      subject: internal.subject,
      html: internal.html,
      replyTo: input.email,         // hitting Reply goes to the customer
    });

    await admin.from("email_events").insert({
      from_address: route.address,
      to_address: route.address,
      subject: internal.subject,
      template: "inquiry_internal_notification",
      status: "sent",
      provider: "microsoft_graph",
      metadata: { inquiry_id: input.id, mailbox: route.mailbox, routed_to: route.address },
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[email] internal notification failed:", err);
    await admin.from("email_events").insert({
      from_address: route.address,
      to_address: route.address,
      subject: internal.subject,
      template: "inquiry_internal_notification",
      status: "failed",
      provider: "microsoft_graph",
      error: err instanceof Error ? err.message : String(err),
      metadata: { inquiry_id: input.id, mailbox: route.mailbox },
    });
  }

  // 2. Acknowledgment to submitter — sent FROM the routed department mailbox,
  // so the customer sees "From: sales@"/"hr@" rather than always info@, and
  // replies go straight there too. Passing route.mailbox also personalizes
  // which team the copy says will respond.
  const ack = acknowledgmentEmail(input, route.mailbox);
  try {
    await sendGraphMail({
      from: route.address,
      to: input.email,
      subject: ack.subject,
      html: ack.html,
      replyTo: route.address,      // customer replies land in the correct team inbox
    });

    await admin.from("email_events").insert({
      from_address: route.address,
      to_address: input.email,
      subject: ack.subject,
      template: "inquiry_acknowledgment",
      status: "sent",
      provider: "microsoft_graph",
      metadata: { inquiry_id: input.id, routed_to: route.address },
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[email] acknowledgment failed:", err);
    await admin.from("email_events").insert({
      from_address: route.address,
      to_address: input.email,
      subject: ack.subject,
      template: "inquiry_acknowledgment",
      status: "failed",
      provider: "microsoft_graph",
      error: err instanceof Error ? err.message : String(err),
      metadata: { inquiry_id: input.id },
    });
  }
}
