// apps/ai/lib/email/templates.ts
// HTML templates for inquiry notification + acknowledgment emails.

import { escapeHtml, escapeHtmlMultiline, BRAND_PRIMARY, renderEmailShell } from "./shell";
import type { MailboxRoute } from "./routing";

// Shared by both templates — the structured product/interest selection
// (from a dropdown or the pricing page's picker), separate from whatever
// free-text the customer typed into the message field.
function productLine(data: { interest?: string | null; interested_products?: string[] | null }): string {
  return data.interested_products && data.interested_products.length
    ? data.interested_products.join(", ")
    : data.interest || "";
}

// The customer's requested demo slot, if they picked one — only present on
// demo_request inquiries where the contact form's date/time fields were filled in.
function preferredWhenLine(data: { preferred_date?: string | null; preferred_time?: string | null }): string {
  return [data.preferred_date, data.preferred_time].filter(Boolean).join(" at ");
}

function line(label: string, value?: string | null): string {
  if (!value) return "";
  return (
    '<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;vertical-align:top;white-space:nowrap;">' +
    escapeHtml(label) +
    '</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">' +
    escapeHtml(value) +
    "</td></tr>"
  );
}

export type InquiryEmailData = {
  id: string;
  type: string;
  source_site: string;
  source_page?: string | null;
  full_name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  industry?: string | null;
  message?: string | null;
  interest?: string | null;
  interested_products?: string[] | null;
  budget_range?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  urgency?: string | null;
  ip_address?: string | null;
  consoleUrl: string; // https://xobriq-ai-psi.vercel.app/console/inquiries/{id}
};

// Internal staff notification keeps its own gradient header (a distinct
// visual "tone" for staff-facing mail) rather than the customer-facing shell.
export function internalNotificationEmail(data: InquiryEmailData): {
  subject: string;
  html: string;
} {
  const typeLabel = data.type.replace(/_/g, " ").toUpperCase();
  const interestSummary = productLine(data);
  const preferredWhen = preferredWhenLine(data);

  const subject =
    "[Xobriq " +
    data.source_site +
    "] " +
    typeLabel +
    " — " +
    data.full_name +
    (data.company ? " (" + data.company + ")" : "");

  const html =
    '<!doctype html><html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;background:#f8fafc;">' +
    '<div style="max-width:640px;margin:0 auto;padding:24px;">' +
    '<div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">' +

    // Header
    '<div style="background:linear-gradient(135deg,' + BRAND_PRIMARY + ' 0%,#5b8dff 100%);color:#ffffff;padding:20px 24px;">' +
    '<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:0.85;">New ' + escapeHtml(typeLabel) + '</div>' +
    '<div style="font-size:22px;font-weight:700;margin-top:4px;">' + escapeHtml(data.full_name) + '</div>' +
    (data.company ? '<div style="font-size:14px;opacity:0.85;margin-top:2px;">' + escapeHtml(data.company) + '</div>' : "") +
    '</div>' +

    // Details
    '<div style="padding:24px;">' +
    '<table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">' +
    line("Email", data.email) +
    line("Phone", data.phone || undefined) +
    line("Industry", data.industry || undefined) +
    line("Interest", interestSummary || undefined) +
    line("Preferred Demo Time", preferredWhen || undefined) +
    line("Budget", data.budget_range || undefined) +
    line("Urgency", data.urgency && data.urgency !== "normal" ? data.urgency.toUpperCase() : undefined) +
    line("Source", data.source_site + (data.source_page ? " · " + data.source_page : "")) +
    line("IP", data.ip_address || undefined) +
    "</table>" +

    (data.message
      ? '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">' +
        '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Message</div>' +
        '<div style="font-size:14px;color:#0f172a;line-height:1.6;">' + escapeHtmlMultiline(data.message) + "</div>" +
        "</div>"
      : "") +

    // Actions
    '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">' +
    '<a href="' + data.consoleUrl + '" style="display:inline-block;background:' + BRAND_PRIMARY + ';color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Open in Console →</a>' +
    '  <a href="mailto:' + data.email + '?subject=Re:%20Your%20inquiry%20to%20Xobriq" style="display:inline-block;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;color:' + BRAND_PRIMARY + ';">Reply to ' + escapeHtml(data.full_name.split(" ")[0]) + '</a>' +
    "</div>" +
    "</div>" +

    // Footer
    '<div style="padding:14px 24px;background:#f1f5f9;font-size:11px;color:#64748b;text-align:center;">Inquiry ID: ' + data.id + ' · Reply to this email — it will go directly to the customer.</div>' +
    "</div>" +
    "</div></body></html>";

  return { subject, html };
}

