import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { beginQuery, endQuery, runStrategy, CreditinfoTransientError } from "./client";

// Fully mocked — no real network call is ever made, no real Creditinfo
// credentials are needed to run this suite. Safe test data only: made-up
// strategy IDs/tokens/identifiers, never anything resembling a real
// national ID or the credentials shared in this project's chat history.
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
  for (const name of [...Object.keys(SANDBOX_VARS), ...Object.keys(PROD_VARS)]) originalEnv[name] = process.env[name];
  Object.assign(process.env, SANDBOX_VARS, PROD_VARS);
});

afterEach(() => {
  for (const name of Object.keys(originalEnv)) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
  global.fetch = originalFetch;
  vi.useRealTimers();
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("beginQuery — authentication and request shape", () => {
  it("POSTs to {baseUrl}/{strategyId} with a Basic auth header built from the resolved environment's credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { Token: "tok_abc123" }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const token = await beginQuery("sandbox", "sandbox-kyc-strategy", { IdentifierType: "national_id", IdentifierNumber: "1234567" });

    expect(token).toBe("tok_abc123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://idmtest.example/api/strategies/sandbox-kyc-strategy");
    expect(init.method).toBe("POST");
    const expectedAuth = "Basic " + Buffer.from("test-sandbox-user:test-sandbox-pass").toString("base64");
    expect(init.headers.Authorization).toBe(expectedAuth);
    expect(JSON.parse(init.body)).toEqual({ CustomFields: { IdentifierType: "national_id", IdentifierNumber: "1234567" }, Consent: true });
  });

  it("selects the Production credential set and strategy host when environment is production, never the sandbox one", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { Token: "tok_prod" }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await beginQuery("production", "prod-kyc-strategy", { IdentifierType: "national_id", IdentifierNumber: "1234567" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://idm.example/api/strategies/prod-kyc-strategy");
    const expectedAuth = "Basic " + Buffer.from("test-prod-user:test-prod-pass").toString("base64");
    expect(init.headers.Authorization).toBe(expectedAuth);
  });

  it("throws a plain (non-retryable) Error when BeginQuery's response has no Token", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, {})) as unknown as typeof fetch;
    await expect(beginQuery("sandbox", "sandbox-kyc-strategy", {})).rejects.toThrow(/did not return a Token/);
    await expect(beginQuery("sandbox", "sandbox-kyc-strategy", {})).rejects.not.toBeInstanceOf(CreditinfoTransientError);
  });

  it("wraps a 4xx response as a plain Error (not retryable — it's a bad request, not an outage)", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(400, { Message: "bad strategy" })) as unknown as typeof fetch;
    await expect(beginQuery("sandbox", "sandbox-kyc-strategy", {})).rejects.not.toBeInstanceOf(CreditinfoTransientError);
  });

  it("wraps a 5xx response as CreditinfoTransientError (retryable — provider-side outage)", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(503, { Message: "down" })) as unknown as typeof fetch;
    await expect(beginQuery("sandbox", "sandbox-kyc-strategy", {})).rejects.toBeInstanceOf(CreditinfoTransientError);
  });

  it("wraps a 429 response as CreditinfoTransientError", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(429, { Message: "rate limited" })) as unknown as typeof fetch;
    await expect(beginQuery("sandbox", "sandbox-kyc-strategy", {})).rejects.toBeInstanceOf(CreditinfoTransientError);
  });

  it("wraps a network-level failure (fetch rejecting) as CreditinfoTransientError", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    await expect(beginQuery("sandbox", "sandbox-kyc-strategy", {})).rejects.toBeInstanceOf(CreditinfoTransientError);
  });

  // Real Production incident: Creditinfo returns a disabled-account login
  // failure as HTTP 500, which would otherwise be misclassified as a
  // transient outage and shown to the user as "looks unavailable, retry" —
  // misleading, since retrying a disabled account never succeeds.
  it("wraps a 500 'Login_AccountDisabled' response as a plain Error, not CreditinfoTransientError", async () => {
    global.fetch = vi.fn(async () => jsonResponse(500, { Message: "Login_AccountDisabled" })) as unknown as typeof fetch;
    await expect(beginQuery("sandbox", "sandbox-kyc-strategy", {})).rejects.not.toBeInstanceOf(CreditinfoTransientError);
  });

  it("preserves Creditinfo's own message for a 500 'Login_AccountDisabled' response", async () => {
    global.fetch = vi.fn(async () => jsonResponse(500, { Message: "Login_AccountDisabled" })) as unknown as typeof fetch;
    await expect(beginQuery("sandbox", "sandbox-kyc-strategy", {})).rejects.toThrow(/AccountDisabled/);
  });

  it("still treats an unrelated 500 as CreditinfoTransientError (retryable)", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(500, { Message: "internal server error" })) as unknown as typeof fetch;
    await expect(beginQuery("sandbox", "sandbox-kyc-strategy", {})).rejects.toBeInstanceOf(CreditinfoTransientError);
  });
});

describe("endQuery — polling", () => {
  it("polls GET {baseUrl}/{token} until Data is present, then returns the body", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, {})) // still processing
      .mockResolvedValueOnce(jsonResponse(200, { Data: { response: "final" } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const promise = endQuery("sandbox", "tok_abc123");
    await vi.advanceTimersByTimeAsync(5000); // fast-forward past the poll interval
    const result = await promise;

    expect(result).toEqual({ Data: { response: "final" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://idmtest.example/api/strategies/tok_abc123");
    expect(init.method).toBe("GET");
  });

  it("throws CreditinfoTransientError once the poll deadline elapses without Data ever appearing", async () => {
    vi.useFakeTimers();
    // A fresh Response per call — a Response body can only be read once,
    // and reusing one instance across polling iterations would itself
    // throw a "Body is unusable" error, masking the real behavior under
    // test.
    global.fetch = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(200, {}))) as unknown as typeof fetch;

    const promise = endQuery("sandbox", "tok_stuck");
    const assertion = expect(promise).rejects.toBeInstanceOf(CreditinfoTransientError);
    await vi.advanceTimersByTimeAsync(60_000); // well past the 20s default timeout
    await assertion;
  });
});

describe("runStrategy — full BeginQuery -> EndQuery cycle", () => {
  it("chains beginQuery's Token straight into endQuery and returns the final result", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { Token: "tok_chain" }))
      .mockResolvedValueOnce(jsonResponse(200, { Data: { ok: true } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const promise = runStrategy("sandbox", "sandbox-kyc-strategy", { IdentifierType: "national_id", IdentifierNumber: "1234567" });
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;

    expect(result).toEqual({ Data: { ok: true } });
    expect(fetchMock.mock.calls[1][0]).toBe("https://idmtest.example/api/strategies/tok_chain");
  });
});
