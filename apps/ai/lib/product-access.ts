// apps/ai/lib/product-access.ts
// Product access requests: a client org must request access to a product
// (e.g. "kyc") and Xobriq staff must approve it before the corresponding
// mini-dashboard is reachable. One row per (organization_id, product_slug) —
// re-requesting after a denial flips the existing row back to "pending"
// rather than creating a new one.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRODUCT_SLUGS = ["kyc", "guard", "cloud", "agentic", "consult", "cyber"] as const;
export type ProductSlug = (typeof PRODUCT_SLUGS)[number];

export type ProductAccessStatus = "none" | "pending" | "approved" | "denied";

export async function getProductAccessStatus(
  organizationId: string | null,
  productSlug: ProductSlug
): Promise<ProductAccessStatus> {
  if (!organizationId) return "none";

  const admin = createAdminClient();
  const { data } = await admin
    .from("product_access_requests")
    .select("status")
    .eq("organization_id", organizationId)
    .eq("product_slug", productSlug)
    .maybeSingle();

  return (data?.status as ProductAccessStatus) || "none";
}

export type ProductAccessDetail = {
  status: ProductAccessStatus;
  validUntil: string | null;
};

// Same as getProductAccessStatus, plus the subscription validity date so
// UI that needs to show/warn about an upcoming renewal doesn't need a
// second round trip. Kept as a separate function rather than changing
// getProductAccessStatus's return shape, since that one's already used in
// several places expecting a plain string.
export async function getProductAccessDetail(
  organizationId: string | null,
  productSlug: ProductSlug
): Promise<ProductAccessDetail> {
  if (!organizationId) return { status: "none", validUntil: null };

  const admin = createAdminClient();
  const { data } = await admin
    .from("product_access_requests")
    .select("status, valid_until")
    .eq("organization_id", organizationId)
    .eq("product_slug", productSlug)
    .maybeSingle();

  return {
    status: (data?.status as ProductAccessStatus) || "none",
    validUntil: data?.valid_until ?? null,
  };
}

export function daysUntil(dateIso: string | null): number | null {
  if (!dateIso) return null;
  return Math.ceil((new Date(dateIso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

// Production access is a separate dimension from the "status" column
// above (which is the general/sandbox-tier access this file already
// tracked) — a org can be fully approved for sandbox use of a product
// while still not_requested/pending/rejected for that same product's
// Production environment. See _run_me_production_access.sql.
export const PRODUCTION_ACCESS_STATUSES = [
  "not_requested",
  "pending",
  "more_information_required",
  "approved",
  "rejected",
  "suspended",
] as const;
export type ProductionAccessStatus = (typeof PRODUCTION_ACCESS_STATUSES)[number];

export type ProductionAccessDetail = {
  status: ProductionAccessStatus;
  requestedAt: string | null;
  reviewedAt: string | null;
  clientMessage: string | null;
  suspendedAt: string | null;
};

const PRODUCTION_COLUMNS =
  "production_status, production_requested_at, production_reviewed_at, production_client_message, production_suspended_at";

export async function getProductionAccessDetail(
  organizationId: string | null,
  productSlug: ProductSlug
): Promise<ProductionAccessDetail> {
  if (!organizationId) {
    return { status: "not_requested", requestedAt: null, reviewedAt: null, clientMessage: null, suspendedAt: null };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("product_access_requests")
    .select(PRODUCTION_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("product_slug", productSlug)
    .maybeSingle();

  return {
    status: (data?.production_status as ProductionAccessStatus) || "not_requested",
    requestedAt: data?.production_requested_at ?? null,
    reviewedAt: data?.production_reviewed_at ?? null,
    clientMessage: data?.production_client_message ?? null,
    suspendedAt: data?.production_suspended_at ?? null,
  };
}

// The one server-side question every production-key-generation and
// production-API-request check actually needs answered — kept as its own
// function (rather than making every call site compare
// getProductionAccessDetail(...).status === "approved" itself) so the
// definition of "approved" lives in exactly one place.
export async function isProductionApproved(organizationId: string | null, productSlug: ProductSlug): Promise<boolean> {
  const detail = await getProductionAccessDetail(organizationId, productSlug);
  return detail.status === "approved";
}

export type ProductionReadinessItem = {
  key: string;
  label: string;
  complete: boolean;
  manualReview: boolean;
};

// Every item here is either a real, derived-from-existing-data check, or
// explicitly flagged manualReview: true — nothing is faked to look
// checkable when this app has no real data behind it yet (no
// payment-method-on-file, compliance-document-upload, ToS-acceptance
// timestamp, or technical-contact field exists anywhere in the schema
// today).
export async function getProductionReadiness(organizationId: string | null): Promise<ProductionReadinessItem[]> {
  if (!organizationId) {
    return readinessItems({ profileComplete: false, walletFunded: false, sandboxUsed: false });
  }

  const admin = createAdminClient();
  const [{ data: org }, { data: wallet }, { data: usedSandboxKey }] = await Promise.all([
    admin.from("organizations").select("billing_email").eq("id", organizationId).maybeSingle(),
    admin.from("kyc_wallets").select("balance").eq("organization_id", organizationId).maybeSingle(),
    admin
      .from("api_keys")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("environment", "sandbox")
      .not("last_used_at", "is", null)
      .limit(1)
      .maybeSingle(),
  ]);

  return readinessItems({
    profileComplete: !!org?.billing_email,
    walletFunded: Number(wallet?.balance ?? 0) > 0,
    sandboxUsed: !!usedSandboxKey,
  });
}

function readinessItems(real: { profileComplete: boolean; walletFunded: boolean; sandboxUsed: boolean }): ProductionReadinessItem[] {
  return [
    { key: "profile", label: "Organization profile complete", complete: real.profileComplete, manualReview: false },
    { key: "billing", label: "Billing method or contract configured", complete: false, manualReview: true },
    { key: "wallet", label: "Wallet funded or invoicing arrangement approved", complete: real.walletFunded, manualReview: false },
    { key: "compliance", label: "Compliance information completed", complete: false, manualReview: true },
    { key: "terms", label: "Product terms accepted", complete: false, manualReview: true },
    { key: "sandbox", label: "Sandbox integration completed", complete: real.sandboxUsed, manualReview: false },
    { key: "contact", label: "Technical contact configured", complete: false, manualReview: true },
  ];
}
