import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_714_RULES,
  PLAN_714_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan714";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-714") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, product, ...overrides };
}

describe("Plan 714 identity", () => {
  it("matches the catalogue's Plan 714 identity exactly", () => {
    expect(product.planNumber).toBe("714");
    expect(product.uin).toBe(PLAN_714_UIN);
    expect(PLAN_714_UIN).toBe("512N277V03");
  });
});

describe("Plan 714 eligibility boundaries", () => {
  it("accepts the minimum entry age (8)", () => {
    const result = evaluateEligibility(
      ctx({ age: PLAN_714_RULES.minEntryAge, policyTermYears: 15, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects an age below the minimum entry age", () => {
    const result = evaluateEligibility(ctx({ age: PLAN_714_RULES.minEntryAge - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_below_min")).toBe(true);
  });

  it("rejects an age above the maximum entry age (50)", () => {
    const result = evaluateEligibility(ctx({ age: 51 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_above_max")).toBe(true);
  });

  it("accepts the exact minimum-maturity-age boundary (min entry age 8 + min term 12 = 20)", () => {
    const result = evaluateEligibility(ctx({ age: 8, policyTermYears: 12, sumAssured: 200000 }));
    expect(result.eligible).toBe(true);
    expect(result.reasonCodes?.some((r) => r.code === "maturity_age_too_low")).toBe(false);
  });

  it("rejects a maturity age above the maximum of 75", () => {
    const result = evaluateEligibility(ctx({ age: 50, policyTermYears: 35, sumAssured: 200000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "maturity_age_too_high")).toBe(true);
  });
});

describe("Plan 714 term/PPT: Premium Paying Term must equal Policy Term", () => {
  it("accepts when PPT equals term", () => {
    const result = evaluateEligibility(
      ctx({ policyTermYears: 25, premiumPaymentTermYears: 25, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects when PPT differs from term (no limited-pay option offered)", () => {
    const result = evaluateEligibility(
      ctx({ policyTermYears: 25, premiumPaymentTermYears: 15, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "ppt_must_equal_term")).toBe(true);
  });
});

describe("Plan 714 Sum Assured rules (3-tier increments)", () => {
  it("rejects an invalid increment below Rs.4,50,000 (step Rs.5,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 201000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });

  it("accepts a valid mid-band increment (step Rs.50,000, Rs.4,50,000-9,00,000)", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 15, sumAssured: 500000 }));
    expect(result.eligible).toBe(true);
  });

  it("accepts a valid top-band increment (step Rs.1,00,000, above Rs.9,00,000)", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 15, sumAssured: 1000000 }));
    expect(result.eligible).toBe(true);
  });

  it("rejects an invalid top-band increment", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 950000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 714 premium engine — exact lookup only", () => {
  it("returns a verified premium for an exact brochure sample point", () => {
    const result = calculatePremium(ctx({ age: 30, policyTermYears: 35, sumAssured: 200000 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(6213);
  });

  it("does NOT extrapolate for an unpublished term", () => {
    const result = calculatePremium(ctx({ age: 30, policyTermYears: 20, sumAssured: 200000 }));
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });
});

describe("Plan 714 benefits — guaranteed vs non-guaranteed, Family Protection", () => {
  it("computes the guaranteed base maturity benefit as the Basic Sum Assured", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 35, sumAssured: 500000 }));
    expect(result.maturityBenefit).toBe(500000);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 35, sumAssured: 500000 }));
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });

  it("computes an exact guaranteed Sum Assured on Death when the premium is verified", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 35, sumAssured: 200000 }));
    // premium=6213 -> 7*6213=43491, below BSA 200000 -> BSA wins.
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(200000);
    expect(result.deathBenefit).toBe(200000);
  });

  it("reports only the guaranteed BSA floor (never a complete figure) when premium is unavailable", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 20, sumAssured: 300000 }));
    expect(result.guaranteedBenefits?.sumAssuredOnDeathMinimum).toBe(300000);
    expect(result.deathBenefit).toBeUndefined();
  });
});
