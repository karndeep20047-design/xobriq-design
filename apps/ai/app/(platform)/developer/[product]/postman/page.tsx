import { redirect } from "next/navigation";
import { requireOrgPermission } from "@/lib/permissions";
import { PUBLIC_API_BASE_URL } from "@/lib/public-api-config";
import { DEVELOPER_PRODUCTS, isDeveloperProductSlug } from "../../product-config";
import { PostmanGuideContent } from "./PostmanGuideContent";

export default async function PostmanGuidePage({ params }: { params: Promise<{ product: string }> }) {
  await requireOrgPermission("api_keys");
  const { product } = await params;
  if (!isDeveloperProductSlug(product)) redirect("/developer");
  if (!DEVELOPER_PRODUCTS[product].tabs.includes("postman")) redirect(`/developer/${product}/overview`);

  return <PostmanGuideContent baseUrl={PUBLIC_API_BASE_URL} />;
}
