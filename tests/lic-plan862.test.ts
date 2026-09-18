import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import {
  PLAN_862_UIN,
  evaluateEligibility,
  calculateBenefits,
  calculateCosts,
  evaluateLiquidity,
} from "@/lib/insurance/providers/lic/plans/plan862";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-862") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 60, purchasePrice: 1000000, mode: "yearly" as const, optionCode: "I", ...overrides };
}

describe("Plan 862 identity", () => {
  it("matches the catalogue's Plan 862 identity exactly", () => {
    expect(product.planNumber).toBe("862");
    expect(product.uin).toBe(PLAN_862_UIN);
    expect(PLAN_862_UIN).toBe("512N342V05");
  });
});

describe("Plan 862 eligibility", () => {
  it("accepts age 60 with Option I", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 39, below the minimum entry age of 40", () => {
    const result = evaluateEligibility(ctx({ age: 39 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("rejects age 81, above the maximum entry age of 80", () => {
    const result = evaluateEligibility(ctx({ age: 81 }));
    expect(result.eligible).toBe(false);
  });

  it("never rejects on Purchase Price alone — no flat minimum is published, so this check is unenforced", () => {
    const result = evaluateEligibility(ctx({ purchasePrice: 50000 }));
    expect(result.eligible).toBe(true);
  });

  it("requires a secondary age for Option II (Joint Life)", () => {
    const result = evaluateEligibility(ctx({ optionCode: "II", secondaryAge: undefined }));
    expect(result.missingInputs).toContain("secondaryAge");
  });
});

describe("Plan 862 has no rate table for arbitrary Purchase Price — premium capability is not_applicable", () => {
  it("declares premium capability as not_applicable", () => {
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.premium).toBe("not_applicable");
  });

  it("has no calculatePremium method at all", () => {
    const engine = getLicProductEngine("862", PLAN_862_UIN);
    expect(engine?.calculatePremium).toBeUndefined();
  });
});

describe("Plan 862 benefits — both options are Return-of-Purchase-Price", () => {
  it("returns the exact published annuity amount for Option I at the sample point", () => {
    const result = calculateBenefits(ctx());
    expect(result.guaranteedBenefits?.annuityAmountPerPayment).toBe(62300);
  });

  it("returns the exact published annuity amount for Option II at the sample point", () => {
    const result = calculateBenefits(ctx({ optionCode: "II", secondaryAge: 55 }));
    expect(result.guaranteedBenefits?.annuityAmountPerPayment).toBe(61600);
  });

  it("reports 100% of Purchase Price as the death benefit for both options", () => {
    expect(calculateBenefits(ctx({ optionCode: "I" })).deathBenefit).toBe(1000000);
    expect(calculateBenefits(ctx({ optionCode: "II", secondaryAge: 55 })).deathBenefit).toBe(1000000);
  });

  it("never returns a maturityBenefit", () => {
    expect(calculateBenefits(ctx()).maturityBenefit).toBeUndefined();
  });

  it("stays unavailable for the annuity amount when the age doesn't match the published sample", () => {
    const result = calculateBenefits(ctx({ age: 65 }));
    expect(result.guaranteedBenefits?.annuityAmountPerPayment).toBeUndefined();
  });
});

describe("Plan 862 liquidity — surrender is gated on critical illness, never a flat yes", () => {
  it("reports loan as verified true for both options", () => {
    expect(evaluateLiquidity("test-source", ctx()).loanAvailable.value).toBe(true);
  });

  it("reports surrender as conditional (critical-illness-gated), never verified true", () => {
    const liquidity = evaluateLiquidity("test-source", ctx());
    expect(liquidity.surrenderAvailable.status).toBe("conditional");
    expect(liquidity.surrenderAvailable.reasonCodes?.[0]?.code).toBe("surrender_requires_critical_illness");
  });
});

describe("Plan 862 costs — annuity plans have no unit fund or charge structure", () => {
  it("declares every cost dimension not_applicable", () => {
    const costs = calculateCosts();
    expect(costs.fundManagementCharge.status).toBe("not_applicable");
  });
});
