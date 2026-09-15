import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_733_RULES,
  PLAN_733_BONUS_DISCLAIMER,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan733";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-733") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, product, ...overrides };
}

describe("Plan 733 eligibility boundaries", () => {
  it("accepts the minimum entry age", () => {
    const result = evaluateEligibility(ctx({ age: PLAN_733_RULES.minEntryAge }));
    expect(result.eligible).not.toBe(false);
  });

  it("rejects an age below the minimum entry age", () => {
    const result = evaluateEligibility(ctx({ age: PLAN_733_RULES.minEntryAge - 1 }));
    expect(result.eligible).toBe(false);
  });

  it("accepts the maximum entry age", () => {
    const result = evaluateEligibility(
      ctx({ age: PLAN_733_RULES.maxEntryAge, policyTermYears: 13, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects an age above the maximum entry age", () => {
    const result = evaluateEligibility(ctx({ age: PLAN_733_RULES.maxEntryAge + 1 }));
    expect(result.eligible).toBe(false);
  });

  it("accepts a valid policy term", () => {
    const result = evaluateEligibility(
      ctx({ age: 30, policyTermYears: PLAN_733_RULES.minPolicyTermYears, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects a policy term below the minimum", () => {
    const result = evaluateEligibility(
      ctx({ policyTermYears: PLAN_733_RULES.minPolicyTermYears - 1 })
    );
    expect(result.eligible).toBe(false);
  });

  it("rejects a policy term above the maximum", () => {
    const result = evaluateEligibility(
      ctx({ policyTermYears: PLAN_733_RULES.maxPolicyTermYears + 1 })
    );
    expect(result.eligible).toBe(false);
  });

  it("rejects a policy term that would breach the maximum maturity age", () => {
    // Age 50 + 25-year term = maturity at 75, well above the max of 65.
    const result = evaluateEligibility(ctx({ age: 50, policyTermYears: 25 }));
    expect(result.eligible).toBe(false);
  });

  it("accepts the minimum Basic Sum Assured", () => {
    const result = evaluateEligibility(
      ctx({ policyTermYears: 15, sumAssured: PLAN_733_RULES.minBasicSumAssured })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects a Basic Sum Assured below the minimum", () => {
    const result = evaluateEligibility(
      ctx({ policyTermYears: 15, sumAssured: PLAN_733_RULES.minBasicSumAssured - 1 })
    );
    expect(result.eligible).toBe(false);
  });

  it("accepts a valid increment above Rs. 4,00,000", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 15, sumAssured: 450000 }));
    expect(result.eligible).toBe(true);
  });

  it("rejects an invalid increment (not a multiple of Rs. 50,000 above Rs. 4,00,000)", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 15, sumAssured: 420000 }));
    expect(result.eligible).toBe(false);
  });

  it("rejects an invalid increment below Rs. 4,00,000 (not a multiple of Rs. 10,000)", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 15, sumAssured: 205000 }));
    expect(result.eligible).toBe(false);
  });

  it("is null (not a guessed true/false) when required inputs are missing", () => {
    const result = evaluateEligibility(ctx());
    expect(result.eligible).toBeNull();
    expect(result.missingInputs).toEqual(expect.arrayContaining(["policyTermYears", "sumAssured"]));
  });

  it("never claims LIC underwriting approval", () => {
    const result = evaluateEligibility(ctx({ policyTermYears: 15, sumAssured: 200000 }));
    expect(result.reasons.join(" ")).toContain(
      "does not constitute LIC underwriting approval"
    );
  });
});

describe("Plan 733 benefit formulas (verified, guaranteed-only)", () => {
  it("computes the maturity benefit as exactly the Basic Sum Assured", () => {
    const result = calculateBenefits(ctx({ sumAssured: 500000 }));
    expect(result.available).toBe(true);
    expect(result.maturityBenefit).toBe(500000);
  });

  it("computes the 110% death benefit maturity component from Basic Sum Assured", () => {
    const result = calculateBenefits(ctx({ sumAssured: 200000 }));
    expect(result.guaranteedBenefits?.deathBenefitMaturityComponent).toBe(220000);
  });

  it("computes the 10% annual income benefit from Basic Sum Assured", () => {
    const result = calculateBenefits(ctx({ sumAssured: 200000 }));
    expect(result.guaranteedBenefits?.deathBenefitAnnualIncomePerYear).toBe(20000);
  });

  it("is unavailable, not zero, when Basic Sum Assured is missing", () => {
    const result = calculateBenefits(ctx());
    expect(result.available).toBe(false);
    expect(result.maturityBenefit).toBeUndefined();
    expect(result.maturityBenefit).not.toBe(0);
  });

  it("never collapses deathBenefit to a single fabricated figure", () => {
    // The real "Sum Assured on Death" is the higher of the BSA-anchored
    // components or 7x annualised premium — never guessed here.
    const result = calculateBenefits(ctx({ sumAssured: 200000 }));
    expect(result.deathBenefit).toBeUndefined();
  });

  it("never fabricates a bonus value", () => {
    const result = calculateBenefits(ctx({ sumAssured: 200000 }));
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
  });

  it("exposes a bonus disclaimer that never claims a guaranteed rate", () => {
    expect(PLAN_733_BONUS_DISCLAIMER).toMatch(/not guaranteed/i);
  });
});

describe("Plan 733 premium safety (exact-match only, never estimated)", () => {
  it("returns the exact published premium for a sample table match", () => {
    const result = calculatePremium(ctx({ age: 30, policyTermYears: 13, sumAssured: 200000 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(20286);
  });

  it("returns another exact published premium for a different sample point", () => {
    const result = calculatePremium(ctx({ age: 40, policyTermYears: 25, sumAssured: 200000 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(10074);
  });

  it("is unavailable for a Sum Assured not in the published sample table", () => {
    const result = calculatePremium(ctx({ age: 30, policyTermYears: 13, sumAssured: 300000 }));
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
    expect(result.premium).not.toBe(0);
  });

  it("is unavailable for an age/term combination not in the published sample table", () => {
    const result = calculatePremium(ctx({ age: 35, policyTermYears: 13, sumAssured: 200000 }));
    expect(result.available).toBe(false);
  });

  it("is unavailable when the age/term/sum-assured combination was never published (blank cell)", () => {
    // Age 50 with a 20 or 25-year term is blank in the brochure's own table.
    const result = calculatePremium(ctx({ age: 50, policyTermYears: 20, sumAssured: 200000 }));
    expect(result.available).toBe(false);
  });

  it("is unavailable, not zero, when required inputs are missing", () => {
    const result = calculatePremium(ctx());
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
    expect(result.premium).not.toBe(0);
  });
});
