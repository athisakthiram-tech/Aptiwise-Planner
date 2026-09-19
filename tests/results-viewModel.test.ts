import { describe, it, expect } from "vitest";
import {
  groupStrategiesByFamily,
  getStatusPresentation,
  getBudgetPresentation,
  getProtectionVisualData,
  getGoalVisualData,
  toggleCompareSelection,
  MAX_COMPARE_SELECTIONS,
  reasonCodeI18nKey,
  categoryI18nKey,
  ALL_STRATEGY_REASON_CODES,
  FAMILY_META,
} from "@/lib/planning/resultsViewModel";
import { StrategyComponent, StrategyResult } from "@/lib/planning/strategyTypes";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ValueStatus } from "@/types/insurance";

function component(overrides: Partial<StrategyComponent> = {}): StrategyComponent {
  return {
    role: "term_protection",
    product: { planNumber: "876", uin: "512N356V02", productName: "LIC's Digi Term", category: "term_protection" },
    eligible: true,
    monthlyPremium: { value: null, status: "unavailable" },
    deathBenefit: { value: null, status: "unavailable" },
    maturityBenefit: { value: null, status: "unavailable" },
    reasonCodes: ["PROTECTION_GAP_PRESENT", "PRODUCT_ELIGIBLE", "PREMIUM_UNAVAILABLE"],
    ...overrides,
  };
}

function strategy(overrides: Partial<StrategyResult> = {}): StrategyResult {
  return {
    id: "test-1",
    family: "protection_investment",
    components: [component()],
    monthlyBudgetAvailable: 15000,
    monthlyBudgetVerifiedUsed: null,
    monthlyBudgetUsageStatus: "unavailable",
    remainingBudget: null,
    protectionCoverage: { value: null, status: "unavailable" },
    protectionGap: { value: null, status: "unavailable" },
    goalCoverage: { value: null, status: "unavailable" },
    goalGap: { value: null, status: "unavailable" },
    marketExposure: { value: "market_linked", status: "verified" },
    liquidity: { value: null, status: "conditional" },
    guarantees: { value: null, status: "unavailable" },
    costs: { value: null, status: "unavailable" },
    taxTreatment: { value: null, status: "conditional" },
    assumptions: [],
    warnings: [],
    reasonCodes: ["PROTECTION_GAP_PRESENT"],
    confidence: "unavailable",
    ...overrides,
  };
}

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

describe("Results view-model — family grouping", () => {
  it("groups strategies by family in a fixed, non-evaluative order", () => {
    const strategies = [
      strategy({ id: "a", family: "retirement_structure" }),
      strategy({ id: "b", family: "protection_investment" }),
      strategy({ id: "c", family: "market_linked_insurance" }),
    ];
    const groups = groupStrategiesByFamily(strategies);
    expect(groups.map((g) => g.family)).toEqual(["protection_investment", "market_linked_insurance", "retirement_structure"]);
  });

  it("only includes families that actually have at least one strategy", () => {
    const strategies = [strategy({ id: "a", family: "traditional_structure" })];
    const groups = groupStrategiesByFamily(strategies);
    expect(groups.length).toBe(1);
    expect(groups[0].family).toBe("traditional_structure");
  });

  it("sorts within a family by Plan Number ascending — a neutral tie-break, not a quality score", () => {
    const strategies = [
      strategy({
        id: "high-plan",
        components: [component({ product: { planNumber: "955", uin: "512N350V02", productName: "LIC's New Jeevan Amar", category: "term_protection" } })],
      }),
      strategy({
        id: "low-plan",
        components: [component({ product: { planNumber: "859", uin: "512N341V01", productName: "LIC's Saral Jeevan Bima", category: "term_protection" } })],
      }),
    ];
    const groups = groupStrategiesByFamily(strategies);
    expect(groups[0].strategies.map((s) => s.id)).toEqual(["low-plan", "high-plan"]);
  });

  it("has display metadata for every strategy family", () => {
    const families: (keyof typeof FAMILY_META)[] = [
      "protection_investment",
      "traditional_protection",
      "market_linked_insurance",
      "traditional_structure",
      "retirement_structure",
    ];
    for (const family of families) {
      expect(FAMILY_META[family].icon.length).toBeGreaterThan(0);
      expect(FAMILY_META[family].titleKey).toContain(family);
    }
  });
});

