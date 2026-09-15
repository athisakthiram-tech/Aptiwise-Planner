import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getPlanEngine, getPlanEngineForProduct } from "@/lib/insurance/engineRegistry";
import { comparePlanBudget } from "@/lib/insurance/budgetComparison";
import { PLAN_733_UIN, PLAN_733_RULES } from "@/lib/insurance/providers/lic/plans/plan733";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-733") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, product, ...overrides };
}

describe("Plan 733 configuration flow via the engine registry", () => {
  it("resolves the same engine via getPlanEngine and getPlanEngineForProduct", () => {
    const byIdentity = getPlanEngine("LIC", "733", PLAN_733_UIN);
    const byProduct = getPlanEngineForProduct(product);
    expect(byProduct.eligibility).not.toBeNull();
    expect(byIdentity.eligibility).not.toBeNull();
  });

  it("reports a valid configuration as eligible", () => {
    const engine = getPlanEngineForProduct(product);
    const result = engine.eligibility?.evaluateEligibility(
      ctx({ age: 30, policyTermYears: 15, sumAssured: 500000 })
    );
    expect(result?.eligible).toBe(true);
  });

  it("rejects an invalid Basic Sum Assured (below minimum)", () => {
    const engine = getPlanEngineForProduct(product);
    const result = engine.eligibility?.evaluateEligibility(
      ctx({ age: 30, policyTermYears: 15, sumAssured: 50000 })
    );
    expect(result?.eligible).toBe(false);
  });

  it("rejects an invalid policy term (outside 13-25 years)", () => {
    const engine = getPlanEngineForProduct(product);
    const result = engine.eligibility?.evaluateEligibility(
      ctx({ age: 30, policyTermYears: 30, sumAssured: 200000 })
    );
    expect(result?.eligible).toBe(false);
  });

  it("rejects a configuration that breaches the maturity-age constraint", () => {
    const engine = getPlanEngineForProduct(product);
    // Age 55 + 25-year term = maturity at 80, above the 65-year maximum.
    const result = engine.eligibility?.evaluateEligibility(
      ctx({ age: 55, policyTermYears: 25, sumAssured: 200000 })
    );
    expect(result?.eligible).toBe(false);
  });

  it("returns the exact brochure sample premium for a matching configuration", () => {
    const engine = getPlanEngineForProduct(product);
    const result = engine.premium?.calculatePremium(
      ctx({ age: 20, policyTermYears: 13, sumAssured: 200000 })
    );
    expect(result?.available).toBe(true);
    expect(result?.premium).toBe(20217);
  });

  it("stays unavailable for a non-sample configuration", () => {
    const engine = getPlanEngineForProduct(product);
    const result = engine.premium?.calculatePremium(
      ctx({ age: 33, policyTermYears: 17, sumAssured: 350000 })
    );
    expect(result?.available).toBe(false);
    expect(result?.premium).toBeUndefined();
  });

  it("never interpolates between two published sample ages", () => {
    const engine = getPlanEngineForProduct(product);
    // Age 25 sits between the published age-20 and age-30 rows for a
    // 13-year term — no interpolated premium may be produced.
    const result = engine.premium?.calculatePremium(
      ctx({ age: 25, policyTermYears: 13, sumAssured: 200000 })
    );
    expect(result?.available).toBe(false);
    expect(result?.premium).toBeUndefined();
  });

  it("never scales the published Rs. 2,00,000 premium proportionally for another Sum Assured", () => {
    const engine = getPlanEngineForProduct(product);
    // 400000 is double the sampled 200000 — a naive scaler would return
    // 2x the age-30/term-13 premium (40572). That must never happen.
    const result = engine.premium?.calculatePremium(
      ctx({ age: 30, policyTermYears: 13, sumAssured: 400000 })
    );
    expect(result?.available).toBe(false);
    expect(result?.premium).toBeUndefined();
    expect(result?.premium).not.toBe(20286 * 2);
  });
});

describe("Plan 733 budget comparison", () => {
  it("computes the monthly equivalent as annual verified premium / 12", () => {
    const engine = getPlanEngineForProduct(product);
    const premium = engine.premium?.calculatePremium(
      ctx({ age: 20, policyTermYears: 13, sumAssured: 200000 })
    );
    const comparison = comparePlanBudget(2000, premium);
    expect(comparison.verified).toBe(true);
    expect(comparison.annualPremium).toBe(20217);
    expect(comparison.monthlyEquivalent).toBeCloseTo(20217 / 12);
  });

  it("flags within-budget when the monthly equivalent is affordable", () => {
    const engine = getPlanEngineForProduct(product);
    const premium = engine.premium?.calculatePremium(
      ctx({ age: 20, policyTermYears: 13, sumAssured: 200000 })
    );
    const comparison = comparePlanBudget(5000, premium); // 20217/12 ≈ 1685
    expect(comparison.withinBudget).toBe(true);
  });

  it("flags above-budget when the monthly equivalent exceeds the budget", () => {
    const engine = getPlanEngineForProduct(product);
    const premium = engine.premium?.calculatePremium(
      ctx({ age: 20, policyTermYears: 13, sumAssured: 200000 })
    );
    const comparison = comparePlanBudget(1000, premium); // 20217/12 ≈ 1685
    expect(comparison.withinBudget).toBe(false);
  });

  it("is unverified, never fabricated, when the premium is unavailable", () => {
    const engine = getPlanEngineForProduct(product);
    const premium = engine.premium?.calculatePremium(
      ctx({ age: 33, policyTermYears: 17, sumAssured: 350000 })
    );
    const comparison = comparePlanBudget(10000, premium);
    expect(comparison.verified).toBe(false);
    expect(comparison.annualPremium).toBeUndefined();
    expect(comparison.monthlyEquivalent).toBeUndefined();
    expect(comparison.withinBudget).toBeUndefined();
    // Unknown must never be represented as 0.
    expect(comparison.annualPremium).not.toBe(0);
    expect(comparison.monthlyEquivalent).not.toBe(0);
  });

  it("is unverified when no premium result is supplied at all", () => {
    const comparison = comparePlanBudget(10000, undefined);
    expect(comparison.verified).toBe(false);
    expect(comparison.annualPremium).toBeUndefined();
  });
});

describe("Plan 733 configuration never widens the verified rule set", () => {
  it("still requires a valid Sum Assured increment through the registry", () => {
    const engine = getPlanEngineForProduct(product);
    const result = engine.eligibility?.evaluateEligibility(
      ctx({ age: 30, policyTermYears: 15, sumAssured: 205000 })
    );
    expect(result?.eligible).toBe(false);
  });

  it("keeps the same minimum Basic Sum Assured as PLAN_733_RULES", () => {
    const engine = getPlanEngineForProduct(product);
    const result = engine.eligibility?.evaluateEligibility(
      ctx({ age: 30, policyTermYears: 15, sumAssured: PLAN_733_RULES.minBasicSumAssured })
    );
    expect(result?.eligible).toBe(true);
  });
});
