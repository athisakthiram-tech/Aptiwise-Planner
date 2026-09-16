import { describe, it, expect } from "vitest";
import { buildPlan, DEFAULT_PROTECTION_ALLOCATION_PERCENT } from "@/lib/planner/planBuilder";
import { sipFutureValue } from "@/lib/calculations/sip";

function baseInput(overrides: Partial<Parameters<typeof buildPlan>[0]> = {}) {
  return {
    targetAmount: 5000000,
    monthlyBudget: 10000,
    years: 15,
    protectionAllocation: 2000,
    annualScenarioRate: 8,
    ...overrides,
  };
}

describe("allocation always totals the monthly budget", () => {
  it.each([
    [2000, 8000],
    [3000, 7000],
    [1000, 9000],
  ])("₹%i protection => ₹%i goal-building (of ₹10,000)", (protection, expectedGoal) => {
    const result = buildPlan(baseInput({ protectionAllocation: protection }));
    expect(result.protectionAllocation).toBe(protection);
    expect(result.goalAllocation).toBe(expectedGoal);
    expect(result.protectionAllocation + result.goalAllocation).toBe(10000);
  });

  it("never lets protection + goal exceed or fall short of the budget", () => {
    for (const protection of [0, 1500, 5000, 9999, 10000]) {
      const result = buildPlan(baseInput({ protectionAllocation: protection }));
      expect(result.protectionAllocation + result.goalAllocation).toBe(10000);
    }
  });
});

describe("contribution math", () => {
  it("computes protection reserved amount as protectionAllocation x 12 x years", () => {
    const result = buildPlan(baseInput({ protectionAllocation: 2000 }));
    expect(result.protectionContribution).toBe(2000 * 12 * 15);
  });

  it("computes goal contribution as goalAllocation x 12 x years", () => {
    const result = buildPlan(baseInput({ protectionAllocation: 2000 }));
    expect(result.goalContribution).toBe(8000 * 12 * 15);
  });
});

describe("reuses the existing tested SIP calculation", () => {
  it("illustrativeGoalValue matches sipFutureValue for the goal allocation only", () => {
    const result = buildPlan(baseInput({ protectionAllocation: 2000, annualScenarioRate: 10 }));
    expect(result.illustrativeGoalValue).toBe(sipFutureValue(8000, 10, 15));
  });

  it("never adds the protection allocation into the illustrative goal value", () => {
    const withProtection = buildPlan(baseInput({ protectionAllocation: 5000 }));
    const zeroProtection = buildPlan(baseInput({ protectionAllocation: 0 }));
    // Same total budget, different splits — goal value must depend only
    // on the goal allocation, never on money reserved for protection.
    expect(withProtection.illustrativeGoalValue).toBe(sipFutureValue(5000, 8, 15));
    expect(zeroProtection.illustrativeGoalValue).toBe(sipFutureValue(10000, 8, 15));
    expect(withProtection.illustrativeGoalValue).toBeLessThan(zeroProtection.illustrativeGoalValue);
  });
});

describe("scenario switching", () => {
  it("produces a different illustrative goal value per scenario rate", () => {
    const rates = [6, 8, 10, 12];
    const values = rates.map(
      (rate) => buildPlan(baseInput({ annualScenarioRate: rate })).illustrativeGoalValue
    );
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe("gap, surplus and coverage", () => {
  it("computes a positive gap when the projection falls short", () => {
    const result = buildPlan(baseInput({ targetAmount: 5000000, annualScenarioRate: 6 }));
    expect(result.goalGap).toBe(Math.max(0, 5000000 - result.illustrativeGoalValue));
    expect(result.goalSurplus).toBe(0);
  });

  it("computes a surplus, never a negative gap, once the projection exceeds the target", () => {
    const result = buildPlan(baseInput({ targetAmount: 500000, annualScenarioRate: 12 }));
    expect(result.illustrativeGoalValue).toBeGreaterThan(500000);
    expect(result.goalGap).toBe(0);
    expect(result.goalSurplus).toBe(result.illustrativeGoalValue - 500000);
  });

  it("computes coverage as illustrativeGoalValue / targetAmount x 100", () => {
    const result = buildPlan(baseInput());
    expect(result.goalCoveragePercent).toBe(
      Math.round((result.illustrativeGoalValue / 5000000) * 100)
    );
  });

  it("handles a zero target amount safely", () => {
    const result = buildPlan(baseInput({ targetAmount: 0 }));
    expect(result.goalCoveragePercent).toBe(0);
    expect(Number.isFinite(result.goalCoveragePercent)).toBe(true);
  });
});

describe("allocation edge cases", () => {
  it("0% protection reserves nothing and gives the full budget to goal-building", () => {
    const result = buildPlan(baseInput({ protectionAllocation: 0 }));
    expect(result.protectionAllocation).toBe(0);
    expect(result.goalAllocation).toBe(10000);
    expect(result.protectionContribution).toBe(0);
  });

  it("100% protection leaves goal allocation and illustrative value safely at 0", () => {
    const result = buildPlan(baseInput({ protectionAllocation: 10000 }));
    expect(result.goalAllocation).toBe(0);
    expect(result.goalContribution).toBe(0);
    expect(result.illustrativeGoalValue).toBe(0);
    expect(result.illustrativeGrowth).toBe(0);
  });

  it("clamps an out-of-range protection allocation instead of producing an invalid split", () => {
    const tooHigh = buildPlan(baseInput({ protectionAllocation: 999999 }));
    expect(tooHigh.protectionAllocation).toBe(10000);
    expect(tooHigh.goalAllocation).toBe(0);

    const negative = buildPlan(baseInput({ protectionAllocation: -500 }));
    expect(negative.protectionAllocation).toBe(0);
    expect(negative.goalAllocation).toBe(10000);
  });

  it("never produces NaN or Infinity for any field", () => {
    for (const protection of [0, 2500, 10000]) {
      const result = buildPlan(baseInput({ protectionAllocation: protection, years: 0 }));
      for (const value of Object.values(result)) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  it("different horizons still produce a safe, finite result", () => {
    for (const years of [0, 1, 25, 40]) {
      const result = buildPlan(baseInput({ years }));
      expect(Number.isFinite(result.illustrativeGoalValue)).toBe(true);
      expect(result.illustrativeGoalValue).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("default allocation is a starting illustration, not advice", () => {
  it("defaults to 20% protection", () => {
    expect(DEFAULT_PROTECTION_ALLOCATION_PERCENT).toBe(20);
  });
});

describe("buildPlan is language-independent", () => {
  it("takes no locale parameter and is deterministic for identical inputs", () => {
    const input = baseInput();
    expect(buildPlan(input)).toEqual(buildPlan(input));
  });
});
