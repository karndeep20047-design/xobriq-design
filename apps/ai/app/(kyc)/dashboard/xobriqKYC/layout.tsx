import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberAccess } from "@/lib/permissions";
import { ORG_PERMISSION_KEYS, type OrgPermissions } from "@/lib/permissions-shared";
import { KycIdentityProvider } from "@/components/kyc/identity-context";
import { Toaster } from "@/components/ui/sonner";

// Own auth check (regular org-member area, not requireStaff/requireRole) and
// own chrome — deliberately NOT nested under app/(platform)/layout.tsx's
// DashboardShell, which has a completely different nav for the main client
// dashboard. This is the native Next.js replacement for what used to be a
// separate TanStack Start app reverse-proxied here from a local Vite dev
// server on port 8080 (see next.config.ts history) — same URL, same look,
// real Next.js routes instead of a proxy.
export default async function XobriqKycLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth("/login?redirectTo=/dashboard/xobriqKYC");
  if (!user.default_org_id) redirect("/dashboard");

  const admin = createAdminClient();
  const [{ data: org }, { count: alertsCount }, { data: notifications }, access] = await Promise.all([
    admin.from("organizations").select("name, plan").eq("id", user.default_org_id).single(),
    // Same "failed or not-matched" definition of an alert as alerts/page.tsx
    // — fed here once so the sidebar badge shows the real count instead of
    // a hardcoded placeholder.
    admin
      .from("kyc_verifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.default_org_id)
      .or("status.eq.failed,matched.eq.false"),
    // Same real notifications table/shape as app/(platform)/layout.tsx —
    // explicit user_id filter since this runs on the admin client (bypasses
    // RLS), not the session client that table's policy would otherwise
    // scope automatically.
    admin
      .from("notifications")
      .select("id, title, body, link, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    getMemberAccess(user.id, user.default_org_id),
  ]);

  // Only null if the membership row is missing entirely (shouldn't happen
  // for someone with a default_org_id) — every page under this layout
  // guards itself via requireKycPermission anyway, so this is just what the
  // sidebar renders with in that edge case, not a security boundary itself.
  const noAccess: OrgPermissions = ORG_PERMISSION_KEYS.reduce((acc, k) => {
    acc[k] = false;
    return acc;
  }, {} as OrgPermissions);

  return (
    <div className="kyc-scope">
      <KycIdentityProvider
        identity={{
          orgName: org?.name ?? null,
          orgPlan: org?.plan ?? null,
          alertsCount: alertsCount ?? 0,
          notifications: notifications || [],
          permissions: access?.permissions ?? noAccess,
        }}
      >
        {children}
      </KycIdentityProvider>
      {/* apps/kyc defined this wrapper but never actually mounted it, so
          toast.success()/toast.error() calls throughout the ported pages
          silently rendered nothing — mounting it here is what makes them
          visible, not a behavior change beyond what was clearly intended. */}
      <Toaster />
    </div>
  );
}
