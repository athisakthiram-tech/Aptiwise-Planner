import { describe, it, expect } from "vitest";
import { deriveProductRoles, hasGoalFundingRole, isGoalFundingRole, ProductRole } from "@/lib/planning/goalOrchestrator/productRoles";
import { InsuranceProduct } from "@/types/insurance";

function product(overrides: Partial<InsuranceProduct> = {}): InsuranceProduct {
  return {
    id: "lic-test",
    provider: "LIC",
    productName: "Test Plan",
    planNumber: "000",
    uin: "512N000V00",
    category: "savings_endowment",
    goalTags: [],
    marketLinked: false,
    protectionAvailable: true,
    status: "ACTIVE",
    officialSourceUrl: "https://example.com",
    sourceCheckedDate: "2026-01-01",
    verification: {
      identityVerified: true,
      eligibilityRulesVerified: true,
      premiumEngineAvailable: true,
      benefitEngineAvailable: true,
    },
    ...overrides,
  };
}

describe("deriveProductRoles — deterministic, category-driven, never invented", () => {
  it("a pure term product is PROTECTION_ONLY and nothing else", () => {
    const roles = deriveProductRoles(product({ category: "term_protection" }));
    expect(roles).toEqual(["PROTECTION_ONLY"]);
  });

  it("micro insurance is PROTECTION_ONLY", () => {
    expect(deriveProductRoles(product({ category: "micro_insurance" }))).toEqual(["PROTECTION_ONLY"]);
  });

  it("a savings/endowment product carries goal accumulation and long-term protection-savings roles", () => {
    const roles = deriveProductRoles(product({ category: "savings_endowment" }));
    expect(roles).toContain("GOAL_ACCUMULATION");
    expect(roles).toContain("LONG_TERM_PROTECTION_SAVINGS");
    expect(roles).not.toContain("PROTECTION_ONLY");
  });

  it("a money-back/child plan additionally carries a scheduled-liquidity role", () => {
    const roles = deriveProductRoles(product({ category: "money_back_child" }));
    expect(roles).toContain("SCHEDULED_LIQUIDITY");
    expect(roles).toContain("GOAL_ACCUMULATION");
  });

  it("a pension product is retirement/income-oriented, never plain goal accumulation", () => {
    const roles = deriveProductRoles(product({ category: "pension" }));
    expect(roles).toEqual(["RETIREMENT", "INCOME_GENERATION"]);
    expect(roles).not.toContain("GOAL_ACCUMULATION");
  });

  it("a ULIP is market-linked accumulation only", () => {
    expect(deriveProductRoles(product({ category: "market_linked_ulip" }))).toEqual(["MARKET_LINKED_ACCUMULATION"]);
  });

  it("every role for every category is a defined ProductRole value (no invented strings)", () => {
    const allRoles: ProductRole[] = [
      "GOAL_ACCUMULATION",
      "INCOME_GENERATION",
      "SCHEDULED_LIQUIDITY",
      "MARKET_LINKED_ACCUMULATION",
      "LONG_TERM_PROTECTION_SAVINGS",
      "RETIREMENT",
      "PROTECTION_ONLY",
    ];
    const categories: InsuranceProduct["category"][] = [
      "term_protection",
      "savings_endowment",
      "whole_life",
      "money_back_child",
      "pension",
      "market_linked_ulip",
      "micro_insurance",
    ];
    for (const category of categories) {
      for (const role of deriveProductRoles(product({ category }))) {
        expect(allRoles).toContain(role);
      }
    }
  });
});

describe("isGoalFundingRole / hasGoalFundingRole — the structural gate keeping protection-only products out of goal slots", () => {
  it("PROTECTION_ONLY is never a goal-funding role", () => {
    expect(isGoalFundingRole("PROTECTION_ONLY")).toBe(false);
  });

  it("every other role is a goal-funding role", () => {
    const nonProtection: ProductRole[] = [
      "GOAL_ACCUMULATION",
      "INCOME_GENERATION",
      "SCHEDULED_LIQUIDITY",
      "MARKET_LINKED_ACCUMULATION",
      "LONG_TERM_PROTECTION_SAVINGS",
      "RETIREMENT",
    ];
    for (const role of nonProtection) {
      expect(isGoalFundingRole(role)).toBe(true);
    }
  });

  it("a term-protection product structurally cannot fund a goal", () => {
    expect(hasGoalFundingRole(product({ category: "term_protection" }))).toBe(false);
  });

  it("an endowment product can fund a goal", () => {
    expect(hasGoalFundingRole(product({ category: "savings_endowment" }))).toBe(true);
  });
});
