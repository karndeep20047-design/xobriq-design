import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CreditinfoAdapter } from "./index";
import { CreditinfoResponseFormatError } from "./errors";

const SANDBOX_VARS = {
  CREDITINFO_SANDBOX_BASE_URL: "https://idmtest.example/api/strategies",
  CREDITINFO_SANDBOX_USERNAME: "test-sandbox-user",
  CREDITINFO_SANDBOX_PASSWORD: "test-sandbox-pass",
  CREDITINFO_SANDBOX_KYC_STRATEGY_ID: "sandbox-kyc-strategy",
  CREDITINFO_SANDBOX_PHONE_STRATEGY_ID: "sandbox-phone-strategy",
  CREDITINFO_SANDBOX_BRS_UBO_STRATEGY_ID: "sandbox-brs-strategy",
};
const PROD_VARS = {
  CREDITINFO_PROD_BASE_URL: "https://idm.example/api/strategies",
  CREDITINFO_PROD_USERNAME: "test-prod-user",
  CREDITINFO_PROD_PASSWORD: "test-prod-pass",
  CREDITINFO_KYC_STRATEGY_ID: "prod-kyc-strategy",
  CREDITINFO_PHONE_STRATEGY_ID: "prod-phone-strategy",
  CREDITINFO_BRS_UBO_STRATEGY_ID: "prod-brs-strategy",
};

const originalEnv: Record<string, string | undefined> = {};
const originalFetch = global.fetch;

beforeEach(() => {
  for (const name of [...Object.keys(SANDBOX_VARS), ...Object.keys(PROD_VARS), "CREDITINFO_PRODUCTION_ENABLED"]) {
    originalEnv[name] = process.env[name];
  }
  Object.assign(process.env, SANDBOX_VARS, PROD_VARS);
  delete process.env.CREDITINFO_PRODUCTION_ENABLED;
});

afterEach(() => {
  for (const name of Object.keys(originalEnv)) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
  global.fetch = originalFetch;
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

// Shape mirrors mapper.ts's expected wrapper — this is the "normalization"
// half of the connectivity test, exercised against a realistic (but fully
// synthetic) Creditinfo response, not real PII.
const IDENTITY_MATCH_RESPONSE = {
  Data: {
    response: {
      IdmIdentifyAfrica: {
        data: {
          response: {
            success: "true",
            data: {
              valid: "true",
              name: "TEST PERSON",
              first_name: "TEST",
              last_name: "PERSON",
              gender: "MALE",
              dob: "1990-01-01",
              citizenship: "KENYAN",
              id_number: "1234567",
            },
          },
        },
      },
    },
  },
};

describe("CreditinfoAdapter — production kill switch", () => {
  it("refuses a production call and makes zero network requests when CREDITINFO_PRODUCTION_ENABLED is not \"true\"", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      CreditinfoAdapter.verifyIdentity({ identifierType: "national_id", identifierNumber: "1234567" }, "production")
    ).rejects.toThrow(/not yet enabled/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still allows a sandbox call when the production flag is unset", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { Token: "tok_1" }))
      .mockResolvedValueOnce(jsonResponse(200, IDENTITY_MATCH_RESPONSE)) as unknown as typeof fetch;

    const result = await CreditinfoAdapter.verifyIdentity({ identifierType: "national_id", identifierNumber: "1234567" }, "sandbox");
    expect(result.matched).toBe(true);
  });

  it("allows a production call once the flag is explicitly \"true\"", async () => {
    process.env.CREDITINFO_PRODUCTION_ENABLED = "true";
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { Token: "tok_prod" }))
      .mockResolvedValueOnce(jsonResponse(200, IDENTITY_MATCH_RESPONSE)) as unknown as typeof fetch;

    const result = await CreditinfoAdapter.verifyIdentity({ identifierType: "national_id", identifierNumber: "1234567" }, "production");
    expect(result.matched).toBe(true);
  });
});

