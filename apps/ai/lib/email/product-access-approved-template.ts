// apps/ai/lib/email/product-access-approved-template.ts
import { escapeHtml, emailButton, renderEmailShell } from "./shell";
import { PRODUCT_LABELS } from "./product-access-requested-template";

export type ProductAccessApprovedEmailData = {
  full_name: string | null;
  product_slug: string;
  dashboard_url: string;
};

export function productAccessApprovedEmail(data: ProductAccessApprovedEmailData): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml((data.full_name || "there").split(" ")[0] || "there");
  const productLabel = PRODUCT_LABELS[data.product_slug] || data.product_slug;
  const subject = `You're approved for ${productLabel}`;

  const bodyHtml =
    '<h1 style="font-size:22px;color:#0f172a;margin:12px 0 16px;">Hi ' + firstName + ",</h1>" +
    '<p style="font-size:15px;line-height:1.6;color:#334155;">' +
    "Good news — your organization now has access to <strong>" + escapeHtml(productLabel) +
    "</strong>. You can start using it right away.</p>" +
    '<div style="margin:28px 0;text-align:center;">' +
    emailButton(data.dashboard_url, "Get started") +
    "</div>" +
    '<p style="font-size:14px;line-height:1.6;color:#334155;margin-top:28px;">Best,<br>The Xobriq team</p>';

  return { subject, html: renderEmailShell({ title: subject, bodyHtml }) };
}
