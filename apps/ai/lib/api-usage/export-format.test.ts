import { describe, it, expect } from "vitest";
import { API_USAGE_EXPORT_HEADERS, orgUsageRowToCsvFields } from "./export-format";
import type { OrgUsageRow } from "./types";

const FORBIDDEN_HEADER_SUBSTRINGS = ["secret", "key_hash", "identifier", "national id", "passport", "biometric", "phone", "email"];

describe("API_USAGE_EXPORT_HEADERS", () => {
  it("never includes a column that could hold a secret or identity field", () => {
    const lower = API_USAGE_EXPORT_HEADERS.map((h) => h.toLowerCase());
    for (const forbidden of FORBIDDEN_HEADER_SUBSTRINGS) {
      expect(lower.some((h) => h.includes(forbidden))).toBe(false);
    }
  });
});

describe("orgUsageRowToCsvFields", () => {
  const row: OrgUsageRow = {
    organizationId: "11111111-1111-1111-1111-111111111111",
    organizationName: "Acme, Inc.", // deliberately includes a comma to exercise CSV escaping downstream
    totalRequests: 120,
    successful: 90,
    failed: 10,
    pending: 20,
    amountConsumed: 4500.5,
    activeApiKeys: 2,
    lastActivityAt: "2026-08-01T12:00:00.000Z",
    walletBalance: 1000,
    status: "active",
  };

  it("produces exactly one field per header, in the same order", () => {
    expect(orgUsageRowToCsvFields(row)).toHaveLength(API_USAGE_EXPORT_HEADERS.length);
  });

  it("computes success rate excluding pending, matching the summary card formula", () => {
    const fields = orgUsageRowToCsvFields(row);
    // successful / (successful + failed) = 90 / 100 = 90%
    expect(fields[6]).toBe("90.0");
  });

  it("never emits the row's raw organization name replaced or stripped — escaping is the CSV layer's job, not this one's", () => {
    const fields = orgUsageRowToCsvFields(row);
    expect(fields[0]).toBe("Acme, Inc.");
  });

  it("falls back to an empty success rate when there are no completed-or-failed attempts", () => {
    const fields = orgUsageRowToCsvFields({ ...row, successful: 0, failed: 0 });
    expect(fields[6]).toBe("");
  });

  it("formats money fields with exactly two decimal places for a clean numeric CSV column", () => {
    const fields = orgUsageRowToCsvFields(row);
    expect(fields[7]).toBe("4500.50");
    expect(fields[8]).toBe("1000.00");
  });
});
