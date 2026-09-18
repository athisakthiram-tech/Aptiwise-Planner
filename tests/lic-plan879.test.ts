import { describe, it, expect } from "vitest";
import { InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import {
  PLAN_879_UIN,
  evaluateEligibility,
  calculateBenefits,
  calculateCosts,
  evaluateLiquidity,
} from "@/lib/insurance/providers/lic/plans/plan879";

const product = LIC_CATALOGUE.find((p) => p.id === "lic-879") as InsuranceProduct;

function ctx(overrides: Record<string, unknown> = {}) {
  return { age: 60, purchasePrice: 1000000, mode: "yearly" as const, optionCode: "A", ...overrides };
}

describe("Plan 879 identity", () => {
  it("matches the catalogue's Plan 879 identity exactly", () => {
    expect(product.planNumber).toBe("879");
    expect(product.uin).toBe(PLAN_879_UIN);
    expect(PLAN_879_UIN).toBe("512N386V01");
  });
});

describe("Plan 879 eligibility", () => {
  it("accepts age 60 with Option A", () => {
    expect(evaluateEligibility(ctx()).eligible).toBe(true);
  });

  it("rejects age 17, below the minimum entry age of 18", () => {
    expect(evaluateEligibility(ctx({ age: 17 })).eligible).toBe(false);
  });

  it("rejects age 66 for Option E1, whose ceiling is 65 (below the general 85 ceiling)", () => {
    const result = evaluateEligibility(ctx({ age: 66, optionCode: "E1" }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "age_out_of_range")).toBe(true);
  });

  it("accepts age 66 for Option A (general 85 ceiling applies)", () => {
    expect(evaluateEligibility(ctx({ age: 66, optionCode: "A" })).eligible).toBe(true);
  });

  it("accepts age 95 for Option F, whose ceiling extends to 100", () => {
    expect(evaluateEligibility(ctx({ age: 95, optionCode: "F" })).eligible).toBe(true);
  });

  it("rejects a Purchase Price below the flat Rs.1,00,000 minimum", () => {
    const result = evaluateEligibility(ctx({ purchasePrice: 50000 }));
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes?.some((r) => r.code === "sum_assured_below_min")).toBe(true);
  });
});

describe("Plan 879 has no rate table for arbitrary Purchase Price — premium capability is not_applicable", () => {
  it("declares premium capability as not_applicable", () => {
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.premium).toBe("not_applicable");
  });

  it("has no calculatePremium method at all", () => {
    const engine = getLicProductEngine("879", PLAN_879_UIN);
    expect(engine?.calculatePremium).toBeUndefined();
  });
});

describe("Plan 879 benefits — 22-option exact-match lookup", () => {
  it("returns the exact published annuity amount for Option A", () => {
    expect(calculateBenefits(ctx()).guaranteedBenefits?.annuityAmountPerPayment).toBe(85000);
  });

  it("reports a verified zero death benefit for Option C1 (increasing, nothing on death)", () => {
    expect(calculateBenefits(ctx({ optionCode: "C1" })).deathBenefit).toBe(0);
  });

  it("reports the full Purchase Price as the death benefit for Option D (Balance of Purchase Price at inception)", () => {
    expect(calculateBenefits(ctx({ optionCode: "D" })).deathBenefit).toBe(1000000);
  });

  it("reports the full Purchase Price as the death benefit for Option F", () => {
    expect(calculateBenefits(ctx({ optionCode: "F" })).deathBenefit).toBe(1000000);
  });

  it("leaves Option E1 (percentage early-return) death benefit as not_computed", () => {
    expect(calculateBenefits(ctx({ optionCode: "E1" })).deathBenefit).toBeUndefined();
  });

  it("never returns a maturityBenefit", () => {
    expect(calculateBenefits(ctx()).maturityBenefit).toBeUndefined();
  });
});

describe("Plan 879 liquidity — Option D allows surrender but not loan", () => {
  it("allows surrender but not loan under Option D", () => {
    const liquidity = evaluateLiquidity("test-source", ctx({ optionCode: "D" }));
    expect(liquidity.surrenderAvailable.value).toBe(true);
    expect(liquidity.loanAvailable.value).toBe(false);
  });

  it("allows both under Option F", () => {
    const liquidity = evaluateLiquidity("test-source", ctx({ optionCode: "F" }));
    expect(liquidity.surrenderAvailable.value).toBe(true);
    expect(liquidity.loanAvailable.value).toBe(true);
  });

  it("allows neither under Option A", () => {
    const liquidity = evaluateLiquidity("test-source", ctx({ optionCode: "A" }));
    expect(liquidity.surrenderAvailable.value).toBe(false);
    expect(liquidity.loanAvailable.value).toBe(false);
  });
});

describe("Plan 879 costs — annuity plans have no unit fund or charge structure", () => {
  it("declares every cost dimension not_applicable", () => {
    expect(calculateCosts().fundManagementCharge.status).toBe("not_applicable");
  });
});
