import { describe, it, expect } from "vitest";
import {
  successRate, percentDelta, bucketForRange, resolveDateRange, previousPeriod,
  walletStateFor, maskedKeyDisplay, formatKes, paginationInfo,
} from "./metrics";

describe("successRate", () => {
  it("excludes pending from the denominator", () => {
    // 8 successful, 2 failed, and (implicitly) any number pending — pending
    // never enters this function's arguments at all, which is the point.
    expect(successRate(8, 2)).toBe(80);
  });

  it("returns null when there are no completed-or-failed attempts yet", () => {
    expect(successRate(0, 0)).toBeNull();
  });

  it("is 0% when every completed attempt failed", () => {
    expect(successRate(0, 5)).toBe(0);
  });

  it("is 100% when every completed attempt succeeded", () => {
    expect(successRate(5, 0)).toBe(100);
  });
});

describe("percentDelta", () => {
  it("computes a straightforward increase", () => {
    expect(percentDelta(150, 100)).toBe(50);
  });

  it("computes a decrease as negative", () => {
    expect(percentDelta(50, 100)).toBe(-50);
  });

  it("is 0 when both periods are zero (not null — genuinely no change)", () => {
    expect(percentDelta(0, 0)).toBe(0);
  });

  it("is null when the previous period was zero but current isn't (undefined percentage, not +Infinity)", () => {
    expect(percentDelta(10, 0)).toBeNull();
  });
});

describe("bucketForRange", () => {
  const iso = (d: string) => new Date(d).toISOString();

  it("buckets a same-day range by hour", () => {
    expect(bucketForRange(iso("2026-08-01T00:00:00Z"), iso("2026-08-01T23:00:00Z"))).toBe("hour");
  });

  it("buckets a 30-day range by day", () => {
    expect(bucketForRange(iso("2026-08-01"), iso("2026-08-31"))).toBe("day");
  });

  it("buckets a 90-day range by week", () => {
    expect(bucketForRange(iso("2026-05-01"), iso("2026-08-01"))).toBe("week");
  });

  it("buckets anything longer than 180 days by month", () => {
    expect(bucketForRange(iso("2025-01-01"), iso("2026-08-01"))).toBe("month");
  });
});

describe("resolveDateRange", () => {
  it("uses explicit bounds for a custom range", () => {
    const from = "2026-01-01T00:00:00.000Z";
    const to = "2026-01-08T00:00:00.000Z";
    expect(resolveDateRange("custom", from, to)).toEqual({ from, to });
  });

  it("falls back to a 30-day window if custom bounds are missing", () => {
    const { from, to } = resolveDateRange("custom", null, null);
    const spanDays = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
    expect(spanDays).toBeCloseTo(30, 0);
  });

  it("computes a 24h window ending now", () => {
    const { from, to } = resolveDateRange("24h", null, null);
    const spanHours = (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000;
    expect(spanHours).toBeCloseTo(24, 0);
  });
});

describe("previousPeriod", () => {
  it("returns the immediately preceding window of equal length", () => {
    const { from, to } = previousPeriod("2026-01-08T00:00:00.000Z", "2026-01-15T00:00:00.000Z");
    expect(to).toBe("2026-01-08T00:00:00.000Z");
    expect(from).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("walletStateFor", () => {
  it("is zero at or below zero balance", () => {
    expect(walletStateFor(0)).toBe("zero");
    expect(walletStateFor(-10)).toBe("zero");
  });

  it("is low between zero and the threshold", () => {
    expect(walletStateFor(1)).toBe("low");
    expect(walletStateFor(500)).toBe("low");
  });

  it("is healthy above the threshold", () => {
    expect(walletStateFor(501)).toBe("healthy");
  });
});

describe("maskedKeyDisplay", () => {
  it("never appends anything that could extend the real prefix", () => {
    expect(maskedKeyDisplay("xob_live_a1b2c3d4")).toBe("xob_live_a1b2c3d4••••••••");
  });
});

describe("formatKes", () => {
  it("formats with the KES prefix and two decimal places", () => {
    expect(formatKes(1234.5)).toBe("KES 1,234.50");
  });

  it("formats zero correctly", () => {
    expect(formatKes(0)).toBe("KES 0.00");
  });
});

describe("paginationInfo", () => {
  it("computes a middle page correctly", () => {
    const info = paginationInfo(95, 2, 20);
    expect(info).toEqual({ totalPages: 5, currentPage: 2, rangeStart: 21, rangeEnd: 40, offset: 20 });
  });

  it("clamps a page above the last page down to the last page", () => {
    const info = paginationInfo(45, 99, 20);
    expect(info.currentPage).toBe(3);
    expect(info.rangeEnd).toBe(45);
  });

  it("clamps a page below 1 up to 1", () => {
    const info = paginationInfo(45, 0, 20);
    expect(info.currentPage).toBe(1);
  });

  it("handles zero total rows without dividing by zero", () => {
    const info = paginationInfo(0, 1, 20);
    expect(info).toEqual({ totalPages: 1, currentPage: 1, rangeStart: 0, rangeEnd: 0, offset: 0 });
  });
});
