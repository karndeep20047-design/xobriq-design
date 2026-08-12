// apps/ai/lib/email/send-inquiry-reply.ts
import "server-only";
import { sendGraphMail } from "./graph";
import { SENDER_ADDRESS } from "./routing";
import { inquiryReplyEmail } from "./inquiry-reply-template";
import { createAdminClient } from "@/lib/supabase/admin";

export type SendInquiryReplyInput = {
  inquiry_id: string;
  email: string;
  full_name: string;
  original_message: string | null;
  reply_message: string;
};

// Same shape as every other transactional send in this codebase
// (lib/email/send-password-reset.ts etc.) — never throws, always logs to
// email_events either way, so a Graph outage doesn't lose the reply itself
// (it's already persisted in inquiry_replies by the caller before this runs).
export async function sendInquiryReplyEmail(
  input: SendInquiryReplyInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { subject, html } = inquiryReplyEmail({
    full_name: input.full_name,
    original_message: input.original_message,
    reply_message: input.reply_message,
  });

  try {
    await sendGraphMail({
      from: SENDER_ADDRESS,
      to: input.email,
      subject,
      html,
    });

    await admin.from("email_events").insert({
      from_address: SENDER_ADDRESS,
      to_address: input.email,
      subject,
      template: "inquiry_reply",
      status: "sent",
      provider: "microsoft_graph",
      metadata: { inquiry_id: input.inquiry_id },
      sent_at: new Date().toISOString(),
    });

    return { ok: true };
  } catch (err) {
    console.error("[inquiry-reply] send failed:", err);

    await admin.from("email_events").insert({
      from_address: SENDER_ADDRESS,
      to_address: input.email,
      subject,
      template: "inquiry_reply",
      status: "failed",
      provider: "microsoft_graph",
      error: err instanceof Error ? err.message : String(err),
      metadata: { inquiry_id: input.inquiry_id },
    });

    return { ok: false, error: "Failed to send reply email" };
  }
}
