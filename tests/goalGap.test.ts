import { describe, it, expect } from "vitest";
import { calculateGoalGap } from "@/lib/calculations/goalGap";
import { sipFutureValue } from "@/lib/calculations/sip";

describe("calculateGoalGap contributions", () => {
  it("matches monthlyBudget x 12 x years", () => {
    const result = calculateGoalGap({ targetAmount: 5000000, monthlyBudget: 10000, years: 15 });
    expect(result.totalContributions).toBe(10000 * 12 * 15);
    expect(result.totalContributions).toBe(1800000);
  });
});

describe("calculateGoalGap scenario projections", () => {
  it("reuses the existing SIP calculation for each scenario's projected value", () => {
    const result = calculateGoalGap({ targetAmount: 5000000, monthlyBudget: 10000, years: 15 });
    for (const scenario of result.scenarios) {
      const expected = sipFutureValue(10000, scenario.annualRatePct, 15);
      expect(scenario.projectedValue).toBe(expected);
    }
  });

  it("defaults to the 6/8/10/12 illustration rates", () => {
    const result = calculateGoalGap({ targetAmount: 5000000, monthlyBudget: 10000, years: 15 });
    expect(result.scenarios.map((s) => s.annualRatePct)).toEqual([6, 8, 10, 12]);
  });
});

describe("calculateGoalGap gap and coverage", () => {
  it("computes a positive gap when the projection falls short of the target", () => {
    const result = calculateGoalGap({ targetAmount: 5000000, monthlyBudget: 10000, years: 15 });
    const scenario = result.scenarios.find((s) => s.annualRatePct === 6)!;
    expect(scenario.projectedValue).toBeLessThan(5000000);
    expect(scenario.gap).toBe(5000000 - scenario.projectedValue);
    expect(scenario.surplus).toBe(0);
    expect(scenario.status).toBe("shortfall");
  });

  it("never lets gap go negative when the projection exceeds the target (surplus instead)", () => {
    const result = calculateGoalGap({ targetAmount: 1000000, monthlyBudget: 10000, years: 15 });
    const scenario = result.scenarios.find((s) => s.annualRatePct === 12)!;
    expect(scenario.projectedValue).toBeGreaterThan(1000000);
    expect(scenario.gap).toBe(0);
    expect(scenario.surplus).toBe(scenario.projectedValue - 1000000);
    expect(scenario.status).toBe("surplus");
  });

  it("computes coverage as projectedValue / targetAmount x 100", () => {
    const result = calculateGoalGap({ targetAmount: 5000000, monthlyBudget: 10000, years: 15 });
    for (const scenario of result.scenarios) {
      expect(scenario.goalCoveragePercent).toBe(
        Math.round((scenario.projectedValue / 5000000) * 100)
      );
    }
  });

  it("handles a zero target amount safely (no crash, no NaN)", () => {
    const result = calculateGoalGap({ targetAmount: 0, monthlyBudget: 10000, years: 15 });
    for (const scenario of result.scenarios) {
      expect(scenario.goalCoveragePercent).toBe(0);
      expect(Number.isFinite(scenario.goalCoveragePercent)).toBe(true);
    }
  });

  it("rounds every monetary figure to a whole rupee", () => {
    const result = calculateGoalGap({ targetAmount: 5000000, monthlyBudget: 10000, years: 15 });
    for (const scenario of result.scenarios) {
      expect(Number.isInteger(scenario.projectedValue)).toBe(true);
      expect(Number.isInteger(scenario.gap)).toBe(true);
      expect(Number.isInteger(scenario.surplus)).toBe(true);
      expect(Number.isInteger(scenario.illustrativeGrowth)).toBe(true);
    }
  });
});

describe("calculateGoalGap illustrative growth", () => {
  it("computes growth as projectedValue - totalContributions", () => {
    const result = calculateGoalGap({ targetAmount: 5000000, monthlyBudget: 10000, years: 15 });
    for (const scenario of result.scenarios) {
      expect(scenario.illustrativeGrowth).toBe(scenario.projectedValue - result.totalContributions);
    }
  });

  it("never displays negative growth (floored at 0)", () => {
    // Duration 0 collapses contributions and projections to 0 for every
    // rate — growth must be reported as 0, never a negative rounding
    // artifact.
    const result = calculateGoalGap({ targetAmount: 100000, monthlyBudget: 10000, years: 0 });
    for (const scenario of result.scenarios) {
      expect(scenario.illustrativeGrowth).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("calculateGoalGap is language-independent", () => {
  it("is deterministic for identical inputs (no locale parameter exists)", () => {
    const input = { targetAmount: 5000000, monthlyBudget: 10000, years: 15 };
    expect(calculateGoalGap(input)).toEqual(calculateGoalGap(input));
  });
});
