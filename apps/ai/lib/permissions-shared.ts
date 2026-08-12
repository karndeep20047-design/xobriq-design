// apps/ai/lib/permissions-shared.ts
//
// Client-safe half of the RBAC model — plain constants/types only, no
// "server-only" import. lib/permissions.ts (the actual access-checking
// logic, which touches the DB) re-exports these for server-side callers;
// client components that only need the shape (e.g. rendering a permission
// checklist in the roles builder UI) must import from here directly —
// importing them from lib/permissions.ts would pull "server-only" into the
// client bundle and fail the build.
//
// Whether an org has the KYC *product* at all is still governed
// independently by product_access_requests (a client requests access, staff
// approve it at /console/product-access) — that part is untouched. What's
// governed here, via the kyc_* keys below, is which sections of KYC a given
// member/custom role can see ONCE their org has access — same mechanism
// (custom roles, per-member overrides, the invite flow) as every other
// section in this file. See lib/permissions.ts's getMemberAccess/
// requireKycPermission for the enforcement side and lib/kyc/api-auth.ts's
// requireKycClientAccess for the API-route side.
export const ORG_PERMISSION_KEYS = [
  "dashboard",
  "team",
  "audit_log",
  "billing",
  "settings",
  "api_keys",
  "kyc_dashboard",
  "kyc_verify",
  "kyc_verifications",
  "kyc_bulk",
  "kyc_alerts",
  "kyc_support",
] as const;

export type OrgPermissionKey = (typeof ORG_PERMISSION_KEYS)[number];
export type OrgPermissions = Record<OrgPermissionKey, boolean>;

export const PERMISSION_LABELS: Record<OrgPermissionKey, string> = {
  dashboard: "Overview",
  team: "Team",
  audit_log: "Audit Log",
  billing: "Billing",
  settings: "Settings",
  api_keys: "API Keys",
  kyc_dashboard: "Dashboard",
  kyc_verify: "New Verification",
  kyc_verifications: "Verifications",
  kyc_bulk: "Bulk Upload",
  kyc_alerts: "Fraud Alerts",
  kyc_support: "Support",
};

// Lets the Roles builder render two labeled sections instead of one flat
// grid, now that the list has grown from 6 keys to 12.
export const PERMISSION_GROUPS: Array<{ label: string; keys: OrgPermissionKey[] }> = [
  { label: "Organization", keys: ["dashboard", "team", "audit_log", "billing", "settings", "api_keys"] },
  { label: "XOBRIQ KYC", keys: ["kyc_dashboard", "kyc_verify", "kyc_verifications", "kyc_bulk", "kyc_alerts", "kyc_support"] },
];

export type MemberAccess = {
  role: "owner" | "admin" | "member";
  permissions: OrgPermissions;
};
