import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_748_RULES,
  PLAN_748_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan748";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-748") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 20, sumAssured: 1000000, policyTermYears: 14, product, ...overrides };
}

describe("Plan 748 identity", () => {
  it("matches the catalogue's Plan 748 identity exactly", () => {
    expect(product.planNumber).toBe("748");
    expect(product.uin).toBe(PLAN_748_UIN);
    expect(PLAN_748_UIN).toBe("512N316V03");
  });
});

describe("Plan 748 eligibility: discrete Policy Term set and term-dependent max entry age", () => {
  it("accepts age 20 with a 14-year Policy Term", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects a Policy Term not in the discrete set", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 15 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("rejects age 56 for a 14-year term (max entry age is 55)", () => {
    const result = evaluateEligibility(ctx({ age: 56 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_above_max_for_ppt")).toBe(true);
  });

  it("accepts age 55 — the exact boundary for a 14-year term", () => {
    expect(evaluateEligibility(ctx({ age: 55 })).eligible).toBe(true);
  });

  it("rejects age below the minimum entry age of 8", () => {
    const result = evaluateEligibility(ctx({ age: 7, policyTermYears: 28 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_below_min")).toBe(true);
  });
});

describe("Plan 748 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.10,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_748_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment (not a multiple of Rs.50,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 1010000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 748 premium engine — exact lookup only (BSA Rs.10,00,000)", () => {
  it("returns a verified premium for age 20, term 14", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(108780);
  });

  it("does NOT extrapolate for an unpublished age/term cell (age 50, term 20)", () => {
    const result = calculatePremium(ctx({ age: 50, policyTermYears: 20 }));
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });
});

describe("Plan 748 benefits — hybrid Guaranteed Addition (BSA-based) + discretionary Loyalty Addition (never fabricated)", () => {
  it("computes the Guaranteed Addition at end of PPT (10 years) as Rs.50/55 per thousand BSA", () => {
    const result = calculateBenefits(ctx());
    // PPT = 14-4 = 10 years: 5 years @ 50/1000 + 5 years @ 55/1000 = BSA/1000 * 525.
    expect(result.guaranteedBenefits?.guaranteedAdditionAtMaturity).toBe(525000);
  });

  it("computes the maturity benefit as 40% of BSA (14-year term) plus the Guaranteed Addition", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.maturitySumAssured).toBe(400000);
    expect(result.maturityBenefit).toBe(925000);
  });

  it("computes the survival benefit as 30% of BSA per instalment for a 14-year term", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.survivalBenefitPerInstallment).toBe(300000);
  });

  it("always includes the 125%-BSA death-benefit floor plus accrued GA, even with no verified premium", () => {
    const result = calculateBenefits(ctx({ age: 50, policyTermYears: 20 }));
    // 125% * 1000000 = 1250000; GA for PPT=16 (20-4): 5*50/1000*BSA + 11*55/1000*BSA = 855000.
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(1250000);
    expect(result.deathBenefit).toBe(1250000 + 855000);
  });

  it("raises the death benefit to 7x premium when that exceeds 125% of BSA", () => {
    const result = calculateBenefits(ctx());
    // 7*108780=761460, which is LESS than 125%*1000000=1250000, so the floor wins.
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(1250000);
  });

  it("never fabricates the discretionary Loyalty Addition", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
