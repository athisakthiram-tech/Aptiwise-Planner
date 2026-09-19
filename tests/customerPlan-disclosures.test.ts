import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateStrategies } from "@/lib/planning/strategyGenerator";
import { StrategyResult } from "@/lib/planning/strategyTypes";
import { deriveDisclosures } from "@/lib/customerPlan/disclosures";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

function buildStrategies(): StrategyResult[] {
  const p = profile({
    age: 30,
    monthlyBudget: 15000,
    yearsToGoal: 20,
    goalType: "child_education",
    targetGoalAmount: 3000000,
    existingInvestments: 400000,
    outstandingLiabilities: 1000000,
    existingLifeCover: 0,
    riskComfort: "medium",
  });
  const protectionNeed = calculateProtectionNeed({ profile: p });
  const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });
  return generateStrategies({ profile: p, protectionNeed, goalNeed });
}

// A minimal synthetic StrategyResult with every status "clean" — nothing
// unverified, nothing illustrative, nothing market-linked, no LIC
// product component — to prove deriveDisclosures produces NO codes when
// none genuinely apply, rather than a fixed list shown regardless of
// relevance.
function cleanStrategy(): StrategyResult {
  return {
    id: "clean-1",
    family: "traditional_structure",
    components: [],
    monthlyBudgetAvailable: 15000,
    monthlyBudgetVerifiedUsed: 15000,
    monthlyBudgetUsageStatus: "verified",
    remainingBudget: 0,
    protectionCoverage: { value: 1000000, status: "verified" },
    protectionGap: { value: 0, status: "verified" },
    goalCoverage: { value: null, status: "not_applicable" },
    goalGap: { value: null, status: "not_applicable" },
    marketExposure: { value: "not_market_linked", status: "verified" },
    liquidity: { value: null, status: "verified" },
    guarantees: { value: 1000000, status: "verified" },
    costs: { value: null, status: "verified" },
    taxTreatment: { value: null, status: "verified" },
    assumptions: [],
    warnings: [],
    reasonCodes: [],
    confidence: "verified",
  };
}

describe("deriveDisclosures — only genuinely relevant codes are produced", () => {
  it("produces no disclosure codes when nothing about the strategy is unverified/illustrative/conditional", () => {
    expect(deriveDisclosures(cleanStrategy())).toEqual([]);
  });

  it("flags illustrative investment values only when an illustrative_investment component exists", () => {
    const strategies = buildStrategies();
    const withInvestment = strategies.find((s) => s.family === "protection_investment")!;
    expect(withInvestment.components.some((c) => c.role === "illustrative_investment")).toBe(true);
    expect(deriveDisclosures(withInvestment)).toContain("illustrative_investment_values");

    const withoutInvestment = strategies.find(
      (s) => s.family === "traditional_structure" || s.family === "traditional_protection"
    );
    if (withoutInvestment) {
      expect(withoutInvestment.components.some((c) => c.role === "illustrative_investment")).toBe(false);
      expect(deriveDisclosures(withoutInvestment)).not.toContain("illustrative_investment_values");
    }
  });

  it("flags eligibility-vs-underwriting only when a real LIC product component is present", () => {
    expect(deriveDisclosures(cleanStrategy())).not.toContain("eligibility_not_underwriting_approval");

    const strategies = buildStrategies();
    const withProduct = strategies.find((s) => s.components.some((c) => c.product != null))!;
    expect(deriveDisclosures(withProduct)).toContain("eligibility_not_underwriting_approval");
  });

  it("flags market-linked values only when marketExposure is actually market-linked", () => {
    const marketLinked: StrategyResult = {
      ...cleanStrategy(),
      family: "market_linked_insurance",
      marketExposure: { value: "market_linked", status: "verified" },
    };
    expect(deriveDisclosures(marketLinked)).toContain("market_linked_values");
    expect(deriveDisclosures(cleanStrategy())).not.toContain("market_linked_values");
  });

  it("flags premium-requires-verification only when a component's premium is genuinely unavailable", () => {
    const unverifiedPremium: StrategyResult = {
      ...cleanStrategy(),
      components: [
        {
          role: "term_protection",
          product: { planNumber: "894", uin: "512N005V03", productName: "LIC's Jeevan Raksha", category: "term_protection" },
          eligible: true,
          monthlyPremium: { value: null, status: "unavailable" },
          deathBenefit: { value: 1000000, status: "verified" },
          maturityBenefit: { value: null, status: "not_applicable" },
          reasonCodes: [],
        },
      ],
    };
    expect(deriveDisclosures(unverifiedPremium)).toContain("premium_requires_verification");
    expect(deriveDisclosures(cleanStrategy())).not.toContain("premium_requires_verification");
  });

  it("flags tax/costs/liquidity disclosures only for their own conditional/unavailable statuses", () => {
    const base = cleanStrategy();
    expect(deriveDisclosures({ ...base, taxTreatment: { value: null, status: "conditional" } })).toContain(
      "tax_treatment_conditional"
    );
    expect(deriveDisclosures({ ...base, costs: { value: null, status: "unavailable" } })).toContain("costs_unavailable");
    expect(deriveDisclosures({ ...base, liquidity: { value: null, status: "conditional" } })).toContain(
      "liquidity_conditional"
    );
    expect(deriveDisclosures(base)).not.toContain("tax_treatment_conditional");
    expect(deriveDisclosures(base)).not.toContain("costs_unavailable");
    expect(deriveDisclosures(base)).not.toContain("liquidity_conditional");
  });
});
