import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import {
  PLAN_867_UIN,
  cumulativeGuaranteedAdditions,
  evaluateEligibility,
  calculateBenefits,
  calculateCosts,
  evaluateLiquidity,
} from "@/lib/insurance/providers/lic/plans/plan867";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-867") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, policyTermYears: 20, premiumMode: "yearly" as const, annualPremium: 100000, ...overrides };
}

describe("Plan 867 identity", () => {
  it("matches the catalogue's Plan 867 identity exactly", () => {
    expect(product.planNumber).toBe("867");
    expect(product.uin).toBe(PLAN_867_UIN);
    expect(PLAN_867_UIN).toBe("512L347V01");
  });

  it("is correctly flagged as market-linked in the catalogue", () => {
    expect(product.marketLinked).toBe(true);
  });
});

describe("Plan 867 eligibility: entry age, vesting age, policy term, premium minimums", () => {
  it("accepts age 30 with a 20-year term and Rs.1,00,000 annual premium", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 24, below the minimum entry age of 25", () => {
    const result = evaluateEligibility(ctx({ age: 24 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("rejects age 76, above the maximum entry age of 75", () => {
    const result = evaluateEligibility(ctx({ age: 76 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("rejects a vesting age above the maximum of 85", () => {
    const result = evaluateEligibility(ctx({ age: 70, policyTermYears: 20 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "maturity_age_too_high")).toBe(true);
  });

  it("rejects a vesting age below the minimum of 35", () => {
    const result = evaluateEligibility(ctx({ age: 25, policyTermYears: 9 }));
    // Policy term 9 is also below the minimum of 10, so both checks fire —
    // still confirms ineligibility either way.
    expect(result.eligible).toBe(false);
  });

  it("rejects a Policy Term above the maximum of 42 years", () => {
    const result = evaluateEligibility(ctx({ age: 30, policyTermYears: 43 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("rejects an annual premium below the Rs.30,000 minimum for yearly mode", () => {
    const result = evaluateEligibility(ctx({ annualPremium: 29999 }));
    expect(result.eligible).toBe(false);
  });

  it("accepts a Single Premium of Rs.1,00,000 (the mode-specific minimum)", () => {
    const result = evaluateEligibility(ctx({ premiumMode: "single", annualPremium: 100000 }));
    expect(result.eligible).toBe(true);
  });

  it("rejects a Single Premium below Rs.1,00,000", () => {
    const result = evaluateEligibility(ctx({ premiumMode: "single", annualPremium: 99999 }));
    expect(result.eligible).toBe(false);
  });
});

describe("Plan 867 has no Basic Sum Assured concept — premium capability is not_applicable, not unavailable", () => {
  it("declares premium capability as not_applicable", () => {
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.premium).toBe("not_applicable");
  });

  it("has no calculatePremium method at all", () => {
    const engine = getLicProductEngine("867", PLAN_867_UIN);
    expect(engine?.calculatePremium).toBeUndefined();
  });
});

describe("Plan 867 Guaranteed Additions — fully computable, no market/NAV dependency", () => {
  it("adds nothing before policy year 6", () => {
    expect(cumulativeGuaranteedAdditions(100000, false, 5)).toBe(0);
  });

  it("adds exactly the 6th-year rate (5% of Annual Premium) at year 6", () => {
    expect(cumulativeGuaranteedAdditions(100000, false, 6)).toBe(5000);
  });

  it("adds the 6th and 10th year rates by year 10 (5% + 10% = 15%)", () => {
    expect(cumulativeGuaranteedAdditions(100000, false, 10)).toBe(15000);
  });

  it("continues accruing every year from year 11 onward using the banded rate", () => {
    // 5000 (yr6) + 10000 (yr10) + 4000*5 (yr11-15, 4% each) = 35000
    expect(cumulativeGuaranteedAdditions(100000, false, 15)).toBe(35000);
  });

  it("uses the lower Single Premium rate schedule when the mode is single", () => {
    // 4000 (yr6, 4%) + 5000 (yr10, 5%) = 9000
    expect(cumulativeGuaranteedAdditions(100000, true, 10)).toBe(9000);
  });

  it("computes the full 42-year accrual matching the published rate table exactly", () => {
    // 5000(yr6) + 10000(yr10) + 4%*5(11-15) + 5.5%*5(16-20) + 7%*5(21-25)
    // + 8.75%*5(26-30) + 10.75%*5(31-35) + 13%*5(36-40) + 15.5%*2(41-42)
    const expected =
      5000 +
      10000 +
      0.04 * 100000 * 5 +
      0.055 * 100000 * 5 +
      0.07 * 100000 * 5 +
      0.0875 * 100000 * 5 +
      0.1075 * 100000 * 5 +
      0.13 * 100000 * 5 +
      0.155 * 100000 * 2;
    expect(cumulativeGuaranteedAdditions(100000, false, 42)).toBe(Math.round(expected));
  });
});

describe("Plan 867 benefits — NEVER projects a maturity/vesting value", () => {
  it("never returns a maturityBenefit under any circumstance", () => {
    const result = calculateBenefits(ctx());
    expect(result.available).toBe(true);
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("reports the Assured Death Benefit floor at inception as 105% of premium", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.assuredDeathBenefitAtInception).toBe(105000);
    expect(result.deathBenefit).toBe(105000);
  });

  it("reports the cumulative Guaranteed Additions alongside the death benefit floor", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.guaranteedAdditionsCumulative).toBeDefined();
    expect(result.guaranteedBenefits?.guaranteedAdditionsCumulative).toBeGreaterThan(0);
  });

  it("never fabricates a non-guaranteed illustration", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });

  it("stays unavailable when premium is missing", () => {
    const result = calculateBenefits({ age: 30 });
    expect(result.available).toBe(false);
  });
});

describe("Plan 867 costs — only the two flat, unconditional rates are verified", () => {
  it("reports Fund Management Charge as a verified 1.35%", () => {
    const costs = calculateCosts("test-source");
    expect(costs.fundManagementCharge.status).toBe("verified");
    expect(costs.fundManagementCharge.value).toBe(1.35);
  });

  it("reports Mortality Charge as a verified Nil (0%)", () => {
    const costs = calculateCosts("test-source");
    expect(costs.mortalityCharge.status).toBe("verified");
    expect(costs.mortalityCharge.value).toBe(0);
  });

  it("never fabricates the conditional Policy Administration / Discontinuance charges", () => {
    const costs = calculateCosts("test-source");
    expect(costs.adminCharge.status).toBe("unavailable");
    expect(costs.adminCharge.value).toBeNull();
    expect(costs.exitLoad.status).toBe("unavailable");
    expect(costs.exitLoad.value).toBeNull();
  });
});

describe("Plan 867 liquidity — no loan ever; surrender genuinely conditional on elapsed years", () => {
  it("reports loan as verified false", () => {
    const liquidity = evaluateLiquidity("test-source");
    expect(liquidity.loanAvailable.status).toBe("verified");
    expect(liquidity.loanAvailable.value).toBe(false);
  });

  it("reports surrender as conditional, never a flat true or false", () => {
    const liquidity = evaluateLiquidity("test-source");
    expect(liquidity.surrenderAvailable.status).toBe("conditional");
    expect(liquidity.surrenderAvailable.value).toBeNull();
  });
});

describe("Plan 867 generic comparison — never projects a goal/maturity value", () => {
  it("stays unavailable for goal projection (Unit Fund Value is NAV-dependent)", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 1000000,
      horizonYears: 20,
      product,
      context: { age: 30, policyTermYears: 20, premiumMode: "yearly", annualPremium: 100000 },
    });
    expect(comparison.goal.projectedValue.status).toBe("unavailable");
    expect(comparison.goal.projectedValue.value).toBeNull();
  });

  it("reports family protection (Assured Death Benefit floor) as verified", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 1000000,
      horizonYears: 20,
      product,
      context: { age: 30, policyTermYears: 20, premiumMode: "yearly", annualPremium: 100000 },
    });
    expect(comparison.protection.familyProtectionAmount.status).toBe("verified");
    expect(comparison.protection.familyProtectionAmount.value).toBe(105000);
  });

  it("never invents a maturity value anywhere in the comparison", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 1000000,
      horizonYears: 20,
      product,
      context: { age: 30, policyTermYears: 20, premiumMode: "yearly", annualPremium: 100000 },
    });
    expect(comparison.goal.projectedValue.value).toBeNull();
    expect(comparison.guarantees.guaranteedValue.value).toBeNull();
  });
});
