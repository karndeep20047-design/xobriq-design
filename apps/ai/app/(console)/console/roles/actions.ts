"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { requireStaffPermission } from "@/lib/staff-permissions";
import { STAFF_PERMISSION_KEYS, type StaffPermissions } from "@/lib/staff-permissions-shared";

const RoleSchema = z.object({
  name: z.string().trim().min(2, "Enter a role name").max(60),
});

function permissionsFromFormData(formData: FormData): StaffPermissions {
  const permissions = {} as StaffPermissions;
  for (const key of STAFF_PERMISSION_KEYS) {
    permissions[key] = formData.get("perm_" + key) === "on";
  }
  return permissions;
}

export async function createStaffRoleAction(formData: FormData) {
  let ctx;
  try {
    ctx = await requireStaffPermission("manage_roles");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user } = ctx;

  const parsed = RoleSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();
  const { data: role, error } = await admin
    .from("staff_roles")
    .insert({
      name: parsed.data.name,
      permissions: permissionsFromFormData(formData),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !role) {
    const message = error?.code === "23505" ? "A role with that name already exists" : "Failed to create role";
    return { ok: false, error: message };
  }

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: null,
    action: "staff_role.created",
    resource_type: "staff_role",
    resource_id: role.id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/console/roles");
  return { ok: true };
}

export async function updateStaffRoleAction(roleId: string, formData: FormData) {
  let ctx;
  try {
    ctx = await requireStaffPermission("manage_roles");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user } = ctx;

  const parsed = RoleSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();

  // Confirm the role still exists before touching it — an id alone is
  // never sufficient, same reasoning as the client-org role actions.
  const { data: existing } = await admin
    .from("staff_roles")
    .select("id")
    .eq("id", roleId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Role not found" };
  }

  const { error } = await admin
    .from("staff_roles")
    .update({
      name: parsed.data.name,
      permissions: permissionsFromFormData(formData),
    })
    .eq("id", roleId);

  if (error) {
    const message = error.code === "23505" ? "A role with that name already exists" : "Failed to update role";
    return { ok: false, error: message };
  }

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: null,
    action: "staff_role.updated",
    resource_type: "staff_role",
    resource_id: roleId,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/console/roles");
  return { ok: true };
}

export async function deleteStaffRoleAction(roleId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("manage_roles");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user } = ctx;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("staff_roles")
    .select("id, name")
    .eq("id", roleId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Role not found" };
  }

  // Staff holding this role fall back to profiles.custom_staff_role_id
  // being nulled via the FK's "on delete set null" — they land on no
  // access rather than the delete failing.
  await admin.from("staff_roles").delete().eq("id", roleId);

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: null,
    action: "staff_role.deleted",
    resource_type: "staff_role",
    resource_id: roleId,
    metadata: { name: existing.name },
  });

  revalidatePath("/console/roles");
  return { ok: true };
}
