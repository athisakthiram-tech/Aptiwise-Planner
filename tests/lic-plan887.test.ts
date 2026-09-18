import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_887_RULES, PLAN_887_UIN, evaluateEligibility, calculatePremium, calculateBenefits } from "@/lib/insurance/providers/lic/plans/plan887";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-887") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 20,
    sumAssured: 20000000,
    policyTermYears: 20,
    productSpecificInputs: { deathBenefitOption: "I" },
    product,
    ...overrides,
  };
}

describe("Plan 887 identity", () => {
  it("matches the catalogue's Plan 887 identity exactly", () => {
    expect(product.planNumber).toBe("887");
    expect(product.uin).toBe(PLAN_887_UIN);
    expect(PLAN_887_UIN).toBe("512N360V01");
  });
});

describe("Plan 887 eligibility: lifetime risk cover up to age 100", () => {
  it("accepts age 20 with a 20-year term", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("accepts a Policy Term reaching maturity age close to the lifetime ceiling of 100", () => {
    const result = evaluateEligibility(ctx({ age: 30, policyTermYears: 70 }));
    expect(result.eligible).toBe(true);
  });

  it("rejects a Policy Term that would exceed the maximum maturity age of 100", () => {
    const result = evaluateEligibility(ctx({ age: 30, policyTermYears: 71 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "maturity_age_too_high")).toBe(true);
  });

  it("rejects age 66, above the maximum entry age of 65", () => {
    const result = evaluateEligibility(ctx({ age: 66, policyTermYears: 10 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });
});

describe("Plan 887 Sum Assured rules: minimum of Rs.2,00,00,000", () => {
  it("rejects a Basic Sum Assured below the minimum", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_887_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("accepts the exact minimum Basic Sum Assured", () => {
    expect(evaluateEligibility(ctx({ sumAssured: PLAN_887_RULES.minBasicSumAssured })).eligible).toBe(true);
  });
});

describe("Plan 887 premium engine — exact lookup only", () => {
  it("returns a verified Regular premium for Option I at age 20, term 20", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(12600);
  });

  it("returns a different verified premium for Option II at the same point", () => {
    const result = calculatePremium(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(17200);
  });
});

describe("Plan 887 benefits", () => {
  it("never reports a maturity benefit", () => {
    const result = calculateBenefits(ctx());
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("computes the Option II Absolute Amount including its capped final value", () => {
    const result = calculateBenefits(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.guaranteedBenefits?.absoluteAmountAssuredFromPolicyYear16).toBe(40000000);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
