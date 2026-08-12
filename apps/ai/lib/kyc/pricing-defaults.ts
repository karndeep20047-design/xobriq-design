import "server-only";

// Plan-tiered default client pricing, seeded into kyc_client_pricing when
// staff enable KYC for a client org (console/clients/actions.ts). Matches
// the existing organizations.plan enum (free/sandbox/growth/enterprise —
// see console/clients/actions.ts's CreateClientSchema). These are starting
// points, not fixed — a future per-client pricing editor can insert a new
// kyc_client_pricing row to override any of them.
export type VerificationType = "identity" | "phone" | "business";
export type OrgPlan = "free" | "sandbox" | "growth" | "enterprise";

export const PLAN_DEFAULT_PRICING: Record<OrgPlan, Record<VerificationType, number>> = {
  free: { identity: 40, phone: 25, business: 60 },
  sandbox: { identity: 35, phone: 20, business: 50 },
  growth: { identity: 30, phone: 18, business: 45 },
  enterprise: { identity: 25, phone: 15, business: 40 },
};

export const DEFAULT_CURRENCY = "KES";
