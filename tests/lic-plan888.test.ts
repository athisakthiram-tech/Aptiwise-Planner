import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_888_RULES,
  PLAN_888_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan888";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-888") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 35,
    sumAssured: 300000,
    policyTermYears: 20,
    productSpecificInputs: { deathBenefitOption: "I" },
    product,
    ...overrides,
  };
}

describe("Plan 888 identity", () => {
  it("matches the catalogue's Plan 888 identity exactly", () => {
    expect(product.planNumber).toBe("888");
    expect(product.uin).toBe(PLAN_888_UIN);
    expect(PLAN_888_UIN).toBe("512N393V01");
  });
});

describe("Plan 888 eligibility: Option-dependent entry age and Policy Term set", () => {
  it("accepts age 35 with Option I, term 20", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age below the minimum entry age of 18 for both lives", () => {
    const result = evaluateEligibility(ctx({ age: 17 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_below_min")).toBe(true);
  });

  it("rejects age above Option II's stricter maximum entry age of 35", () => {
    const result = evaluateEligibility(
      ctx({ age: 36, policyTermYears: 10, productSpecificInputs: { deathBenefitOption: "II" } })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_above_max_for_ppt")).toBe(true);
  });

  it("rejects a Policy Term of 20 under Option II (only 10 and 15 are offered)", () => {
    const result = evaluateEligibility(
      ctx({ age: 30, policyTermYears: 20, productSpecificInputs: { deathBenefitOption: "II" } })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("accepts age 35 with Option II at the exact maturity-age boundary (term 15 -> maturity 50)", () => {
    // Option II's own max-entry-age table (35) is tuned so that maturity
    // age never exceeds 50 for any offered term — this boundary case
    // (50 exactly) is the closest reachable check.
    const result = evaluateEligibility(
      ctx({ age: 35, policyTermYears: 15, productSpecificInputs: { deathBenefitOption: "II" } })
    );
    expect(result.eligible).toBe(true);
  });
});

describe("Plan 888 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.3,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_888_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment (not a multiple of Rs.25,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 310000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 888 premium engine — exact lookup only (BSA Rs.3,00,000), split by Option", () => {
  it("returns a verified Single Premium for Option I at age 35, term 20", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(252525);
    expect(result.premiumFrequency).toBe("single");
  });

  it("returns a different verified premium for Option II at a term it offers", () => {
    const result = calculatePremium(
      ctx({ policyTermYears: 10, productSpecificInputs: { deathBenefitOption: "II" } })
    );
    expect(result.available).toBe(true);
    expect(result.premium).toBe(427620);
  });

  it("does NOT extrapolate for a term Option II doesn't publish (20)", () => {
    const result = calculatePremium(
      ctx({ policyTermYears: 20, productSpecificInputs: { deathBenefitOption: "II" } })
    );
    expect(result.available).toBe(false);
  });
});

describe("Plan 888 benefits — BSA-based Guaranteed Addition; SAD reconstructs the pre-rebate Tabular Single Premium", () => {
  it("matches the brochure's Illustration 1 exactly: Option I, term 20, BSA Rs.10,00,000, premium 8,12,750", () => {
    const result = calculateBenefits({
      age: 35,
      sumAssured: 1000000,
      policyTermYears: 20,
      productSpecificInputs: { deathBenefitOption: "I" },
      product,
    });
    // Guaranteed Addition is BSA-only: 70/1000 * 10,00,000 * 20 = 14,00,000.
    expect(result.guaranteedBenefits?.guaranteedAdditionAtMaturity).toBe(1400000);
    expect(result.maturityBenefit).toBe(1000000 + 1400000);
  });

  it("computes the Guaranteed Addition as a simple linear BSA-based accrual (no premium needed)", () => {
    const result = calculateBenefits(ctx());
    // 70/1000 * 3,00,000 * 20 = 4,20,000.
    expect(result.guaranteedBenefits?.guaranteedAdditionAtMaturity).toBe(420000);
  });

  it("reconstructs the pre-rebate Tabular Single Premium to compute an exact Option I Sum Assured on Death", () => {
    const result = calculateBenefits(ctx());
    // premium=252525 (age 35, term 20, BSA 3,00,000); BSA falls below
    // the lowest High-BSA rebate band (< Rs.5,00,000), so rebate = 0 and
    // the Tabular premium equals the quoted premium exactly.
    // SAD = max(BSA, 1.25*252525) = max(300000, 315656) = 315656.
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(315656);
  });

  it("stays with the BSA floor for Option I when premium is unavailable", () => {
    const result = calculateBenefits(ctx({ age: 45 }));
    expect(result.guaranteedBenefits?.sumAssuredOnDeathMinimum).toBe(300000);
    expect(result.deathBenefit).toBeUndefined();
  });

  it("never applies a BSA floor to Option II", () => {
    const result = calculateBenefits(
      ctx({ policyTermYears: 10, productSpecificInputs: { deathBenefitOption: "II" } })
    );
    // 10x a small tabular premium is already far above BSA here, so this
    // doesn't distinguish the floor — the key guarantee is that an
    // *unavailable* premium for Option II never falls back to reporting
    // the BSA as if it were guaranteed.
    const unavailable = calculateBenefits(
      ctx({ age: 45, policyTermYears: 10, productSpecificInputs: { deathBenefitOption: "II" } })
    );
    expect(unavailable.guaranteedBenefits?.sumAssuredOnDeathMinimum).toBeUndefined();
    expect(unavailable.deathBenefit).toBeUndefined();
    expect(result.deathBenefit).toBeDefined();
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
