// apps/ai/lib/email/send-staff-invite.ts
import "server-only";
import { sendGraphMail } from "./graph";
import { SENDER_ADDRESS } from "./routing";
import { staffInviteEmail } from "./invite-template";
import { createAdminClient } from "@/lib/supabase/admin";

export type SendStaffInviteInput = {
  invitation_id: string;
  email: string;
  full_name: string;
  role_label: string;
  invited_by_name: string;
  invite_url: string;
  expires_days: number;
};

export async function sendStaffInviteEmail(
  input: SendStaffInviteInput
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { subject, html } = staffInviteEmail({
    full_name: input.full_name,
    role_label: input.role_label,
    invited_by_name: input.invited_by_name,
    invite_url: input.invite_url,
    expires_days: input.expires_days,
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
      template: "staff_invite",
      status: "sent",
      provider: "microsoft_graph",
      metadata: { invitation_id: input.invitation_id },
      sent_at: new Date().toISOString(),
    });

    return { ok: true };
  } catch (err) {
    console.error("[staff-invite] send failed:", err instanceof Error ? err.message : String(err));

    await admin.from("email_events").insert({
      from_address: SENDER_ADDRESS,
      to_address: input.email,
      subject,
      template: "staff_invite",
      status: "failed",
      provider: "microsoft_graph",
      error: err instanceof Error ? err.message : String(err),
      metadata: { invitation_id: input.invitation_id },
    });

    return { ok: false, error: "Failed to send invitation email" };
  }
}
