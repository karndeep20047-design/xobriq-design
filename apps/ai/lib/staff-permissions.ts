// apps/ai/lib/staff-permissions.ts
//
// Internal staff RBAC: mirrors the client-org custom-role model exactly
// (lib/permissions.ts) but for Xobriq staff instead of org members.
//
// profiles.xobriq_staff_role is kept, not replaced — it still answers "is
// this person Xobriq staff at all" (requireStaff() in lib/session.ts) and
// stays wired into the invite flow. Only the literal
// value "super_admin" still carries fixed, unremovable full access (a
// bootstrap/break-glass tier, mirroring how "owner" always has full access
// in the client-org model regardless of custom roles). Every other staff
// member's actual access comes from custom_staff_role_id -> staff_roles,
// fully dynamic and editable through /console/roles.
//
// IMPORTANT — this file only exists during the additive phase (Phase 2 of
// the internal-console plan): no existing console page reads from this yet.
// Every page still uses lib/session.ts's requireRole([...]) with its
// original hardcoded arrays until each one is migrated over individually
// (Phase 3), one at a time, with manual verification in between.
import "server-only";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/session";
import type { StaffRole } from "@/lib/session-types";
import { STAFF_PERMISSION_KEYS, type StaffPermissionKey, type StaffPermissions, type StaffAccess } from "@/lib/staff-permissions-shared";

export { STAFF_PERMISSION_KEYS, STAFF_PERMISSION_LABELS, type StaffPermissionKey, type StaffPermissions, type StaffAccess } from "@/lib/staff-permissions-shared";

const ALL_TRUE: StaffPermissions = STAFF_PERMISSION_KEYS.reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {} as StaffPermissions);

const NO_ACCESS: StaffPermissions = STAFF_PERMISSION_KEYS.reduce((acc, k) => {
  acc[k] = false;
  return acc;
}, {} as StaffPermissions);

export async function getStaffAccess(userId: string): Promise<StaffAccess | null> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("xobriq_staff_role, custom_staff_role_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || !profile.xobriq_staff_role) return null;

  if (profile.xobriq_staff_role === "super_admin") {
    return { isSuperAdmin: true, permissions: ALL_TRUE, roleName: "Super Admin" };
  }

  if (profile.custom_staff_role_id) {
    const { data: role } = await admin
      .from("staff_roles")
      .select("name, permissions")
      .eq("id", profile.custom_staff_role_id)
      .maybeSingle();

    // A deleted/missing role falls back to no access rather than trusting
    // a stale reference — same defense-in-depth reasoning as the client-org
    // custom_role_id lookup in lib/permissions.ts.
    if (role) {
      const permissions = { ...NO_ACCESS, ...(role.permissions as Partial<StaffPermissions>) };
      return { isSuperAdmin: false, permissions, roleName: role.name };
    }
  }

  // Staff but no role assigned yet — no access is the safest default for
  // an admin console (unlike the client-org MINIMAL_DEFAULT, which grants a
  // small starter set; here there's no equivalent "safe minimum").
  return { isSuperAdmin: false, permissions: NO_ACCESS, roleName: null };
}

// Maps a legacy fixed role to the seeded staff_roles row that reproduces
// its historical access — see _run_me_console_rbac_and_support.sql. Used
// so picking a legacy role from the Team dropdown keeps granting a sane
// default permission set instead of silently landing on NO_ACCESS, without
// the caller having to separately remember to pick a custom role too.
// super_admin and any legacy role added after the seed migration (there
// are none today) intentionally have no entry — no name means no default.
const LEGACY_ROLE_DEFAULT_STAFF_ROLE_NAME: Partial<Record<StaffRole, string>> = {
  cto: "Chief Technology Officer",
  tech_lead: "Tech Lead",
  senior_dev: "Senior Developer",
  developer: "Developer",
  ml_lead: "ML Lead",
  cyber_sec: "Cyber Security",
  product_manager: "Product Manager",
  finance_hr: "Finance & HR",
  marketing_head: "Head of Marketing",
  content_admin: "Content Admin",
  content_writer: "Content Writer",
};

export async function getDefaultCustomRoleIdForLegacyRole(
  admin: ReturnType<typeof createAdminClient>,
  legacyRole: StaffRole
): Promise<string | null> {
  const name = LEGACY_ROLE_DEFAULT_STAFF_ROLE_NAME[legacyRole];
  if (!name) return null;
  const { data } = await admin.from("staff_roles").select("id").eq("name", name).maybeSingle();
  return data?.id ?? null;
}

// Bounces to /console (not a 403) for an under-permissioned staff member —
// same "there's always somewhere else to land" reasoning as requireRole().
export async function requireStaffPermission(key: StaffPermissionKey): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  access: StaffAccess;
}> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/console");

  const access = await getStaffAccess(user.id);
  if (!access) redirect("/dashboard");
  if (!access.permissions[key]) redirect("/console");

  return { user, access };
}
