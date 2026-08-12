import "server-only";

import type { ProviderEnvironment } from "../provider.interface";

// Single place that resolves which Creditinfo credential set a call should
// use. Before this file existed there was exactly one unqualified
// credential set (CREDITINFO_BASE_URL/USERNAME/PASSWORD/STRATEGY_*),
// pointed at Creditinfo's sandbox host, used for every call regardless of
// whether the inbound Xobriq API key was sandbox or production. That set
// is renamed (not removed) to CREDITINFO_SANDBOX_* below so sandbox
// traffic keeps working exactly as it does today; CREDITINFO_PROD_* is a
// new, separate set for calls made through an approved-production Xobriq
// key. Nothing outside this file should read a CREDITINFO_* env var
// directly.
export type CreditinfoEnvironment = ProviderEnvironment;

export type CreditinfoCredentials = {
  baseUrl: string;
  username: string;
  password: string;
  kycStrategyId: string;
  phoneStrategyId: string;
  brsUboStrategyId: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function getCreditinfoCredentials(environment: CreditinfoEnvironment): CreditinfoCredentials {
  if (environment === "production") {
    return {
      baseUrl: required("CREDITINFO_PROD_BASE_URL"),
      username: required("CREDITINFO_PROD_USERNAME"),
      password: required("CREDITINFO_PROD_PASSWORD"),
      // Named exactly as given by Creditinfo/ops for the production
      // strategy IDs — unlike the base URL/username/password, these
      // aren't secrets, so there's no separate "rotated value required"
      // concern blocking wiring them in now.
      kycStrategyId: required("CREDITINFO_KYC_STRATEGY_ID"),
      phoneStrategyId: required("CREDITINFO_PHONE_STRATEGY_ID"),
      brsUboStrategyId: required("CREDITINFO_BRS_UBO_STRATEGY_ID"),
    };
  }
  return {
    baseUrl: required("CREDITINFO_SANDBOX_BASE_URL"),
    username: required("CREDITINFO_SANDBOX_USERNAME"),
    password: required("CREDITINFO_SANDBOX_PASSWORD"),
    kycStrategyId: required("CREDITINFO_SANDBOX_KYC_STRATEGY_ID"),
    phoneStrategyId: required("CREDITINFO_SANDBOX_PHONE_STRATEGY_ID"),
    brsUboStrategyId: required("CREDITINFO_SANDBOX_BRS_UBO_STRATEGY_ID"),
  };
}

export function creditinfoMissingEnvVars(environment: CreditinfoEnvironment): string[] {
  const names =
    environment === "production"
      ? ["CREDITINFO_PROD_BASE_URL", "CREDITINFO_PROD_USERNAME", "CREDITINFO_PROD_PASSWORD", "CREDITINFO_KYC_STRATEGY_ID", "CREDITINFO_PHONE_STRATEGY_ID", "CREDITINFO_BRS_UBO_STRATEGY_ID"]
      : ["CREDITINFO_SANDBOX_BASE_URL", "CREDITINFO_SANDBOX_USERNAME", "CREDITINFO_SANDBOX_PASSWORD", "CREDITINFO_SANDBOX_KYC_STRATEGY_ID", "CREDITINFO_SANDBOX_PHONE_STRATEGY_ID", "CREDITINFO_SANDBOX_BRS_UBO_STRATEGY_ID"];
  return names.filter((name) => !process.env[name]);
}

/**
 * The explicit kill switch for Production Creditinfo traffic — deliberately
 * separate from "are the CREDITINFO_PROD_* env vars present", so a rotated
 * credential can be installed and verified (via the connectivity test)
 * without any real client call being able to reach Production yet. Flip
 * to "true" only once every precondition is actually met: the rotated
 * (not the chat-shared) password is installed, per-org production
 * entitlement is approved (see lib/product-access.ts), real BeginQuery/
 * EndQuery response samples have been verified against this codebase's
 * mapper.ts, polling behavior is confirmed against the Production API,
 * and rate-limit/IP-allowlisting requirements are confirmed with
 * Creditinfo. Defaults to disabled.
 */
export function isCreditinfoProductionEnabled(): boolean {
  return process.env.CREDITINFO_PRODUCTION_ENABLED === "true";
}

// Never log a full secret, even at debug level — used by the connectivity
// test and anywhere else that might want to confirm "a value is present"
// without revealing it.
export function maskSecret(value: string): string {
  if (value.length <= 4) return "*".repeat(value.length);
  return value.slice(0, 2) + "*".repeat(Math.max(4, value.length - 4)) + value.slice(-2);
}
