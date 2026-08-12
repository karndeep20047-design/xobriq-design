// apps/ai/lib/email/verification-template.ts

import { escapeHtml, emailButton, emailUrlBox, renderEmailShell } from "./shell";

export type VerificationEmailData = {
  full_name: string;
  verification_url: string;
  expires_hours: number;
};

export function verificationEmail(data: VerificationEmailData): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml(data.full_name.split(" ")[0] || "there");
  const subject = "Verify your Xobriq account";

  const bodyHtml =
    '<h1 style="font-size:22px;color:#0f172a;margin:12px 0 16px;">Hi ' + firstName + ",</h1>" +
    '<p style="font-size:15px;line-height:1.6;color:#334155;">Welcome to Xobriq. Please verify your email address to activate your account.</p>' +
    '<div style="margin:28px 0;text-align:center;">' +
    emailButton(data.verification_url, "Verify email address") +
    "</div>" +
    '<p style="font-size:14px;line-height:1.6;color:#64748b;">This link expires in ' + data.expires_hours +
    " hours. If you did not create an account, you can safely ignore this email.</p>" +
    '<p style="font-size:14px;line-height:1.6;color:#64748b;margin-top:20px;">If the button does not work, copy and paste this URL into your browser:</p>' +
    emailUrlBox(data.verification_url) +
    '<p style="font-size:14px;line-height:1.6;color:#334155;margin-top:28px;">Best,<br>The Xobriq team</p>';

  return { subject, html: renderEmailShell({ title: subject, bodyHtml }) };
}
