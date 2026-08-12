import { getCurrentUser } from "@/lib/session";
import { getMemberAccess } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Settings — Xobriq" };

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <SettingsClient profile={{ full_name: null, email: "" }} org={null} canManageOrgSettings={false} />;
  }

  let org: { name: string; billing_email: string | null } | null = null;
  let canManageOrgSettings = false;

  if (user.default_org_id) {
    const admin = createAdminClient();
    const [access, { data: orgRow }] = await Promise.all([
      getMemberAccess(user.id, user.default_org_id),
      admin.from("organizations").select("name, billing_email").eq("id", user.default_org_id).maybeSingle(),
    ]);

    canManageOrgSettings = access?.permissions.settings ?? false;
    org = orgRow ? { name: orgRow.name, billing_email: orgRow.billing_email } : null;
  }

  return (
    <SettingsClient
      profile={{ full_name: user.full_name, email: user.email }}
      org={org}
      canManageOrgSettings={canManageOrgSettings}
    />
  );
}
