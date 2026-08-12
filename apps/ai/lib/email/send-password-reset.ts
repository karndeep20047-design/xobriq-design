// apps/ai/lib/email/send-password-reset.ts
import "server-only";
import { sendGraphMail } from "./graph";
import { SENDER_ADDRESS } from "./routing";
import { passwordResetEmail } from "./password-reset-template";
import { createAdminClient } from "@/lib/supabase/admin";

export type SendPasswordResetInput = {
  user_id: string;
  email: string;
  full_name: string;
  ip_address?: string | null;
  user_agent?: string | null;
};

const RESET_EXPIRES_MINUTES = 60;

export async function sendPasswordResetEmail(
  input: SendPasswordResetInput
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const admin = createAdminClient();

  // Invalidate any existing unused reset tokens for this user
  await admin
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", input.user_id)
    .is("used_at", null);

  // Create fresh token
  const { data: tokenRow, error: tokenErr } = await admin
    .from("password_reset_tokens")
    .insert({
      user_id: input.user_id,
      email: input.email,
      ip_address: input.ip_address || null,
      user_agent: input.user_agent || null,
    })
    .select("token")
    .single();

  if (tokenErr || !tokenRow) {
    console.error("[password-reset] failed to create token:", tokenErr?.message);
    return { ok: false, error: "Failed to create reset token" };
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://xobriq-ai-psi.vercel.app"
  ).replace(/\/+$/, "");
  const resetUrl = baseUrl + "/reset-password/" + tokenRow.token;

  const { subject, html } = passwordResetEmail({
    full_name: input.full_name,
    reset_url: resetUrl,
    expires_minutes: RESET_EXPIRES_MINUTES,
    ip_address: input.ip_address || null,
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
      template: "password_reset",
      status: "sent",
      provider: "microsoft_graph",
      metadata: { user_id: input.user_id },
      sent_at: new Date().toISOString(),
    });

    return { ok: true, token: tokenRow.token };
  } catch (err) {
    console.error("[password-reset] send failed:", err);

    await admin.from("email_events").insert({
      from_address: SENDER_ADDRESS,
      to_address: input.email,
      subject,
      template: "password_reset",
      status: "failed",
      provider: "microsoft_graph",
      error: err instanceof Error ? err.message : String(err),
      metadata: { user_id: input.user_id },
    });

    return { ok: false, error: "Failed to send reset email" };
  }
}
