// apps/ai/lib/email/send-verification.ts
import "server-only";
import { sendGraphMail } from "./graph";
import { SENDER_ADDRESS } from "./routing";
import { verificationEmail } from "./verification-template";
import { createAdminClient } from "@/lib/supabase/admin";

export type SendVerificationInput = {
  user_id: string;
  email: string;
  full_name: string;
};

const VERIFICATION_EXPIRES_HOURS = 24;

export async function sendVerificationEmail(
  input: SendVerificationInput
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const admin = createAdminClient();

  // Invalidate any existing unused tokens for this user
  await admin
    .from("email_verification_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", input.user_id)
    .is("used_at", null);

  // Create fresh token
  const { data: tokenRow, error: tokenErr } = await admin
    .from("email_verification_tokens")
    .insert({
      user_id: input.user_id,
      email: input.email,
    })
    .select("token")
    .single();

  if (tokenErr || !tokenRow) {
    console.error("[verify] failed to create token:", tokenErr?.message);
    return { ok: false, error: "Failed to create verification token" };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://xobriq-ai-psi.vercel.app";
  const verificationUrl = baseUrl + "/verify-email/" + tokenRow.token;

  const { subject, html } = verificationEmail({
    full_name: input.full_name,
    verification_url: verificationUrl,
    expires_hours: VERIFICATION_EXPIRES_HOURS,
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
      template: "email_verification",
      status: "sent",
      provider: "microsoft_graph",
      metadata: { user_id: input.user_id },
      sent_at: new Date().toISOString(),
    });

    return { ok: true, token: tokenRow.token };
  } catch (err) {
    console.error("[verify] send failed:", err);

    await admin.from("email_events").insert({
      from_address: SENDER_ADDRESS,
      to_address: input.email,
      subject,
      template: "email_verification",
      status: "failed",
      provider: "microsoft_graph",
      error: err instanceof Error ? err.message : String(err),
      metadata: { user_id: input.user_id },
    });

    return { ok: false, error: "Failed to send verification email" };
  }
}
