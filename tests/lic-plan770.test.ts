import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_770_RULES,
  PLAN_770_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan770";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-770") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 35,
    sumAssured: 300000,
    policyTermYears: 30,
    premiumPaymentTermYears: 7,
    product,
    ...overrides,
  };
}

describe("Plan 770 identity", () => {
  it("matches the catalogue's Plan 770 identity exactly", () => {
    expect(product.planNumber).toBe("770");
    expect(product.uin).toBe(PLAN_770_UIN);
    expect(PLAN_770_UIN).toBe("512N397V01");
  });
});

describe("Plan 770 eligibility: PPT-dependent entry age and Policy Term range", () => {
  it("accepts age 35 with PPT 7, term 30", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 56 for PPT 7 (max entry age is 55)", () => {
    const result = evaluateEligibility(ctx({ age: 56 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("rejects a term of 16 for PPT 7 (min term for PPT 7 is 17)", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 16 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range_for_ppt")).toBe(true);
  });

  it("rejects an unsupported Premium Paying Term", () => {
    const result = evaluateEligibility(ctx({ premiumPaymentTermYears: 9 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "invalid_premium_paying_term")).toBe(true);
  });
});

describe("Plan 770 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.3,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_770_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment (not a multiple of Rs.10,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 305000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 770 premium engine — exact lookup only (BSA Rs.3,00,000, term 30)", () => {
  it("returns a verified premium for age 35, PPT 7", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(87495);
  });

  it("returns a different verified premium for a different PPT at the same age", () => {
    const result = calculatePremium(ctx({ premiumPaymentTermYears: 10 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(57015);
  });

  it("does NOT extrapolate for a policy term outside the published 30-year sample", () => {
    const result = calculatePremium(ctx({ policyTermYears: 25 }));
    expect(result.available).toBe(false);
  });
});

describe("Plan 770 benefits — Income Benefit needs no premium; Guaranteed Addition needs a verified premium", () => {
  it("computes the Regular Income Benefit as 10% of BSA, needing no verified premium", () => {
    // policyTermYears 25 has no published premium row, yet the Regular
    // Income Benefit (BSA-only) is still computed.
    const result = calculateBenefits(ctx({ policyTermYears: 25 }));
    expect(result.guaranteedBenefits?.regularIncomeBenefitAnnual).toBe(30000);
  });

  it("computes the Booster Income Benefit as 70% of BSA when PPT is known", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.boosterIncomeBenefit).toBe(210000);
  });

  it("computes an exact Sum Assured on Death when premium is verified (higher of BSA or 11x premium)", () => {
    const result = calculateBenefits(ctx());
    // 11*87495=962445, higher than BSA 300000.
    expect(result.deathBenefit).toBe(962445);
  });

  it("stays with the BSA guaranteed floor for maturity/death when premium is unavailable", () => {
    const result = calculateBenefits(ctx({ policyTermYears: 25 }));
    expect(result.guaranteedBenefits?.guaranteedAdditionAtMaturity).toBeUndefined();
    expect(result.maturityBenefit).toBe(300000);
    expect(result.guaranteedBenefits?.sumAssuredOnDeathMinimum).toBe(300000);
    expect(result.deathBenefit).toBeUndefined();
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
