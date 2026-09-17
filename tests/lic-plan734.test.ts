import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_734_RULES,
  PLAN_734_UIN,
  derivedPolicyTermYears,
  derivedPremiumPayingTermYears,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan734";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-734") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 8, sumAssured: 200000, product, ...overrides };
}

describe("Plan 734 identity", () => {
  it("matches the catalogue's Plan 734 identity exactly", () => {
    expect(product.planNumber).toBe("734");
    expect(product.uin).toBe(PLAN_734_UIN);
    expect(PLAN_734_UIN).toBe("512N299V03");
  });
});

describe("Plan 734 derived Premium Paying Term / Policy Term", () => {
  it("derives PPT = 20 - age and Term = 25 - age", () => {
    expect(derivedPremiumPayingTermYears(8)).toBe(12);
    expect(derivedPolicyTermYears(8)).toBe(17);
    expect(derivedPremiumPayingTermYears(0)).toBe(20);
    expect(derivedPolicyTermYears(0)).toBe(25);
  });
});

describe("Plan 734 eligibility: entry age range", () => {
  it("accepts age 0 (30 days)", () => {
    expect(evaluateEligibility(ctx({ age: 0 })).eligible).toBe(true);
  });

  it("accepts age 12 (last birthday), the upper boundary", () => {
    expect(evaluateEligibility(ctx({ age: 12 })).eligible).toBe(true);
  });

  it("rejects age 13, above the maximum entry age", () => {
    const result = evaluateEligibility(ctx({ age: 13 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });
});

describe("Plan 734 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.2,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_734_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment in the lowest band (must be a multiple of Rs.5,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 203000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });

  it("accepts a valid increment", () => {
    expect(evaluateEligibility(ctx({ sumAssured: 205000 })).eligible).toBe(true);
  });
});

describe("Plan 734 premium engine — exact lookup only, split by Survival Benefit Option", () => {
  it("returns a verified premium for Option 1 at age 0", () => {
    const result = calculatePremium(
      ctx({ age: 0, productSpecificInputs: { survivalBenefitOption: "1" } })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(9114);
  });

  it("returns a different verified premium for Option 4 at the same age", () => {
    const result = calculatePremium(
      ctx({ age: 0, productSpecificInputs: { survivalBenefitOption: "4" } })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(9722);
  });

  it("does NOT extrapolate for an age outside the 4 published sample points", () => {
    const result = calculatePremium(
      ctx({ age: 6, productSpecificInputs: { survivalBenefitOption: "1" } })
    );
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });
});

describe("Plan 734 benefits — Survival/Maturity split by Option; Death Benefit floor needs no premium", () => {
  it("computes maturity as 100% of BSA for Option 1 (no interim survival benefits)", () => {
    const result = calculateBenefits(
      ctx({ age: 0, productSpecificInputs: { survivalBenefitOption: "1" } })
    );
    expect(result.guaranteedBenefits?.survivalBenefitPerInstallment).toBeUndefined();
    expect(result.maturityBenefit).toBe(200000);
  });

  it("splits Option 4 into 15%-per-year survival benefits and a 25% maturity benefit", () => {
    const result = calculateBenefits(
      ctx({ age: 0, productSpecificInputs: { survivalBenefitOption: "4" } })
    );
    expect(result.guaranteedBenefits?.survivalBenefitPerInstallment).toBe(30000);
    expect(result.maturityBenefit).toBe(50000);
  });

  it("always reports the 125%-BSA death-benefit floor even with no verified premium", () => {
    const result = calculateBenefits(ctx({ age: 6 }));
    expect(result.deathBenefit).toBe(250000);
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(250000);
  });

  it("raises the death benefit to 7x premium when that exceeds 125% of BSA", () => {
    const result = calculateBenefits(
      ctx({ age: 0, productSpecificInputs: { survivalBenefitOption: "1" } })
    );
    // 7*9114=63798, which is LESS than 125%*200000=250000, so the floor wins.
    expect(result.deathBenefit).toBe(250000);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(
      ctx({ age: 0, productSpecificInputs: { survivalBenefitOption: "1" } })
    );
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