// Which team the acknowledgment says will respond — kept in sync with
// routeInquiry()'s mailbox decision so the customer-facing copy matches
// where their message actually went, not a one-size-fits-all line.
const FOLLOW_UP_LINE: Record<MailboxRoute, string> = {
  sales: "Our sales team will be in touch within one business day.",
  hr: "Our People &amp; Culture team will review your message and follow up if there's a fit.",
  info: "A member of our team will get back to you within one business day.",
  partnerships: "Our partnerships team will review your application and follow up if there's a fit.",
};

export function acknowledgmentEmail(
  data: InquiryEmailData,
  mailbox: MailboxRoute = "info"
): {
  subject: string;
  html: string;
} {
  const firstName = data.full_name.split(" ")[0] || "there";
  const subject = "Thanks for reaching out to Xobriq";
  const interestSummary = productLine(data);
  const preferredWhen = preferredWhenLine(data);

  const bodyHtml =
    '<h1 style="font-size:22px;color:#0f172a;margin:12px 0 16px;">Hi ' + escapeHtml(firstName) + ",</h1>" +
    '<p style="font-size:15px;line-height:1.6;color:#334155;">Thanks for reaching out. We\'ve received your inquiry. ' + FOLLOW_UP_LINE[mailbox] + '</p>' +
    '<p style="font-size:15px;line-height:1.6;color:#334155;margin-top:14px;">Here\'s a quick summary of what you sent:</p>' +
    '<div style="margin-top:14px;padding:16px;background:#f8fafc;border-left:3px solid ' + BRAND_PRIMARY + ';border-radius:6px;font-size:14px;color:#0f172a;">' +
    // Shows the structured product/interest selection (if any) separately
    // from the free-text message — previously this block only ever echoed
    // data.message, so picking a product from a dropdown with no message
    // text rendered as "General inquiry" even though the customer had
    // clearly said what they wanted.
    (interestSummary
      ? '<div style="font-weight:600;margin-bottom:8px;">Interested in: ' + escapeHtml(interestSummary) + "</div>"
      : "") +
    (preferredWhen
      ? '<div style="font-weight:600;margin-bottom:8px;">Requested time: ' + escapeHtml(preferredWhen) + "</div>"
      : "") +
    (data.message
      ? '<div style="line-height:1.6;">' + escapeHtmlMultiline(data.message) + "</div>"
      : (interestSummary || preferredWhen ? "" : '<div style="color:#64748b;">General inquiry</div>')) +
    "</div>" +
    '<p style="font-size:14px;line-height:1.6;color:#64748b;margin-top:24px;">In the meantime, feel free to:</p>' +
    '<ul style="font-size:14px;line-height:1.8;color:#334155;padding-left:20px;">' +
    '<li>Explore <a href="https://xobriq.com" style="color:' + BRAND_PRIMARY + ';">xobriq.com</a> to learn more about our services</li>' +
    '<li>Reply directly to this email if you have anything to add</li>' +
    "</ul>" +
    '<p style="font-size:14px;line-height:1.6;color:#334155;margin-top:24px;">Best,<br>The Xobriq team</p>';

  return { subject, html: renderEmailShell({ title: subject, bodyHtml }) };
}
