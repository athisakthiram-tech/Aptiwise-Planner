import { describe, it, expect } from "vitest";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import {
  matchLicProducts,
  MAX_PRIMARY_MATCHES,
  RETIREMENT_CATALOGUE_WARNING,
} from "@/lib/insurance/matching";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";

function baseGoal(overrides: Partial<GoalInput> = {}): GoalInput {
  return {
    age: 35,
    monthlyBudget: 10000,
    goalType: "child_education",
    targetAmount: 5000000,
    yearsToGoal: 15,
    existingLifeCover: 1000000,
    riskComfort: "medium",
    ...overrides,
  };
}

describe("goal to category matching", () => {
  it("maps family protection to term/protection products only", () => {
    const result = matchLicProducts(baseGoal({ goalType: "family_protection" }));
    expect(result.potentialMatches.length).toBeGreaterThan(0);
    for (const { product } of result.potentialMatches) {
      expect(product.category).toBe("term_protection");
    }
  });

  it("maps wealth to savings/endowment and market-linked products only", () => {
    const result = matchLicProducts(baseGoal({ goalType: "wealth" }));
    const categories = new Set(result.potentialMatches.map((m) => m.product.category));
    for (const category of categories) {
      expect(["savings_endowment", "market_linked_ulip"]).toContain(category);
    }
  });

  it("flags retirement as needing catalogue expansion instead of guessing", () => {
    const result = matchLicProducts(baseGoal({ goalType: "retirement" }));
    expect(result.potentialMatches).toHaveLength(0);
    expect(result.warnings).toContain(RETIREMENT_CATALOGUE_WARNING);
  });
});

describe("risk comfort ordering", () => {
  it("orders non-market-linked products first for low risk comfort", () => {
    const result = matchLicProducts(baseGoal({ goalType: "wealth", riskComfort: "low" }));
    const firstMarketLinkedIndex = result.potentialMatches.findIndex(
      (m) => m.product.marketLinked
    );
    const lastNonMarketLinkedIndex = result.potentialMatches
      .map((m) => m.product.marketLinked)
      .lastIndexOf(false);
    if (firstMarketLinkedIndex !== -1 && lastNonMarketLinkedIndex !== -1) {
      expect(lastNonMarketLinkedIndex).toBeLessThan(firstMarketLinkedIndex);
    }
  });

  it("orders market-linked products first for high risk comfort", () => {
    const result = matchLicProducts(baseGoal({ goalType: "wealth", riskComfort: "high" }));
    expect(result.potentialMatches[0].product.marketLinked).toBe(true);
  });
});

describe("status filtering", () => {
  const active: InsuranceProduct = {
    id: "test-active",
    provider: "LIC",
    productName: "LIC's Test Active Plan",
    planNumber: "999",
    uin: "512N999V01",
    category: "term_protection",
    goalTags: ["family_protection"],
    marketLinked: false,
    protectionAvailable: true,
    status: "ACTIVE",
    officialSourceUrl: "https://licindia.in/",
    sourceCheckedDate: "2026-09-15",
    verification: {
      identityVerified: true,
      eligibilityRulesVerified: false,
      premiumEngineAvailable: false,
      benefitEngineAvailable: false,
    },
  };
  const withdrawn: InsuranceProduct = { ...active, id: "test-withdrawn", status: "WITHDRAWN" };
  const unknown: InsuranceProduct = { ...active, id: "test-unknown", status: "UNKNOWN" };

  it("includes ACTIVE products", () => {
    const result = matchLicProducts(baseGoal({ goalType: "family_protection" }), [active]);
    expect(result.potentialMatches.map((m) => m.product.id)).toContain("test-active");
  });

  it("excludes WITHDRAWN products", () => {
    const result = matchLicProducts(baseGoal({ goalType: "family_protection" }), [withdrawn]);
    expect(result.potentialMatches).toHaveLength(0);
  });

  it("excludes UNKNOWN products", () => {
    const result = matchLicProducts(baseGoal({ goalType: "family_protection" }), [unknown]);
    expect(result.potentialMatches).toHaveLength(0);
  });
});

describe("result shape and safety", () => {
  it("exposes a maximum primary match count for the UI to slice on", () => {
    expect(MAX_PRIMARY_MATCHES).toBe(3);
  });

  it("preserves plan number and UIN from the catalogue", () => {
    const result = matchLicProducts(baseGoal({ goalType: "family_protection" }));
    const jeevanRaksha = LIC_CATALOGUE.find((p) => p.id === "lic-894")!;
    const match = result.potentialMatches.find((m) => m.product.id === "lic-894");
    expect(match?.product.planNumber).toBe(jeevanRaksha.planNumber);
    expect(match?.product.uin).toBe(jeevanRaksha.uin);
  });

  it("never invents premium, returns, or maturity fields", () => {
    const result = matchLicProducts(baseGoal({ goalType: "child_education" }));
    const forbiddenKeys = ["premium", "returns", "maturity", "bonus", "irr", "sumAssured"];
    for (const { product } of result.potentialMatches) {
      for (const key of Object.keys(product)) {
        expect(forbiddenKeys).not.toContain(key.toLowerCase());
      }
    }
    expect(result.missingVerification.length).toBeGreaterThan(0);
  });
});
