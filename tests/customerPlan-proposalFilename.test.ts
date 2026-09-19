import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { StrategyComponent, StrategyResult } from "@/lib/planning/strategyTypes";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { buildProposalFilename } from "@/lib/customerPlan/export/proposalFilename";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

function minimalComponent(): StrategyComponent {
  return {
    role: "illustrative_investment",
    product: null,
    eligible: null,
    monthlyPremium: { value: 15000, status: "illustrative" },
    deathBenefit: { value: null, status: "not_applicable" },
    maturityBenefit: { value: null, status: "not_applicable" },
    reasonCodes: [],
  };
}

function minimalStrategy(): StrategyResult {
  return {
    id: "s1",
    family: "traditional_structure",
    components: [minimalComponent()],
    monthlyBudgetAvailable: 15000,
    monthlyBudgetVerifiedUsed: 15000,
    monthlyBudgetUsageStatus: "verified",
    remainingBudget: 0,
    protectionCoverage: { value: null, status: "not_applicable" },
    protectionGap: { value: null, status: "not_applicable" },
    goalCoverage: { value: null, status: "not_applicable" },
    goalGap: { value: null, status: "not_applicable" },
    marketExposure: { value: "not_market_linked", status: "verified" },
    liquidity: { value: null, status: "verified" },
    guarantees: { value: null, status: "verified" },
    costs: { value: null, status: "verified" },
    taxTreatment: { value: null, status: "verified" },
    assumptions: [],
    warnings: [],
    reasonCodes: [],
    confidence: "verified",
  };
}

function buildPlan(customer?: { name?: string | null }, goalType: CustomerFinancialProfile["goalType"] = "child_education"): CustomerPlan {
  const p = profile({ goalType });
  return createCustomerPlan({
    customerProfile: p,
    protectionNeed: calculateProtectionNeed({ profile: p }),
    goalNeed: calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments }),
    selectedStrategy: minimalStrategy(),
    locale: "en",
    customer,
    idProvider: () => "fixed-id",
    nowProvider: () => new Date("2026-09-19T10:00:00.000Z"),
  });
}

describe("buildProposalFilename — safe, deterministic, informative", () => {
  it("builds a descriptive filename for a named customer", () => {
    const filename = buildProposalFilename(buildPlan({ name: "Ananya" }));
    expect(filename).toBe("Aptiwise_Ananya_Child-Education_2026-09-19.pdf");
  });

  it("falls back to a generic filename for an unnamed customer", () => {
    const filename = buildProposalFilename(buildPlan());
    expect(filename).toBe("Aptiwise_Customer_Plan_2026-09-19.pdf");
  });

  it("strips reserved filename characters from the customer name", () => {
    const filename = buildProposalFilename(buildPlan({ name: 'A/B\\C:D*E?F"G<H>I|J' }));
    for (const reserved of ["/", "\\", ":", "*", "?", '"', "<", ">", "|"]) {
      expect(filename).not.toContain(reserved);
    }
  });

  it("strips control characters from the customer name", () => {
    const filename = buildProposalFilename(buildPlan({ name: "Ananya\n\t\u0000Rao" }));
    // eslint-disable-next-line no-control-regex
    expect(filename).not.toMatch(/[\u0000-\u001f\u007f]/);
  });

  it("truncates an excessively long customer name rather than producing an unbounded filename", () => {
    const longName = "A".repeat(500);
    const filename = buildProposalFilename(buildPlan({ name: longName }));
    expect(filename.length).toBeLessThan(200);
  });

  it("preserves a Unicode (Tamil/Hindi) customer name rather than stripping it", () => {
    const filename = buildProposalFilename(buildPlan({ name: "அனன்யா" }));
    expect(filename).toContain("அனன்யா");
  });

  it("collapses internal whitespace in a multi-word name into a single separator", () => {
    const filename = buildProposalFilename(buildPlan({ name: "Ananya   Rao" }));
    expect(filename).toContain("Ananya-Rao");
  });

  it("never contains a forward or backward slash anywhere (path safety)", () => {
    const filename = buildProposalFilename(buildPlan({ name: "A/B" }));
    expect(filename).not.toContain("/");
    expect(filename).not.toContain("\\");
  });

  it("always ends with the requested extension", () => {
    const filename = buildProposalFilename(buildPlan({ name: "Ananya" }), { extension: "html" });
    expect(filename.endsWith(".html")).toBe(true);
  });
});
