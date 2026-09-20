import { describe, it, expect } from "vitest";
import { solveBudgetFit } from "@/lib/planning/goalOrchestrator/budgetSolver";
import { assessProductEligibility } from "@/lib/planning/productEligibility";
import { getLicProductByIdentity } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_736_UIN } from "@/lib/insurance/providers/lic/plans/plan736";
import { LicCalculationContext } from "@/types/insurance";

// Plan 736 (Jeevan Labh)'s own published Sample Illustrative Premium
// table has an exact row: age 30, policyTermYears 16, Basic Sum Assured
// 2,00,000 -> Rs.17,767/year (~Rs.1,481/month). This is real, verified
// data already relied on by plan736.ts's own tests — used here purely to
// prove the solver's PROBE mechanism actually reaches a real engine and
// accepts only what it verifies, never inventing a number.
function plan736Assessment(context: LicCalculationContext) {
  const product = getLicProductByIdentity("736", PLAN_736_UIN)!;
  return assessProductEligibility(product, context)!;
}

describe("solveBudgetFit — bounded, real-engine probe, never a fabricated premium", () => {
  it("finds the product's own published Basic Sum Assured when it fits the budget", () => {
    const baseContext: LicCalculationContext = { age: 30, premiumMode: "yearly" };
    const assessment = plan736Assessment({ ...baseContext, policyTermYears: 16 });

    const result = solveBudgetFit({
      assessment,
      role: "traditional_savings",
      baseContext,
      policyTermYears: 16,
      initialBsaCandidate: 2500000, // the goal amount — deliberately NOT the amount that will actually fit
      maxMonthlyBudget: 10000,
      reasonCodes: [],
    });

    expect(result.fits).toBe(true);
    expect(result.basicSumAssured).toBe(200000);
    expect(result.component.monthlyPremium.status).toBe("verified");
    expect(result.component.monthlyPremium.value).toBe(Math.round(17767 / 12));
  });

  it("never returns a Basic Sum Assured equal to the un-configured goal amount unless the engine actually verified it", () => {
    const baseContext: LicCalculationContext = { age: 30, premiumMode: "yearly" };
    const assessment = plan736Assessment({ ...baseContext, policyTermYears: 16 });
    const result = solveBudgetFit({
      assessment,
      role: "traditional_savings",
      baseContext,
      policyTermYears: 16,
      initialBsaCandidate: 2500000,
      maxMonthlyBudget: 10000,
      reasonCodes: [],
    });
    // Goal amount (2,500,000) and the resolved BSA (200,000) are
    // different numbers on purpose (Section 6): the goal amount only
    // ever seeds the search.
    expect(result.basicSumAssured).not.toBe(2500000);
  });

  it("reports 'unavailable' rather than fabricating a premium when no candidate BSA matches any published row", () => {
    const baseContext: LicCalculationContext = { age: 47, premiumMode: "yearly" }; // not one of the plan's sample ages
    const assessment = plan736Assessment({ ...baseContext, policyTermYears: 16 });
    const result = solveBudgetFit({
      assessment,
      role: "traditional_savings",
      baseContext,
      policyTermYears: 16,
      initialBsaCandidate: 2500000,
      maxMonthlyBudget: 10000,
      reasonCodes: [],
    });
    expect(result.fits).toBe(false);
    expect(result.component.monthlyPremium.status).toBe("unavailable");
    expect(result.component.monthlyPremium.value).toBeNull();
  });

  it("never returns a premium that exceeds the stated monthly budget ceiling", () => {
    const baseContext: LicCalculationContext = { age: 30, premiumMode: "yearly" };
    const assessment = plan736Assessment({ ...baseContext, policyTermYears: 16 });
    const result = solveBudgetFit({
      assessment,
      role: "traditional_savings",
      baseContext,
      policyTermYears: 16,
      initialBsaCandidate: 2500000,
      // The only resolvable premium (~Rs.1,481/month at BSA 200,000) is
      // deliberately excluded by a budget ceiling below it.
      maxMonthlyBudget: 1000,
      reasonCodes: [],
    });
    expect(result.fits).toBe(false);
    if (result.component.monthlyPremium.value != null) {
      expect(result.component.monthlyPremium.value).toBeLessThanOrEqual(1000);
    }
  });

  it("respects an explicit premiumPayingTermYears override in the returned configuration", () => {
    const baseContext: LicCalculationContext = { age: 30, premiumMode: "yearly" };
    const assessment = plan736Assessment({ ...baseContext, policyTermYears: 16 });
    const result = solveBudgetFit({
      assessment,
      role: "traditional_savings",
      baseContext,
      policyTermYears: 16,
      premiumPayingTermYears: 10,
      initialBsaCandidate: 2500000,
      maxMonthlyBudget: 10000,
      reasonCodes: [],
    });
    expect(result.premiumPayingTermYears).toBe(10);
  });
});
