import { describe, it, expect } from "vitest";
import { formatINR, formatINRCompact } from "@/lib/calculations/format";

describe("formatINR (exact Indian digit grouping)", () => {
  it("formats with Indian lakh/crore comma grouping", () => {
    expect(formatINR(10000)).toBe("₹10,000");
    expect(formatINR(200000)).toBe("₹2,00,000");
    expect(formatINR(1800000)).toBe("₹18,00,000");
    expect(formatINR(5000000)).toBe("₹50,00,000");
  });

  it("rounds to the nearest whole rupee", () => {
    expect(formatINR(1234.6)).toBe("₹1,235");
  });

  it("does not depend on any locale parameter", () => {
    expect(formatINR(1800000)).toBe(formatINR(1800000));
  });
});

describe("formatINRCompact", () => {
  it("uses lakh notation between 1L and 1Cr", () => {
    expect(formatINRCompact(1800000)).toBe("₹18.00 L");
    expect(formatINRCompact(3420000)).toBe("₹34.20 L");
  });

  it("uses crore notation at 1Cr and above", () => {
    expect(formatINRCompact(12000000)).toBe("₹1.20 Cr");
  });

  it("falls back to exact formatting below 1 lakh", () => {
    expect(formatINRCompact(50000)).toBe(formatINR(50000));
  });
});
