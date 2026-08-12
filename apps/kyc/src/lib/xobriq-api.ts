// Talks to apps/ai's real Creditinfo-backed KYC API. In production this
// dashboard is only ever reached through the xobriq.ai reverse-proxy
// (xobriq.ai/dashboard/xobriqKYC/*), so a relative fetch to /api/v1/kyc/* is
// same-origin with apps/ai and carries the existing Supabase session cookie
// automatically — no separate API-key auth needed. VITE_XOBRIQ_AI_API is
// only a fallback for local dev against a deployed apps/ai backend directly;
// that path is cross-site, so the session cookie (SameSite=Lax) won't be
// sent — a known, unsolved local-dev-only limitation, not a production one.
const ABSOLUTE_BASE = (import.meta.env as Record<string, string | undefined>).VITE_XOBRIQ_AI_API;

function apiUrl(path: string): string {
  return ABSOLUTE_BASE ? `${ABSOLUTE_BASE}${path}` : path;
}

export class XobriqApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
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

export function verifyIdentity(input: {
  identifierType: string;
  identifierNumber: string;
  lastName?: string;
}) {
  return request<VerificationOutcome<IdentityResult>>("/api/v1/kyc/verify-identity", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyPhone(input: { nationalId: string; mobileNumber: string }) {
  return request<VerificationOutcome<PhoneResult>>("/api/v1/kyc/verify-phone", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyBusiness(input: { registrationNumber: string }) {
  return request<VerificationOutcome<BusinessResult>>("/api/v1/kyc/verify-business", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type VerificationListItem = {
  id: string;
  ref: string;
  verification_type: "identity" | "phone" | "business";
  provider: string;
  status: "pending" | "completed" | "failed";
  identifier_type: string | null;
  identifier_number: string;
  last_name: string | null;
  matched: boolean | null;
  result: IdentityResult | PhoneResult | BusinessResult | null;
  error_message: string | null;
  duration_ms: number | null;
  requested_by_email: string | null;
  created_at: string;
  completed_at: string | null;
};

export async function listVerifications(): Promise<VerificationListItem[]> {
  const data = await request<{ verifications: VerificationListItem[] }>(
    "/api/v1/kyc/verifications?limit=200",
  );
  return data.verifications;
}

export type VerificationDetail = VerificationListItem & {
  organization_id: string;
  raw_response: unknown;
  ip_address: string | null;
  user_agent: string | null;
};

export async function getVerification(idOrRef: string): Promise<VerificationDetail> {
  const data = await request<{ verification: VerificationDetail }>(
    `/api/v1/kyc/verifications/${encodeURIComponent(idOrRef)}`,
  );
  return data.verification;
}

export type Me = {
  displayName: string;
  orgName: string | null;
  orgPlan: string | null;
};

export function getMe(): Promise<Me> {
  return request<Me>("/api/v1/kyc/me");
}

export type Wallet = {
  balance: number;
  currency: string;
  pricing: { identity: number | null; phone: number | null; business: number | null };
};

export function getWallet(): Promise<Wallet> {
  return request<Wallet>("/api/v1/kyc/wallet");
}

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

export async function listWalletTransactions(): Promise<WalletTransaction[]> {
  const data = await request<{ transactions: WalletTransaction[] }>(
    "/api/v1/kyc/wallet/transactions?limit=200",
  );
  return data.transactions;
}

export function submitTopupRequest(input: {
  amount: number;
  method: "mpesa" | "bank" | "card";
  contactReference?: string;
}) {
  return request<{ request: { id: string; status: string; created_at: string } }>(
    "/api/v1/kyc/wallet/topup-request",
    { method: "POST", body: JSON.stringify(input) },
  );
}
