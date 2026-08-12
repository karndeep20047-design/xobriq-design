import "server-only";

import type { CreditinfoBeginQueryResponse, CreditinfoErrorResponse } from "./types";
import { getCreditinfoCredentials, type CreditinfoEnvironment } from "./config";
import { CreditinfoResponseFormatError } from "./errors";

// Configurable so polling behavior can be tuned per-environment (e.g. a
// slower/rate-limited Production tenant) without a code change — falls
// back to the same values this always used when unset. MAX_ATTEMPTS is a
// defensive backstop alongside the deadline, not a replacement for it: a
// provider that responds quickly but never returns Data would previously
// only be bounded by wall-clock time, not call count.
const POLL_INTERVAL_MS = Number(process.env.CREDITINFO_POLL_INTERVAL_MS) || 1500;
const POLL_TIMEOUT_MS = Number(process.env.CREDITINFO_POLL_TIMEOUT_MS) || 20_000;
const POLL_MAX_ATTEMPTS = Number(process.env.CREDITINFO_POLL_MAX_ATTEMPTS) || 30;

// Thrown instead of a plain Error for failures that are about Creditinfo's
// availability (network unreachable, request timed out, 5xx/429 response) —
// as opposed to a bad request (4xx: bad auth, malformed input, unknown
// strategy), which retrying won't fix. Callers (verify-and-record.ts, bulk
// upload) use this distinction to decide what's safe to automatically
// retry after an outage versus what needs a human to fix the input first.
export class CreditinfoTransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreditinfoTransientError";
  }
}

async function fetchWithTransientWrap(url: string, init: RequestInit, context: string): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    // fetch() itself throwing means the request never reached Creditinfo at
    // all (DNS failure, connection refused, TLS error, etc.) — the clearest
    // possible "the provider is unreachable right now" signal.
    const message = err instanceof Error ? err.message : String(err);
    throw new CreditinfoTransientError(`${context} could not reach Creditinfo: ${message}`);
  }
}

function authHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

// Safe to log unconditionally: which environment/host/strategy a call went
// to, its HTTP status, and the response body's top-level keys (never the
// values — those can hold PII/full verification data). No credentials, no ID
// numbers, no names ever pass through here. This is deliberately the only
// place BeginQuery/EndQuery activity gets logged, so a real Production
// incident (like a response shape mapper.ts can't parse) leaves enough of a
// trail to diagnose without needing a client-side network capture.
function logProviderCall(event: string, details: Record<string, unknown>) {
  console.log(`[creditinfo] ${event}`, details);
}

function hostnameOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return "invalid-base-url";
  }
}

// Confirmed from a real Production incident: Creditinfo returns account-state
// login failures (e.g. a disabled account) as HTTP 500 — indistinguishable by
// status code alone from a genuine outage, but retrying never succeeds until
// the account is fixed on Creditinfo's side. Matched against the exception
// body Creditinfo actually returns (e.g. "Login_AccountDisabled"), not the
// status code, so these are never misclassified as "safe to retry later."
const ACCOUNT_STATE_FAILURE_MARKERS = ["AccountDisabled", "AccountLocked", "AccountSuspended"];

function isAccountStateFailure(providerMessage: string): boolean {
  const lower = providerMessage.toLowerCase();
  return ACCOUNT_STATE_FAILURE_MARKERS.some((marker) => lower.includes(marker.toLowerCase()));
}

