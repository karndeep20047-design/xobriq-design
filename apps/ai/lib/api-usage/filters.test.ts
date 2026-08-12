import { describe, it, expect } from "vitest";
import { parseApiUsageFilters } from "./filters";

describe("parseApiUsageFilters", () => {
  it("defaults to a 30-day range when nothing is specified", () => {
    const { rangePreset } = parseApiUsageFilters({});
    expect(rangePreset).toBe("30d");
  });

  it("rejects an unrecognized range value instead of passing it through", () => {
    const { rangePreset } = parseApiUsageFilters({ range: "not-a-real-range" });
    expect(rangePreset).toBe("30d");
  });

  it("honors an explicit custom range", () => {
    const from = "2026-01-01T00:00:00.000Z";
    const to = "2026-01-15T00:00:00.000Z";
    const { filters, rangePreset } = parseApiUsageFilters({ range: "custom", from, to });
    expect(rangePreset).toBe("custom");
    expect(filters.from).toBe(from);
    expect(filters.to).toBe(to);
  });

  it("rejects an unrecognized verification type rather than passing it through to the query layer", () => {
    const { filters } = parseApiUsageFilters({ service: "face_scan" });
    expect(filters.verificationType).toBeNull();
  });

  it("accepts each real verification type", () => {
    expect(parseApiUsageFilters({ service: "identity" }).filters.verificationType).toBe("identity");
    expect(parseApiUsageFilters({ service: "phone" }).filters.verificationType).toBe("phone");
    expect(parseApiUsageFilters({ service: "business" }).filters.verificationType).toBe("business");
  });

  it("rejects an unrecognized status value", () => {
    const { filters } = parseApiUsageFilters({ status: "rejected" }); // not a real DB status
    expect(filters.status).toBeNull();
  });

  it("clamps page to at least 1", () => {
    expect(parseApiUsageFilters({ page: "0" }).filters.page).toBe(1);
    expect(parseApiUsageFilters({ page: "-5" }).filters.page).toBe(1);
    expect(parseApiUsageFilters({ page: "not-a-number" }).filters.page).toBe(1);
  });

  it("passes through a valid page number", () => {
    expect(parseApiUsageFilters({ page: "3" }).filters.page).toBe(3);
  });

  it("defaults sort to total_requests descending", () => {
    const { filters } = parseApiUsageFilters({});
    expect(filters.sort).toBe("total_requests");
    expect(filters.sortDir).toBe("desc");
  });

  it("rejects an unrecognized sort key", () => {
    const { filters } = parseApiUsageFilters({ sort: "some_untrusted_column" });
    expect(filters.sort).toBe("total_requests");
  });
});
