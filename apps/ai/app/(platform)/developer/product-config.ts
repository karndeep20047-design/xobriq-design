// Single source of truth for which developer products exist, what they're
// called, and which workspace tabs are real for each one — the thing that
// lets the Product Hub and [product] workspace stay data-driven instead
// of hardcoding "if kyc ... else if guard ..." branches across components.
// Adding a third product later means adding one entry here, not touching
// the layout/route structure.
export type DeveloperProductSlug = "kyc" | "guard";
export type DeveloperTabKey = "overview" | "api-keys" | "quick-start" | "api-reference" | "postman" | "production";

export type DeveloperProductConfig = {
  slug: DeveloperProductSlug;
  name: string;
  tagline: string;
  description: string;
  tabs: DeveloperTabKey[];
  comingSoon: boolean;
};

export const DEVELOPER_PRODUCTS: Record<DeveloperProductSlug, DeveloperProductConfig> = {
  kyc: {
    slug: "kyc",
    name: "Xobriq KYC",
    tagline: "AI-powered identity and business verification",
    description:
      "Verify National IDs, Alien IDs, KRA PINs, bank accounts, driving licences, number plates, phone numbers, and business registrations — all through one Xobriq-branded API.",
    tabs: ["overview", "api-keys", "quick-start", "api-reference", "postman", "production"],
    comingSoon: false,
  },
  guard: {
    slug: "guard",
    name: "Xobriq Guard",
    tagline: "Fraud, risk, and security infrastructure",
    description: "Real-time fraud and identity defence for digital transactions and customer journeys.",
    tabs: ["overview"],
    comingSoon: true,
  },
};

export const DEVELOPER_TAB_LABELS: Record<DeveloperTabKey, string> = {
  overview: "Overview",
  "api-keys": "API Keys",
  "quick-start": "Quick Start",
  "api-reference": "API Reference",
  postman: "Postman Guide",
  production: "Production Access",
};

export function isDeveloperProductSlug(value: string): value is DeveloperProductSlug {
  return value === "kyc" || value === "guard";
}

export type KycCapability = {
  key: string;
  name: string;
  description: string;
  identifierType?: string;
};

// Every one of these is real and already implemented — not aspirational.
// "identity" verification covers 6 identifierType values through the same
// endpoint; phone and business are separate endpoints. See
// lib/kyc/providers/provider.interface.ts for the normalized result
// shapes and app/api/v1/kyc/verify-identity/route.ts's identifierType enum.
export const KYC_CAPABILITIES: KycCapability[] = [
  { key: "national_id", name: "National ID Verification", description: "Verify a Kenyan National ID against the identity registry.", identifierType: "national_id" },
  { key: "alien_id", name: "Alien ID Verification", description: "Verify a foreign national's Alien ID.", identifierType: "krapinalien_id" },
  { key: "kra_pin", name: "KRA PIN Verification", description: "Verify a KRA PIN against tax registry records.", identifierType: "krapin" },
  { key: "bank_account", name: "Bank Account Verification", description: "Verify a bank account number against the account holder.", identifierType: "bank" },
  { key: "driving_licence", name: "Driving Licence Verification", description: "Verify a driving licence number.", identifierType: "dl" },
  { key: "number_plate", name: "Number Plate Verification", description: "Verify a vehicle registration/number plate.", identifierType: "plate" },
  { key: "phone", name: "Telephone Verification", description: "Confirm a mobile number is registered against a given National ID." },
  { key: "business", name: "Know Your Business (KYB)", description: "Look up a business registration and its beneficial owners." },
];
