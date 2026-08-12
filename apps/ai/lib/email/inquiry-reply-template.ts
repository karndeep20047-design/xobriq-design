// apps/ai/lib/email/inquiry-reply-template.ts

import { escapeHtml, renderEmailShell, BRAND_PRIMARY } from "./shell";

export type InquiryReplyEmailData = {
  full_name: string;
  original_message: string | null;
  reply_message: string;
};

export function inquiryReplyEmail(data: InquiryReplyEmailData): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml((data.full_name || "there").split(" ")[0] || "there");
  const subject = "Xobriq replied to your message";

  const bodyHtml =
    '<h1 style="font-size:22px;color:#0f172a;margin:12px 0 16px;">Hi ' + firstName + ",</h1>" +
    '<p style="font-size:15px;line-height:1.6;color:#334155;">Someone from the Xobriq team replied to your message:</p>' +
    '<div style="margin:20px 0;padding:16px;border-left:3px solid ' + BRAND_PRIMARY + ';background:#f8fafc;border-radius:4px;">' +
    '<p style="font-size:14px;line-height:1.6;color:#1e293b;white-space:pre-wrap;margin:0;">' + escapeHtml(data.reply_message) + "</p>" +
    "</div>" +
    (data.original_message
      ? '<p style="font-size:12px;line-height:1.6;color:#94a3b8;margin-top:20px;">Your original message: "' +
        escapeHtml(data.original_message.slice(0, 300)) +
        (data.original_message.length > 300 ? "…" : "") +
        '"</p>'
      : "") +
    '<p style="font-size:14px;line-height:1.6;color:#334155;margin-top:28px;">Best,<br>The Xobriq team</p>';

  const footerNote =
    'Reply directly to this email, or reach us at <a href="mailto:info@xobriq.com" style="color:' + BRAND_PRIMARY + ';">info@xobriq.com</a>';

  return { subject, html: renderEmailShell({ title: subject, bodyHtml, footerNote }) };
}
