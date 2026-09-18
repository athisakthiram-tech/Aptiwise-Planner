import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_894_RULES, PLAN_894_UIN, evaluateEligibility, calculatePremium, calculateBenefits } from "@/lib/insurance/providers/lic/plans/plan894";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-894") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 20, sumAssured: 500000, policyTermYears: 20, product, ...overrides };
}

describe("Plan 894 identity", () => {
  it("matches the catalogue's Plan 894 identity exactly", () => {
    expect(product.planNumber).toBe("894");
    expect(product.uin).toBe(PLAN_894_UIN);
    expect(PLAN_894_UIN).toBe("512N368V01");
  });
});

describe("Plan 894 eligibility", () => {
  it("accepts age 20 with a 20-year term", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 46, above the maximum entry age of 45", () => {
    const result = evaluateEligibility(ctx({ age: 46 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });
});

describe("Plan 894 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.5,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_894_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });
});

describe("Plan 894 premium engine — exact lookup only, no Increasing option to split by", () => {
  it("returns a verified Regular premium at age 20, term 20", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(2290);
  });

  it("returns the same premium regardless of any deathBenefitOption supplied (there is only one)", () => {
    const withOption = calculatePremium(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    const withoutOption = calculatePremium(ctx());
    expect(withOption.premium).toBe(withoutOption.premium);
  });

  it("returns the correct Limited (10-year) premium", () => {
    const result = calculatePremium(ctx({ premiumPaymentTermYears: 10 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(3150);
  });
});

describe("Plan 894 benefits — no Level/Increasing choice, Absolute Amount is always flat BSA", () => {
  it("never reports a maturity benefit", () => {
    const result = calculateBenefits(ctx());
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("never reports an Increasing-option cap even when Option II is requested", () => {
    const result = calculateBenefits(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.guaranteedBenefits?.absoluteAmountAssuredFromPolicyYear16).toBeUndefined();
    expect(result.guaranteedBenefits?.absoluteAmountAssuredAtInception).toBe(500000);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
