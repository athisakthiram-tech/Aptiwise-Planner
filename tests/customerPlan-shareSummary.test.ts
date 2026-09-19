import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { StrategyComponent, StrategyResult } from "@/lib/planning/strategyTypes";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { buildWhatsAppSummary } from "@/lib/customerPlan/export/shareSummary";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return {
    ...UNKNOWN_CUSTOMER_PROFILE,
    age: 35,
    monthlyBudget: 15000,
    goalType: "child_education",
    targetGoalAmount: 5000000,
    existingInvestments: 800000,
    outstandingLiabilities: 1000000,
    existingLifeCover: 2000000,
    riskComfort: "medium",
    ...overrides,
  };
}

function component(overrides: Partial<StrategyComponent> = {}): StrategyComponent {
  return {
    role: "term_protection",
    product: { planNumber: "955", uin: "512N350V02", productName: "LIC's New Jeevan Amar", category: "term_protection" },
    eligible: true,
    monthlyPremium: { value: null, status: "unavailable" },
    deathBenefit: { value: 4000000, status: "verified" },
    maturityBenefit: { value: null, status: "not_applicable" },
    reasonCodes: ["PROTECTION_GAP_PRESENT"],
    ...overrides,
  };
}

function strategy(overrides: Partial<StrategyResult> = {}): StrategyResult {
  return {
    id: "test-strategy-1",
    family: "protection_investment",
    components: [
      component(),
      {
        role: "illustrative_investment",
        product: null,
        eligible: null,
        monthlyPremium: { value: 15000, status: "illustrative" },
        deathBenefit: { value: null, status: "not_applicable" },
        maturityBenefit: { value: 5800000, status: "illustrative" },
        reasonCodes: [],
        illustration: { ratePct: 8, years: 15 },
      },
    ],
    monthlyBudgetAvailable: 15000,
    monthlyBudgetVerifiedUsed: null,
    monthlyBudgetUsageStatus: "unavailable",
    remainingBudget: null,
    protectionCoverage: { value: 4000000, status: "verified" },
    protectionGap: { value: 2000000, status: "verified" },
    goalCoverage: { value: { coveragePercent: 19, remainingGap: 4200000, surplus: 0 }, status: "verified" },
    goalGap: { value: 4200000, status: "verified" },
    marketExposure: { value: "not_market_linked", status: "verified" },
    liquidity: { value: null, status: "conditional" },
    guarantees: { value: 4000000, status: "verified" },
    costs: { value: null, status: "unavailable" },
    taxTreatment: { value: null, status: "conditional" },
    assumptions: [],
    warnings: [],
    reasonCodes: ["PROTECTION_GAP_PRESENT"],
    confidence: "partial",
    ...overrides,
  };
}

function buildPlan(customer?: { name?: string | null; phone?: string | null }): CustomerPlan {
  const p = profile();
  return createCustomerPlan({
    customerProfile: p,
    protectionNeed: calculateProtectionNeed({ profile: p }),
    goalNeed: calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments }),
    selectedStrategy: strategy(),
    locale: "en",
    customer,
    idProvider: () => "fixed-id",
    nowProvider: () => new Date("2026-09-19T10:00:00.000Z"),
  });
}

describe("buildWhatsAppSummary — concise, safe, faithful to the frozen plan", () => {
  it("stays concise enough for a chat message", () => {
    const summary = buildWhatsAppSummary(buildPlan({ name: "Ananya" }));
    expect(summary.length).toBeLessThan(800);
  });

  it("includes the full Plan Number and UIN, never abbreviated", () => {
    const summary = buildWhatsAppSummary(buildPlan());
    expect(summary).toContain("955");
    expect(summary).toContain("512N350V02");
    expect(summary).not.toContain("512N...");
  });

  it("uses the unknown-premium wording, never a false 'within budget' total", () => {
    const summary = buildWhatsAppSummary(buildPlan());
    expect(summary.toLowerCase()).not.toContain("within budget");
    expect(summary).not.toMatch(/total\s*=\s*₹/i);
    expect(summary.toLowerCase()).toContain("requires verification");
  });

  it("includes the investment-illustration disclaimer when an illustration is part of the structure", () => {
    const summary = buildWhatsAppSummary(buildPlan());
    expect(summary.toLowerCase()).toContain("illustration");
    expect(summary.toLowerCase()).toContain("not guaranteed");
  });

  it("never uses recommendation/ranking wording", () => {
    const summary = buildWhatsAppSummary(buildPlan()).toLowerCase();
    for (const forbidden of ["best", "recommended", "winner", "optimal", "top choice", "our recommendation"]) {
      expect(summary).not.toContain(forbidden);
    }
  });

  it("shows the customer's name when given, and a safe fallback otherwise", () => {
    const named = buildWhatsAppSummary(buildPlan({ name: "Ananya" }));
    expect(named).toContain("Ananya");
    const anonymous = buildWhatsAppSummary(buildPlan());
    expect(anonymous.length).toBeGreaterThan(0);
  });
});
