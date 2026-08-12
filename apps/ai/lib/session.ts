// Auth/role enforcement for the (console) and (platform) route groups.
//
// proxy.ts (repo root — Next 16's renamed middleware.ts) *does* run at the
// edge, but it's a fast-path convenience redirect, not a substitute for the
// checks below: it only covers a fixed prefix list (/dashboard, /console,
// and a few /docs paths) and only checks "is there a session," not role.
// Notably its list does NOT include /api-keys, /billing, /settings,
// /workspaces — those are only actually protected because
// app/(platform)/layout.tsx calls requireStaff() below; proxy.ts wouldn't
// have caught someone hitting them unauthenticated. Every real
// authorization decision — including "does this session have the right
// role" — happens per-layout/page via the functions in this file, not at
// the edge. Don't assume a route is protected just because it's under a
// path proxy.ts's list happens to mention.
import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole, StaffProfile } from "@/lib/session-types";

export type { StaffRole, StaffProfile };
export {
  canManageTeam, canManageClients, canManageBlog, canReviewBlog,
  canViewMetrics, canViewAudit, canViewKycOps, ROLE_LABELS,
  KYC_OPS_ROLES,
} from "@/lib/session-types";

// Always resolves the real signed-in Supabase user's own profile/role.
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, xobriq_staff_role, default_org_id")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function requireAuth(redirectTo = "/login") {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

// A signed-in user with no xobriq_staff_role is a regular client, not staff —
// send them to their own portal rather than treating it as an auth failure.
export async function requireStaff(): Promise<StaffProfile> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/console");
  if (!user.xobriq_staff_role) redirect("/dashboard");
  return user as StaffProfile;
}

// Bounces an under-permissioned staff member back to the console home
// instead of a 403 — they're authenticated, just not cleared for this
// specific page, so there's always somewhere else in the console to land.
export async function requireRole(allowed: StaffRole[]): Promise<StaffProfile> {
  const staff = await requireStaff();
  if (!allowed.includes(staff.xobriq_staff_role)) redirect("/console");
  return staff;
}