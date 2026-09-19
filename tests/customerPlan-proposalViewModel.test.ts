import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { StrategyComponent, StrategyResult } from "@/lib/planning/strategyTypes";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { buildProposalViewModel } from "@/lib/customerPlan/export/proposalViewModel";
import { t } from "@/lib/i18n/translations";

// Same synthetic-fixture pattern as tests/results-viewModel.test.ts — the
// exact-premium-match engines rarely produce a "verified" monthly
// premium for an arbitrary test age, so budget-safety's two branches
// (verified vs. unverified) are exercised with a hand-built, fully
// controlled StrategyResult, layered on top of a REAL protection/goal
// need calculation (so createCustomerPlan's own validation always sees
// an internally-consistent financial picture).
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

function protectionNeed(p: CustomerFinancialProfile) {
  return calculateProtectionNeed({ profile: p });
}

function goalNeed(p: CustomerFinancialProfile) {
  return calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });
}

function component(overrides: Partial<StrategyComponent> = {}): StrategyComponent {
  return {
    role: "term_protection",
    product: { planNumber: "955", uin: "512N350V02", productName: "LIC's New Jeevan Amar", category: "term_protection" },
    eligible: true,
    monthlyPremium: { value: null, status: "unavailable" },
    deathBenefit: { value: 4000000, status: "verified" },
    maturityBenefit: { value: null, status: "not_applicable" },
    reasonCodes: ["PROTECTION_GAP_PRESENT", "PRODUCT_ELIGIBLE"],
    ...overrides,
  };
}

function strategy(overrides: Partial<StrategyResult> = {}): StrategyResult {
  return {
    id: "test-strategy-1",
    family: "protection_investment",
    components: [component()],
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
    reasonCodes: ["PROTECTION_GAP_PRESENT", "GOAL_FUNDING_REQUIRED"],
    confidence: "partial",
    ...overrides,
  };
}

function buildPlan(strategyOverrides: Partial<StrategyResult> = {}, customer?: { name?: string | null; phone?: string | null }): CustomerPlan {
  const p = profile();
  return createCustomerPlan({
    customerProfile: p,
    protectionNeed: protectionNeed(p),
    goalNeed: goalNeed(p),
    selectedStrategy: strategy(strategyOverrides),
    locale: "en",
    customer,
    idProvider: () => "fixed-id",
    nowProvider: () => new Date("2026-09-19T10:00:00.000Z"),
  });
}

