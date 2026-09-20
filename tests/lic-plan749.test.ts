import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import {
  PLAN_749_UIN,
  cumulativeGuaranteedAdditions,
  evaluateEligibility,
  calculateBenefits,
  calculateCosts,
  evaluateLiquidity,
} from "@/lib/insurance/providers/lic/plans/plan749";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-849") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, policyTermYears: 20, singlePremium: 125000, bsaOption: 1 as const, ...overrides };
}

describe("Plan 849 (Nivesh Plus, formerly \"749\" in this repo) identity", () => {
  it("matches the catalogue's corrected Plan 849 identity exactly", () => {
    expect(product.planNumber).toBe("849"); // Phase 4: corrected from "749"
    expect(product.uin).toBe(PLAN_749_UIN);
    expect(PLAN_749_UIN).toBe("512L317V02");
  });

  it("is correctly flagged as market-linked in the catalogue", () => {
    expect(product.marketLinked).toBe(true);
  });
});

describe("Plan 749 eligibility", () => {
  it("accepts age 30, Option 1, 20-year term, Rs.1,25,000 single premium", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("accepts age 70 for Option 1 (the maximum entry age)", () => {
    expect(evaluateEligibility(ctx({ age: 70, policyTermYears: 15 })).eligible).toBe(true);
  });

  it("rejects age 71 for Option 1, above the maximum entry age of 70", () => {
    const result = evaluateEligibility(ctx({ age: 71, policyTermYears: 14 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("rejects age 36 for Option 2, above its own maximum entry age of 35", () => {
    const result = evaluateEligibility(ctx({ age: 36, bsaOption: 2, policyTermYears: 10 }));
    expect(result.eligible).toBe(false);
  });

  it("rejects a Single Premium below the Rs.1,25,000 minimum", () => {
    const result = evaluateEligibility(ctx({ singlePremium: 100000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects a policy term below 10 years for Option 1", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 9 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("rejects a policy term above 20 years for Option 2 at age 26-30 (max 20)", () => {
    const result = evaluateEligibility(ctx({ bsaOption: 2, age: 28, policyTermYears: 21 }));
    expect(result.eligible).toBe(false);
  });

  it("only accepts a fixed 10-year term for Option 2 at age 31-35", () => {
    expect(evaluateEligibility(ctx({ bsaOption: 2, age: 33, policyTermYears: 10 })).eligible).toBe(true);
    expect(evaluateEligibility(ctx({ bsaOption: 2, age: 33, policyTermYears: 11 })).eligible).toBe(false);
  });

  it("rejects a maturity age above 85 for Option 1 (age 70 + term 25)", () => {
    const result = evaluateEligibility(ctx({ age: 70, policyTermYears: 25 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "maturity_age_too_high")).toBe(true);
  });
});

describe("Plan 749 has no rate table for premium — capability is not_applicable", () => {
  it("declares premium capability as not_applicable", () => {
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.premium).toBe("not_applicable");
  });

  it("has no calculatePremium method at all", () => {
    const engine = getLicProductEngine("849", PLAN_749_UIN);
    expect(engine?.calculatePremium).toBeUndefined();
  });
});

describe("Plan 749 Guaranteed Additions and BSA — fully computable, no market/NAV dependency", () => {
  it("computes the cumulative Guaranteed Additions across a full 25-year term (3+4+5+6+7 = 25%)", () => {
    expect(cumulativeGuaranteedAdditions(125000, 25)).toBe(31250);
  });

  it("computes a partial accrual for a 15-year term (3+4+5 = 12%)", () => {
    expect(cumulativeGuaranteedAdditions(125000, 15)).toBe(15000);
  });
});

describe("Plan 749 benefits — NEVER projects a maturity/vesting value", () => {
  it("computes the Basic Sum Assured directly for Option 1 (1.25x)", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.basicSumAssured).toBe(156250);
  });

  it("computes the Basic Sum Assured directly for Option 2 (10x)", () => {
    const result = calculateBenefits(ctx({ bsaOption: 2, age: 30, policyTermYears: 10 }));
    expect(result.guaranteedBenefits?.basicSumAssured).toBe(1250000);
  });

  it("reports the death benefit as exactly the Basic Sum Assured — no premium-based floor exists for this product", () => {
    const result = calculateBenefits(ctx());
    expect(result.deathBenefit).toBe(156250);
  });

  it("never returns a maturityBenefit under any circumstance", () => {
    expect(calculateBenefits(ctx()).maturityBenefit).toBeUndefined();
  });

  it("never fabricates a non-guaranteed illustration", () => {
    expect(calculateBenefits(ctx()).nonGuaranteedIllustrations).toBeUndefined();
  });
});

describe("Plan 749 costs — only FMC and the exact-lookup mortality table are verified", () => {
  it("reports Fund Management Charge as a verified 1.35%", () => {
    const costs = calculateCosts("test-source");
    expect(costs.fundManagementCharge.status).toBe("verified");
    expect(costs.fundManagementCharge.value).toBe(1.35);
  });

  it("reports Mortality Charge as verified for a published age", () => {
    const costs = calculateCosts("test-source", 45);
    expect(costs.mortalityCharge.value).toBe(3.48);
  });

  it("never interpolates Mortality Charge for age 60, which this brochure doesn't publish", () => {
    const costs = calculateCosts("test-source", 60);
    expect(costs.mortalityCharge.status).toBe("unavailable");
    expect(costs.mortalityCharge.value).toBeNull();
  });
});

describe("Plan 749 liquidity — no loan ever; surrender genuinely conditional", () => {
  it("reports loan as verified false and surrender as conditional", () => {
    const liquidity = evaluateLiquidity("test-source");
    expect(liquidity.loanAvailable.status).toBe("verified");
    expect(liquidity.loanAvailable.value).toBe(false);
    expect(liquidity.surrenderAvailable.status).toBe("conditional");
  });
});

describe("Plan 749 generic comparison — never projects a goal/maturity value", () => {
  it("stays unavailable for goal projection (Unit Fund Value is NAV-dependent)", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 1000000,
      horizonYears: 20,
      product,
      context: ctx(),
    });
    expect(comparison.goal.projectedValue.status).toBe("unavailable");
    expect(comparison.goal.projectedValue.value).toBeNull();
  });
});
