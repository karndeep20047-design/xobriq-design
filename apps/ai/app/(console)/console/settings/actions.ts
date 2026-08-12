"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

const ProfileSchema = z.object({
  full_name: z.string().min(2).max(120),
  phone: z.string().max(40).optional().or(z.literal("")),
  timezone: z.string().max(80).optional(),
});

const PasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(12).max(200),
});

export async function updateProfileAction(formData: FormData) {
  const staff = await requireStaff();
  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({
    full_name: parsed.data.full_name,
    phone: parsed.data.phone || null,
    timezone: parsed.data.timezone || null,
  }).eq("id", staff.id);

  if (error) return { ok: false, error: error.message };

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "profile.updated",
    resource_type: "profile",
    resource_id: staff.id,
  });

  revalidatePath("/console/settings");
  return { ok: true, message: "Profile updated" };
}

export async function changePasswordAction(formData: FormData) {
  const staff = await requireStaff();
  const parsed = PasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };

  const supabase = await createClient();

  // Verify current password by signing in
  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: staff.email,
    password: parsed.data.current_password,
  });

  if (verifyErr) {
    await logAudit({
      actor_id: staff.id,
      actor_email: staff.email,
      action: "auth.password_change.failed",
      metadata: { reason: "invalid_current_password" },
    });
    return { ok: false, error: "Current password is incorrect" };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "auth.password_changed",
  });

  return { ok: true, message: "Password updated" };
}