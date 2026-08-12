// apps/ai/lib/permissions.ts
//
// Client-org RBAC: owner/admin always have full access. A "member" can
// optionally be assigned a custom, owner-defined organization_roles row
// (permissions jsonb) that narrows exactly which sections they can see —
// e.g. a "Billing only" role.
//
// Every permission check here is itself organization-scoped: getMemberAccess
// always takes the CALLER's own organization_id (from their profile), and
// every downstream query in the app must filter by that same
// organization_id — this file only decides WHAT a member can see, not which
// rows belong to their org. Cross-org isolation is enforced at the query
// level in each page/action.
//
// KYC section visibility (the kyc_* keys) is part of this same system — see
// lib/permissions-shared.ts's top comment for how it relates to org-level
// KYC product access (a separate, unaffected system).
import "server-only";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/session";
import { ORG_PERMISSION_KEYS, type OrgPermissionKey, type OrgPermissions, type MemberAccess } from "@/lib/permissions-shared";

export { ORG_PERMISSION_KEYS, PERMISSION_LABELS, type OrgPermissionKey, type OrgPermissions, type MemberAccess } from "@/lib/permissions-shared";

const ALL_TRUE: OrgPermissions = ORG_PERMISSION_KEYS.reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {} as OrgPermissions);

// A "member" invited before custom roles existed (or whose custom role was
// deleted) falls back to this rather than either silently keeping full
// access or silently losing everything — Overview is the one thing every
// signed-in org member can always reach. KYC's kyc_* keys default to true
// instead of false here — unlike Team/Billing/etc., KYC's sections are the
// day-to-day job for most org members, not an admin function, so a plain
// Member keeps seeing all of KYC exactly as before this permission model
// existed. Restricting KYC visibility is opt-in: create a custom role with
// only some kyc_* boxes checked and assign it. This same default is also
// what a custom role created BEFORE the kyc_* keys existed falls back to for
// those keys (see computeBasePermissions) — old roles keep full KYC access
// until an admin edits them and explicitly unchecks something.
const MEMBER_DEFAULT: OrgPermissions = ORG_PERMISSION_KEYS.reduce((acc, k) => {
  acc[k] = k === "dashboard" || k.startsWith("kyc_");
  return acc;
}, {} as OrgPermissions);

// The role's/custom-role's permissions BEFORE any per-member override is
// applied — exported so the Team page can compute this once per member from
// data it's already fetched in bulk, instead of re-querying per row.
export function computeBasePermissions(
  role: "owner" | "admin" | "member",
  customRolePermissions: Partial<OrgPermissions> | null
): OrgPermissions {
  if (role === "owner" || role === "admin") return ALL_TRUE;
  if (customRolePermissions) return { ...MEMBER_DEFAULT, ...customRolePermissions };
  return MEMBER_DEFAULT;
}

export async function getMemberAccess(userId: string, organizationId: string): Promise<MemberAccess | null> {
  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("organization_members")
    .select("role, custom_role_id, permission_overrides")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  // The owner is never overridable — always full access, mirroring the
  // "cannot remove the organization owner" invariant enforced elsewhere.
  // There must always be at least one fully-privileged person in an org.
  if (membership.role === "owner") {
    return { role: "owner", permissions: ALL_TRUE };
  }

  let customRolePermissions: Partial<OrgPermissions> | null = null;
  if (membership.custom_role_id) {
    const { data: customRole } = await admin
      .from("organization_roles")
      .select("permissions, organization_id")
      .eq("id", membership.custom_role_id)
      .maybeSingle();

    // The role must belong to the SAME org — a stale/cross-org reference
    // (shouldn't happen, but never trust it implicitly) falls back to minimal.
    if (customRole && customRole.organization_id === organizationId) {
      customRolePermissions = customRole.permissions as Partial<OrgPermissions>;
    }
  }

  const base = computeBasePermissions(membership.role as "admin" | "member", customRolePermissions);
  const overrides = (membership.permission_overrides || {}) as Partial<OrgPermissions>;

  return { role: membership.role as "admin" | "member", permissions: { ...base, ...overrides } };
}