describe("CreditinfoAdapter — normalization", () => {
  it("maps a matched identity response into the app's normalized shape with no Creditinfo-native fields leaking through", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { Token: "tok_1" }))
      .mockResolvedValueOnce(jsonResponse(200, IDENTITY_MATCH_RESPONSE)) as unknown as typeof fetch;

    const result = await CreditinfoAdapter.verifyIdentity({ identifierType: "national_id", identifierNumber: "1234567" }, "sandbox");

    expect(result).toMatchObject({
      matched: true,
      fullName: "TEST PERSON",
      firstName: "TEST",
      lastName: "PERSON",
      gender: "MALE",
      dateOfBirth: "1990-01-01",
      citizenship: "KENYAN",
      idNumber: "1234567",
    });
    // The normalized shape is the app's own contract, defined in
    // provider.interface.ts — asserting these Creditinfo-native keys are
    // absent from the top level is what "never expose provider payloads"
    // actually means in a test.
    expect(result).not.toHaveProperty("IdmIdentifyAfrica");
    expect(result).not.toHaveProperty("Data");
  });
});

describe("CreditinfoAdapter — failure handling", () => {
  it("propagates a provider outage (5xx) as a retryable error rather than swallowing it", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(502, { Message: "bad gateway" })) as unknown as typeof fetch;
    await expect(
      CreditinfoAdapter.verifyIdentity({ identifierType: "national_id", identifierNumber: "1234567" }, "sandbox")
    ).rejects.toThrow();
  });

  it("healthCheck reports missing configuration without throwing and without ever including a credential value", async () => {
    delete process.env.CREDITINFO_SANDBOX_PASSWORD;
    const health = await CreditinfoAdapter.healthCheck("sandbox");
    expect(health.healthy).toBe(false);
    expect(health.detail).toContain("CREDITINFO_SANDBOX_PASSWORD");
    expect(health.detail).not.toContain(SANDBOX_VARS.CREDITINFO_SANDBOX_USERNAME);
  });

  // Reproduces the real Production incident: EndQuery came back 200 with a
  // Data object, but not shaped the way every mapper assumed — a bare
  // "Cannot read properties of undefined (reading 'IdmIdentifyAfrica')"
  // reached the client instead of a diagnosable error.
  it("returns a typed CreditinfoResponseFormatError instead of crashing on a malformed Production response", async () => {
    process.env.CREDITINFO_PRODUCTION_ENABLED = "true";
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { Token: "tok_prod" }))
      .mockResolvedValueOnce(jsonResponse(200, { Data: { Status: "Failure" } })) as unknown as typeof fetch;

    await expect(
      CreditinfoAdapter.verifyIdentity({ identifierType: "national_id", identifierNumber: "1234567" }, "production")
    ).rejects.toThrow(CreditinfoResponseFormatError);
  });
});

describe("CreditinfoAdapter — environment isolation", () => {
  it("a Production call only ever reaches the Production host, never Sandbox, even on failure", async () => {
    process.env.CREDITINFO_PRODUCTION_ENABLED = "true";
    const calledUrls: string[] = [];
    global.fetch = vi.fn(async (url: string) => {
      calledUrls.push(url);
      if (calledUrls.length === 1) return jsonResponse(200, { Token: "tok_prod" });
      return jsonResponse(200, { Data: { Status: "Failure" } });
    }) as unknown as typeof fetch;

    await expect(
      CreditinfoAdapter.verifyIdentity({ identifierType: "national_id", identifierNumber: "1234567" }, "production")
    ).rejects.toThrow(CreditinfoResponseFormatError);

    expect(calledUrls.length).toBeGreaterThan(0);
    for (const url of calledUrls) {
      expect(url).toContain(PROD_VARS.CREDITINFO_PROD_BASE_URL);
      expect(url).not.toContain(SANDBOX_VARS.CREDITINFO_SANDBOX_BASE_URL);
    }
  });
});
