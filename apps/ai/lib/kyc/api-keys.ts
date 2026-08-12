import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isProductionApproved, type ProductSlug } from "@/lib/product-access";

export type ApiKeyEnvironment = "test" | "live";

// xob_test_/xob_live_ matches the prefix the (platform)/api-keys mock UI
// already showed before this was wired to real data. 32 random bytes hex
// (64 chars) — no existing crypto dependency in this repo (no bcrypt/nanoid/
// uuid package), so this uses Node's built-in crypto rather than adding one.
export function generateApiKey(environment: ApiKeyEnvironment): { fullKey: string; keyPrefix: string } {
  const secret = randomBytes(32).toString("hex");
  const fullKey = `xob_${environment}_${secret}`;
  // First 16 chars of the full key (includes the prefix) — enough for an
  // org to recognize which key is which in a list without exposing
  // anything that shortens a brute-force search of the remaining secret.
  const keyPrefix = fullKey.slice(0, 16);
  return { fullKey, keyPrefix };
}

export function hashApiKey(fullKey: string): string {
  return createHash("sha256").update(fullKey).digest("hex");
}

// The app's ApiKeyEnvironment vocabulary ("test"/"live" — used for the raw
// key prefix and every UI label) predates and differs from the live
// database's environment column, which a separate branch's migration
// constrained to "sandbox"/"production" after renaming this table from
// kyc_api_keys to api_keys. These two functions are the only place that
// vocabulary gap is bridged — every DB read/write goes through them so the
// app-level type never has to change.
export function toDbEnvironment(environment: ApiKeyEnvironment): "sandbox" | "production" {
  return environment === "live" ? "production" : "sandbox";
}

export function fromDbEnvironment(dbEnvironment: string): ApiKeyEnvironment {
  return dbEnvironment === "production" ? "live" : "test";
}

/**
 * Resolves a Bearer token from the Authorization header to an
 * organization_id, for the API-key auth path in lib/kyc/api-auth.ts. Always
 * uses the admin client — an API key isn't a Supabase Auth session, so
 * there's no auth.uid() for RLS to key off here; isolation for this path is
 * enforced by this lookup itself (only an exact key_hash match resolves to
 * an organization_id), same trust model as most API-key systems.
 */
export type ResolvedApiKey =
  | { ok: true; organizationId: string; keyId: string; environment: "sandbox" | "production" }
  // A real, active, correctly-product-scoped key whose environment is
  // production but whose organization isn't (or is no longer) approved
  // for that product's Production access — distinct from "key not
  // found/inactive/wrong product" (a plain 401 everywhere else) so the
  // caller can return the more specific PRODUCTION_ACCESS_REQUIRED error
  // instead of a generic "invalid api key".
  | { ok: false; reason: "production_access_required" };

export async function resolveApiKey(bearerToken: string): Promise<ResolvedApiKey | null> {
  const admin = createAdminClient();
  const keyHash = hashApiKey(bearerToken);

  const { data } = await admin
    .from("api_keys")
    .select("id, organization_id, status, product_slug, environment")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!data || data.status !== "active") return null;
  // Every key created before product scoping existed has product_slug ===
  // null and is treated as a KYC key (see the backfill migration) — but a
  // key explicitly scoped to a different product (e.g. a future Guard key)
  // must never authenticate against the KYC API. This is the actual
  // enforcement point; the client-facing generator only sets the intent.
  const productSlug = (data.product_slug || "kyc") as ProductSlug;
  if (productSlug !== "kyc") return null;

  if (data.environment === "production" && !(await isProductionApproved(data.organization_id, productSlug))) {
    return { ok: false, reason: "production_access_required" };
  }

  // Fire-and-forget — a failed last_used_at update shouldn't block or fail
  // the actual request.
  void (async () => {
    try {
      await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
    } catch {
      // best-effort only
    }
  })();

  return {
    ok: true,
    organizationId: data.organization_id,
    keyId: data.id,
    environment: data.environment === "production" ? "production" : "sandbox",
  };
}
