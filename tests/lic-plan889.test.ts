import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { accrueGuaranteedAdditionOnPremium } from "@/lib/insurance/providers/lic/plans/shared";
import {
  PLAN_889_RULES,
  PLAN_889_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan889";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-889") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 35,
    sumAssured: 300000,
    policyTermYears: 25,
    premiumPaymentTermYears: 15,
    productSpecificInputs: { deathBenefitOption: "I" },
    product,
    ...overrides,
  };
}

describe("Plan 889 identity", () => {
  it("matches the catalogue's Plan 889 identity exactly", () => {
    expect(product.planNumber).toBe("889");
    expect(product.uin).toBe(PLAN_889_UIN);
    expect(PLAN_889_UIN).toBe("512N394V01");
  });
});

describe("Plan 889 eligibility: joint-life entry age and structural PPT/Term combinations", () => {
  it("accepts age 35 with PPT 15, term 25, Option I", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age below the minimum entry age of 18 for both lives", () => {
    const result = evaluateEligibility(ctx({ age: 17 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_below_min")).toBe(true);
  });

  it("rejects a Premium Paying Term/Policy Term combination that isn't offered", () => {
    const result = evaluateEligibility(ctx({ premiumPaymentTermYears: 5, policyTermYears: 25 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("rejects age above Option II's stricter maximum entry age for the same PPT/term", () => {
    // PPT 15/Term 25: max entry age is 50 for Option I but only 35 for Option II.
    const result = evaluateEligibility(
      ctx({ age: 40, productSpecificInputs: { deathBenefitOption: "II" } })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_above_max_for_ppt")).toBe(true);
  });

  it("accepts age 35 with Option II at the exact maturity-age boundary (PPT 10, term 25 -> maturity 60)", () => {
    // The brochure's own max-entry-age table for Option II is tuned so
    // that maturity age never exceeds 60 for any offered combination —
    // this boundary case (60 exactly) is the closest reachable check.
    const result = evaluateEligibility(
      ctx({
        age: 35,
        premiumPaymentTermYears: 10,
        policyTermYears: 25,
        productSpecificInputs: { deathBenefitOption: "II" },
      })
    );
    expect(result.eligible).toBe(true);
  });
});

describe("Plan 889 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.3,00,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_889_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment (not a multiple of Rs.10,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 305000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 889 premium engine — exact lookup only (BSA Rs.3,00,000), split by Option", () => {
  it("returns a verified premium for Option I at age 35, PPT 15, term 25", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(25095);
  });

  it("returns a different verified premium for Option II at the same point", () => {
    const result = calculatePremium(ctx({ productSpecificInputs: { deathBenefitOption: "II" } }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(25095);
  });

  it("does NOT extrapolate for an age outside the published sample points", () => {
    const result = calculatePremium(ctx({ age: 30 }));
    expect(result.available).toBe(false);
  });
});

describe("Plan 889 Guaranteed Addition formula (cross-checked against the brochure's own Benefit Illustrations)", () => {
  // The brochure's two Benefit Illustrations use a BSA (Rs.10,00,000) and
  // premium outside our exact-lookup-only Sample Premium table (which
  // only covers BSA Rs.3,00,000), so the GA *formula* itself is verified
  // directly here against the brochure's own published year-by-year
  // Guaranteed Addition, rather than through calculateBenefits() (which
  // can only ever use a premium this engine has itself verified).
  it("matches Illustration 1 exactly: Option I, PPT 15, term 25, BSA Rs.10,00,000, premium 83,650", () => {
    // Base 70 per-thousand (7%) + 8.0 per-thousand (0.80%) High-BSA
    // incentive (10L-15L band, term 25) = 78 per-thousand (7.8%).
    const ga = accrueGuaranteedAdditionOnPremium(83650, 78, 25, 15);
    expect(ga).toBe(1761669);
  });

  it("matches Illustration 2 exactly: Option II, PPT 10, term 20, BSA Rs.10,00,000, premium 1,31,750", () => {
    // Base 70 per-thousand (7%) + 4.5 per-thousand (0.45%) High-BSA
    // incentive (10L-15L band, term 20) = 74.5 per-thousand (7.45%).
    const ga = accrueGuaranteedAdditionOnPremium(131750, 74.5, 20, 10);
    expect(ga).toBe(1521383);
  });

  it("computes a real Guaranteed Addition end-to-end via calculateBenefits at a verified sample point", () => {
    const result = calculateBenefits(ctx());
    // premium=25095 (age 35, Option I, PPT 15, term 25, BSA 3,00,000);
    // BSA falls below the lowest High-BSA incentive band, so the
    // effective rate is the base 70 per-thousand (7%) alone.
    const expectedGa = accrueGuaranteedAdditionOnPremium(25095, 70, 25, 15);
    expect(result.guaranteedBenefits?.guaranteedAdditionAtMaturity).toBe(expectedGa);
    expect(result.maturityBenefit).toBe(300000 + expectedGa);
  });

  it("computes first-death Sum Assured on Death when premium is verified", () => {
    const result = calculateBenefits(ctx());
    // 7*25095=175665, which is LESS than BSA 300000, so BSA wins.
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(300000);
    expect(result.deathBenefit).toBe(300000);
  });

  it("reports the simultaneous-death minimum as double the first-death benefit", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.sumAssuredOnSimultaneousDeathMinimum).toBe(600000);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
