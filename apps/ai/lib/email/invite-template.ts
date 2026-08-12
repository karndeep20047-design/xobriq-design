// apps/ai/lib/email/invite-template.ts

import { escapeHtml, emailButton, emailUrlBox, renderEmailShell } from "./shell";

export type StaffInviteEmailData = {
  full_name: string;
  role_label: string;
  invited_by_name: string;
  invite_url: string;
  expires_days: number;
};

export function staffInviteEmail(data: StaffInviteEmailData): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml(data.full_name.split(" ")[0] || "there");
  const subject = "You've been invited to join Xobriq";

  const bodyHtml =
    '<h1 style="font-size:22px;color:#0f172a;margin:12px 0 16px;">Hi ' + firstName + ",</h1>" +
    '<p style="font-size:15px;line-height:1.6;color:#334155;">' +
    escapeHtml(data.invited_by_name) + " has invited you to join the Xobriq internal console as <strong>" +
    escapeHtml(data.role_label) + "</strong>.</p>" +
    '<div style="margin:28px 0;text-align:center;">' +
    emailButton(data.invite_url, "Accept invitation") +
    "</div>" +
    '<p style="font-size:14px;line-height:1.6;color:#64748b;">This link expires in ' + data.expires_days +
    " days and can only be used once. If you weren't expecting this invitation, you can safely ignore this email.</p>" +
    '<p style="font-size:14px;line-height:1.6;color:#64748b;margin-top:20px;">If the button does not work, copy and paste this URL into your browser:</p>' +
    emailUrlBox(data.invite_url) +
    '<p style="font-size:14px;line-height:1.6;color:#334155;margin-top:28px;">Best,<br>The Xobriq team</p>';

  return { subject, html: renderEmailShell({ title: subject, bodyHtml }) };
}

export type OrgInviteEmailData = {
  full_name: string;
  organization_name: string;
  role_label: string;
  invited_by_name: string;
  invite_url: string;
  expires_days: number;
};

// Same shell/structure as staffInviteEmail, worded for a client organization
// invite (joining a company's own workspace) instead of the internal
// console — kept as a separate function rather than parameterizing the
// staff version so the two audiences' copy can diverge freely later.
export function orgInviteEmail(data: OrgInviteEmailData): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml(data.full_name.split(" ")[0] || "there");
  const subject = `You've been invited to join ${data.organization_name} on Xobriq`;

  const bodyHtml =
    '<h1 style="font-size:22px;color:#0f172a;margin:12px 0 16px;">Hi ' + firstName + ",</h1>" +
    '<p style="font-size:15px;line-height:1.6;color:#334155;">' +
    escapeHtml(data.invited_by_name) + " has invited you to join <strong>" + escapeHtml(data.organization_name) +
    "</strong>'s workspace on Xobriq as <strong>" + escapeHtml(data.role_label) + "</strong>.</p>" +
    '<div style="margin:28px 0;text-align:center;">' +
    emailButton(data.invite_url, "Accept invitation") +
    "</div>" +
    '<p style="font-size:14px;line-height:1.6;color:#64748b;">This link expires in ' + data.expires_days +
    " days and can only be used once. If you weren't expecting this invitation, you can safely ignore this email.</p>" +
    '<p style="font-size:14px;line-height:1.6;color:#64748b;margin-top:20px;">If the button does not work, copy and paste this URL into your browser:</p>' +
    emailUrlBox(data.invite_url) +
    '<p style="font-size:14px;line-height:1.6;color:#334155;margin-top:28px;">Best,<br>The Xobriq team</p>';

  return { subject, html: renderEmailShell({ title: subject, bodyHtml }) };
}