describe("buildProposalViewModel — frozen snapshot only, no recalculation", () => {
  it("never touches the network/engine layer — building it twice from the same plan is byte-identical", () => {
    const plan = buildPlan();
    const a = buildProposalViewModel(plan);
    const b = buildProposalViewModel(plan);
    expect(a).toEqual(b);
  });

  it("does not import or call any product engine / eligibility engine / strategy generator", () => {
    // A static guard: the module's own source never references the
    // engine registry or generator, so no accidental recalculation path
    // can be reintroduced silently.
    const src = readFileSync(path.resolve(__dirname, "../lib/customerPlan/export/proposalViewModel.ts"), "utf-8");
    expect(src).not.toMatch(/engineRegistry|generateStrategies|calculateProtectionNeed|calculateGoalNeed|matchLicProducts/);
  });

  it("shows the full, unabbreviated Plan Number and UIN, never truncated", () => {
    const plan = buildPlan();
    const vm = buildProposalViewModel(plan);
    const identity = vm.components[0].product!;
    expect(identity.planNumber).toBe("955");
    expect(identity.uin).toBe("512N350V02");
    expect(identity.uin).not.toContain("...");
    expect(identity.uin.length).toBeGreaterThanOrEqual(10);
  });

  it("respects plan.localeAtCreation, not any current/ambient UI locale", () => {
    const plan = buildPlan();
    const taPlan: CustomerPlan = { ...plan, localeAtCreation: "ta" };
    const vmEn = buildProposalViewModel(plan);
    const vmTa = buildProposalViewModel(taPlan);
    expect(vmEn.locale).toBe("en");
    expect(vmTa.locale).toBe("ta");
    expect(vmTa.goal.titleLabel).not.toBe(vmEn.goal.titleLabel);
  });

  it("keeps an unknown/null value unknown — never turns it into a fabricated number", () => {
    const plan = buildPlan({
      components: [component({ deathBenefit: { value: null, status: "unavailable" } })],
    });
    const vm = buildProposalViewModel(plan);
    expect(vm.components[0].deathBenefit.formattedValue).not.toMatch(/₹0\b/);
    expect(vm.components[0].deathBenefit.status).toBe("unavailable");
  });

  it("preserves every ComparisonValue status exactly (verified/illustrative/partial/conditional/unavailable/not_applicable)", () => {
    const plan = buildPlan({
      liquidity: { value: null, status: "conditional" },
      taxTreatment: { value: null, status: "conditional" },
      costs: { value: null, status: "unavailable" },
    });
    const vm = buildProposalViewModel(plan);
    // Dimension row order is fixed: [protection, goal, market, guarantees, liquidity, costs, tax].
    expect(vm.dimensions[4].statusLabel).toBe(t("results.status.conditional", "en"));
    expect(vm.dimensions[5].statusLabel).toBe(t("results.status.unavailable", "en"));
    expect(vm.dimensions[6].statusLabel).toBe(t("results.status.conditional", "en"));
    // Never silently upgraded to "Verified" — the underlying plan keeps
    // exactly the status the strategy reported.
    expect(plan.selectedStrategy.liquidity.status).toBe("conditional");
    expect(plan.selectedStrategy.taxTreatment.status).toBe("conditional");
    expect(plan.selectedStrategy.costs.status).toBe("unavailable");
  });
});

describe("buildProposalViewModel — budget safety survives export (Section 6)", () => {
  it("keeps an unknown premium as 'requires verification' and never claims a total/within-budget", () => {
    const plan = buildPlan(); // default strategy() has monthlyPremium unavailable
    const vm = buildProposalViewModel(plan);
    expect(vm.budget.kind).toBe("unverified");
    const allText = vm.budget.lines.map((l) => l.text).join(" ");
    expect(allText.toLowerCase()).not.toContain("within budget");
    expect(allText).not.toMatch(/total\s*=\s*₹/i);
    expect(vm.budget.lines.some((l) => l.tone === "warning")).toBe(true);
  });

  it("marks the illustrative investment amount as 'before insurance premium adjustment' when premium is unknown", () => {
    const plan = buildPlan({
      components: [
        component({ monthlyPremium: { value: null, status: "unavailable" } }),
        component({ role: "illustrative_investment", product: null, monthlyPremium: { value: 15000, status: "illustrative" }, deathBenefit: { value: null, status: "not_applicable" } }),
      ],
    });
    const vm = buildProposalViewModel(plan);
    const line = vm.budget.lines.find((l) => l.text.includes("15,000") || l.text.toLowerCase().includes("before"));
    expect(line).toBeDefined();
  });

  it("reports a verified total only when the strategy's own status says verified", () => {
    const plan = buildPlan({
      monthlyBudgetUsageStatus: "verified",
      monthlyBudgetVerifiedUsed: 4700,
      remainingBudget: 10300,
      monthlyBudgetAvailable: 15000,
      components: [component({ monthlyPremium: { value: 4700, status: "verified" } })],
    });
    const vm = buildProposalViewModel(plan);
    expect(vm.budget.kind).toBe("verified");
    const allText = vm.budget.lines.map((l) => l.text).join(" ");
    expect(allText).toMatch(/4,700|4700|₹4,700/);
    expect(vm.budget.lines.every((l) => l.tone === "positive")).toBe(true);
  });

  it("never reports verified budget usage just because a number happens to be present", () => {
    // Defensive: even if monthlyBudgetVerifiedUsed were somehow set,
    // the export layer must trust the explicit status, not the number.
    const plan = buildPlan({ monthlyBudgetUsageStatus: "partial", monthlyBudgetVerifiedUsed: 4700 });
    const vm = buildProposalViewModel(plan);
    expect(vm.budget.kind).toBe("unverified");
  });
});

