import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_912_RULES,
  PLAN_912_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan912";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-912") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 35, product, ...overrides };
}

describe("Plan 912 identity", () => {
  it("matches the catalogue's Plan 912 identity exactly", () => {
    expect(product.planNumber).toBe("912");
    expect(product.uin).toBe(PLAN_912_UIN);
    expect(PLAN_912_UIN).toBe("512N387V02");
  });
});

describe("Plan 912 eligibility: PPT-dependent age and term ranges", () => {
  it("accepts PPT 6 with term 10 at age 35", () => {
    const result = evaluateEligibility(
      ctx({ premiumPaymentTermYears: 6, policyTermYears: 10, sumAssured: 500000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects a term of 10 for PPT 15 (min term for PPT 15 is 18)", () => {
    const result = evaluateEligibility(
      ctx({ premiumPaymentTermYears: 15, policyTermYears: 10, sumAssured: 500000 })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range_for_ppt")).toBe(true);
  });

  it("rejects an age above PPT 15's maximum entry age of 57", () => {
    const result = evaluateEligibility(
      ctx({ age: 58, premiumPaymentTermYears: 15, policyTermYears: 18, sumAssured: 500000 })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_above_max_for_ppt")).toBe(true);
  });

  it("accepts age 57 — PPT 15's own maximum entry age boundary", () => {
    const atBoundary = evaluateEligibility(
      ctx({ age: 57, premiumPaymentTermYears: 15, policyTermYears: 18, sumAssured: 500000 })
    );
    expect(atBoundary.eligible).toBe(true);
  });

  it("rejects an unsupported Premium Paying Term", () => {
    const result = evaluateEligibility(ctx({ premiumPaymentTermYears: 7, sumAssured: 500000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "invalid_premium_paying_term")).toBe(true);
  });
});

describe("Plan 912 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.5,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_912_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment (not a multiple of Rs.10,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 505000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });

  it("accepts a valid increment", () => {
    const result = evaluateEligibility(
      ctx({ premiumPaymentTermYears: 6, policyTermYears: 10, sumAssured: 510000 })
    );
    expect(result.eligible).toBe(true);
  });
});

describe("Plan 912 premium engine — exact lookup only, split by Option", () => {
  it("returns a verified premium for Option I at an exact published point", () => {
    const result = calculatePremium(
      ctx({
        premiumPaymentTermYears: 6,
        policyTermYears: 10,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(101350);
  });

  it("returns a different verified premium for Option II at the same point", () => {
    const result = calculatePremium(
      ctx({
        premiumPaymentTermYears: 6,
        policyTermYears: 10,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "II" },
      })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(103025);
  });

  it("does NOT extrapolate for a PPT/term combination outside the published set", () => {
    const result = calculatePremium(
      ctx({
        premiumPaymentTermYears: 8,
        policyTermYears: 10,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });
});

describe("Plan 912 benefits — Guaranteed Addition needs a verified premium, guaranteed floor otherwise", () => {
  it("computes maturity as Basic Sum Assured plus the term-banded Guaranteed Addition", () => {
    const result = calculateBenefits(
      ctx({
        premiumPaymentTermYears: 6,
        policyTermYears: 10,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    // premium=101350, term 10 -> rate 8.5% -> GA/year = 0.085*101350 = 8614.75;
    // accrued over 10 years = 86147.5, rounded to 86148.
    expect(result.guaranteedBenefits?.guaranteedAdditionAtMaturity).toBe(86148);
    expect(result.maturityBenefit).toBe(586148);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(
      ctx({
        premiumPaymentTermYears: 6,
        policyTermYears: 10,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });

  it("computes an exact Sum Assured on Death when premium is verified", () => {
    const result = calculateBenefits(
      ctx({
        premiumPaymentTermYears: 6,
        policyTermYears: 10,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    // 7*101350=709450, higher than BSA 500000.
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(709450);
    expect(result.deathBenefit).toBe(709450);
  });

  it("stays with the maturity/BSA guaranteed floor only (no GA, no death benefit) when premium is unavailable", () => {
    const result = calculateBenefits(
      ctx({
        premiumPaymentTermYears: 8,
        policyTermYears: 10,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    expect(result.maturityBenefit).toBe(500000);
    expect(result.guaranteedBenefits?.guaranteedAdditionAtMaturity).toBeUndefined();
    expect(result.guaranteedBenefits?.sumAssuredOnDeathMinimum).toBe(500000);
    expect(result.deathBenefit).toBeUndefined();
  });
});
