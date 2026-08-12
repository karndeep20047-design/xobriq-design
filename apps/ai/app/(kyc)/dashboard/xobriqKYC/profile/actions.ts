"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

const ProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
});

const PasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(12, "Password must be at least 12 characters").max(200),
});

// Only the signed-in user's own name/password — no organization-wide
// business fields (trading name, KRA PIN, compliance officer, etc.) live
// here anymore; that was a scope mismatch for a page every staff member of
// the org can reach, not just whoever manages the business profile.
export async function updateMyProfileAction(formData: FormData) {
  const user = await requireAuth("/login?redirectTo=/dashboard/xobriqKYC/profile");

  const parsed = ProfileSchema.safeParse({ full_name: formData.get("full_name") });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id);

  if (error) return { ok: false as const, error: "Failed to save. Please try again." };

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    action: "profile.updated",
    resource_type: "profile",
    resource_id: user.id,
  });

  revalidatePath("/dashboard/xobriqKYC/profile");
  return { ok: true as const, message: "Profile updated" };
}

export async function changeMyPasswordAction(formData: FormData) {
  const user = await requireAuth("/login?redirectTo=/dashboard/xobriqKYC/profile");

  const parsed = PasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const supabase = await createClient();

  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });

  if (verifyErr) {
    await logAudit({
      actor_id: user.id,
      actor_email: user.email,
      action: "auth.password_change.failed",
      metadata: { reason: "invalid_current_password" },
    });
    return { ok: false as const, error: "Current password is incorrect" };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) return { ok: false as const, error: error.message };

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    action: "auth.password_changed",
  });

  return { ok: true as const, message: "Password updated" };
}
