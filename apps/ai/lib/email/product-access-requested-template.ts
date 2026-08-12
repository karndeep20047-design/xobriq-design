// apps/ai/lib/email/product-access-requested-template.ts
import { escapeHtml, emailButton, renderEmailShell } from "./shell";

export const PRODUCT_LABELS: Record<string, string> = {
  kyc: "Xobriq KYC",
  guard: "Xobriq Guard",
  cloud: "Xobriq Cloud",
  agentic: "Xobriq Agentic",
  consult: "Xobriq Consult",
  cyber: "Xobriq Cyber",
};

export type ProductAccessRequestedEmailData = {
  full_name: string | null;
  product_slug: string;
  dashboard_url: string;
};

export function productAccessRequestedEmail(data: ProductAccessRequestedEmailData): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml((data.full_name || "there").split(" ")[0] || "there");
  const productLabel = PRODUCT_LABELS[data.product_slug] || data.product_slug;
  const subject = `We've received your ${productLabel} request`;

  const bodyHtml =
    '<h1 style="font-size:22px;color:#0f172a;margin:12px 0 16px;">Hi ' + firstName + ",</h1>" +
    '<p style="font-size:15px;line-height:1.6;color:#334155;">' +
    "Thanks for requesting access to <strong>" + escapeHtml(productLabel) + "</strong>. " +
    "Our team is reviewing your request and will let you know as soon as it's approved.</p>" +
    '<p style="font-size:14px;line-height:1.6;color:#64748b;">You can check the status of your request any time from your dashboard.</p>' +
    '<div style="margin:28px 0;text-align:center;">' +
    emailButton(data.dashboard_url, "Open dashboard") +
    "</div>" +
    '<p style="font-size:14px;line-height:1.6;color:#334155;margin-top:28px;">Best,<br>The Xobriq team</p>';

  return { subject, html: renderEmailShell({ title: subject, bodyHtml }) };
}