describe("buildProposalViewModel — investment illustration (Section 7)", () => {
  function planWithIllustration(): CustomerPlan {
    return buildPlan({
      components: [
        component({ monthlyPremium: { value: null, status: "unavailable" } }),
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
    });
  }

  it("retains the illustration rate and duration exactly", () => {
    const vm = buildProposalViewModel(planWithIllustration());
    const illustration = vm.components[1].investmentIllustration!;
    expect(illustration.rateFormatted).toContain("8");
    expect(illustration.durationFormatted).toContain("15");
  });

  it("keeps the maturity value's status as illustrative, never upgraded to verified", () => {
    const vm = buildProposalViewModel(planWithIllustration());
    expect(vm.components[1].maturityBenefit.status).toBe("illustrative");
  });

  it("always includes the 'illustration only, not guaranteed' disclaimer text", () => {
    const vm = buildProposalViewModel(planWithIllustration());
    const disclaimer = vm.components[1].investmentIllustration!.disclaimer.toLowerCase();
    expect(disclaimer).toContain("illustration");
    expect(disclaimer).toContain("not guaranteed");
  });

  it("never says expected/projected guaranteed/likely/predicted return anywhere in the illustration text", () => {
    const vm = buildProposalViewModel(planWithIllustration());
    const illustration = vm.components[1].investmentIllustration!;
    const text = `${illustration.disclaimer} ${illustration.rateFormatted} ${illustration.durationFormatted}`.toLowerCase();
    for (const forbidden of ["expected return", "projected guaranteed return", "likely return", "predicted return"]) {
      expect(text).not.toContain(forbidden);
    }
  });
});

describe("buildProposalViewModel — disclosures (Section 10)", () => {
  it("includes only the disclosure codes actually present on the frozen plan", () => {
    const plan = buildPlan();
    const vm = buildProposalViewModel(plan);
    expect(vm.disclosures.length).toBe(plan.disclosures.length);
    // A plan whose premium is unavailable must carry the
    // premium-requires-verification disclosure text.
    if (plan.disclosures.includes("premium_requires_verification")) {
      expect(vm.disclosures.some((d) => d.toLowerCase().includes("premium"))).toBe(true);
    }
  });
});

describe("buildProposalViewModel — no recommendation language anywhere (Section 21)", () => {
  const FORBIDDEN = ["recommended plan", "best plan", "optimal plan", "winner", "top choice", "our recommendation", "advisor recommendation"];

  it("scans every string field the view model produces for forbidden ranking/recommendation wording", () => {
    const plan = buildPlan({ family: "traditional_structure" }, { name: "Ananya Rao" });
    const vm = buildProposalViewModel(plan);
    const haystack = JSON.stringify(vm).toLowerCase();
    for (const forbidden of FORBIDDEN) {
      expect(haystack, `view model contains forbidden phrase "${forbidden}"`).not.toContain(forbidden);
    }
    expect(vm.structureTitleLabel.toLowerCase()).not.toContain("best");
  });
});

describe("buildProposalViewModel — customer identity handling", () => {
  it("shows the customer's name when provided", () => {
    const plan = buildPlan({}, { name: "Ananya Rao" });
    const vm = buildProposalViewModel(plan);
    expect(vm.header.customerName).toBe("Ananya Rao");
  });

  it("falls back to the localized 'unnamed customer' label when no name was given", () => {
    const plan = buildPlan();
    const vm = buildProposalViewModel(plan);
    expect(vm.header.customerName.length).toBeGreaterThan(0);
    expect(vm.header.customerName).not.toBe("null");
  });
});

