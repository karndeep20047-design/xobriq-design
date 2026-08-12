import { requireOrgPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProductAccessDetail } from "@/lib/product-access";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Terminal } from "lucide-react";
import { DEVELOPER_PRODUCTS } from "./product-config";
import { ProductHubCard } from "./ProductHubCard";

export const metadata = { title: "Developer Platform — Xobriq" };

export default async function DeveloperHubPage() {
  const { organizationId } = await requireOrgPermission("api_keys");
  const admin = createAdminClient();

  const [kycAccess, guardAccess, { count: sandboxKeys }, { count: productionKeys }] = await Promise.all([
    getProductAccessDetail(organizationId, "kyc"),
    getProductAccessDetail(organizationId, "guard"),
    admin
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("environment", "sandbox"),
    admin
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("environment", "production"),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <PageHeader
        Icon={Terminal}
        title="Developer Platform"
        subtitle="Build, test, and manage your Xobriq product integrations."
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <ProductHubCard
          config={DEVELOPER_PRODUCTS.kyc}
          accessStatus={kycAccess.status}
          sandboxKeyCount={sandboxKeys ?? 0}
          productionKeyCount={productionKeys ?? 0}
        />
        <ProductHubCard config={DEVELOPER_PRODUCTS.guard} accessStatus={guardAccess.status} />
      </div>
    </div>
  );
}
