"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { requireOrgPermission } from "@/lib/permissions";
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

const OrgSettingsSchema = z.object({
  name: z.string().trim().min(2, "Enter an organization name").max(200),
  billing_email: z.string().trim().email("Enter a valid email").max(200),
});

export async function updateMyProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const parsed = ProfileSchema.safeParse({ full_name: formData.get("full_name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Failed to save. Please try again." };

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    action: "profile.updated",
    resource_type: "profile",
    resource_id: user.id,
  });

  revalidatePath("/settings");
  return { ok: true, message: "Profile updated" };
}

export async function changeMyPasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const parsed = PasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const supabase = await createClient();

  // Confirm the current password before allowing a change, same pattern as
  // the internal console's own account settings (console/settings/actions.ts).
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
    return { ok: false, error: "Current password is incorrect" };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    action: "auth.password_changed",
  });

  return { ok: true, message: "Password updated" };
}

export async function updateOrgSettingsAction(formData: FormData) {
  let ctx;
  try {
    ctx = await requireOrgPermission("settings");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { userId, organizationId } = ctx;

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const parsed = OrgSettingsSchema.safeParse({
    name: formData.get("name"),
    billing_email: formData.get("billing_email"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ name: parsed.data.name, billing_email: parsed.data.billing_email })
    .eq("id", organizationId);

  if (error) return { ok: false, error: "Failed to save. Please try again." };

  await logAudit({
    actor_id: userId,
    actor_email: user.email,
    organization_id: organizationId,
    action: "organization.settings_updated",
    resource_type: "organization",
    resource_id: organizationId,
    metadata: { name: parsed.data.name, billing_email: parsed.data.billing_email },
  });

  revalidatePath("/settings");
  return { ok: true, message: "Organization settings updated" };
}
