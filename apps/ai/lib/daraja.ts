/**
 * Daraja (M-Pesa) API client — STK Push subset.
 *
 * Ported from the standalone Daraja demo into the xobriq platform.
 * Only includes OAuth, STK Push, and STK Query — the minimum needed
 * for the billing/top-up M-Pesa flow.
 *
 * All credentials are read from environment variables — see the Daraja
 * section in .env.local. Targets SANDBOX by default; flip DARAJA_ENV
 * to "production" once Safaricom whitelists your callback URLs.
 */

const ENV = process.env.DARAJA_ENV === "production" ? "production" : "sandbox";

const BASE_URL =
  ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}. Check .env.local`);
  return v;
}

// ---------------------------------------------------------------------------
// OAuth — tokens last 1 hour, cache in memory and refresh a little early.
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const consumerKey = required("DARAJA_CONSUMER_KEY");
  const consumerSecret = required("DARAJA_CONSUMER_SECRET");
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daraja OAuth failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: string };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in) * 1000,
  };
  return cachedToken.token;
}

async function darajaFetch<T>(endpoint: string, body: unknown): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Daraja request to ${endpoint} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json as T;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

// ---------------------------------------------------------------------------
// STK Push (Lipa Na M-Pesa Online / M-Pesa Express)
// ---------------------------------------------------------------------------

export interface StkPushParams {
  amount: number;
  phoneNumber: string; // 2547XXXXXXXX
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function stkPush(params: StkPushParams): Promise<StkPushResponse> {
  const shortcode = required("DARAJA_SHORTCODE");
  const passkey = required("DARAJA_PASSKEY");
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  return darajaFetch<StkPushResponse>("/mpesa/stkpush/v1/processrequest", {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: ts,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(params.amount),
    PartyA: params.phoneNumber,
    PartyB: shortcode,
    PhoneNumber: params.phoneNumber,
    CallBackURL: params.callbackUrl,
    AccountReference: params.accountReference,
    TransactionDesc: params.transactionDesc,
  });
}

// ---------------------------------------------------------------------------
// STK Push Query — poll status while waiting for callback
// ---------------------------------------------------------------------------

export interface StkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export async function stkPushQuery(checkoutRequestId: string): Promise<StkQueryResponse> {
  const shortcode = required("DARAJA_SHORTCODE");
  const passkey = required("DARAJA_PASSKEY");
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  return darajaFetch<StkQueryResponse>("/mpesa/stkpushquery/v1/query", {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: ts,
    CheckoutRequestID: checkoutRequestId,
  });
}
