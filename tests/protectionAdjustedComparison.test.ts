import { describe, it, expect } from "vitest";
import { calculateGoalCoverage } from "@/lib/calculations/goalCoverage";
import { sipFutureValue, ILLUSTRATION_RATES_PCT } from "@/lib/calculations/sip";
import {
  buildInvestmentScenarioComparison,
  buildPlan733Comparison,
} from "@/lib/comparison/protectionAdjustedComparison";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";

const plan733Product = LIC_CATALOGUE.find((p) => p.id === "lic-733") as InsuranceProduct;

describe("calculateGoalCoverage", () => {
  it("₹50L target / ₹30L value => 60% coverage, ₹20L gap, 0 surplus", () => {
    const result = calculateGoalCoverage(5000000, 3000000);
    expect(result.coveragePercent).toBe(60);
    expect(result.remainingGap).toBe(2000000);
    expect(result.surplus).toBe(0);
  });

  it("₹50L target / ₹55L value => 110% coverage, 0 gap, ₹5L surplus", () => {
    const result = calculateGoalCoverage(5000000, 5500000);
    expect(result.coveragePercent).toBe(110);
    expect(result.remainingGap).toBe(0);
    expect(result.surplus).toBe(500000);
  });

  it("never artificially caps coverage at 100%", () => {
    const result = calculateGoalCoverage(1000000, 3000000);
    expect(result.coveragePercent).toBe(300);
  });

  it("handles a projected value of 0 safely", () => {
    const result = calculateGoalCoverage(5000000, 0);
    expect(result.coveragePercent).toBe(0);
    expect(result.remainingGap).toBe(5000000);
    expect(result.surplus).toBe(0);
  });

  it("handles a target of 0 safely (no NaN/Infinity)", () => {
    const result = calculateGoalCoverage(0, 3000000);
    expect(result.coveragePercent).toBe(0);
    expect(Number.isFinite(result.coveragePercent)).toBe(true);
    expect(result.remainingGap).toBe(0);
    expect(result.surplus).toBe(3000000);
  });

  it("never produces a negative gap", () => {
    for (const value of [0, 100, 5000000, 10000000]) {
      const result = calculateGoalCoverage(5000000, value);
      expect(result.remainingGap).toBeGreaterThanOrEqual(0);
      expect(result.surplus).toBeGreaterThanOrEqual(0);
    }
  });

  it("is independent of any budget-allocation percentage (takes only target + projected value)", () => {
    expect(calculateGoalCoverage.length).toBe(2);
  });
});

describe("Plan 733 comparison adapter never invents values", () => {
  it("stays unavailable when no benefit calculation exists", () => {
    const comparison = buildPlan733Comparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
    });
    expect(comparison.goal.projectedValue.value).toBeNull();
    expect(comparison.goal.projectedValue.status).toBe("unavailable");
    expect(comparison.goal.coverage.value).toBeNull();
  });

  it("never fabricates a family protection amount", () => {
    const comparison = buildPlan733Comparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
      benefits: {
        available: true,
        guaranteedBenefits: { maturitySumAssured: 500000, deathBenefitMaturityComponent: 550000 },
        maturityBenefit: 500000,
        // deathBenefit intentionally absent, exactly as plan733.ts always returns it —
        // the true "Sum Assured on Death" needs a premium comparison it doesn't have.
        missingInputs: [],
      },
    });
    expect(comparison.protection.familyProtectionAmount.value).toBeNull();
    expect(comparison.protection.familyProtectionAmount.status).toBe("unavailable");
  });

  it("never fabricates a non-guaranteed bonus value", () => {
    const comparison = buildPlan733Comparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
      benefits: {
        available: true,
        guaranteedBenefits: { maturitySumAssured: 500000 },
        maturityBenefit: 500000,
        missingInputs: [],
      },
    });
    expect(comparison.guarantees.nonGuaranteedValue.value).toBeNull();
    expect(comparison.guarantees.nonGuaranteedValue.status).toBe("unavailable");
  });

  it("never invents or exposes a premium value anywhere in the comparison", () => {
    const comparison = buildPlan733Comparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
      benefits: {
        available: true,
        guaranteedBenefits: { maturitySumAssured: 500000 },
        maturityBenefit: 500000,
        missingInputs: [],
      },
    });
    expect(JSON.stringify(comparison)).not.toMatch(/"premium"/i);
  });

  it("shows a verified guaranteed maturity value as verified, not illustrative", () => {
    const comparison = buildPlan733Comparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
      benefits: {
        available: true,
        guaranteedBenefits: { maturitySumAssured: 500000 },
        maturityBenefit: 500000,
        missingInputs: [],
      },
    });
    expect(comparison.goal.projectedValue.value).toBe(500000);
    expect(comparison.goal.projectedValue.status).toBe("verified");
    expect(comparison.goal.coverage.value?.coveragePercent).toBe(10);
  });

  it("distinguishes not-applicable (mutual-fund charges) from unverified charges", () => {
    const comparison = buildPlan733Comparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
    });
    expect(comparison.costs.expenseRatio.status).toBe("not_applicable");
    expect(comparison.costs.exitLoad.status).toBe("unavailable");
  });
});