describe("Results view-model — status presentation (Section 7)", () => {
  const cases: { status: ValueStatus; icon: string; i18nKey: string }[] = [
    { status: "verified", icon: "✓", i18nKey: "results.status.verified" },
    { status: "illustrative", icon: "~", i18nKey: "results.status.illustrative" },
    { status: "unavailable", icon: "!", i18nKey: "results.status.unavailable" },
    { status: "not_applicable", icon: "○", i18nKey: "results.status.notApplicable" },
    { status: "partial", icon: "◐", i18nKey: "results.status.partial" },
    { status: "conditional", icon: "◇", i18nKey: "results.status.conditional" },
  ];

  for (const { status, icon, i18nKey } of cases) {
    it(`maps '${status}' to icon '${icon}' with key '${i18nKey}'`, () => {
      const presentation = getStatusPresentation(status);
      expect(presentation.icon).toBe(icon);
      expect(presentation.i18nKey).toBe(i18nKey);
    });
  }

  it("never maps two different statuses to the same i18n key", () => {
    const keys = cases.map((c) => getStatusPresentation(c.status).i18nKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("Results view-model — budget safety (Section 6, critical)", () => {
  it("never reports 'verified' budget usage when the premium is unavailable", () => {
    const s = strategy({
      monthlyBudgetUsageStatus: "unavailable",
      monthlyBudgetVerifiedUsed: null,
      components: [
        component({
          role: "term_protection",
          monthlyPremium: { value: null, status: "unavailable" },
        }),
        component({
          role: "illustrative_investment",
          product: null,
          monthlyPremium: { value: 15000, status: "illustrative" },
        }),
      ],
    });
    const budget = getBudgetPresentation(s);
    expect(budget.kind).toBe("unverified");
    if (budget.kind === "unverified") {
      expect(budget.illustrativeInvestmentAmount).toBe(15000);
    }
  });

  it("reports verified budget arithmetic only when the strategy's own status says verified", () => {
    const s = strategy({
      monthlyBudgetUsageStatus: "verified",
      monthlyBudgetVerifiedUsed: 4700,
      remainingBudget: 10300,
      monthlyBudgetAvailable: 15000,
    });
    const budget = getBudgetPresentation(s);
    expect(budget.kind).toBe("verified");
    if (budget.kind === "verified") {
      expect(budget.used).toBe(4700);
      expect(budget.remaining).toBe(10300);
    }
  });

  it("falls back to 'unverified' even if monthlyBudgetVerifiedUsed is somehow set but the status disagrees", () => {
    // Defensive: the presentation trusts the explicit status flag, not
    // just the presence of a number, so a future bug elsewhere can never
    // silently produce a false "within budget" claim.
    const s = strategy({ monthlyBudgetUsageStatus: "partial", monthlyBudgetVerifiedUsed: 4700 });
    const budget = getBudgetPresentation(s);
    expect(budget.kind).toBe("unverified");
  });
});

describe("Results view-model — protection visual (Section 8)", () => {
  const need: ProtectionNeedResult = {
    requiredProtection: 6000000,
    existingProtection: 1000000,
    protectionGap: 5000000,
    methodology: "liabilities_plus_family_support_plus_goal_obligations",
    components: { outstandingLiabilities: 6000000, futureFamilySupport: null, goalObligations: null },
    assumptions: [],
    missingInputs: [],
    status: "calculated",
  };

  it("computes the structure's own protection contribution from its components' death benefits", () => {
    const s = strategy({
      components: [component({ deathBenefit: { value: 4000000, status: "verified" } })],
      protectionGap: { value: 1000000, status: "verified" },
    });
    const data = getProtectionVisualData(s, need);
    expect(data.required).toBe(6000000);
    expect(data.existing).toBe(1000000);
    expect(data.providedByStructure).toBe(4000000);
    expect(data.providedByStructureStatus).toBe("verified");
    expect(data.remainingGap).toBe(1000000);
  });

  it("leaves providedByStructure unavailable when no component's death benefit is known", () => {
    const s = strategy({ components: [component({ deathBenefit: { value: null, status: "unavailable" } })] });
    const data = getProtectionVisualData(s, need);
    expect(data.providedByStructure).toBeNull();
    expect(data.providedByStructureStatus).toBe("unavailable");
  });
});

describe("Results view-model — goal visual (Section 9)", () => {
  it("labels an illustrative structure value as illustrative, never verified", () => {
    const s = strategy({
      goalCoverage: { value: { coveragePercent: 60, remainingGap: 2000000, surplus: 0 }, status: "illustrative" },
      components: [
        component({
          role: "illustrative_investment",
          product: null,
          maturityBenefit: { value: 3000000, status: "illustrative" },
        }),
      ],
    });
    const data = getGoalVisualData(s, profile({ targetGoalAmount: 5000000, existingInvestments: 500000 }));
    expect(data.structureValue).toBe(3000000);
    expect(data.structureValueStatus).toBe("illustrative");
    expect(data.coveragePercent).toBe(60);
    expect(data.status).toBe("illustrative");
  });

  it("reports goal coverage as unavailable, not 0%, when nothing is known", () => {
    const s = strategy({ goalCoverage: { value: null, status: "unavailable" } });
    const data = getGoalVisualData(s, profile());
    expect(data.coveragePercent).toBeNull();
    expect(data.status).toBe("unavailable");
  });
});

describe("Results view-model — compare selection (Section 12)", () => {
  it("adds up to the maximum of 3 selections", () => {
    let selected: string[] = [];
    selected = toggleCompareSelection(selected, "a");
    selected = toggleCompareSelection(selected, "b");
    selected = toggleCompareSelection(selected, "c");
    expect(selected).toEqual(["a", "b", "c"]);
    expect(selected.length).toBe(MAX_COMPARE_SELECTIONS);
  });

  it("refuses a 4th selection without evicting an existing one", () => {
    const selected = toggleCompareSelection(["a", "b", "c"], "d");
    expect(selected).toEqual(["a", "b", "c"]);
  });

  it("removes an already-selected id when toggled again", () => {
    const selected = toggleCompareSelection(["a", "b"], "a");
    expect(selected).toEqual(["b"]);
  });
});

describe("Results view-model — reason code and category key resolution", () => {
  it("resolves every declared reason code to a distinct i18n key", () => {
    const keys = ALL_STRATEGY_REASON_CODES.map(reasonCodeI18nKey);
    expect(new Set(keys).size).toBe(ALL_STRATEGY_REASON_CODES.length);
    for (const code of ALL_STRATEGY_REASON_CODES) {
      expect(reasonCodeI18nKey(code)).toBe(`results.reason.${code}`);
    }
  });

  it("resolves every insurance category to its own i18n key", () => {
    expect(categoryI18nKey("term_protection")).toBe("results.category.term_protection");
    expect(categoryI18nKey("market_linked_ulip")).toBe("results.category.market_linked_ulip");
  });
});
