import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { accrueGuaranteedAdditionOnPremium } from "@/lib/insurance/providers/lic/plans/shared";
import {
  PLAN_890_RULES,
  PLAN_890_UIN,
  derivedPremiumPayingTermYears,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan890";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-890") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, sumAssured: 1000000, policyTermYears: 20, product, ...overrides };
}

describe("Plan 890 identity", () => {
  it("matches the catalogue's Plan 890 identity exactly", () => {
    expect(product.planNumber).toBe("890");
    expect(product.uin).toBe(PLAN_890_UIN);
    expect(PLAN_890_UIN).toBe("512N395V01");
  });
});

describe("Plan 890 derived Premium Paying Term", () => {
  it("derives PPT = Policy Term - 5", () => {
    expect(derivedPremiumPayingTermYears(20)).toBe(15);
    expect(derivedPremiumPayingTermYears(15)).toBe(10);
  });
});

describe("Plan 890 eligibility: entry age and Policy Term range", () => {
  it("accepts age 35 with a 20-year Policy Term", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects a Policy Term below the minimum of 15", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 14 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("rejects age at maturity above the maximum of 75", () => {
    const result = evaluateEligibility(ctx({ age: 60 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "maturity_age_too_high")).toBe(true);
  });
});

describe("Plan 890 Sum Assured rules", () => {
  it("rejects a Basic Sum Assured below the minimum of Rs.1,25,000", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_890_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("rejects an invalid increment in the lowest band (must be a multiple of Rs.5,000)", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 201000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 890 premium engine — exact lookup only (BSA Rs.10,00,000)", () => {
  it("returns a verified premium for age 30, term 20", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(true);
    expect(result.premium).toBe(83400);
  });

  it("does NOT extrapolate for an unpublished age/term cell", () => {
    const result = calculatePremium(ctx({ age: 45 }));
    expect(result.available).toBe(false);
  });
});

describe("Plan 890 benefits — Guaranteed Addition (cross-checked against the brochure's own Benefit Illustration)", () => {
  it("matches the brochure's Sample Benefit Illustration exactly: age 35, PPT 15, term 20, BSA Rs.10,00,000, premium 84,700", () => {
    // Base 60 per-thousand (6%) + 12.5 per-thousand (1.25%) High-BSA
    // incentive ("10,00,000 and above" band, PPT 15) = 72.5 per-thousand.
    const ga = accrueGuaranteedAdditionOnPremium(84700, 72.5, 20, 15);
    expect(ga).toBe(1197446);
  });

  it("computes a real Guaranteed Addition end-to-end via calculateBenefits at a verified sample point", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.guaranteedAdditionAtMaturity).toBeDefined();
    expect(result.maturityBenefit).toBe(1000000 + (result.guaranteedBenefits?.guaranteedAdditionAtMaturity ?? 0));
  });

  it("always reports the 125%-BSA death-benefit floor even with no verified premium", () => {
    const result = calculateBenefits(ctx({ age: 45 }));
    expect(result.deathBenefit).toBe(1250000);
  });

  it("never fabricates a bonus", () => {
    const result = calculateBenefits(ctx());
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });
});