// The ordered list of permission -> route a signed-in org member could land
// on. Used both to bounce someone away from a page they don't have (instead
// of always assuming /dashboard is a safe landing spot — it isn't anymore,
// now that "dashboard" is itself a gated permission) and to pick a sensible
// post-login destination for a member whose role doesn't include Overview.
const ROUTE_PRIORITY: Array<[OrgPermissionKey, string]> = [
  ["dashboard", "/dashboard"],
  ["team", "/team"],
  ["audit_log", "/audit"],
  ["billing", "/billing"],
  ["api_keys", "/api-keys"],
];

// /settings is always reachable regardless of permissions (My Account is
// personal, not org-scoped) so it's the guaranteed-safe fallback — nobody
// should ever land on a page that immediately bounces them again.
export function getFirstAccessibleRoute(access: MemberAccess | null): string {
  if (!access) return "/settings";
  for (const [key, route] of ROUTE_PRIORITY) {
    if (access.permissions[key]) return route;
  }
  return "/settings";
}

// Server-only page guard, mirroring requireRole()'s shape for staff pages.
// Redirects to whichever page this member's role actually grants rather than
// a hard 403 or an assumed-safe /dashboard (which may itself be gated) —
// same "there's always somewhere else to land" reasoning requireRole() uses.
export async function requireOrgPermission(key: OrgPermissionKey): Promise<{
  userId: string;
  organizationId: string;
  access: MemberAccess;
}> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/dashboard");
  if (!user.default_org_id) redirect("/dashboard");

  const access = await getMemberAccess(user.id, user.default_org_id);
  if (!access || !access.permissions[key]) redirect(getFirstAccessibleRoute(access));

  return { userId: user.id, organizationId: user.default_org_id, access };
}

// Same "ordered list of permission -> route, always land somewhere safe"
// pattern as ROUTE_PRIORITY/getFirstAccessibleRoute above, scoped to the KYC
// dashboard's own sections instead of the main app's.
const KYC_BASE = "/dashboard/xobriqKYC";

const KYC_ROUTE_PRIORITY: Array<[OrgPermissionKey, string]> = [
  ["kyc_dashboard", KYC_BASE],
  ["kyc_verify", `${KYC_BASE}/verify`],
  ["kyc_verifications", `${KYC_BASE}/verifications`],
  ["kyc_bulk", `${KYC_BASE}/bulk`],
  ["kyc_alerts", `${KYC_BASE}/alerts`],
  ["kyc_support", `${KYC_BASE}/support`],
];

// A member with zero KYC section access has no safe page left inside KYC to
// land on — /dashboard/xobriqKYC/profile is reachable regardless (personal,
// like /settings), but bouncing someone with no real KYC access back into
// the KYC shell just to see their own profile is pointless, so the fallback
// leaves KYC entirely for the main app dashboard instead.
function getFirstAccessibleKycRoute(access: MemberAccess | null): string {
  if (!access) return "/dashboard";
  for (const [key, route] of KYC_ROUTE_PRIORITY) {
    if (access.permissions[key]) return route;
  }
  return "/dashboard";
}

// Server-only page guard for app/(kyc)/dashboard/xobriqKYC/* pages, mirroring
// requireOrgPermission's shape. Returns the full profile (not just userId) —
// unlike the main app's pages, every KYC page already needs full_name/email
// for its own display, not just the id.
export async function requireKycPermission(key: OrgPermissionKey): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  organizationId: string;
  access: MemberAccess;
}> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirectTo=${KYC_BASE}`);
  if (!user.default_org_id) redirect("/dashboard");

  const access = await getMemberAccess(user.id, user.default_org_id);
  if (!access || !access.permissions[key]) redirect(getFirstAccessibleKycRoute(access));

  return { user, organizationId: user.default_org_id, access };
}
