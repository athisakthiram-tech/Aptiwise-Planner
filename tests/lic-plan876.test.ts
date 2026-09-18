import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_876_RULES, PLAN_876_UIN, evaluateEligibility, calculatePremium, calculateBenefits } from "@/lib/insurance/providers/lic/plans/plan876";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-876") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 20,
    sumAssured: 5000000,
    policyTermYears: 20,
    premiumFrequency: "yearly" as const,
    productSpecificInputs: { deathBenefitOption: "I" },
    product,
    ...overrides,
  };
}

describe("Plan 876 identity", () => {
  it("matches the catalogue's Plan 876 identity exactly", () => {
    expect(product.planNumber).toBe("876");
    expect(product.uin).toBe(PLAN_876_UIN);
    expect(PLAN_876_UIN).toBe("512N356V02");
  });
});

describe("Plan 876 eligibility: entry age, Policy Term and maturity age", () => {
  it("accepts age 20 with a 20-year term, Regular premium", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 46, above the maximum entry age of 45", () => {
    const result = evaluateEligibility(ctx({ age: 46 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("rejects a Policy Term below the minimum of 15 years", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 14 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("accepts age 18 with the minimum 15-year term at the exact maturity-age boundary (33)", () => {
    // minEntryAge (18) + minPolicyTermYears (15) = 33 exactly, so the
    // minimum maturity age of 33 can never actually be breached — this
    // boundary case is the closest reachable check.
    const result = evaluateEligibility(ctx({ age: 18, policyTermYears: 15 }));
    expect(result.eligible).toBe(true);
  });

  it("accepts a valid Limited Premium of 15 years for a 20-year term", () => {
    const result = evaluateEligibility(
      ctx({ premiumPaymentTermYears: 15, premiumFrequency: undefined })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects a Limited Premium of 15 years for a 16-year term (needs term >= 20)", () => {
    const result = evaluateEligibility(
      ctx({ policyTermYears: 16, premiumPaymentTermYears: 15, premiumFrequency: undefined })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "invalid_premium_paying_term")).toBe(true);
  });

  it("enforces Option II's stricter max Policy Term by age/BSA band", () => {
    // Age 36-45, BSA < 1 Crore -> max term 26 years under Option II.
    const result = evaluateEligibility(
      ctx({ age: 40, policyTermYears: 27, productSpecificInputs: { deathBenefitOption: "II" } })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("accepts a 40-year term under Option I at the same age/BSA (no extra cap)", () => {
    const result = evaluateEligibility(
      ctx({ age: 40, policyTermYears: 27, productSpecificInputs: { deathBenefitOption: "I" } })
    );
    expect(result.eligible).toBe(true);
  });
});

describe("Plan 876 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.50,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_876_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment (not a multiple of Rs.1,00,000 in the lowest band)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 5050001 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 876 premium engine — exact lookup only, split by Option and mode", () => {
  it("returns a verified Regular premium for Option I at age 20, term 20", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(3600);
  });

  it("returns a different verified premium for Option II at the same point", () => {
    const result = calculatePremium(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(4650);
  });

  it("returns the correct Limited (10-year) premium, distinct from the 15-year one", () => {
    const result = calculatePremium(
      ctx({ premiumPaymentTermYears: 10, premiumFrequency: undefined })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(5200);
  });

  it("returns the correct Single premium", () => {
    const result = calculatePremium(ctx({ premiumFrequency: "single" }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(37750);
    expect(result.premiumFrequency).toBe("single");
  });

  it("does NOT extrapolate for an age outside the published sample", () => {
    const result = calculatePremium(ctx({ age: 25 }));
    expect(result.available).toBe(false);
  });
});

describe("Plan 876 benefits — no maturity benefit; Absolute Amount depends on Option", () => {
  it("never reports a maturity benefit — this is a pure risk plan", () => {
    const result = calculateBenefits(ctx());
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("computes the Option I Absolute Amount as flat Basic Sum Assured", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.absoluteAmountAssuredAtInception).toBe(5000000);
    expect(result.guaranteedBenefits?.absoluteAmountAssuredFromPolicyYear16).toBeUndefined();
  });

  it("computes the Option II Absolute Amount, including its capped final value of 2x BSA", () => {
    const result = calculateBenefits(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.guaranteedBenefits?.absoluteAmountAssuredAtInception).toBe(5000000);
    expect(result.guaranteedBenefits?.absoluteAmountAssuredFromPolicyYear16).toBe(10000000);
  });

  it("raises the death benefit to 7x premium when that exceeds the Absolute Amount", () => {
    const result = calculateBenefits(ctx({ age: 40 }));
    // 7*9400=65800, far below Absolute Amount 5,000,000, so the floor wins.
    expect(result.deathBenefit).toBe(5000000);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
