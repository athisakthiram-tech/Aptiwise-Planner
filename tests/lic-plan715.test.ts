import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_715_RULES,
  PLAN_715_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan715";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-715") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, product, ...overrides };
}

describe("Plan 715 identity", () => {
  it("matches the catalogue's Plan 715 identity exactly", () => {
    expect(product.planNumber).toBe("715");
    expect(product.uin).toBe(PLAN_715_UIN);
    expect(PLAN_715_UIN).toBe("512N279V03");
  });
});

describe("Plan 715 eligibility boundaries", () => {
  it("accepts the minimum entry age (18)", () => {
    const result = evaluateEligibility(
      ctx({ age: PLAN_715_RULES.minEntryAge, policyTermYears: 15, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects an age below the minimum entry age", () => {
    const result = evaluateEligibility(ctx({ age: PLAN_715_RULES.minEntryAge - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_below_min")).toBe(true);
  });

  it("rejects an age above the maximum entry age (50)", () => {
    const result = evaluateEligibility(ctx({ age: 51 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_above_max")).toBe(true);
  });

  it("rejects a policy term below the minimum of 15", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 14, sumAssured: 200000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("rejects a maturity age above the maximum of 75 (no minimum maturity age is stated)", () => {
    const result = evaluateEligibility(ctx({ age: 50, policyTermYears: 35, sumAssured: 200000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "maturity_age_too_high")).toBe(true);
  });
});

describe("Plan 715 term/PPT: Premium Paying Term must equal Policy Term", () => {
  it("rejects when PPT differs from term", () => {
    const result = evaluateEligibility(
      ctx({ policyTermYears: 25, premiumPaymentTermYears: 15, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "ppt_must_equal_term")).toBe(true);
  });
});

describe("Plan 715 premium engine — exact lookup only", () => {
  it("returns a verified premium for an exact brochure sample point", () => {
    const result = calculatePremium(ctx({ age: 30, policyTermYears: 35, sumAssured: 200000 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(6968);
  });

  it("unsupported input returns unavailable/null", () => {
    const result = calculatePremium(ctx({ age: 50, policyTermYears: 35, sumAssured: 200000 }));
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });
});

describe("Plan 715 benefits — 125% BSA / 7x premium death benefit, Family Protection", () => {
  it("computes the guaranteed base maturity benefit as the Basic Sum Assured", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 35, sumAssured: 500000 }));
    expect(result.maturityBenefit).toBe(500000);
  });

  it("applies the higher-of(125% BSA, 7x premium) formula when premium is verified", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 35, sumAssured: 200000 }));
    // premium=6968 -> 7*6968=48776; 125%*200000=250000 -> 250000 wins.
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(250000);
    expect(result.deathBenefit).toBe(250000);
  });

  it("reports the 125%-of-BSA guaranteed floor (never a complete figure) when premium is unavailable", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 20, sumAssured: 200000 }));
    expect(result.guaranteedBenefits?.sumAssuredOnDeathMinimum).toBe(250000);
    expect(result.deathBenefit).toBeUndefined();
  });

  it("never fabricates a bonus or the post-maturity whole-life death benefit", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 35, sumAssured: 500000 }));
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
