// apps/ai/lib/email/password-reset-template.ts

import { escapeHtml, emailButton, emailUrlBox, renderEmailShell, BRAND_PRIMARY } from "./shell";

export type PasswordResetEmailData = {
  full_name: string;
  reset_url: string;
  expires_minutes: number;
  ip_address?: string | null;
};

export function passwordResetEmail(data: PasswordResetEmailData): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml(data.full_name.split(" ")[0] || "there");
  const subject = "Reset your Xobriq password";

  const bodyHtml =
    '<h1 style="font-size:22px;color:#0f172a;margin:12px 0 16px;">Hi ' + firstName + ",</h1>" +
    '<p style="font-size:15px;line-height:1.6;color:#334155;">We received a request to reset the password for your Xobriq account. Click the button below to set a new password.</p>' +
    '<div style="margin:28px 0;text-align:center;">' +
    emailButton(data.reset_url, "Reset your password") +
    "</div>" +
    '<p style="font-size:14px;line-height:1.6;color:#64748b;">This link expires in ' +
    data.expires_minutes +
    " minutes for your security. If you did not request a password reset, you can safely ignore this email — your account is secure.</p>" +
    (data.ip_address
      ? '<p style="font-size:12px;line-height:1.6;color:#94a3b8;margin-top:16px;">Requested from IP: <span style="font-family:monospace;">' +
        escapeHtml(data.ip_address) +
        "</span></p>"
      : "") +
    '<p style="font-size:14px;line-height:1.6;color:#64748b;margin-top:20px;">If the button does not work, copy and paste this URL into your browser:</p>' +
    emailUrlBox(data.reset_url) +
    '<p style="font-size:14px;line-height:1.6;color:#334155;margin-top:28px;">Best,<br>The Xobriq team</p>';

  const footerNote =
    'If you have questions, contact us at <a href="mailto:info@xobriq.com" style="color:' + BRAND_PRIMARY + ';">info@xobriq.com</a>';

  return { subject, html: renderEmailShell({ title: subject, bodyHtml, footerNote }) };
}
