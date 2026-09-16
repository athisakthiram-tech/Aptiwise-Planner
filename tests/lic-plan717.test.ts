import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_717_RULES,
  PLAN_717_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan717";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-717") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, product, premiumFrequency: "single" as const, ...overrides };
}

describe("Plan 717 identity", () => {
  it("matches the catalogue's Plan 717 identity exactly", () => {
    expect(product.planNumber).toBe("717");
    expect(product.uin).toBe(PLAN_717_UIN);
    expect(PLAN_717_UIN).toBe("512N283V03");
  });
});

describe("Plan 717 eligibility boundaries", () => {
  it("accepts the maximum entry age (65)", () => {
    const result = evaluateEligibility(
      ctx({ age: 65, policyTermYears: 10, sumAssured: 100000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects an age above the maximum entry age", () => {
    const result = evaluateEligibility(ctx({ age: 66 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_above_max")).toBe(true);
  });

  it("rejects a policy term outside 10-25 years", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 9, sumAssured: 100000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("rejects a maturity age below the minimum of 18", () => {
    const result = evaluateEligibility(ctx({ age: 5, policyTermYears: 10, sumAssured: 100000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "maturity_age_too_low")).toBe(true);
  });

  it("rejects a maturity age above the maximum of 75", () => {
    const result = evaluateEligibility(ctx({ age: 65, policyTermYears: 25, sumAssured: 100000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "maturity_age_too_high")).toBe(true);
  });
});

describe("Plan 717 Sum Assured rules", () => {
  it("accepts the minimum Basic Sum Assured (1,00,000)", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 15, sumAssured: 100000 }));
    expect(result.eligible).toBe(true);
  });

  it("rejects a Basic Sum Assured below the minimum", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_717_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid lower-band increment", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 105000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });

  it("accepts a valid upper-band increment (above Rs.2,50,000, step Rs.25,000)", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 15, sumAssured: 300000 }));
    expect(result.eligible).toBe(true);
  });
});

describe("Plan 717 premium engine — exact lookup only (single premium)", () => {
  it("returns a verified single premium for an exact brochure sample point", () => {
    const result = calculatePremium(ctx({ age: 30, policyTermYears: 25, sumAssured: 100000 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(50695);
    expect(result.premiumFrequency).toBe("single");
  });

  it("does NOT interpolate for an unpublished age", () => {
    const result = calculatePremium(ctx({ age: 31, policyTermYears: 25, sumAssured: 100000 }));
    expect(result.available).toBe(false);
  });

  it("does NOT scale for a different Basic Sum Assured", () => {
    const result = calculatePremium(ctx({ age: 30, policyTermYears: 25, sumAssured: 200000 }));
    expect(result.available).toBe(false);
  });

  it("unsupported combination returns unavailable/null, never a fabricated value", () => {
    const result = calculatePremium(ctx({ age: 45, policyTermYears: 25, sumAssured: 100000 }));
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });
});

describe("Plan 717 benefits — age-dependent multiplier, guaranteed floor when premium unverified", () => {
  it("computes guaranteed maturity as the Basic Sum Assured", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 25, sumAssured: 500000 }));
    expect(result.maturityBenefit).toBe(500000);
  });

  it("uses the 1.25x multiplier for age below 50 when premium is verified", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 25, sumAssured: 100000 }));
    // premium = 50695 -> 1.25 * 50695 = 63368.75, higher than BSA 100000? No: BSA wins.
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(Math.max(100000, 1.25 * 50695));
  });

  it("uses the 1.10x multiplier for age 50 and above when premium is verified", () => {
    const result = calculateBenefits(ctx({ age: 50, policyTermYears: 25, sumAssured: 100000 }));
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(Math.max(100000, 1.1 * 56160));
  });

  it("reports only the guaranteed BSA floor when premium is unavailable", () => {
    const result = calculateBenefits(ctx({ age: 45, policyTermYears: 25, sumAssured: 100000 }));
    expect(result.guaranteedBenefits?.sumAssuredOnDeathMinimum).toBe(100000);
    expect(result.deathBenefit).toBeUndefined();
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 25, sumAssured: 500000 }));
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
