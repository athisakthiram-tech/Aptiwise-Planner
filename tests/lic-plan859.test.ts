import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_859_RULES, PLAN_859_UIN, evaluateEligibility, calculatePremium, calculateBenefits } from "@/lib/insurance/providers/lic/plans/plan859";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-859") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, sumAssured: 500000, policyTermYears: 20, product, ...overrides };
}

describe("Plan 859 identity", () => {
  it("matches the catalogue's Plan 859 identity exactly", () => {
    expect(product.planNumber).toBe("859");
    expect(product.uin).toBe(PLAN_859_UIN);
    expect(PLAN_859_UIN).toBe("512N341V01");
  });
});

describe("Plan 859 eligibility", () => {
  it("accepts age 30 with a 20-year term", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 66, above the maximum entry age of 65", () => {
    const result = evaluateEligibility(ctx({ age: 66, policyTermYears: 5 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("rejects a Policy Term above the maximum of 40 (subject to maturity age 70)", () => {
    const result = evaluateEligibility(ctx({ age: 30, policyTermYears: 41 }));
    expect(result.eligible).toBe(false);
  });
});

describe("Plan 859 Sum Assured rules: flat Rs.50,000 increments, no tiered bands", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.5,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_859_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment (not a multiple of Rs.50,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 510000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 859 premium engine — exact lookup only at the one published (BSA, age, term) point", () => {
  it("returns a verified Regular premium at age 30, term 20, BSA Rs.5,00,000", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(2095);
  });

  it("returns the correct Limited (10-year) premium", () => {
    const result = calculatePremium(ctx({ premiumPaymentTermYears: 10 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(3010);
  });

  it("returns the correct Limited (5-year) premium, distinct from the 10-year one", () => {
    const result = calculatePremium(ctx({ premiumPaymentTermYears: 5 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(4955);
  });

  it("does NOT extrapolate for an age/term outside the one published sample point", () => {
    const result = calculatePremium(ctx({ age: 25 }));
    expect(result.available).toBe(false);
  });
});

describe("Plan 859 benefits — uniquely a 10x (not 7x) annualised-premium multiple", () => {
  it("never reports a maturity benefit", () => {
    const result = calculateBenefits(ctx());
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("uses the flat BSA floor when 10x the verified premium doesn't exceed it", () => {
    const result = calculateBenefits(ctx());
    // 10*2095=20950, far below BSA 500000, so the floor wins.
    expect(result.deathBenefit).toBe(500000);
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(500000);
  });

  it("never reports an Increasing-option cap — this plan has no such option", () => {
    const result = calculateBenefits(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.guaranteedBenefits?.absoluteAmountAssuredFromPolicyYear16).toBeUndefined();
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
