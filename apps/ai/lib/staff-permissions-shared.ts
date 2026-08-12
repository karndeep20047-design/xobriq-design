// apps/ai/lib/staff-permissions-shared.ts
//
// Client-safe half of the internal staff RBAC model — plain constants/types
// only, no "server-only" import. Mirrors lib/permissions-shared.ts's split
// exactly, for the same reason: lib/staff-permissions.ts (the actual
// DB-touching logic) re-exports these for server-side callers, while client
// components that only need the shape (e.g. the roles builder UI) must
// import from here directly, or importing them from lib/staff-permissions.ts
// would pull "server-only" into the client bundle and fail the build.
export const STAFF_PERMISSION_KEYS = [
  "team",
  "clients",
  "blog_write",
  "blog_review",
  "guard",
  "inquiries",
  "metrics",
  "audit",
  "product_access",
  "subscriptions",
  "kyc_ops",
  "kyc_ops_financial",
  "api_usage",
  "api_usage_export",
  "api_usage_wallet",
  "support",
  "settings",
  "manage_roles",
] as const;

export type StaffPermissionKey = (typeof STAFF_PERMISSION_KEYS)[number];
export type StaffPermissions = Record<StaffPermissionKey, boolean>;

export const STAFF_PERMISSION_LABELS: Record<StaffPermissionKey, string> = {
  team: "Manage Staff Team",
  clients: "Manage Clients",
  blog_write: "Write Blog Posts",
  blog_review: "Review & Publish Blog Posts",
  guard: "Guard Dashboard",
  inquiries: "View Inquiries",
  metrics: "View Metrics",
  audit: "View Audit Log",
  product_access: "Manage Product Access",
  subscriptions: "Manage Subscriptions",
  kyc_ops: "KYC Operations",
  kyc_ops_financial: "View KYC Revenue & Billing",
  api_usage: "View API Usage",
  api_usage_export: "Export API Usage Data",
  api_usage_wallet: "View API Usage Wallet Figures",
  support: "Support Inbox",
  settings: "Manage Console Settings",
  manage_roles: "Manage Staff Roles",
};

export type StaffAccess = {
  isSuperAdmin: boolean;
  permissions: StaffPermissions;
  roleName: string | null;
};
