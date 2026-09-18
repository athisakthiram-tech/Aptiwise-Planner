import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_875_RULES, PLAN_875_UIN, evaluateEligibility, calculatePremium, calculateBenefits } from "@/lib/insurance/providers/lic/plans/plan875";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-875") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 30,
    sumAssured: 5000000,
    policyTermYears: 20,
    productSpecificInputs: { deathBenefitOption: "I" },
    product,
    ...overrides,
  };
}

describe("Plan 875 identity", () => {
  it("matches the catalogue's Plan 875 identity exactly", () => {
    expect(product.planNumber).toBe("875");
    expect(product.uin).toBe(PLAN_875_UIN);
    expect(PLAN_875_UIN).toBe("512N355V02");
  });
});

describe("Plan 875 eligibility", () => {
  it("accepts age 30 with a 20-year term", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 46, above the maximum entry age of 45", () => {
    const result = evaluateEligibility(ctx({ age: 46 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("enforces Option II's stricter max Policy Term by age/BSA band", () => {
    const result = evaluateEligibility(
      ctx({ age: 40, policyTermYears: 27, productSpecificInputs: { deathBenefitOption: "II" } })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });
});

describe("Plan 875 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.50,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_875_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });
});

describe("Plan 875 premium engine — exact lookup only, distinct from Digi Term's own figures", () => {
  it("returns a verified Regular premium for Option I at age 30, term 20", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(5950);
  });

  it("returns a different verified premium for Option II at the same point", () => {
    const result = calculatePremium(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(8250);
  });

  it("returns the correct Single premium", () => {
    const result = calculatePremium(ctx({ premiumFrequency: "single" }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(59550);
  });

  it("does NOT extrapolate for an age outside the published sample", () => {
    const result = calculatePremium(ctx({ age: 25 }));
    expect(result.available).toBe(false);
  });
});

describe("Plan 875 benefits", () => {
  it("never reports a maturity benefit", () => {
    const result = calculateBenefits(ctx());
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("computes the Option II Absolute Amount including its capped final value", () => {
    const result = calculateBenefits(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.guaranteedBenefits?.absoluteAmountAssuredAtInception).toBe(5000000);
    expect(result.guaranteedBenefits?.absoluteAmountAssuredFromPolicyYear16).toBe(10000000);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
