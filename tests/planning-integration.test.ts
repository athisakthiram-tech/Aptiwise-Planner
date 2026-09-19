import { describe, it, expect } from "vitest";
import { getLicVerificationSummary } from "@/lib/insurance/capabilities";
import { UNKNOWN_CUSTOMER_PROFILE, buildProfileFromGoalInput, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { runPlanningPipeline } from "@/lib/planning/planningPipeline";
import { isRegisteredProduct } from "@/lib/planning/productEligibility";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

describe("Regression — catalogue and engine registry counts unaffected by the planning layer", () => {
  it("keeps 40 active LIC products and 31 registered engines", () => {
    const summary = getLicVerificationSummary();
    expect(summary.totalActiveProducts).toBe(40);
    expect(summary.productsWithEngines).toBe(31);
    expect(summary.catalogueOnlyProducts).toBe(9);
  });
});

describe("Planning pipeline — end-to-end wiring", () => {
  it("runs Customer Profile -> Protection Need -> Goal Need -> Eligible Products -> Strategies -> Comparison Table", () => {
    const p = profile({
      age: 32,
      monthlyBudget: 15000,
      yearsToGoal: 15,
      goalType: "child_education",
      targetGoalAmount: 3000000,
      existingInvestments: 500000,
      outstandingLiabilities: 1000000,
      existingLifeCover: 500000,
      riskComfort: "medium",
      liquidityPreference: "medium",
    });

    const result = runPlanningPipeline({ profile: p });

    expect(result.protectionNeed.status).not.toBe("unavailable");
    expect(result.goalNeed.status).not.toBe("unavailable");
    expect(result.strategies.length).toBeGreaterThan(0);
    expect(result.comparisonTable.length).toBe(result.strategies.length);

    // Every comparison row must be traceable back to a strategy id.
    const strategyIds = new Set(result.strategies.map((s) => s.id));
    for (const row of result.comparisonTable) {
      expect(strategyIds.has(row.id)).toBe(true);
    }
  });

  it("builds a valid profile bridge from the existing wizard's GoalInput, leaving new fields null", () => {
    const bridged = buildProfileFromGoalInput({
      age: 30,
      monthlyBudget: 8000,
      goalType: "wealth",
      targetAmount: 2000000,
      yearsToGoal: 10,
      existingLifeCover: 300000,
      riskComfort: "high",
    });
    expect(bridged.age).toBe(30);
    expect(bridged.targetGoalAmount).toBe(2000000);
    // Fields the wizard doesn't collect yet stay unknown, never 0.
    expect(bridged.annualIncome).toBeNull();
    expect(bridged.existingInvestments).toBeNull();
    expect(bridged.outstandingLiabilities).toBeNull();
    expect(bridged.numberOfDependants).toBeNull();
    expect(bridged.annualFamilyExpenses).toBeNull();
    expect(bridged.liquidityPreference).toBeNull();
  });
});

describe("Planning pipeline — catalogue-only products never appear in generated strategies", () => {
  it("never surfaces a component product that lacks a registered engine", () => {
    const p = profile({
      age: 30,
      monthlyBudget: 20000,
      yearsToGoal: 20,
      goalType: "wealth",
      targetGoalAmount: 5000000,
      existingInvestments: 1000000,
      outstandingLiabilities: 2000000,
      existingLifeCover: 0,
      riskComfort: "high",
    });
    const result = runPlanningPipeline({ profile: p });

    const catalogueOnlyIds = new Set(
      LIC_CATALOGUE.filter((prod) => prod.status === "ACTIVE" && !isRegisteredProduct(prod)).map((prod) => prod.id)
    );
    expect(catalogueOnlyIds.size).toBe(9);

    for (const strategy of result.strategies) {
      for (const component of strategy.components) {
        if (component.product) {
          const id = `lic-${component.product.planNumber}`;
          expect(catalogueOnlyIds.has(id)).toBe(false);
          expect(isRegisteredProduct({ ...LIC_CATALOGUE[0], planNumber: component.product.planNumber, uin: component.product.uin })).toBe(
            true
          );
        }
      }
    }
  });
});

describe("Planning pipeline — partial/unavailable premium status is preserved, never upgraded", () => {
  it("keeps at least one component's premium honestly unavailable when no exact rate-table match exists", () => {
    const p = profile({ age: 41, monthlyBudget: 9000, yearsToGoal: 13, riskComfort: "medium" });
    const result = runPlanningPipeline({ profile: p });
    const anyUnavailablePremium = result.strategies.some((s) =>
      s.components.some((c) => c.monthlyPremium.status === "unavailable")
    );
    expect(anyUnavailablePremium).toBe(true);
  });
});
