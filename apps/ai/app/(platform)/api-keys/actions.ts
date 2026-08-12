"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey, hashApiKey, toDbEnvironment, fromDbEnvironment, type ApiKeyEnvironment } from "@/lib/kyc/api-keys";
import { getMemberAccess } from "@/lib/permissions";
import { isProductionApproved } from "@/lib/product-access";

// Mirrors (platform)/actions.ts's shape: session-scoped client, user/org
// re-derived from the session every time, never trusted from a caller-
// supplied argument. Every write below is additionally scoped with
// .eq("organization_id", ...) even though the RLS policies on
// api_keys already enforce the same boundary — defense in depth costs
// nothing here.
//
// Also re-checks the api_keys permission itself — the page being gated
// isn't enough, since a server action is reachable directly regardless of
// which page's UI happened to render the button that calls it.
async function currentOrgContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("default_org_id").eq("id", user.id).single();

  if (!profile?.default_org_id) return null;

  const access = await getMemberAccess(user.id, profile.default_org_id);
  if (!access || !access.permissions.api_keys) return null;

  return { supabase, userId: user.id, organizationId: profile.default_org_id as string };
}

export async function generateApiKeyAction(name: string, environment: ApiKeyEnvironment, productSlug: "kyc" = "kyc") {
  const ctx = await currentOrgContext();
  if (!ctx) return { ok: false as const, message: "Not signed in to an organization." };

  // Server-side entitlement check — the environment selector on the
  // client is not sufficient, since a Server Action is reachable directly
  // regardless of which UI state happened to render the button. Sandbox
  // key generation is unaffected; only "live" (Production) requires an
  // approved production_status row for this org+product.
  if (environment === "live" && !(await isProductionApproved(ctx.organizationId, productSlug))) {
    return {
      ok: false as const,
      message: "Production access has not been approved for this product.",
      code: "PRODUCTION_ACCESS_REQUIRED" as const,
    };
  }

  const trimmedName = name.trim().slice(0, 100) || (environment === "live" ? "Production key" : "Sandbox key");
  const { fullKey, keyPrefix } = generateApiKey(environment);

  const { data, error } = await ctx.supabase
    .from("api_keys")
    .insert({
      organization_id: ctx.organizationId,
      name: trimmedName,
      environment: toDbEnvironment(environment),
      key_prefix: keyPrefix,
      key_hash: hashApiKey(fullKey),
      created_by: ctx.userId,
      // "kyc" is the only real product with an API today — passed
      // explicitly (not defaulted server-side without a caller signal) so
      // a future product's key generator can't get wired to this action
      // by accident without deliberately passing its own slug.
      product_slug: productSlug,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false as const, message: error?.message || "Failed to create API key." };
  }

  revalidatePath("/api-keys");
  // fullKey is returned exactly once — nothing persists it in plaintext,
  // and there's no way to retrieve it again after this response.
  return { ok: true as const, keyId: data.id as string, fullKey };
}

export async function rotateApiKeyAction(id: string) {
  const ctx = await currentOrgContext();
  if (!ctx) return { ok: false as const, message: "Not signed in to an organization." };

  const { data: existing } = await ctx.supabase
    .from("api_keys")
    .select("environment")
    .eq("id", id)
    .eq("organization_id", ctx.organizationId)
    .single();

  if (!existing) return { ok: false as const, message: "Key not found." };

  const { fullKey, keyPrefix } = generateApiKey(fromDbEnvironment(existing.environment));

  const { error } = await ctx.supabase
    .from("api_keys")
    .update({ key_prefix: keyPrefix, key_hash: hashApiKey(fullKey), rotated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", ctx.organizationId);

  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/api-keys");
  return { ok: true as const, fullKey };
}

export async function revokeApiKeyAction(id: string) {
  const ctx = await currentOrgContext();
  if (!ctx) return { ok: false as const, message: "Not signed in to an organization." };

  const { error } = await ctx.supabase
    .from("api_keys")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", ctx.organizationId);

  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/api-keys");
  return { ok: true as const };
}
