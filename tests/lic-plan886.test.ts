import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import {
  PLAN_886_UIN,
  minBsaMultiple,
  maxBsaMultiple,
  evaluateEligibility,
  calculateBenefits,
  calculateCosts,
  evaluateLiquidity,
} from "@/lib/insurance/providers/lic/plans/plan886";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-886") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 30,
    policyTermYears: 20,
    premiumPayingTermYears: 10 as const,
    premiumMode: "yearly" as const,
    annualPremium: 60000,
    bsaMultiple: 10,
    ...overrides,
  };
}

describe("Plan 886 identity", () => {
  it("matches the catalogue's Plan 886 identity exactly", () => {
    expect(product.planNumber).toBe("886");
    expect(product.uin).toBe(PLAN_886_UIN);
    expect(PLAN_886_UIN).toBe("512L361V01");
  });

  it("is correctly flagged as market-linked in the catalogue", () => {
    expect(product.marketLinked).toBe(true);
  });
});

describe("Plan 886 eligibility", () => {
  it("accepts age 30, PPT 10, 20-year term, Rs.60,000 yearly premium, 10x BSA multiple", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 51 for PPT 5, above its own maximum entry age of 50", () => {
    const result = evaluateEligibility(ctx({ age: 51, premiumPayingTermYears: 5, policyTermYears: 10 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("accepts age 65 for PPT 10 (the maximum entry age for that PPT)", () => {
    expect(evaluateEligibility(ctx({ age: 65, policyTermYears: 25, bsaMultiple: 7 })).eligible).toBe(true);
  });

  it("rejects a policy term of 10 years for PPT 15, which only allows 15/20/25", () => {
    const result = evaluateEligibility(ctx({ premiumPayingTermYears: 15, policyTermYears: 10 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("accepts the maturity-age boundary exactly (age 65 + term 25 = 90 for PPT 10)", () => {
    // The entry-age cap for each PPT and its allowed terms are designed to
    // land exactly on the maturity-age cap, never exceed it — this is a
    // boundary-acceptance test rather than a rejection test.
    const result = evaluateEligibility(ctx({ age: 65, policyTermYears: 25, bsaMultiple: 7 }));
    expect(result.eligible).toBe(true);
  });

  it("rejects a premium below the Rs.60,000 minimum for PPT 10 yearly mode", () => {
    const result = evaluateEligibility(ctx({ annualPremium: 59999 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects a BSA multiple below the minimum of 7x for age 30", () => {
    const result = evaluateEligibility(ctx({ bsaMultiple: 5 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });

  it("rejects a BSA multiple above the published maximum of 22x for age 30/PPT 10/AP>=60,000", () => {
    const result = evaluateEligibility(ctx({ bsaMultiple: 23 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });

  it("cannot reach the below-threshold gap for PPT 10 through eligibility alone — its own minimum premium (Rs.60,000) already equals the threshold", () => {
    // Every PPT-5/7/10 minimum premium, across every mode, normalizes to
    // exactly the Rs.60,000 Annualized-Premium threshold — so passing the
    // minimum-premium check already guarantees AP >= 60,000. The
    // below-threshold gap is real (see the unit-level test below) but
    // only reachable for PPT 15, whose own minimum (Rs.36,000) sits below
    // the threshold.
    const result = evaluateEligibility(ctx({ premiumMode: "monthly", annualPremium: 5000 }));
    expect(result.eligible).toBe(true);
  });
});

describe("Plan 886 BSA multiple bounds — exact-lookup only", () => {
  it("returns 7x minimum below age 50, 5x from age 50", () => {
    expect(minBsaMultiple(49)).toBe(7);
    expect(minBsaMultiple(50)).toBe(5);
  });

  it("returns the exact published maximum for a high-premium/known age-band/PPT combination", () => {
    expect(maxBsaMultiple(30, 10, 60000)).toBe(22);
    expect(maxBsaMultiple(55, 5, 60000)).toBeUndefined(); // published as "NA"
  });

  it("returns undefined (unenforced) for a low-premium PPT other than 15", () => {
    expect(maxBsaMultiple(30, 10, 50000)).toBeUndefined();
    expect(maxBsaMultiple(30, 15, 50000)).toBe(30); // PPT 15 IS published below the threshold
  });
});

describe("Plan 886 has no rate table for premium — capability is not_applicable", () => {
  it("declares premium capability as not_applicable", () => {
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.premium).toBe("not_applicable");
  });

  it("has no calculatePremium method at all", () => {
    const engine = getLicProductEngine("886", PLAN_886_UIN);
    expect(engine?.calculatePremium).toBeUndefined();
  });
});

describe("Plan 886 benefits — NEVER projects a maturity/vesting value, and has NO Guaranteed Additions", () => {
  it("computes the Basic Sum Assured directly from the chosen multiple and Annualized Premium", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.basicSumAssured).toBe(600000); // 10 x 60,000
  });

  it("reports the death benefit as the higher of BSA or the at-inception premium floor", () => {
    const result = calculateBenefits(ctx());
    expect(result.deathBenefit).toBe(600000); // BSA dominates 105% x 60,000 (63,000)
  });

  it("never returns a maturityBenefit under any circumstance", () => {
    expect(calculateBenefits(ctx()).maturityBenefit).toBeUndefined();
  });

  it("never reports a guaranteedAdditionsCumulative field — this plan has no such feature", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.guaranteedAdditionsCumulative).toBeUndefined();
  });

  it("never fabricates a non-guaranteed illustration", () => {
    expect(calculateBenefits(ctx()).nonGuaranteedIllustrations).toBeUndefined();
  });
});

describe("Plan 886 costs — only FMC and the exact-lookup mortality table are verified", () => {
  it("reports Fund Management Charge as a verified 1.35%", () => {
    const costs = calculateCosts("test-source");
    expect(costs.fundManagementCharge.status).toBe("verified");
    expect(costs.fundManagementCharge.value).toBe(1.35);
  });

  it("reports Mortality Charge as verified for a published age, using this plan's own rates", () => {
    const costs = calculateCosts("test-source", 45);
    expect(costs.mortalityCharge.value).toBe(3.22); // distinct from Plan 873/849's 3.48
  });

  it("never interpolates Mortality Charge for an unpublished age", () => {
    const costs = calculateCosts("test-source", 40);
    expect(costs.mortalityCharge.status).toBe("unavailable");
  });
});

describe("Plan 886 liquidity — no loan ever; surrender genuinely conditional", () => {
  it("reports loan as verified false and surrender as conditional", () => {
    const liquidity = evaluateLiquidity("test-source");
    expect(liquidity.loanAvailable.value).toBe(false);
    expect(liquidity.surrenderAvailable.status).toBe("conditional");
  });
});

describe("Plan 886 generic comparison — never projects a goal/maturity value", () => {
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
