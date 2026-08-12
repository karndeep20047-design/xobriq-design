import { redirect } from "next/navigation";
import { requireOrgPermission } from "@/lib/permissions";
import { PUBLIC_API_BASE_URL } from "@/lib/public-api-config";
import { DEVELOPER_PRODUCTS, isDeveloperProductSlug } from "../../product-config";
import { ApiReferenceContent } from "./ApiReferenceContent";

export default async function ApiReferencePage({ params }: { params: Promise<{ product: string }> }) {
  await requireOrgPermission("api_keys");
  const { product } = await params;
  if (!isDeveloperProductSlug(product)) redirect("/developer");
  if (!DEVELOPER_PRODUCTS[product].tabs.includes("api-reference")) redirect(`/developer/${product}/overview`);

  return <ApiReferenceContent baseUrl={PUBLIC_API_BASE_URL} />;
}
