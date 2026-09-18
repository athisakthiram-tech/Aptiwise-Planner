import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import {
  PLAN_873_UIN,
  annualizedPremium,
  cumulativeGuaranteedAdditions,
  evaluateEligibility,
  calculateBenefits,
  calculateCosts,
  evaluateLiquidity,
} from "@/lib/insurance/providers/lic/plans/plan873";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-873") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, policyTermYears: 15, premiumMode: "yearly" as const, annualPremium: 30000, bsaMultiple: 7 as const, ...overrides };
}

describe("Plan 873 identity", () => {
  it("matches the catalogue's Plan 873 identity exactly", () => {
    expect(product.planNumber).toBe("873");
    expect(product.uin).toBe(PLAN_873_UIN);
    expect(PLAN_873_UIN).toBe("512L354V01");
  });

  it("is correctly flagged as market-linked in the catalogue", () => {
    expect(product.marketLinked).toBe(true);
  });
});

describe("Plan 873 eligibility", () => {
  it("accepts age 30, 7x BSA, 15-year term, Rs.30,000 yearly premium", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 51 for a 10x BSA multiple (max entry age 50)", () => {
    const result = evaluateEligibility(ctx({ age: 51, bsaMultiple: 10 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("accepts age 51 for a 7x BSA multiple (max entry age 60)", () => {
    expect(evaluateEligibility(ctx({ age: 51, bsaMultiple: 7 })).eligible).toBe(true);
  });

  it("rejects a premium below the Rs.30,000 minimum for yearly mode", () => {
    const result = evaluateEligibility(ctx({ annualPremium: 29999 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects a policy term below 15 years when Annualized Premium is below Rs.48,000", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 12 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("accepts a policy term of 10 years when Annualized Premium is at/above Rs.48,000", () => {
    const result = evaluateEligibility(ctx({ annualPremium: 48000, policyTermYears: 10 }));
    expect(result.eligible).toBe(true);
  });

  it("accepts the maximum maturity age boundary exactly (age 50 + term 25 = 75 for a 10x BSA multiple)", () => {
    // The entry-age cap (50) and term cap (25) for 10x BSA already bound
    // maturity age to exactly 75 — this rule can never actually be
    // breached given those two caps, so this is a boundary-acceptance
    // test rather than a rejection test.
    const result = evaluateEligibility(ctx({ age: 50, policyTermYears: 25, bsaMultiple: 10, annualPremium: 48000 }));
    expect(result.eligible).toBe(true);
  });
});

describe("Plan 873 has no rate table for premium — capability is not_applicable", () => {
  it("declares premium capability as not_applicable", () => {
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.premium).toBe("not_applicable");
  });

  it("has no calculatePremium method at all", () => {
    const engine = getLicProductEngine("873", PLAN_873_UIN);
    expect(engine?.calculatePremium).toBeUndefined();
  });
});

describe("Plan 873 Guaranteed Additions and BSA — fully computable, no market/NAV dependency", () => {
  it("annualizes a monthly premium correctly", () => {
    expect(annualizedPremium(2500, "monthly")).toBe(30000);
  });

  it("computes the cumulative Guaranteed Additions for a below-threshold premium across a 15-year term", () => {
    // 3%(yr6) + 6%(yr10) + 12%(yr15) of Rs.30,000 = 900 + 1800 + 3600 = 6300
    expect(cumulativeGuaranteedAdditions(30000, 15)).toBe(6300);
  });

  it("uses the higher at-or-above-threshold schedule for Annualized Premium >= Rs.48,000", () => {
    // 5%(yr6) + 10%(yr10) of Rs.48,000 = 2400 + 4800 = 7200
    expect(cumulativeGuaranteedAdditions(48000, 10)).toBe(7200);
  });
});

describe("Plan 873 benefits — NEVER projects a maturity/vesting value", () => {
  it("computes the Basic Sum Assured directly from the chosen multiple and Annualized Premium", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.basicSumAssured).toBe(210000); // 7 x 30,000
  });

  it("reports the death benefit as the higher of BSA or the at-inception premium floor", () => {
    const result = calculateBenefits(ctx());
    expect(result.deathBenefit).toBe(210000); // BSA (210,000) dominates 105% x 30,000 (31,500)
  });

  it("never returns a maturityBenefit under any circumstance", () => {
    expect(calculateBenefits(ctx()).maturityBenefit).toBeUndefined();
  });

  it("never fabricates a non-guaranteed illustration", () => {
    expect(calculateBenefits(ctx()).nonGuaranteedIllustrations).toBeUndefined();
  });
});

describe("Plan 873 costs — only FMC and the exact-lookup mortality table are verified", () => {
  it("reports Fund Management Charge as a verified 1.35%", () => {
    const costs = calculateCosts("test-source");
    expect(costs.fundManagementCharge.status).toBe("verified");
    expect(costs.fundManagementCharge.value).toBe(1.35);
  });

  it("reports Mortality Charge as verified for a published age", () => {
    const costs = calculateCosts("test-source", 45);
    expect(costs.mortalityCharge.status).toBe("verified");
    expect(costs.mortalityCharge.value).toBe(3.48);
  });

  it("never interpolates Mortality Charge for an unpublished age", () => {
    const costs = calculateCosts("test-source", 40);
    expect(costs.mortalityCharge.status).toBe("unavailable");
    expect(costs.mortalityCharge.value).toBeNull();
  });
});

describe("Plan 873 liquidity — no loan ever; surrender genuinely conditional", () => {
  it("reports loan as verified false", () => {
    const liquidity = evaluateLiquidity("test-source");
    expect(liquidity.loanAvailable.status).toBe("verified");
    expect(liquidity.loanAvailable.value).toBe(false);
  });

  it("reports surrender as conditional, never a flat true or false", () => {
    const liquidity = evaluateLiquidity("test-source");
    expect(liquidity.surrenderAvailable.status).toBe("conditional");
  });
});

describe("Plan 873 generic comparison — never projects a goal/maturity value", () => {
  it("stays unavailable for goal projection (Unit Fund Value is NAV-dependent)", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 1000000,
      horizonYears: 15,
      product,
      context: ctx(),
    });
    expect(comparison.goal.projectedValue.status).toBe("unavailable");
    expect(comparison.goal.projectedValue.value).toBeNull();
  });
});
