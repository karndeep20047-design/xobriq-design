import { redirect } from "next/navigation";
import { requireOrgPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProductionAccessDetail, getProductionReadiness } from "@/lib/product-access";
import { DEVELOPER_PRODUCTS, isDeveloperProductSlug } from "../../product-config";
import { ProductionAccessContent } from "./ProductionAccessContent";

export default async function ProductionAccessPage({ params }: { params: Promise<{ product: string }> }) {
  const { organizationId } = await requireOrgPermission("api_keys");
  const { product } = await params;
  if (!isDeveloperProductSlug(product)) redirect("/developer");
  const config = DEVELOPER_PRODUCTS[product];
  if (!config.tabs.includes("production")) redirect(`/developer/${product}/overview`);

  const admin = createAdminClient();
  const [detail, readiness, { data: org }] = await Promise.all([
    getProductionAccessDetail(organizationId, product),
    getProductionReadiness(organizationId),
    admin.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
  ]);

  return (
    <ProductionAccessContent
      config={config}
      organizationName={org?.name || "Your organization"}
      detail={detail}
      readiness={readiness}
    />
  );
}
