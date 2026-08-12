import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getMemberAccess, type MemberAccess } from "@/lib/permissions";

// The auth + profile fetch lives here, at the layout level, so it applies to
// every route under (platform) — api-keys, billing, settings, workspaces,
// etc. — not just /dashboard. It used to live only in dashboard/page.tsx,
// which meant every sibling route was reachable while signed out; centralizing
// it here is what actually protects them.
export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, xobriq_staff_role, default_org_id, onboarded_at")
    .eq("id", user.id)
    .single();

  if (profile?.xobriq_staff_role) redirect("/console");

  const displayName = profile?.full_name || user.email?.split("@")[0] || "there";
  const firstName = displayName.split(" ")[0];

  let orgName: string | null = null;
  if (profile?.default_org_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.default_org_id)
      .single();
    orgName = org?.name || null;
  }

  const memberSince = profile?.onboarded_at
    ? new Date(profile.onboarded_at).toLocaleDateString("en-KE", {
        month: "long",
        year: "numeric",
      })
    : "recently joined";

  // Tolerates the notifications table not existing yet (falls back to an
  // empty list) — see the migration in the notifications feature plan;
  // nothing writes to this table yet, so an empty inbox is expected either way.
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, link, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const access: MemberAccess | null = profile?.default_org_id
    ? await getMemberAccess(user.id, profile.default_org_id)
    : null;

  return (
    <DashboardShell
      user={{
        displayName,
        firstName,
        email: user.email || "",
        orgName,
        memberSince,
      }}
      access={access}
      notifications={notifications || []}
    >
      {children}
    </DashboardShell>
  );
}
