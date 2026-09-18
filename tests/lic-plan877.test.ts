import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { outstandingBalanceRatio, sumAssuredOnDeathAtPolicyYear } from "@/lib/insurance/providers/lic/plans/creditLifeShared";
import { PLAN_877_RULES, PLAN_877_UIN, evaluateEligibility, calculatePremium, calculateBenefits } from "@/lib/insurance/providers/lic/plans/plan877";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-877") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 20,
    sumAssured: 5000000,
    policyTermYears: 25,
    premiumFrequency: "single" as const,
    productSpecificInputs: { interestRate: 8 },
    product,
    ...overrides,
  };
}

describe("Plan 877 identity", () => {
  it("matches the catalogue's Plan 877 identity exactly", () => {
    expect(product.planNumber).toBe("877");
    expect(product.uin).toBe(PLAN_877_UIN);
    expect(PLAN_877_UIN).toBe("512N357V01");
  });
});

describe("Plan 877's loan-amortisation Risk Cover Schedule formula, cross-checked exactly against the brochure's own published schedule (BSA normalised to 1,000; rate 8%; term 25)", () => {
  const published = [
    1000.0, 986.32, 971.55, 955.59, 938.36, 919.75, 899.65, 877.95, 854.5, 829.19, 801.84, 772.31, 740.42, 705.97,
    668.77, 628.59, 585.2, 538.34, 487.73, 433.07, 374.03, 310.28, 241.42, 167.05, 86.74,
  ];

  it.each(published.map((value, i) => ({ policyYear: i + 1, value })))(
    "matches policy year $policyYear exactly",
    ({ policyYear, value }) => {
      const computed = sumAssuredOnDeathAtPolicyYear(1000, 8, 25, policyYear);
      expect(computed).toBeCloseTo(value, 1);
    }
  );

  it("always starts at exactly 100% of the principal (policy year 1)", () => {
    expect(outstandingBalanceRatio(8, 25, 1)).toBe(1);
  });
});

describe("Plan 877 eligibility", () => {
  it("accepts age 20 with a 25-year term, Single premium, interest rate 8%", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 46, above the maximum entry age of 45", () => {
    const result = evaluateEligibility(ctx({ age: 46 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("rejects a Policy Term above the maximum of 30 years", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 31 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("unlocks progressively longer Limited Premium Paying Terms as Policy Term grows", () => {
    expect(PLAN_877_RULES.limitedPptOptionsForTerm(9)).toEqual([]);
    expect(PLAN_877_RULES.limitedPptOptionsForTerm(10)).toEqual([5]);
    expect(PLAN_877_RULES.limitedPptOptionsForTerm(15)).toEqual([5, 10]);
    expect(PLAN_877_RULES.limitedPptOptionsForTerm(25)).toEqual([5, 10, 15]);
  });

  it("rejects an unsupported interest rate choice", () => {
    const result = evaluateEligibility(
      ctx({ productSpecificInputs: { interestRate: 8.5 } })
    );
    expect(result.missingInputs).toContain("productSpecificInputs.interestRate");
  });
});

describe("Plan 877 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.50,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_877_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });
});

describe("Plan 877 premium engine — exact lookup only at the published interest rate (8%)", () => {
  it("returns a verified Single premium for age 20, term 25", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(40900);
  });

  it("returns the correct Limited (10-year) premium", () => {
    const result = calculatePremium(
      ctx({ premiumFrequency: undefined, policyTermYears: 25, premiumPaymentTermYears: 10 })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(6100);
  });

  it("does NOT re-derive a premium for an unpublished interest rate (e.g. 7%)", () => {
    const result = calculatePremium(ctx({ productSpecificInputs: { interestRate: 7 } }));
    expect(result.available).toBe(false);
  });
});

describe("Plan 877 benefits — decreasing Sum Assured on Death", () => {
  it("never reports a maturity benefit", () => {
    const result = calculateBenefits(ctx());
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("reports Sum Assured on Death at inception as exactly the Basic Sum Assured", () => {
    const result = calculateBenefits(ctx());
    expect(result.deathBenefit).toBe(5000000);
    expect(result.guaranteedBenefits?.sumAssuredOnDeathAtInception).toBe(5000000);
  });

  it("computes the final policy year's Sum Assured on Death using the verified amortisation formula", () => {
    const result = calculateBenefits(ctx());
    // Matches the published schedule's final row (86.74 per 1,000, ~8.674%
    // of BSA) scaled to BSA 50,00,000, within the rounding difference
    // between the brochure's own 2-decimal-per-1,000 table and this
    // engine's direct computation at full scale.
    const value = result.guaranteedBenefits?.sumAssuredOnDeathAtFinalPolicyYear as number;
    expect(Math.abs(value - 5000000 * (86.74 / 1000))).toBeLessThan(5);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
