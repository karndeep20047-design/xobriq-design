import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClientsPageClient } from "./ClientsPageClient";

export const metadata = { title: "Clients — Xobriq Console" };

export default async function ClientsPage() {
  await requireStaffPermission("clients");
  const admin = createAdminClient();

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, slug, type, industry, country, plan, status, billing_email, created_at, kyc_trial_until")
    .in("type", ["client_company", "client_individual"])
    .order("created_at", { ascending: false });

  // Get member counts
  const orgIds = (orgs || []).map((o) => o.id);
  const memberCounts: Record<string, number> = {};

  let kycEnabledOrgIds: string[] = [];
  const walletBalances: Record<string, number> = {};

  if (orgIds.length > 0) {
    const { data: members } = await admin
      .from("organization_members")
      .select("organization_id")
      .in("organization_id", orgIds);

    (members || []).forEach((m) => {
      memberCounts[m.organization_id] = (memberCounts[m.organization_id] || 0) + 1;
    });

    const { data: pricedOrgs } = await admin
      .from("kyc_client_pricing")
      .select("organization_id")
      .in("organization_id", orgIds)
      .is("effective_to", null);

    kycEnabledOrgIds = Array.from(new Set((pricedOrgs || []).map((p) => p.organization_id)));

    const { data: wallets } = await admin
      .from("kyc_wallets")
      .select("organization_id, balance")
      .in("organization_id", orgIds);

    (wallets || []).forEach((w) => {
      walletBalances[w.organization_id] = Number(w.balance);
    });
  }

  return (
    <ClientsPageClient
      orgs={(orgs || []) as any}
      memberCounts={memberCounts}
      kycEnabledOrgIds={kycEnabledOrgIds}
      walletBalances={walletBalances}
    />
  );
}