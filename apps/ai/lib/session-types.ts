// Single source of truth for staff roles and what each one can do.
// Some call sites (console/blog/actions.ts, console/blog/review-actions.ts,
// console/inquiries/actions.ts) re-declare the same role lists locally
// instead of importing canManageBlog/canReviewBlog/canViewInquiries from
// here — that duplication is pre-existing, not intentional; if you change a
// permission boundary, grep for the role name to catch every copy.
export type StaffRole =
  | "super_admin"
  | "cto"
  | "tech_lead"
  | "senior_dev"
  | "developer"
  | "ml_lead"
  | "cyber_sec"
  | "product_manager"
  | "finance_hr"
  | "marketing_head"
  | "content_admin"
  | "content_writer";

export type StaffProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  xobriq_staff_role: StaffRole;
  default_org_id: string | null;
};

// UI helpers — safe to import from Client Components
export function canManageTeam(role: StaffRole) {
  return role === "super_admin";
}

export function canManageClients(role: StaffRole) {
  return ["super_admin", "finance_hr", "product_manager"].includes(role);
}

export function canManageBlog(role: StaffRole) {
  return ["super_admin", "marketing_head", "content_admin", "content_writer"].includes(role);
}

export function canReviewBlog(role: StaffRole) {
  return ["super_admin", "marketing_head", "content_admin"].includes(role);
}

export function canViewMetrics(role: StaffRole) {
  return ["super_admin", "cto", "tech_lead", "senior_dev", "developer", "ml_lead", "cyber_sec"].includes(role);
}

export function canViewAudit(role: StaffRole) {
  return ["super_admin", "cyber_sec", "cto"].includes(role);
}

// Technical roles (same set as canViewMetrics) plus finance_hr/product_manager
// — per-client KYC usage is a billing/business question as much as a
// technical one, unlike Guard's fraud-scoring metrics. Exported as an array
// (not just the predicate) so requireRole() call sites can reuse the exact
// same list instead of re-declaring it — the duplication this file's top
// comment warns about elsewhere.
export const KYC_OPS_ROLES: StaffRole[] = [
  "super_admin", "cto", "tech_lead", "senior_dev", "developer", "ml_lead", "cyber_sec",
  "finance_hr", "product_manager",
];

export function canViewKycOps(role: StaffRole) {
  return KYC_OPS_ROLES.includes(role);
}

export function canManageProductAccess(role: StaffRole) {
  return ["super_admin", "product_manager"].includes(role);
}

// API Usage analytics (app/(console)/console/api-usage/**). Viewing usage
// volume/status is the same KYC_OPS_ROLES audience as canViewKycOps — it's
// operational/product data. Exporting a client list and viewing the wallet
// ledger's client-billing amounts are narrower — a business action rather
// than a debugging one — so those exclude the pure-engineering roles.
export const API_USAGE_WALLET_ROLES: StaffRole[] = ["super_admin", "finance_hr", "product_manager"];

export function canViewApiUsage(role: StaffRole) {
  return KYC_OPS_ROLES.includes(role);
}

export function canViewApiUsageRequestDetails(role: StaffRole) {
  return KYC_OPS_ROLES.includes(role);
}

export function canExportApiUsage(role: StaffRole) {
  return API_USAGE_WALLET_ROLES.includes(role);
}

export function canViewApiUsageWallet(role: StaffRole) {
  return API_USAGE_WALLET_ROLES.includes(role);
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  cto: "Chief Technology Officer",
  tech_lead: "Tech Lead",
  senior_dev: "Senior Developer",
  developer: "Developer",
  ml_lead: "ML Lead",
  cyber_sec: "Cyber Security",
  product_manager: "Product Manager",
  finance_hr: "Finance & HR",
  marketing_head: "Head of Marketing",
  content_admin: "Content Admin",
  content_writer: "Content Writer",
};

export function canViewInquiries(role: StaffRole) {
  return ["super_admin", "content_admin", "marketing_head", "finance_hr", "product_manager"].includes(role);
}

export type InquiryDepartment = "hr" | "sales" | "general" | "partnerships";

// Which inquiry departments a role may see/mutate. "all" bypasses filtering
// entirely (super_admin only). finance_hr is scoped to "hr" alone — career
// applications are treated as sensitive and kept out of the sales/marketing
// roles' view. Those roles get "sales" *and* "general" (not just "sales") so
// that inquiries which aren't career-related but also aren't a clear product
// pitch (support, press, security disclosures) still land somewhere a human
// will see them, instead of becoming invisible to everyone but super_admin.
// "partnerships" (Expert Roster / Key Expert bid applications) is granted to
// both finance_hr and the sales/marketing roles — unlike regular career
// applications, these are meant to be visible to both teams.
export function inquiryDepartmentsForRole(role: StaffRole): "all" | InquiryDepartment[] {
  if (role === "super_admin") return "all";
  if (role === "finance_hr") return ["hr", "partnerships"];
  if (["content_admin", "marketing_head", "product_manager"].includes(role)) {
    return ["sales", "general", "partnerships"];
  }
  return [];
}
