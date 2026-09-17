import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_881_RULES,
  PLAN_881_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan881";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-881") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 35, sumAssured: 200000, policyTermYears: 25, product, ...overrides };
}

describe("Plan 881 identity", () => {
  it("matches the catalogue's Plan 881 identity exactly", () => {
    expect(product.planNumber).toBe("881");
    expect(product.uin).toBe(PLAN_881_UIN);
    expect(PLAN_881_UIN).toBe("512N389V01");
  });
});

describe("Plan 881 eligibility: entry age and fixed Policy Term", () => {
  it("accepts age 18, the lower boundary", () => {
    expect(evaluateEligibility(ctx({ age: 18, premiumPaymentTermYears: 7 })).eligible).toBe(true);
  });

  it("rejects age 51, above the maximum entry age of 50", () => {
    const result = evaluateEligibility(ctx({ age: 51, premiumPaymentTermYears: 7 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("rejects a Policy Term other than the fixed 25 years", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 20, premiumPaymentTermYears: 7 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("rejects a Premium Paying Term outside 7-15 years", () => {
    const result = evaluateEligibility(ctx({ premiumPaymentTermYears: 16 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "invalid_premium_paying_term")).toBe(true);
  });
});

describe("Plan 881 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.2,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_881_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment (not a multiple of Rs.10,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 205000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 881 premium engine — exact lookup only (age 35, BSA Rs.2,00,000), split by Option", () => {
  it("returns a verified premium for Option A at PPT 7", () => {
    const result = calculatePremium(
      ctx({ premiumPaymentTermYears: 7, productSpecificInputs: { survivalBenefitOption: "A" } })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(47840);
  });

  it("returns a different verified premium for Option B at the same PPT", () => {
    const result = calculatePremium(
      ctx({ premiumPaymentTermYears: 7, productSpecificInputs: { survivalBenefitOption: "B" } })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(56700);
  });

  it("does NOT extrapolate for an age outside the published sample (age 35 only)", () => {
    const result = calculatePremium(
      ctx({ age: 40, premiumPaymentTermYears: 7, productSpecificInputs: { survivalBenefitOption: "A" } })
    );
    expect(result.available).toBe(false);
  });
});

describe("Plan 881 benefits — Guaranteed Addition accrues for the full 25-year Policy Term", () => {
  it("computes the Option A survival benefit as 50% of BSA at end of PPT", () => {
    const result = calculateBenefits(
      ctx({ premiumPaymentTermYears: 7, productSpecificInputs: { survivalBenefitOption: "A" } })
    );
    expect(result.guaranteedBenefits?.survivalBenefitAtEndOfPpt).toBe(100000);
  });

  it("computes the Option B survival benefit as 7.5% of BSA per instalment", () => {
    const result = calculateBenefits(
      ctx({ premiumPaymentTermYears: 7, productSpecificInputs: { survivalBenefitOption: "B" } })
    );
    expect(result.guaranteedBenefits?.survivalBenefitPerInstallment).toBe(15000);
  });

  it("computes an exact Sum Assured on Death when premium is verified (higher of BSA or 10x premium)", () => {
    const result = calculateBenefits(
      ctx({ premiumPaymentTermYears: 7, productSpecificInputs: { survivalBenefitOption: "A" } })
    );
    // 10*47840=478400, higher than BSA 200000.
    expect(result.deathBenefit).toBe(478400);
  });

  it("stays with the BSA guaranteed floor only when premium is unavailable", () => {
    const result = calculateBenefits(ctx({ age: 40, premiumPaymentTermYears: 7 }));
    expect(result.guaranteedBenefits?.guaranteedAdditionAtMaturity).toBeUndefined();
    expect(result.maturityBenefit).toBe(200000);
    expect(result.deathBenefit).toBeUndefined();
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(
      ctx({ premiumPaymentTermYears: 7, productSpecificInputs: { survivalBenefitOption: "A" } })
    );
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
