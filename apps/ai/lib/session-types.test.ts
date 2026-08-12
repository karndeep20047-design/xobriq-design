import { describe, it, expect } from "vitest";
import {
  canViewApiUsage, canExportApiUsage, canViewApiUsageWallet, canViewApiUsageRequestDetails,
  type StaffRole,
} from "./session-types";

const ALL_ROLES: StaffRole[] = [
  "super_admin", "cto", "tech_lead", "senior_dev", "developer", "ml_lead", "cyber_sec",
  "product_manager", "finance_hr", "marketing_head", "content_admin", "content_writer",
];

describe("API Usage authorization", () => {
  it("super_admin can view usage, request details, export, and wallet data", () => {
    expect(canViewApiUsage("super_admin")).toBe(true);
    expect(canViewApiUsageRequestDetails("super_admin")).toBe(true);
    expect(canExportApiUsage("super_admin")).toBe(true);
    expect(canViewApiUsageWallet("super_admin")).toBe(true);
  });

  it("a pure engineering role can view usage but not export or see wallet financials", () => {
    expect(canViewApiUsage("tech_lead")).toBe(true);
    expect(canExportApiUsage("tech_lead")).toBe(false);
    expect(canViewApiUsageWallet("tech_lead")).toBe(false);
  });

  it("finance_hr can view usage, wallet, and export — this is core to their job", () => {
    expect(canViewApiUsage("finance_hr")).toBe(true);
    expect(canExportApiUsage("finance_hr")).toBe(true);
    expect(canViewApiUsageWallet("finance_hr")).toBe(true);
  });

  it("roles with no KYC-ops relationship at all (blog/marketing) cannot view usage", () => {
    expect(canViewApiUsage("content_writer")).toBe(false);
    expect(canViewApiUsage("marketing_head")).toBe(false);
  });

  it("nobody outside KYC_OPS_ROLES-adjacent roles is ever granted export or wallet access without base view access", () => {
    for (const role of ALL_ROLES) {
      if (canExportApiUsage(role) || canViewApiUsageWallet(role)) {
        expect(canViewApiUsage(role)).toBe(true);
      }
    }
  });
});
