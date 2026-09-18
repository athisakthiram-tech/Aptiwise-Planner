import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_954_RULES, PLAN_954_UIN, evaluateEligibility, calculatePremium, calculateBenefits } from "@/lib/insurance/providers/lic/plans/plan954";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-954") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 20,
    sumAssured: 10000000,
    policyTermYears: 20,
    productSpecificInputs: { deathBenefitOption: "I" },
    product,
    ...overrides,
  };
}

describe("Plan 954 identity", () => {
  it("matches the catalogue's Plan 954 identity exactly", () => {
    expect(product.planNumber).toBe("954");
    expect(product.uin).toBe(PLAN_954_UIN);
    expect(PLAN_954_UIN).toBe("512N351V02");
  });
});

describe("Plan 954 eligibility: broader entry age (up to 65) than Digi Term/Yuva Term", () => {
  it("accepts age 60, above Digi Term/Yuva Term's 45-year ceiling", () => {
    const result = evaluateEligibility(ctx({ age: 60, policyTermYears: 15 }));
    expect(result.eligible).toBe(true);
  });

  it("rejects age 66, above the maximum entry age of 65", () => {
    const result = evaluateEligibility(ctx({ age: 66, policyTermYears: 10 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("accepts a Policy Term of 10 years, below Digi Term/Yuva Term's minimum of 15", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 10 }));
    expect(result.eligible).toBe(true);
  });

  it("derives Limited Premium Paying Term as an offset from Policy Term (Term - 5 or Term - 10)", () => {
    expect(PLAN_954_RULES.limitedPptOptionsForTerm(20)).toEqual([15, 10]);
    expect(PLAN_954_RULES.limitedPptOptionsForTerm(12)).toEqual([7]);
  });

  it("accepts a Limited Premium of Term-5 (15 years) for a 20-year term", () => {
    const result = evaluateEligibility(
      ctx({ premiumPaymentTermYears: 15 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects a Limited Premium that isn't Term-5 or Term-10", () => {
    const result = evaluateEligibility(
      ctx({ premiumPaymentTermYears: 12 })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "invalid_premium_paying_term")).toBe(true);
  });
});

describe("Plan 954 Sum Assured rules: simpler 2-tier band than Digi Term/Yuva Term", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.50,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_954_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment above Rs.75,00,000 (must be a multiple of Rs.25,00,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 8000000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });

  it("accepts a valid increment of Rs.25,00,000 above Rs.75,00,000", () => {
    expect(evaluateEligibility(ctx({ sumAssured: 10000000 })).eligible).toBe(true);
  });
});

describe("Plan 954 premium engine — exact lookup only (BSA Rs.1,00,00,000)", () => {
  it("returns a verified Regular premium for Option I at age 20, term 20", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(7047);
  });

  it("returns the correct Limited (Term-10) premium", () => {
    const result = calculatePremium(ctx({ premiumPaymentTermYears: 10 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(10266);
  });

  it("returns the correct Single premium under Option II", () => {
    const result = calculatePremium(
      ctx({ premiumFrequency: "single", productSpecificInputs: { deathBenefitOption: "II" } })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(102617);
  });
});

describe("Plan 954 benefits", () => {
  it("never reports a maturity benefit", () => {
    const result = calculateBenefits(ctx());
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("computes the Option I Absolute Amount as flat Basic Sum Assured", () => {
    const result = calculateBenefits(ctx());
    expect(result.deathBenefit).toBe(10000000);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
