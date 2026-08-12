// Client-safe fetch wrappers for the browser-facing /api/v1/kyc/* routes.
// Deliberately NOT "server-only" — imported from "use client" components
// (the ported verify form etc). Ported from apps/kyc's xobriq-api.ts,
// trimmed to only the calls that must stay real client-side fetches (the
// verify-* routes run the actual Creditinfo call and are also part of the
// external API-key surface — see lib/kyc/api-auth.ts). Read-side data
// (me/wallet/verifications) is fetched directly server-side elsewhere in
// this app now instead of round-tripping through these same routes.
export class XobriqApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new XobriqApiError(body.error || `Request failed (${res.status})`, res.status);
  }
  return res.json();
}

export type VerificationOutcome<TResult> = {
  id: string;
  ref: string;
  verificationType: "identity" | "phone" | "business";
  status: "completed" | "failed";
  matched: boolean | null;
  result: TResult | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  durationMs: number | null;
  // Only meaningful when status is "failed" — true when Creditinfo itself
  // was unreachable/overloaded/timed out rather than a bad request. Absent
  // on records from before this field existed.
  retryable?: boolean;
  // Which Creditinfo environment this specific call actually used.
  environment: "sandbox" | "production";
  // Only set for failures with a stable, known cause (e.g.
  // "CREDITINFO_RESPONSE_FORMAT_ERROR") — errorMessage is already a
  // generic, safe-to-display string whenever this is present.
  errorCode?: string;
};

export type IdentityResult = {
  matched: boolean;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  citizenship: string | null;
  idNumber: string;
  // Absent on verification records created before this field existed —
  // callers should fall back to the fixed fields above in that case.
  fields?: { label: string; value: string }[];
};

export type PhoneResult = {
  matched: boolean;
  mobileNumber: string;
};

export type BeneficialOwner = {
  name: string;
  role: string;
  idType: string | null;
  idNumber: string | null;
  ownershipPercentage: number | null;
};

export type BusinessResult = {
  matched: boolean;
  status: string | null;
  businessName: string | null;
  registrationDate: string | null;
  physicalAddress: string | null;
  postalAddress: string | null;
  beneficialOwners: BeneficialOwner[];
};

// idempotencyKey: pass the same value on a retry of the same submit
// attempt (network error, timeout) to avoid running — and billing for —
// a second real verification. Generate a fresh one only for a genuinely
// new attempt (e.g. the user resets the form and verifies someone else).
function idempotencyHeaders(idempotencyKey?: string): RequestInit["headers"] {
  return idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined;
}

export function verifyIdentity(
  input: { identifierType: string; identifierNumber: string; lastName?: string },
  idempotencyKey?: string
) {
  return request<VerificationOutcome<IdentityResult>>("/api/v1/kyc/verify-identity", {
    method: "POST",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
  });
}

export function verifyPhone(
  input: { nationalId: string; mobileNumber: string },
  idempotencyKey?: string
) {
  return request<VerificationOutcome<PhoneResult>>("/api/v1/kyc/verify-phone", {
    method: "POST",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
  });
}

export function verifyBusiness(
  input: { registrationNumber: string },
  idempotencyKey?: string
) {
  return request<VerificationOutcome<BusinessResult>>("/api/v1/kyc/verify-business", {
    method: "POST",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
  });
}

// Shapes for the verifications list/detail pages — mirror
// app/api/v1/kyc/verifications/route.ts's LIST_COLUMNS / DETAIL_COLUMNS
// exactly, since the ported pages query kyc_verifications directly
// server-side now instead of round-tripping through that route themselves.
export type VerificationListItem = {
  id: string;
  ref: string;
  verification_type: "identity" | "phone" | "business";
  provider: string;
  status: "pending" | "completed" | "failed";
  identifier_type: string | null;
  identifier_number: string | null;
  last_name: string | null;
  matched: boolean | null;
  result: IdentityResult | PhoneResult | BusinessResult | null;
  error_message: string | null;
  duration_ms: number | null;
  requested_by_email: string | null;
  created_at: string;
  completed_at: string | null;
};

export type VerificationDetail = VerificationListItem & {
  organization_id: string;
  raw_response: unknown;
  ip_address: string | null;
  user_agent: string | null;
};

// Mirrors app/api/v1/kyc/wallet/transactions/route.ts's COLUMNS — the
// billing pages query kyc_wallet_transactions directly server-side now.
export type WalletTransaction = {
  id: string;
  type: "topup" | "debit" | "adjustment";
  amount: number;
  balance_after: number;
  verification_id: string | null;
  reference: string | null;
  note: string | null;
  created_at: string;
};