describe("investment scenario comparison adapter", () => {
  it("reuses the existing tested SIP calculation, never re-deriving it", () => {
    const comparison = buildInvestmentScenarioComparison({
      targetAmount: 5000000,
      monthlyAmount: 10000,
      years: 15,
      annualRatePct: 10,
    });
    expect(comparison.goal.projectedValue.value).toBe(sipFutureValue(10000, 10, 15));
  });

  it("has no built-in life cover", () => {
    const comparison = buildInvestmentScenarioComparison({
      targetAmount: 5000000,
      monthlyAmount: 10000,
      years: 15,
      annualRatePct: 8,
    });
    expect(comparison.protection.hasBuiltInLifeProtection).toBe(false);
    expect(comparison.protection.familyProtectionAmount.value).toBeNull();
  });

  it("never assumes zero costs", () => {
    const comparison = buildInvestmentScenarioComparison({
      targetAmount: 5000000,
      monthlyAmount: 10000,
      years: 15,
      annualRatePct: 8,
    });
    for (const cost of Object.values(comparison.costs)) {
      expect(cost.value).not.toBe(0);
      expect(cost.status).not.toBe("verified");
    }
  });

  it("never assumes zero or exempt tax", () => {
    const comparison = buildInvestmentScenarioComparison({
      targetAmount: 5000000,
      monthlyAmount: 10000,
      years: 15,
      annualRatePct: 8,
    });
    for (const taxField of Object.values(comparison.tax)) {
      expect(taxField.value).not.toBe(0);
      expect(taxField.status).not.toBe("verified");
    }
  });

  it("marks every scenario result as illustrative, never verified/expected", () => {
    for (const rate of ILLUSTRATION_RATES_PCT) {
      const comparison = buildInvestmentScenarioComparison({
        targetAmount: 5000000,
        monthlyAmount: 10000,
        years: 15,
        annualRatePct: rate,
      });
      expect(comparison.goal.projectedValue.status).toBe("illustrative");
    }
  });

  it("never produces NaN or Infinity even for a zero-year horizon", () => {
    const comparison = buildInvestmentScenarioComparison({
      targetAmount: 5000000,
      monthlyAmount: 10000,
      years: 0,
      annualRatePct: 8,
    });
    expect(comparison.goal.projectedValue.value).toBe(0);
    expect(Number.isFinite(comparison.goal.coverage.value?.coveragePercent)).toBe(true);
  });
});

describe("verified vs illustrative status stays distinct", () => {
  it("Plan 733's guaranteed value is verified while the investment scenario is illustrative", () => {
    const insurance = buildPlan733Comparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
      benefits: {
        available: true,
        guaranteedBenefits: { maturitySumAssured: 500000 },
        maturityBenefit: 500000,
        missingInputs: [],
      },
    });
    const investment = buildInvestmentScenarioComparison({
      targetAmount: 5000000,
      monthlyAmount: 10000,
      years: 15,
      annualRatePct: 8,
    });
    expect(insurance.goal.projectedValue.status).toBe("verified");
    expect(investment.goal.projectedValue.status).toBe("illustrative");
  });
});
