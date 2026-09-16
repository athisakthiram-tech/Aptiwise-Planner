import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_774_RULES,
  PLAN_774_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan774";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-774") as InsuranceProduct;

function limitedCtx(overrides: Record<string, unknown> = {}) {
  return { age: 5, product, premiumFrequency: "yearly" as const, ...overrides };
}
function singleCtx(overrides: Record<string, unknown> = {}) {
  return { age: 5, product, premiumFrequency: "single" as const, ...overrides };
}

describe("Plan 774 identity", () => {
  it("matches the catalogue's Plan 774 identity exactly", () => {
    expect(product.planNumber).toBe("774");
    expect(product.uin).toBe(PLAN_774_UIN);
    expect(PLAN_774_UIN).toBe("512N365V02");
  });
});

describe("Plan 774 eligibility: age boundaries (child plan, 0-13)", () => {
  it("accepts the minimum entry age (0)", () => {
    const result = evaluateEligibility(
      limitedCtx({ age: 0, policyTermYears: 20, premiumPaymentTermYears: 7, sumAssured: 500000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects an age above the maximum entry age of 13", () => {
    const result = evaluateEligibility(limitedCtx({ age: 14 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });
});

describe("Plan 774 term/PPT: Limited vs Single premium have different rules", () => {
  it("accepts a Limited Premium term of 10-25 years with PPT in {5,6,7}", () => {
    const result = evaluateEligibility(
      limitedCtx({ age: 5, policyTermYears: 20, premiumPaymentTermYears: 7, sumAssured: 500000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects a Limited Premium PPT outside {5,6,7}", () => {
    const result = evaluateEligibility(
      limitedCtx({ age: 5, policyTermYears: 20, premiumPaymentTermYears: 10, sumAssured: 500000 })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "invalid_premium_paying_term")).toBe(true);
  });

  it("rejects a Single Premium term below the minimum of 5 years", () => {
    const result = evaluateEligibility(singleCtx({ age: 5, policyTermYears: 4, sumAssured: 500000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("accepts a Single Premium term of 5-25 years without a PPT choice", () => {
    const result = evaluateEligibility(singleCtx({ age: 5, policyTermYears: 20, sumAssured: 500000 }));
    expect(result.eligible).toBe(true);
  });
});

describe("Plan 774 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.2,00,000", () => {
    const result = evaluateEligibility(limitedCtx({ sumAssured: PLAN_774_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment above Rs.24,00,000 (step Rs.50,000)", () => {
    const result = evaluateEligibility(limitedCtx({ sumAssured: 2420000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 774 death-benefit Option / premium-mode mismatch", () => {
  it("rejects Option III (Single Premium only) under Limited Premium payment", () => {
    const result = evaluateEligibility(
      limitedCtx({
        age: 5,
        policyTermYears: 20,
        premiumPaymentTermYears: 7,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "III" },
      })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "death_benefit_option_mode_mismatch")).toBe(true);
  });
});

describe("Plan 774 premium engine — exact lookup only, split by mode and Option", () => {
  it("returns a verified Limited Premium (Option I) for the exact published point", () => {
    const result = calculatePremium(
      limitedCtx({
        age: 5,
        policyTermYears: 20,
        premiumPaymentTermYears: 7,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(73625);
  });

  it("returns a verified Single Premium (Option IV) for the exact published point", () => {
    const result = calculatePremium(
      singleCtx({
        age: 5,
        policyTermYears: 20,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "IV" },
      })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(412600);
  });

  it("does NOT scale for a different Basic Sum Assured", () => {
    const result = calculatePremium(
      limitedCtx({
        age: 5,
        policyTermYears: 20,
        premiumPaymentTermYears: 7,
        sumAssured: 1000000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    expect(result.available).toBe(false);
  });

  it("unsupported age returns unavailable/null", () => {
    const result = calculatePremium(
      limitedCtx({
        age: 6,
        policyTermYears: 20,
        premiumPaymentTermYears: 7,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });
});

describe("Plan 774 benefits — guaranteed Addition is fully computable, never dependent on unverified experience", () => {
  it("computes maturity as Basic Sum Assured plus the fixed Guaranteed Addition", () => {
    const result = calculateBenefits(limitedCtx({ policyTermYears: 20, sumAssured: 500000 }));
    // Rs.80 per thousand BSA per year * 20 years = 0.08*500000*20 = 800000.
    expect(result.guaranteedBenefits?.guaranteedAdditionAtMaturity).toBe(800000);
    expect(result.maturityBenefit).toBe(1300000);
  });

  it("never fabricates a bonus (this Non-Par plan has none, and none is invented)", () => {
    const result = calculateBenefits(limitedCtx({ policyTermYears: 20, sumAssured: 500000 }));
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });

  it("computes an exact Sum Assured on Death (Option I) when premium is verified", () => {
    const result = calculateBenefits(
      limitedCtx({
        age: 5,
        policyTermYears: 20,
        premiumPaymentTermYears: 7,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    // premium=73625 -> 7*73625=515375, higher than BSA 500000.
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(515375);
    expect(result.deathBenefit).toBe(515375);
  });

  it("reports the guaranteed BSA floor for Options I-III when premium is unavailable", () => {
    const result = calculateBenefits(
      limitedCtx({
        age: 6,
        policyTermYears: 20,
        premiumPaymentTermYears: 7,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "I" },
      })
    );
    expect(result.guaranteedBenefits?.sumAssuredOnDeathMinimum).toBe(500000);
    expect(result.deathBenefit).toBeUndefined();
  });

  it("Option IV has no Basic-Sum-Assured floor and reports nothing when premium is unavailable", () => {
    const result = calculateBenefits(
      singleCtx({
        age: 6,
        policyTermYears: 20,
        sumAssured: 500000,
        productSpecificInputs: { deathBenefitOption: "IV" },
      })
    );
    expect(result.guaranteedBenefits?.sumAssuredOnDeathMinimum).toBeUndefined();
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBeUndefined();
    expect(result.deathBenefit).toBeUndefined();
  });
});
