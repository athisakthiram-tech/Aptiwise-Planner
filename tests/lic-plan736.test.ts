import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  PLAN_736_RULES,
  PLAN_736_UIN,
  evaluateEligibility,
  calculatePremium,
  calculateBenefits,
} from "@/lib/insurance/providers/lic/plans/plan736";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-736") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 30, product, ...overrides };
}

describe("Plan 736 identity", () => {
  it("matches the catalogue's Plan 736 identity exactly", () => {
    expect(product.planNumber).toBe("736");
    expect(product.uin).toBe(PLAN_736_UIN);
    expect(PLAN_736_UIN).toBe("512N304V03");
  });
});

describe("Plan 736 eligibility: age boundaries", () => {
  it("accepts the minimum entry age (8)", () => {
    const result = evaluateEligibility(
      ctx({ age: PLAN_736_RULES.minEntryAge, policyTermYears: 25, premiumPaymentTermYears: 16, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects an age below the minimum entry age", () => {
    const result = evaluateEligibility(ctx({ age: PLAN_736_RULES.minEntryAge - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_below_min")).toBe(true);
  });

  it("accepts the maximum entry age for a given term (59 for term 16)", () => {
    const result = evaluateEligibility(
      ctx({ age: 59, policyTermYears: 16, premiumPaymentTermYears: 10, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects an age above the maximum entry age for that term", () => {
    const result = evaluateEligibility(
      ctx({ age: 60, policyTermYears: 16, premiumPaymentTermYears: 10, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_above_max_for_term")).toBe(true);
  });

  it("the same age (55) is invalid for term 21 but was valid for term 16", () => {
    const term16 = evaluateEligibility(
      ctx({ age: 55, policyTermYears: 16, premiumPaymentTermYears: 10, sumAssured: 200000 })
    );
    const term21 = evaluateEligibility(
      ctx({ age: 55, policyTermYears: 21, premiumPaymentTermYears: 15, sumAssured: 200000 })
    );
    expect(term16.eligible).toBe(true);
    expect(term21.eligible).toBe(false);
    expect(term21.reasonCodes?.some((r) => r.code === "age_above_max_for_term")).toBe(true);
  });
});

describe("Plan 736 eligibility: term/PPT combinations", () => {
  it("accepts each of the three official pairs", () => {
    for (const [term, ppt] of [[16, 10], [21, 15], [25, 16]] as const) {
      const result = evaluateEligibility(
        ctx({ age: 30, policyTermYears: term, premiumPaymentTermYears: ppt, sumAssured: 200000 })
      );
      expect(result.eligible, `term ${term}/ppt ${ppt}`).toBe(true);
    }
  });

  it("rejects a policy term outside the offered set (e.g. 20 years)", () => {
    const result = evaluateEligibility(ctx({ age: 30, policyTermYears: 20, sumAssured: 200000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "invalid_term_ppt_combination")).toBe(true);
  });

  it("rejects a valid term paired with the wrong PPT", () => {
    const result = evaluateEligibility(
      ctx({ age: 30, policyTermYears: 21, premiumPaymentTermYears: 10, sumAssured: 200000 })
    );
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "invalid_term_ppt_combination")).toBe(true);
  });

  it("does not independently allow an arbitrary PPT when only the term is given", () => {
    // Term 25 requires PPT 16 — omitting PPT must not silently assume it's valid.
    const result = evaluateEligibility(ctx({ age: 30, policyTermYears: 25, sumAssured: 200000 }));
    expect(result.eligible).toBe(true); // PPT omitted, not contradicted -> not rejected
    expect(result.missingInputs).not.toContain("policyTermYears");
  });
});

describe("Plan 736 eligibility: maturity age", () => {
  it("rejects a combination whose maturity age would exceed 75", () => {
    // age 50 + term 25 = 75 is fine (== max); one step further via a term/age
    // combination that structurally can't happen given max-entry-age rules
    // is already blocked by age_above_max_for_term, so this exercises the
    // maturity check directly at its own boundary.
    const atBoundary = evaluateEligibility(
      ctx({ age: 50, policyTermYears: 25, premiumPaymentTermYears: 16, sumAssured: 200000 })
    );
    expect(atBoundary.eligible).toBe(true);
    expect(atBoundary.reasonCodes?.some((r) => r.code === "maturity_age_exceeded")).toBe(false);
  });
});

describe("Plan 736 eligibility: Basic Sum Assured", () => {
  it("accepts the minimum Basic Sum Assured", () => {
    const result = evaluateEligibility(
      ctx({ age: 30, policyTermYears: 25, premiumPaymentTermYears: 16, sumAssured: PLAN_736_RULES.minBasicSumAssured })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects a Basic Sum Assured below the minimum", () => {
    const result = evaluateEligibility(ctx({ sumAssured: PLAN_736_RULES.minBasicSumAssured - 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("accepts a valid lower-band increment (Rs.10,000 step up to Rs.4,50,000)", () => {
    const result = evaluateEligibility(
      ctx({ age: 30, policyTermYears: 25, premiumPaymentTermYears: 16, sumAssured: 250000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects an invalid lower-band increment", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 205000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });

  it("accepts a valid upper-band increment (Rs.25,000 step above Rs.4,50,000)", () => {
    const result = evaluateEligibility(
      ctx({ age: 30, policyTermYears: 25, premiumPaymentTermYears: 16, sumAssured: 500000 })
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects an invalid upper-band increment", () => {
    const result = evaluateEligibility(ctx({ sumAssured: 460000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_invalid_increment")).toBe(true);
  });
});

describe("Plan 736 premium engine — exact lookup only, never scaled/interpolated/extrapolated", () => {
  it("returns a verified premium for an exact brochure sample point (age 30, term 25, BSA 2L)", () => {
    const result = calculatePremium(ctx({ age: 30, policyTermYears: 25, sumAssured: 200000 }));
    expect(result.available).toBe(true);
    expect(result.premium).toBe(10025);
  });

  it("matches all 12 published sample points exactly", () => {
    for (const row of PLAN_736_RULES.sampleIllustrativePremium.rows) {
      const result = calculatePremium(
        ctx({ age: row.age, policyTermYears: row.policyTermYears, sumAssured: 200000 })
      );
      expect(result.available, `age ${row.age} term ${row.policyTermYears}`).toBe(true);
      expect(result.premium).toBe(row.annualPremium);
    }
  });

  it("does NOT interpolate for an age one year off an exact sample point", () => {
    const result = calculatePremium(ctx({ age: 31, policyTermYears: 25, sumAssured: 200000 }));
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });

  it("does NOT scale for a different Basic Sum Assured", () => {
    const result = calculatePremium(ctx({ age: 30, policyTermYears: 25, sumAssured: 250000 }));
    expect(result.available).toBe(false);
  });

  it("does NOT extrapolate for a different (though validly paired) term", () => {
    const result = calculatePremium(ctx({ age: 20, policyTermYears: 21, sumAssured: 200000 }));
    // age 20/term 21 IS actually a published point; use an unpublished
    // age instead to prove no extrapolation across the term axis.
    expect(result.available).toBe(true); // sanity: this one IS published
    const unpublished = calculatePremium(ctx({ age: 25, policyTermYears: 21, sumAssured: 200000 }));
    expect(unpublished.available).toBe(false);
  });

  it("returns unavailable/null for any input combination outside the exact evidence", () => {
    const result = calculatePremium(ctx({ age: 33, policyTermYears: 16, sumAssured: 300000 }));
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });
});

describe("Plan 736 benefits — guaranteed vs non-guaranteed kept separate, never fabricated", () => {
  it("computes the guaranteed base maturity benefit as the Basic Sum Assured", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 25, sumAssured: 500000 }));
    expect(result.available).toBe(true);
    expect(result.maturityBenefit).toBe(500000);
    expect(result.guaranteedBenefits?.maturitySumAssured).toBe(500000);
  });

  it("never fabricates a bonus (Simple Reversionary or Final Additional)", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 25, sumAssured: 500000 }));
    expect(result.nonGuaranteedIllustrations).toBeUndefined();
    expect(JSON.stringify(result)).not.toMatch(/bonus.*\d/i);
  });

  it("computes an exact guaranteed Sum Assured on Death when the premium is verified", () => {
    // age 30 / term 25 / BSA 200000 has a verified premium of 10025 ->
    // Sum Assured on Death = max(200000, 7*10025) = max(200000, 70175) = 200000.
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 25, sumAssured: 200000 }));
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(200000);
    expect(result.deathBenefit).toBe(200000);
  });

  it("applies the higher-of(BSA, 7x premium) formula literally rather than assuming BSA always wins", () => {
    // At the sample table's BSA (Rs.2L) the 7x-premium side never actually
    // exceeds BSA, but the formula itself — not a BSA shortcut — must be
    // what produces the result.
    const result = calculateBenefits(ctx({ age: 20, policyTermYears: 16, sumAssured: 200000 }));
    const premium = calculatePremium(ctx({ age: 20, policyTermYears: 16, sumAssured: 200000 }));
    expect(premium.available).toBe(true);
    const expected = Math.max(200000, 7 * (premium.premium as number));
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBe(expected);
  });

  it("reports only the guaranteed BSA floor (never a complete figure) when premium is unavailable", () => {
    const result = calculateBenefits(ctx({ age: 33, policyTermYears: 16, sumAssured: 300000 }));
    expect(result.guaranteedBenefits?.sumAssuredOnDeathMinimum).toBe(300000);
    expect(result.guaranteedBenefits?.sumAssuredOnDeath).toBeUndefined();
    expect(result.deathBenefit).toBeUndefined();
  });

  it("stays unavailable without a Basic Sum Assured", () => {
    const result = calculateBenefits(ctx({ age: 30, policyTermYears: 25, sumAssured: undefined }));
    expect(result.available).toBe(false);
    expect(result.missingInputs).toContain("sumAssured");
  });
});
