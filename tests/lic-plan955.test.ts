import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_955_RULES, PLAN_955_UIN, evaluateEligibility, calculatePremium, calculateBenefits } from "@/lib/insurance/providers/lic/plans/plan955";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-955") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 20,
    sumAssured: 5000000,
    policyTermYears: 20,
    productSpecificInputs: { deathBenefitOption: "I" },
    product,
    ...overrides,
  };
}

describe("Plan 955 identity", () => {
  it("matches the catalogue's Plan 955 identity exactly", () => {
    expect(product.planNumber).toBe("955");
    expect(product.uin).toBe(PLAN_955_UIN);
    expect(PLAN_955_UIN).toBe("512N350V02");
  });
});

describe("Plan 955 eligibility", () => {
  it("accepts age 20 with a 20-year term", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("accepts a Policy Term of 10 years, below Digi Term/Yuva Term's minimum of 15", () => {
    expect(evaluateEligibility(ctx({ policyTermYears: 10 })).eligible).toBe(true);
  });

  it("derives Limited Premium Paying Term as an offset from Policy Term (Term - 5 or Term - 10)", () => {
    expect(PLAN_955_RULES.limitedPptOptionsForTerm(20)).toEqual([15, 10]);
  });
});

describe("Plan 955 Sum Assured rules: higher minimum of Rs.25,00,000", () => {
  it("rejects a Basic Sum Assured below the minimum", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_955_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });
});

describe("Plan 955 premium engine — exact lookup only, split by Option", () => {
  it("returns a verified Regular premium for Option I at age 20, term 20", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(5959);
  });

  it("returns a different verified premium for Option II at the same point", () => {
    const result = calculatePremium(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(7832);
  });

  it("returns the correct Single premium", () => {
    const result = calculatePremium(ctx({ premiumFrequency: "single" }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(57768);
  });
});

describe("Plan 955 benefits", () => {
  it("never reports a maturity benefit", () => {
    const result = calculateBenefits(ctx());
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("computes the Option II Absolute Amount including its capped final value", () => {
    const result = calculateBenefits(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.guaranteedBenefits?.absoluteAmountAssuredFromPolicyYear16).toBe(10000000);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
