import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_878_RULES, PLAN_878_UIN, evaluateEligibility, calculatePremium, calculateBenefits } from "@/lib/insurance/providers/lic/plans/plan878";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-878") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 30,
    sumAssured: 5000000,
    policyTermYears: 25,
    premiumFrequency: "single" as const,
    productSpecificInputs: { interestRate: 8 },
    product,
    ...overrides,
  };
}

describe("Plan 878 identity", () => {
  it("matches the catalogue's Plan 878 identity exactly", () => {
    expect(product.planNumber).toBe("878");
    expect(product.uin).toBe(PLAN_878_UIN);
    expect(PLAN_878_UIN).toBe("512N358V01");
  });
});

describe("Plan 878 eligibility (identical structure to Yuva Credit Life)", () => {
  it("accepts age 30 with a 25-year term, Single premium, interest rate 8%", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 46, above the maximum entry age of 45", () => {
    const result = evaluateEligibility(ctx({ age: 46 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });
});

describe("Plan 878 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.50,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_878_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });
});

describe("Plan 878 premium engine — exact lookup only, distinct from Yuva Credit Life's own figures", () => {
  it("returns a verified Single premium for age 30, term 25 (cheaper than Yuva Credit Life's offline rate)", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(45500);
  });

  it("returns the correct Limited (5-year) premium", () => {
    const result = calculatePremium(
      ctx({ premiumFrequency: undefined, premiumPaymentTermYears: 5 })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(10500);
  });

  it("does NOT re-derive a premium for an unpublished interest rate", () => {
    const result = calculatePremium(ctx({ productSpecificInputs: { interestRate: 10 } }));
    expect(result.available).toBe(false);
  });
});

describe("Plan 878 benefits — decreasing Sum Assured on Death, same verified formula as Plan 877", () => {
  it("never reports a maturity benefit", () => {
    const result = calculateBenefits(ctx());
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("reports Sum Assured on Death at inception as exactly the Basic Sum Assured", () => {
    const result = calculateBenefits(ctx());
    expect(result.deathBenefit).toBe(5000000);
  });

  it("computes a declining final-policy-year Sum Assured on Death, well below the inception value", () => {
    const result = calculateBenefits(ctx());
    const final = result.guaranteedBenefits?.sumAssuredOnDeathAtFinalPolicyYear as number;
    expect(final).toBeLessThan(5000000);
    expect(final).toBeGreaterThan(0);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
