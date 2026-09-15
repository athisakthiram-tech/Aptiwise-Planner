import { describe, it, expect } from "vitest";
import { sipFutureValue, buildInvestmentProjections, ILLUSTRATION_RATES_PCT } from "@/lib/calculations/sip";

describe("sipFutureValue", () => {
  it("returns 0 for 0 years", () => {
    expect(sipFutureValue(10000, 10, 0)).toBe(0);
  });

  it("returns simple sum when rate is 0", () => {
    expect(sipFutureValue(10000, 0, 2)).toBe(10000 * 24);
  });

  it("grows with a positive rate compared to principal only", () => {
    const fv = sipFutureValue(10000, 12, 10);
    const principal = 10000 * 12 * 10;
    expect(fv).toBeGreaterThan(principal);
  });

  it("matches a known SIP formula result", () => {
    // 10,000/month, 12% p.a., 1 year -> monthly rate 1%
    const fv = sipFutureValue(10000, 12, 1);
    const r = 0.01;
    const n = 12;
    const expected = Math.round(10000 * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    expect(fv).toBe(expected);
  });

  it("throws for negative inputs", () => {
    expect(() => sipFutureValue(-1, 10, 1)).toThrow();
    expect(() => sipFutureValue(1000, 10, -1)).toThrow();
  });
});

describe("buildInvestmentProjections", () => {
  it("builds one point per illustration rate, increasing with rate", () => {
    const points = buildInvestmentProjections({ monthlyAmount: 5000, years: 5 });
    expect(points).toHaveLength(ILLUSTRATION_RATES_PCT.length);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].futureValue).toBeGreaterThan(points[i - 1].futureValue);
    }
  });
});
