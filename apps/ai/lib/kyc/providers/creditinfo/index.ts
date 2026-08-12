import "server-only";

import type { KycProviderAdapter, ProviderHealth, ProviderEnvironment } from "../provider.interface";
import { verifyBusiness as verifyBusinessRaw } from "./verify-business";
import { verifyIdentity as verifyIdentityRaw } from "./verify-identity";
import { verifyPhone as verifyPhoneRaw } from "./verify-phone";
import { creditinfoMissingEnvVars, isCreditinfoProductionEnabled } from "./config";

// A single choke point for the "Production traffic isn't allowed to run
// yet" kill switch (see config.ts's isCreditinfoProductionEnabled) — every
// real verify call goes through here, so there's exactly one place this
// gets enforced rather than three call sites that could drift.
function assertEnvironmentAllowed(environment: ProviderEnvironment) {
  if (environment === "production" && !isCreditinfoProductionEnabled()) {
    throw new Error(
      "Production KYC verification is not yet enabled. Contact Xobriq engineering to confirm activation preconditions."
    );
  }
}

async function verifyIdentity(...args: Parameters<typeof verifyIdentityRaw>) {
  assertEnvironmentAllowed(args[1]);
  return verifyIdentityRaw(...args);
}

async function verifyPhone(...args: Parameters<typeof verifyPhoneRaw>) {
  assertEnvironmentAllowed(args[1]);
  return verifyPhoneRaw(...args);
}

async function verifyBusiness(...args: Parameters<typeof verifyBusinessRaw>) {
  assertEnvironmentAllowed(args[1]);
  return verifyBusinessRaw(...args);
}

async function healthCheck(environment: ProviderEnvironment = "sandbox"): Promise<ProviderHealth> {
  const missing = creditinfoMissingEnvVars(environment);
  if (missing.length > 0) {
    return { healthy: false, detail: `Missing env vars: ${missing.join(", ")}` };
  }
  if (environment === "production" && !isCreditinfoProductionEnabled()) {
    return { healthy: false, detail: "Production traffic is not enabled (CREDITINFO_PRODUCTION_ENABLED is not \"true\")." };
  }

  try {
    // A real, cheap round-trip against the KYC strategy is the only reliable
    // signal Creditinfo's IDM API gives us — there's no dedicated ping/health
    // endpoint. Uses a fixed test identifier appropriate to the environment
    // being checked.
    await verifyIdentityRaw({ identifierType: "national_id", identifierNumber: "1234567" }, environment);
    return { healthy: true };
  } catch (err) {
    return { healthy: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export const CreditinfoAdapter: KycProviderAdapter = {
  key: "creditinfo",
  verifyIdentity,
  verifyPhone,
  verifyBusiness,
  healthCheck,
};
