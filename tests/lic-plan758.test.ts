import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import {
  PLAN_758_UIN,
  evaluateEligibility,
  calculateBenefits,
  calculateCosts,
  evaluateLiquidity,
} from "@/lib/insurance/providers/lic/plans/plan758";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-758") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    age: 45,
    purchasePrice: 1000000,
    mode: "yearly" as const,
    optionCode: "1",
    defermentPeriodYears: 5,
    ...overrides,
  };
}

describe("Plan 758 identity", () => {
  it("matches the catalogue's Plan 758 identity exactly", () => {
    expect(product.planNumber).toBe("758");
    expect(product.uin).toBe(PLAN_758_UIN);
    expect(PLAN_758_UIN).toBe("512N338V08");
  });
});

describe("Plan 758 eligibility — deferred annuity, needs a deferment period", () => {
  it("accepts age 45 with Option 1, 5-year deferment", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 29, below the minimum entry age of 30", () => {
    expect(evaluateEligibility(ctx({ age: 29 })).eligible).toBe(false);
  });

  it("rejects a deferment period of 6 years, above the maximum of 5", () => {
    const result = evaluateEligibility(ctx({ defermentPeriodYears: 6 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "term_out_of_range")).toBe(true);
  });

  it("rejects a deferment period that would push vesting age above 80", () => {
    const result = evaluateEligibility(ctx({ age: 79, defermentPeriodYears: 5 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "maturity_age_too_high")).toBe(true);
  });

  it("reports missing deferment period when omitted", () => {
    const result = evaluateEligibility(ctx({ defermentPeriodYears: undefined }));
    expect(result.missingInputs).toContain("defermentPeriodYears");
  });

  it("requires a secondary age for Option 2 (Joint Life)", () => {
    const result = evaluateEligibility(ctx({ optionCode: "2", secondaryAge: undefined }));
    expect(result.missingInputs).toContain("secondaryAge");
  });
});

describe("Plan 758 has no rate table for arbitrary Purchase Price — premium capability is not_applicable", () => {
  it("declares premium capability as not_applicable", () => {
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.premium).toBe("not_applicable");
  });

  it("has no calculatePremium method at all", () => {
    const engine = getLicProductEngine("758", PLAN_758_UIN);
    expect(engine?.calculatePremium).toBeUndefined();
  });
});

describe("Plan 758 benefits", () => {
  it("returns the exact published annuity amount for Option 1 at the sample point", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.annuityAmountPerPayment).toBe(86100);
  });

  it("returns the exact published annuity amount for Option 2 at the sample point", () => {
    const result = calculateBenefits(ctx({ optionCode: "2", secondaryAge: 35 }));
    expect(result.guaranteedBenefits?.annuityAmountPerPayment).toBe(82800);
  });

  it("reports 105% of Purchase Price as the death benefit floor (never the full 'higher of' formula)", () => {
    const result = calculateBenefits(ctx());
    expect(result.deathBenefit).toBe(1050000);
  });

  it("stays unavailable for the annuity amount when the deferment period doesn't match the sample", () => {
    const result = calculateBenefits(ctx({ defermentPeriodYears: 3 }));
    expect(result.guaranteedBenefits?.annuityAmountPerPayment).toBeUndefined();
    // The 105% floor is still reported — it needs no rate-table lookup.
    expect(result.deathBenefit).toBe(1050000);
  });

  it("never returns a maturityBenefit", () => {
    expect(calculateBenefits(ctx()).maturityBenefit).toBeUndefined();
  });
});

describe("Plan 758 liquidity — general, not option-restricted", () => {
  it("reports both loan and surrender as verified true for either option", () => {
    const liquidity = evaluateLiquidity("test-source", ctx());
    expect(liquidity.loanAvailable.value).toBe(true);
    expect(liquidity.surrenderAvailable.value).toBe(true);
  });
});

describe("Plan 758 costs — annuity plans have no unit fund or charge structure", () => {
  it("declares every cost dimension not_applicable", () => {
    expect(calculateCosts().fundManagementCharge.status).toBe("not_applicable");
  });
});
