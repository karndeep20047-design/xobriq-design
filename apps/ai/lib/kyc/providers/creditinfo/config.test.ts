import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getCreditinfoCredentials, creditinfoMissingEnvVars, isCreditinfoProductionEnabled, maskSecret } from "./config";

const SANDBOX_VARS = {
  CREDITINFO_SANDBOX_BASE_URL: "https://idmtest.creditinfo.co.ke/api/strategies",
  CREDITINFO_SANDBOX_USERNAME: "sandbox-user",
  CREDITINFO_SANDBOX_PASSWORD: "sandbox-pass",
  CREDITINFO_SANDBOX_KYC_STRATEGY_ID: "sandbox-kyc-id",
  CREDITINFO_SANDBOX_PHONE_STRATEGY_ID: "sandbox-phone-id",
  CREDITINFO_SANDBOX_BRS_UBO_STRATEGY_ID: "sandbox-brs-id",
};

const PROD_VARS = {
  CREDITINFO_PROD_BASE_URL: "https://idm.creditinfo.co.ke/api/strategies",
  CREDITINFO_PROD_USERNAME: "prod-user",
  CREDITINFO_PROD_PASSWORD: "prod-pass",
  CREDITINFO_KYC_STRATEGY_ID: "prod-kyc-id",
  CREDITINFO_PHONE_STRATEGY_ID: "prod-phone-id",
  CREDITINFO_BRS_UBO_STRATEGY_ID: "prod-brs-id",
};

const ALL_VAR_NAMES = [...Object.keys(SANDBOX_VARS), ...Object.keys(PROD_VARS), "CREDITINFO_PRODUCTION_ENABLED"];
const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const name of ALL_VAR_NAMES) originalEnv[name] = process.env[name];
});

afterEach(() => {
  for (const name of ALL_VAR_NAMES) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
});

describe("getCreditinfoCredentials", () => {
  it("resolves the sandbox set without ever reading production values", () => {
    Object.assign(process.env, SANDBOX_VARS, PROD_VARS);
    const creds = getCreditinfoCredentials("sandbox");
    expect(creds).toEqual({
      baseUrl: SANDBOX_VARS.CREDITINFO_SANDBOX_BASE_URL,
      username: SANDBOX_VARS.CREDITINFO_SANDBOX_USERNAME,
      password: SANDBOX_VARS.CREDITINFO_SANDBOX_PASSWORD,
      kycStrategyId: SANDBOX_VARS.CREDITINFO_SANDBOX_KYC_STRATEGY_ID,
      phoneStrategyId: SANDBOX_VARS.CREDITINFO_SANDBOX_PHONE_STRATEGY_ID,
      brsUboStrategyId: SANDBOX_VARS.CREDITINFO_SANDBOX_BRS_UBO_STRATEGY_ID,
    });
  });

  it("resolves the production set without ever reading sandbox values", () => {
    Object.assign(process.env, SANDBOX_VARS, PROD_VARS);
    const creds = getCreditinfoCredentials("production");
    expect(creds).toEqual({
      baseUrl: PROD_VARS.CREDITINFO_PROD_BASE_URL,
      username: PROD_VARS.CREDITINFO_PROD_USERNAME,
      password: PROD_VARS.CREDITINFO_PROD_PASSWORD,
      kycStrategyId: PROD_VARS.CREDITINFO_KYC_STRATEGY_ID,
      phoneStrategyId: PROD_VARS.CREDITINFO_PHONE_STRATEGY_ID,
      brsUboStrategyId: PROD_VARS.CREDITINFO_BRS_UBO_STRATEGY_ID,
    });
  });

  it("throws rather than silently falling back when a required var is missing", () => {
    Object.assign(process.env, SANDBOX_VARS);
    delete process.env.CREDITINFO_SANDBOX_PASSWORD;
    expect(() => getCreditinfoCredentials("sandbox")).toThrow("CREDITINFO_SANDBOX_PASSWORD is not set");
  });

  it("never mixes a partially-configured production set with sandbox fallbacks", () => {
    Object.assign(process.env, SANDBOX_VARS);
    process.env.CREDITINFO_PROD_BASE_URL = PROD_VARS.CREDITINFO_PROD_BASE_URL;
    // Only base URL set for production — everything else missing.
    expect(() => getCreditinfoCredentials("production")).toThrow("CREDITINFO_PROD_USERNAME is not set");
  });
});

describe("creditinfoMissingEnvVars", () => {
  it("reports nothing missing once every sandbox var is set", () => {
    Object.assign(process.env, SANDBOX_VARS);
    expect(creditinfoMissingEnvVars("sandbox")).toEqual([]);
  });

  it("lists exactly the missing production vars, prefixed correctly", () => {
    for (const name of Object.keys(PROD_VARS)) delete process.env[name];
    process.env.CREDITINFO_PROD_BASE_URL = PROD_VARS.CREDITINFO_PROD_BASE_URL;
    const missing = creditinfoMissingEnvVars("production");
    expect(missing).not.toContain("CREDITINFO_PROD_BASE_URL");
    expect(missing).toContain("CREDITINFO_PROD_USERNAME");
    expect(missing).toContain("CREDITINFO_KYC_STRATEGY_ID");
  });
});

describe("isCreditinfoProductionEnabled", () => {
  it("is false when unset", () => {
    delete process.env.CREDITINFO_PRODUCTION_ENABLED;
    expect(isCreditinfoProductionEnabled()).toBe(false);
  });

  it("is false for any value other than the exact string \"true\"", () => {
    process.env.CREDITINFO_PRODUCTION_ENABLED = "1";
    expect(isCreditinfoProductionEnabled()).toBe(false);
    process.env.CREDITINFO_PRODUCTION_ENABLED = "TRUE";
    expect(isCreditinfoProductionEnabled()).toBe(false);
  });

  it("is true only for the exact string \"true\"", () => {
    process.env.CREDITINFO_PRODUCTION_ENABLED = "true";
    expect(isCreditinfoProductionEnabled()).toBe(true);
  });
});

describe("maskSecret", () => {
  it("never returns the original value verbatim", () => {
    // Deliberately generic/synthetic — never use a real credential (even
    // an old/rotated one) as a test fixture, since this file is committed
    // to git history.
    const secret = "sYnth3tic_Secr3tValue";
    const masked = maskSecret(secret);
    expect(masked).not.toBe(secret);
    expect(masked).not.toContain(secret);
  });

  it("preserves only the first and last two characters", () => {
    expect(maskSecret("example.username")).toBe("ex************me");
  });

  it("fully masks very short values instead of leaking them via the head/tail", () => {
    const masked = maskSecret("abcd");
    expect(masked).toBe("****");
  });
});
