"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { ORG_PERMISSION_KEYS, type OrgPermissions } from "@/lib/permissions-shared";

async function requireOrgOwnerOrAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  if (!user.default_org_id) throw new Error("No organization");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", user.default_org_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("You don't have permission to manage roles");
  }

  return { user, orgId: user.default_org_id as string };
}

const RoleSchema = z.object({
  name: z.string().trim().min(2, "Enter a role name").max(60),
});

function permissionsFromFormData(formData: FormData): OrgPermissions {
  const permissions = {} as OrgPermissions;
  for (const key of ORG_PERMISSION_KEYS) {
    permissions[key] = formData.get("perm_" + key) === "on";
  }
  return permissions;
}

export async function createOrgRoleAction(formData: FormData) {
  let ctx;
  try {
    ctx = await requireOrgOwnerOrAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user, orgId } = ctx;

  const parsed = RoleSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();
  const { data: role, error } = await admin
    .from("organization_roles")
    .insert({
      organization_id: orgId,
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
    organization_id: orgId,
    action: "role.created",
    resource_type: "organization_role",
    resource_id: role.id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/team/roles");
  return { ok: true };
}

export async function updateOrgRoleAction(roleId: string, formData: FormData) {
  let ctx;
  try {
    ctx = await requireOrgOwnerOrAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user, orgId } = ctx;

  const parsed = RoleSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();

  // Confirm the role actually belongs to the caller's own org before
  // touching it — an id alone is never sufficient authorization.
  const { data: existing } = await admin
    .from("organization_roles")
    .select("organization_id")
    .eq("id", roleId)
    .maybeSingle();

  if (!existing || existing.organization_id !== orgId) {
    return { ok: false, error: "Role not found" };
  }

  const { error } = await admin
    .from("organization_roles")
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
    organization_id: orgId,
    action: "role.updated",
    resource_type: "organization_role",
    resource_id: roleId,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/team/roles");
  return { ok: true };
}

export async function deleteOrgRoleAction(roleId: string) {
  let ctx;
  try {
    ctx = await requireOrgOwnerOrAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const { user, orgId } = ctx;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("organization_roles")
    .select("organization_id, name")
    .eq("id", roleId)
    .maybeSingle();

  if (!existing || existing.organization_id !== orgId) {
    return { ok: false, error: "Role not found" };
  }

  // Members holding this role fall back to organization_members.custom_role_id
  // being nulled via the FK's "on delete set null" — they land on the
  // minimal-default permission set rather than the delete failing.
  await admin.from("organization_roles").delete().eq("id", roleId);

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: orgId,
    action: "role.deleted",
    resource_type: "organization_role",
    resource_id: roleId,
    metadata: { name: existing.name },
  });

  revalidatePath("/team/roles");
  return { ok: true };
}
