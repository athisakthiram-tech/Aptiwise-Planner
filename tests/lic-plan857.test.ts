import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import {
  PLAN_857_UIN,
  evaluateEligibility,
  calculateBenefits,
  calculateCosts,
  evaluateLiquidity,
} from "@/lib/insurance/providers/lic/plans/plan857";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-857") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 60, purchasePrice: 1000000, mode: "yearly" as const, optionCode: "A", ...overrides };
}

describe("Plan 857 identity", () => {
  it("matches the catalogue's Plan 857 identity exactly", () => {
    expect(product.planNumber).toBe("857");
    expect(product.uin).toBe(PLAN_857_UIN);
    expect(PLAN_857_UIN).toBe("512N337V07");
  });
});

describe("Plan 857 eligibility", () => {
  it("accepts age 60 with option A and Rs.10,00,000 purchase price", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 24, below the minimum entry age of 25", () => {
    const result = evaluateEligibility(ctx({ age: 24 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("rejects age 86, above the maximum entry age of 85", () => {
    const result = evaluateEligibility(ctx({ age: 86 }));
    expect(result.eligible).toBe(false);
  });

  it("rejects a purchase price below the age-banded minimum (age 28, below Rs.10,00,000)", () => {
    const result = evaluateEligibility(ctx({ age: 28, purchasePrice: 500000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });

  it("accepts Rs.1,00,000 purchase price at age 30 (below-30 minimum doesn't apply)", () => {
    const result = evaluateEligibility(ctx({ age: 30, purchasePrice: 100000 }));
    expect(result.eligible).toBe(true);
  });

  it("requires a secondary age for Joint Life options (H/I/J)", () => {
    const result = evaluateEligibility(ctx({ optionCode: "J", secondaryAge: undefined }));
    expect(result.missingInputs).toContain("secondaryAge");
  });
});

describe("Plan 857 has no rate table for arbitrary Purchase Price — premium capability is not_applicable", () => {
  it("declares premium capability as not_applicable", () => {
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.premium).toBe("not_applicable");
  });

  it("has no calculatePremium method at all", () => {
    const engine = getLicProductEngine("857", PLAN_857_UIN);
    expect(engine?.calculatePremium).toBeUndefined();
  });
});

describe("Plan 857 benefits — exact-match-only annuity amount", () => {
  it("returns the exact published annuity amount for the sample illustration point", () => {
    const result = calculateBenefits(ctx());
    expect(result.available).toBe(true);
    expect(result.guaranteedBenefits?.annuityAmountPerPayment).toBe(86100);
  });

  it("stays unavailable for the annuity amount when inputs don't match the published sample", () => {
    const result = calculateBenefits(ctx({ purchasePrice: 750000 }));
    expect(result.guaranteedBenefits?.annuityAmountPerPayment).toBeUndefined();
  });

  it("never returns a maturityBenefit under any circumstance", () => {
    const result = calculateBenefits(ctx());
    expect(result.maturityBenefit).toBeUndefined();
  });

  it("reports a verified zero death benefit for Option A (nothing payable on death)", () => {
    const result = calculateBenefits(ctx({ optionCode: "A" }));
    expect(result.deathBenefit).toBe(0);
  });

  it("reports the full Purchase Price as the death benefit for Option F (Return of Purchase Price)", () => {
    const result = calculateBenefits(ctx({ optionCode: "F" }));
    expect(result.deathBenefit).toBe(1000000);
  });

  it("reports the guaranteed-period total at inception for Option B (5-year guaranteed period)", () => {
    const result = calculateBenefits(ctx({ optionCode: "B" }));
    expect(result.deathBenefit).toBe(85500 * 5);
  });

  it("leaves the Joint Life continuation options (H/I) as not_computed (undefined death benefit)", () => {
    const result = calculateBenefits(ctx({ optionCode: "H", secondaryAge: 55 }));
    expect(result.deathBenefit).toBeUndefined();
  });
});

describe("Plan 857 liquidity — loan/surrender only under Options F and J", () => {
  it("reports both available (verified true) under Option F", () => {
    const liquidity = evaluateLiquidity("test-source", ctx({ optionCode: "F" }));
    expect(liquidity.loanAvailable.status).toBe("verified");
    expect(liquidity.loanAvailable.value).toBe(true);
    expect(liquidity.surrenderAvailable.value).toBe(true);
  });

  it("reports both unavailable (verified false) under Option A", () => {
    const liquidity = evaluateLiquidity("test-source", ctx({ optionCode: "A" }));
    expect(liquidity.loanAvailable.value).toBe(false);
    expect(liquidity.surrenderAvailable.value).toBe(false);
  });
});

describe("Plan 857 costs — annuity plans have no unit fund or charge structure", () => {
  it("declares every cost dimension not_applicable", () => {
    const costs = calculateCosts();
    expect(costs.fundManagementCharge.status).toBe("not_applicable");
    expect(costs.mortalityCharge.status).toBe("not_applicable");
  });
});
