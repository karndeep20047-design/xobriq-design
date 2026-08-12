import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOrgPermission } from "@/lib/permissions";
import { fromDbEnvironment } from "@/lib/kyc/api-keys";
import { ApiKeysClient, type ApiKeyRow } from "@/app/(platform)/api-keys/ApiKeysClient";
import { DEVELOPER_PRODUCTS, isDeveloperProductSlug } from "../../product-config";

const KEY_COLUMNS = "id, name, environment, key_prefix, status, created_at, last_used_at, rotated_at, revoked_at";

export default async function DeveloperApiKeysPage({ params }: { params: Promise<{ product: string }> }) {
  await requireOrgPermission("api_keys");
  const { product } = await params;
  if (!isDeveloperProductSlug(product)) redirect("/developer");
  if (!DEVELOPER_PRODUCTS[product].tabs.includes("api-keys")) redirect(`/developer/${product}/overview`);

  const supabase = await createClient();
  // Same RLS-scoped query the old /api-keys page used — org scoping comes
  // from the api_keys RLS policy on the session client, not an explicit
  // .eq() here. Phase 1 only has real keys for "kyc", so no product_slug
  // filter is applied yet — see resolveApiKey() for the actual server-side
  // enforcement that a non-kyc key can't authenticate against this API.
  const { data } = await supabase.from("api_keys").select(KEY_COLUMNS).order("created_at", { ascending: false });

  const rows = (data || []).map((row) => ({
    ...row,
    environment: fromDbEnvironment(row.environment),
  })) as ApiKeyRow[];

  return <ApiKeysClient initialKeys={rows} />;
}
