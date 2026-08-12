// apps/ai/lib/email/subscription-renewal-template.ts
import { escapeHtml, emailButton, renderEmailShell } from "./shell";
import { PRODUCT_LABELS } from "./product-access-requested-template";

export type SubscriptionRenewalEmailData = {
  full_name: string | null;
  product_slug: string;
  days_remaining: number;
  billing_url: string;
};

export function subscriptionRenewalEmail(data: SubscriptionRenewalEmailData): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml((data.full_name || "there").split(" ")[0] || "there");
  const productLabel = PRODUCT_LABELS[data.product_slug] || data.product_slug;
  const subject = `${productLabel} access renews in ${data.days_remaining} day${data.days_remaining === 1 ? "" : "s"}`;

  const bodyHtml =
    '<h1 style="font-size:22px;color:#0f172a;margin:12px 0 16px;">Hi ' + firstName + ",</h1>" +
    '<p style="font-size:15px;line-height:1.6;color:#334155;">' +
    "Your organization's access to <strong>" + escapeHtml(productLabel) + "</strong> is due for renewal in " +
    "<strong>" + data.days_remaining + " day" + (data.days_remaining === 1 ? "" : "s") + "</strong>. " +
    "Reach out to us if you'd like to renew, or if anything about your plan needs to change.</p>" +
    '<div style="margin:28px 0;text-align:center;">' +
    emailButton(data.billing_url, "View billing") +
    "</div>" +
    '<p style="font-size:14px;line-height:1.6;color:#334155;margin-top:28px;">Best,<br>The Xobriq team</p>';

  return { subject, html: renderEmailShell({ title: subject, bodyHtml }) };
}
