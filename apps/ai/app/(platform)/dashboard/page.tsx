import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMemberAccess, getFirstAccessibleRoute } from "@/lib/permissions";
import { getProductAccessStatus, type ProductSlug } from "@/lib/product-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export const metadata = { title: "Dashboard — Xobriq" };

const DASHBOARD_PRODUCTS: ProductSlug[] = ["kyc", "guard", "cloud"];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const orgId = user?.default_org_id || null;

  // Only gate this once the user actually belongs to an org — someone with
  // no org yet still needs to land here to see the "Organization setup
  // pending" messaging, and there's no membership row to check permissions
  // against. Redirects to getFirstAccessibleRoute (never back to /dashboard
  // itself) to avoid a self-redirect loop.
  if (orgId && user) {
    const access = await getMemberAccess(user.id, orgId);
    if (!access || !access.permissions.dashboard) {
      redirect(getFirstAccessibleRoute(access));
    }
  }

  const statuses = await Promise.all(
    DASHBOARD_PRODUCTS.map((slug) => getProductAccessStatus(orgId, slug))
  );

  const productAccess = Object.fromEntries(
    DASHBOARD_PRODUCTS.map((slug, i) => [slug, statuses[i]])
  ) as Record<ProductSlug, Awaited<ReturnType<typeof getProductAccessStatus>>>;

  let activeApiKeys = 0;
  let subscribedProducts = 0;
  if (orgId) {
    const admin = createAdminClient();
    const [{ count: keyCount }, { count: productCount }] = await Promise.all([
      admin.from("api_keys").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "active"),
      admin.from("product_access_requests").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "approved"),
    ]);
    activeApiKeys = keyCount || 0;
    subscribedProducts = productCount || 0;
  }

  return (
    <DashboardOverview
      productAccess={productAccess}
      metrics={{ activeApiKeys, subscribedProducts }}
    />
  );
}