async function parseJsonOrThrow(res: Response, context: string): Promise<any> {
  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${context} returned non-JSON response (${res.status}): ${text.slice(0, 500)}`);
  }
  if (!res.ok) {
    // Creditinfo returns unhandled .NET exceptions as the error body, not a
    // normal error contract — surface its own message rather than swallowing it.
    const err = body as CreditinfoErrorResponse;
    const providerMessage = err.ExceptionMessage ?? err.Message ?? text.slice(0, 500);
    const message = `${context} failed (${res.status}): ${providerMessage}`;
    if (isAccountStateFailure(providerMessage)) {
      throw new Error(message);
    }
    // 5xx/429 means Creditinfo's own side is unhealthy or overloaded right
    // now — safe to retry later. A 4xx (bad auth, malformed input, unknown
    // strategy) is a request problem that retrying won't fix.
    if (res.status >= 500 || res.status === 429) {
      throw new CreditinfoTransientError(message);
    }
    throw new Error(message);
  }
  return body;
}

/**
 * Submits a query to a Creditinfo strategy. Returns a Token that must be
 * polled via `endQuery` for the actual result — Creditinfo's IDM API is
 * asynchronous even though the sandbox happens to resolve near-instantly.
 */
export async function beginQuery(
  environment: CreditinfoEnvironment,
  strategyId: string,
  customFields: Record<string, unknown>
): Promise<string> {
  const credentials = getCreditinfoCredentials(environment);
  const host = hostnameOf(credentials.baseUrl);
  logProviderCall("BeginQuery", { environment, host, strategyId, provider: "creditinfo" });

  const res = await fetchWithTransientWrap(
    `${credentials.baseUrl}/${strategyId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(credentials.username, credentials.password),
      },
      body: JSON.stringify({ CustomFields: customFields, Consent: true }),
    },
    "Creditinfo BeginQuery"
  );

  const body: CreditinfoBeginQueryResponse = await parseJsonOrThrow(res, "Creditinfo BeginQuery");
  if (!body.Token) {
    logProviderCall("BeginQuery missing Token", {
      environment,
      host,
      strategyId,
      httpStatus: res.status,
      topLevelKeys: Object.keys(body ?? {}),
    });
    throw new CreditinfoResponseFormatError(
      "Creditinfo BeginQuery did not return a Token (see server logs for response shape)."
    );
  }
  logProviderCall("BeginQuery resolved", { environment, host, strategyId, httpStatus: res.status, token: body.Token });
  return body.Token;
}

/**
 * Polls EndQuery for a Token returned by `beginQuery` until a result is
 * available or POLL_TIMEOUT_MS elapses.
 */
export async function endQuery<T>(environment: CreditinfoEnvironment, token: string): Promise<T> {
  const credentials = getCreditinfoCredentials(environment);
  const host = hostnameOf(credentials.baseUrl);
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let attempts = 0;

  while (true) {
    attempts += 1;
    const res = await fetchWithTransientWrap(
      `${credentials.baseUrl}/${token}`,
      { method: "GET", headers: { Authorization: authHeader(credentials.username, credentials.password) } },
      "Creditinfo EndQuery"
    );

    const body = await parseJsonOrThrow(res, "Creditinfo EndQuery");

    // A still-processing query returns HTTP 200 with no `Data` yet in some
    // Creditinfo strategies — treat an empty/undefined Data as "not ready".
    if (body && body.Data !== undefined && body.Data !== null) {
      logProviderCall("EndQuery resolved", {
        environment,
        host,
        httpStatus: res.status,
        topLevelKeys: Object.keys(body),
        token,
        attempts,
      });
      return body as T;
    }

    if (Date.now() >= deadline || attempts >= POLL_MAX_ATTEMPTS) {
      // A slow/overloaded provider, not a bad request — same "safe to retry
      // later" bucket as a 5xx/429 response.
      throw new CreditinfoTransientError(
        `Creditinfo EndQuery timed out after ${attempts} attempt(s)/${Date.now() - (deadline - POLL_TIMEOUT_MS)}ms for token ${token}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

/**
 * Runs the full BeginQuery -> poll EndQuery cycle for a single strategy call.
 */
export async function runStrategy<T>(
  environment: CreditinfoEnvironment,
  strategyId: string,
  customFields: Record<string, unknown>
): Promise<T> {
  const token = await beginQuery(environment, strategyId, customFields);
  return endQuery<T>(environment, token);
}
