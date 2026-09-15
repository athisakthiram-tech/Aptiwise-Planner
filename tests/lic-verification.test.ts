import { describe, it, expect } from "vitest";
import { GoalInput } from "@/types";
import { matchLicProducts } from "@/lib/insurance/matching";
import { getPlanEngine } from "@/lib/insurance/engineRegistry";
import { PLAN_733_UIN } from "@/lib/insurance/providers/lic/plans/plan733";

function baseGoal(overrides: Partial<GoalInput> = {}): GoalInput {
  return {
    age: 30,
    monthlyBudget: 10000,
    goalType: "child_education",
    targetAmount: 5000000,
    yearsToGoal: 15,
    existingLifeCover: 1000000,
    riskComfort: "medium",
    ...overrides,
  };
}

describe("category match does not imply anything else", () => {
  const result = matchLicProducts(baseGoal());

  it("never implies eligibility from a category match", () => {
    for (const { quality } of result.potentialMatches) {
      expect(quality.categoryMatch).toBe(true);
      expect(quality.eligibilityVerified).toBe(false);
    }
  });

  it("never implies affordability from a category match", () => {
    for (const { quality } of result.potentialMatches) {
      expect(quality.budgetVerified).toBe(false);
    }
  });

  it("never implies benefits from a category match", () => {
    for (const { quality } of result.potentialMatches) {
      expect(quality.benefitsVerified).toBe(false);
    }
  });
});

describe("budget behaviour", () => {
  it("does not fabricate affordability for a ₹2,000/month or ₹50,000/month budget", () => {
    const customerA = matchLicProducts(baseGoal({ monthlyBudget: 2000 }));
    const customerB = matchLicProducts(baseGoal({ monthlyBudget: 50000 }));

    const idsA = customerA.potentialMatches.map((m) => m.product.id).sort();
    const idsB = customerB.potentialMatches.map((m) => m.product.id).sort();

    // Category matches must be identical regardless of budget — the
    // matching engine has no verified way to check affordability.
    expect(idsA).toEqual(idsB);

    for (const match of [...customerA.potentialMatches, ...customerB.potentialMatches]) {
      expect(match.quality.budgetVerified).toBe(false);
    }
  });
});

describe("engine registry safety", () => {
  it("returns unavailable safely when no engine is registered", () => {
    const engine = getPlanEngine("LIC", "999999", "NOT-A-REAL-UIN");
    expect(engine.eligibility).toBeNull();
    expect(engine.premium).toBeNull();
    expect(engine.benefit).toBeNull();
  });

  it("is version/UIN aware for the Plan 733 slot", () => {
    const engine = getPlanEngine("LIC", "733", PLAN_733_UIN);
    expect(engine.eligibility).not.toBeNull();
    expect(engine.premium).not.toBeNull();
    expect(engine.benefit).not.toBeNull();
  });

  it("does not let an incorrect UIN use the Plan 733 engine", () => {
    const wrongUin = getPlanEngine("LIC", "733", "512N000V00");
    expect(wrongUin.eligibility).toBeNull();
    expect(wrongUin.premium).toBeNull();
    expect(wrongUin.benefit).toBeNull();
  });

  it("does not let a matching UIN under the wrong plan number resolve", () => {
    const wrongPlanNumber = getPlanEngine("LIC", "000", PLAN_733_UIN);
    expect(wrongPlanNumber.eligibility).toBeNull();
  });
});
