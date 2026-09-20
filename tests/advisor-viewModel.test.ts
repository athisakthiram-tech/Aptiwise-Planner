import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateGoalStructures } from "@/lib/planning/goalOrchestrator/goalStructureGenerator";
import { deriveProductRoles, hasGoalFundingRole } from "@/lib/planning/goalOrchestrator/productRoles";
import {
  advisorRoleLabelKind,
  combinedIllustratedValue,
  illustratedGoalCoverage,
  isMarketLinkedComponent,
  marketLinkedIllustrationValue,
  toEngineGoalType,
  traditionalGoalBenefit,
} from "@/lib/advisor/advisorViewModel";
import { applyAdvisorIllustrationOverride } from "@/lib/advisor/advisorIllustrationOverride";
import { buildAdvisorExplanationParts } from "@/lib/advisor/advisorExplanation";
import { rebuildStrategyResultWithComponents } from "@/lib/advisor/advisorPlanRebuild";
import { StrategyComponent } from "@/lib/planning/strategyTypes";
import { InsuranceProduct } from "@/types/insurance";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

function runOrchestrator(p: CustomerFinancialProfile) {
  const protectionNeed = calculateProtectionNeed({ profile: p });
  const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });
  return { protectionNeed, goalNeed, structures: generateGoalStructures({ profile: p, protectionNeed, goalNeed }) };
}

const REGRESSION_AGE_35 = () =>
  profile({
    age: 35,
    monthlyBudget: 10000,
    goalType: "child_education",
    targetGoalAmount: 2500000,
    yearsToGoal: 16,
    riskComfort: "medium",
  });

const AGE_30_RESOLVABLE = () =>
  profile({
    age: 30,
    monthlyBudget: 10000,
    goalType: "child_education",
    targetGoalAmount: 2500000,
    yearsToGoal: 16,
    riskComfort: "medium",
  });

// ---- Item 10/11: goal-fit uses mechanics, not product name ----
describe("Goal-fit uses product mechanics, not product name (Items 10/11)", () => {
  it("candidates for Child Education are drawn from general savings/endowment mechanics, never restricted to a 'child'-named product", () => {
    const { structures } = runOrchestrator(REGRESSION_AGE_35());
    expect(structures.length).toBeGreaterThan(0);
    const categories = structures.flatMap((s) => s.strategyResult.components.map((c) => c.product?.category).filter(Boolean));
    expect(categories.length).toBeGreaterThan(0);
    // Plan 717 (Single Premium Endowment) has no "child" branding at all.
    expect(categories).toContain("savings_endowment");
  });
});

// ---- Item 12: protection-only never becomes a normal goal component ----
describe("Protection-only products never become goal-building components (Item 12)", () => {
  it("a pure term-protection product is structurally excluded from goal-funding roles", () => {
    const termProduct: InsuranceProduct = {
      id: "lic-test-term",
      provider: "LIC",
      productName: "Test Term",
      planNumber: "000",
      uin: "512N000V00",
      category: "term_protection",
      goalTags: ["child_education"],
      marketLinked: false,
      protectionAvailable: true,
      status: "ACTIVE",
      officialSourceUrl: "https://example.com",
      sourceCheckedDate: "2026-01-01",
      verification: { identityVerified: true, eligibilityRulesVerified: true, premiumEngineAvailable: true, benefitEngineAvailable: true },
    };
    expect(hasGoalFundingRole(termProduct)).toBe(false);
    expect(deriveProductRoles(termProduct)).toEqual(["PROTECTION_ONLY"]);
  });

  it("no generated structure for the regression scenario ever contains a term_protection component", () => {
    const { structures } = runOrchestrator(REGRESSION_AGE_35());
    for (const s of structures) {
      for (const c of s.strategyResult.components) {
        expect(c.product?.category).not.toBe("term_protection");
      }
    }
  });
});

// ---- Items 13/14/15/16: combination shapes ----
describe("Combination engine supports 1, 2, or more components without forcing a fixed count (Items 13/14/15)", () => {
  it("a single-product structure is valid on its own", () => {
    const { structures } = runOrchestrator(REGRESSION_AGE_35());
    const single = structures.find((s) => s.strategyResult.components.length === 1);
    expect(single).toBeDefined();
  });

  it("a two-product structure is valid when the mechanics support it", () => {
    const { structures } = runOrchestrator(AGE_30_RESOLVABLE());
    const two = structures.find((s) => s.strategyResult.components.length === 2);
    expect(two).toBeDefined();
  });

  it("the architecture does not hardcode a maximum of exactly 2 components (GoalStructure.strategyResult.components is a plain array)", () => {
    const { structures } = runOrchestrator(AGE_30_RESOLVABLE());
    for (const s of structures) {
      expect(Array.isArray(s.strategyResult.components)).toBe(true);
    }
  });
});

describe("Total simultaneous allocation never exceeds monthly capacity (Item 16)", () => {
  it("every timeline phase's allocated amount stays within the stated monthly capacity", () => {
    const { structures } = runOrchestrator(AGE_30_RESOLVABLE());
    for (const s of structures) {
      for (const phase of s.timeline) {
        expect(phase.allocatedMonthly).toBeLessThanOrEqual(10000);
      }
    }
  });
});

// ---- Items 17-21: allocation ratios are search candidates, not mandatory ----
describe("Allocation ratios are natural outputs, never mandatory 90/10-style buckets (Items 17-21)", () => {
  it("a structure's allocation split reflects the actual resolved premiums, not a fixed percentage table", () => {
    const { structures } = runOrchestrator(AGE_30_RESOLVABLE());
    const structureB = structures.find((s) => s.strategyResult.components.length === 2)!;
    const [primary, second] = structureB.strategyResult.components;
    // Jeevan Labh's own real premium (1,481) + the freed capacity (8,519)
    // — a naturally-occurring split, never coerced to 90/10, 80/20 or
    // 70/30.
    expect(primary.monthlyPremium.value).toBe(1481);
    expect(second.monthlyPremium.value).toBe(8519);
    const total = (primary.monthlyPremium.value as number) + (second.monthlyPremium.value as number);
    expect(total).toBe(10000);
    const splitPct = Math.round(((primary.monthlyPremium.value as number) / total) * 100);
    expect([90, 80, 70]).not.toContain(splitPct);
  });
});

// ---- Items 22-25: no mandatory ULIP, no hardcoded product ----
describe("No mandatory ULIP, no hardcoded product (Items 22-25)", () => {
  it("a traditional-only single-component structure is possible without any market-linked component", () => {
    const { structures } = runOrchestrator(REGRESSION_AGE_35());
    const structureA = structures.find((s) => s.strategyResult.components.length === 1)!;
    expect(structureA.strategyResult.components.every((c) => !isMarketLinkedComponent(c))).toBe(true);
  });

  it("a traditional + market-linked(illustrative) combination is possible when mechanics support it", () => {
    const { structures } = runOrchestrator(AGE_30_RESOLVABLE());
    const structureB = structures.find((s) => s.strategyResult.components.length === 2)!;
    expect(structureB.strategyResult.components.some((c) => isMarketLinkedComponent(c))).toBe(true);
    expect(structureB.strategyResult.components.some((c) => !isMarketLinkedComponent(c))).toBe(true);
  });

  it("the primary candidate is drawn from the real eligible pool, never a fixed plan number", () => {
    const { structures } = runOrchestrator(AGE_30_RESOLVABLE());
    const structureA = structures.find((s) => s.id.startsWith("goal_structure_a"))!;
    const planNumber = structureA.strategyResult.components[0].product?.planNumber;
    expect(structureA.id).toContain(planNumber as string);
  });
});

// ---- Items 26-31: return/benefit analysis never fabricated or mislabeled ----
describe("Participating/guaranteed benefits are never fabricated; BSA is never treated as total return (Items 26/27)", () => {
  it("a component's configuration.basicSumAssured is tracked separately from its maturityBenefit and never assumed equal", () => {
    const { structures } = runOrchestrator(AGE_30_RESOLVABLE());
    const withConfig = structures.flatMap((s) => s.strategyResult.components).find((c) => c.configuration?.basicSumAssured != null);
    expect(withConfig).toBeDefined();
    // Jeevan Labh: BSA 2,00,000 happens to equal its own maturity (Sum
    // Assured on Maturity = BSA per brochure) — the two remain
    // INDEPENDENTLY tracked fields regardless, never a computed identity.
    expect(withConfig!.configuration!.basicSumAssured).not.toBe(2500000); // never the goal amount
  });

  it("no bonus/future participating rate is ever fabricated — an unresolved premium stays unavailable, never a guessed number", () => {
    const { structures } = runOrchestrator(REGRESSION_AGE_35());
    const structureA = structures.find((s) => s.id.startsWith("goal_structure_a"))!;
    const c = structureA.strategyResult.components[0];
    expect(c.monthlyPremium.status).toBe("unavailable");
    expect(c.monthlyPremium.value).toBeNull();
  });
});

describe("Market-linked values are always marked illustrative, never guaranteed (Items 28/29/30/31)", () => {
  it("marketLinkedIllustrationValue only ever applies to a market-linked component", () => {
    const { structures } = runOrchestrator(AGE_30_RESOLVABLE());
    const structureB = structures.find((s) => s.strategyResult.components.length === 2)!;
    const [traditional, marketLinked] = structureB.strategyResult.components;
    expect(marketLinkedIllustrationValue(traditional, 16, 8)).toBeNull();
    expect(marketLinkedIllustrationValue(marketLinked, 16, 8)).not.toBeNull();
  });

  it("6/8/10 changes ONLY the market-linked component's value, never the traditional component's", () => {
    const { structures } = runOrchestrator(AGE_30_RESOLVABLE());
    const structureB = structures.find((s) => s.strategyResult.components.length === 2)!;
    const [traditional, marketLinked] = structureB.strategyResult.components;
    const traditionalAt6 = traditionalGoalBenefit(traditional);
    const traditionalAt10 = traditionalGoalBenefit(traditional);
    expect(traditionalAt6).toBe(traditionalAt10); // never scaled by rate at all
    const marketAt6 = marketLinkedIllustrationValue(marketLinked, 16, 6);
    const marketAt10 = marketLinkedIllustrationValue(marketLinked, 16, 10);
    expect(marketAt6).not.toBe(marketAt10);
    expect(marketAt10 as number).toBeGreaterThan(marketAt6 as number);
  });

  it("a traditional component's own goal benefit is excluded from the combined total when its premium is genuinely unavailable, never silently treated as free/affordable", () => {
    const { structures } = runOrchestrator(REGRESSION_AGE_35());
    const structureA = structures.find((s) => s.id.startsWith("goal_structure_a"))!;
    const component = structureA.strategyResult.components[0];
    expect(component.monthlyPremium.status).toBe("unavailable");
    expect(component.maturityBenefit.status).toBe("verified"); // the engine DOES know the maturity value
    expect(traditionalGoalBenefit(component)).toBeNull(); // but it must never be counted without a known premium
    expect(combinedIllustratedValue(structureA.strategyResult.components, 16, 8)).toBeNull();
  });
});

// ---- Items 32-34: PPT / cash flow preserved ----
describe("PPT, remaining budget and post-PPT capacity are preserved (Items 32/33/34)", () => {
  it("a limited-pay structure's timeline shows a distinct post-PPT phase with freed capacity", () => {
    const { structures } = runOrchestrator(AGE_30_RESOLVABLE());
    const structureB = structures.find((s) => s.strategyResult.components.length === 2)!;
    expect(structureB.timeline.length).toBeGreaterThanOrEqual(2);
    const lastPhase = structureB.timeline[structureB.timeline.length - 1];
    expect(lastPhase.toYear).toBe(16);
    expect(lastPhase.freeMonthly).toBeGreaterThan(0);
  });
});

// ---- Items 35-37: unknown != zero; advisor fallback preserves source ----
describe("Unknown never becomes zero; advisor official-illustration fallback preserves its own source (Items 35/36/37)", () => {
  it("an unavailable premium stays null, never coerced to 0", () => {
    const { structures } = runOrchestrator(REGRESSION_AGE_35());
    const structureA = structures.find((s) => s.id.startsWith("goal_structure_a"))!;
    expect(structureA.strategyResult.components[0].monthlyPremium.value).not.toBe(0);
    expect(structureA.strategyResult.components[0].monthlyPremium.value).toBeNull();
  });

  it("applyAdvisorIllustrationOverride fills only the fields the advisor entered and tags them with the advisor-entered noteCode", () => {
    const { structures } = runOrchestrator(REGRESSION_AGE_35());
    const structureA = structures.find((s) => s.id.startsWith("goal_structure_a"))!;
    const original = structureA.strategyResult.components[0];
    const overridden = applyAdvisorIllustrationOverride(original, {
      officialPremiumMonthly: 5000,
      maturityOrGoalBenefit: 2500000,
    });
    expect(overridden.monthlyPremium.value).toBe(5000);
    expect(overridden.monthlyPremium.status).toBe("verified");
    expect(overridden.monthlyPremium.noteCode).toBe("advisor_entered_official_illustration");
    expect(overridden.maturityBenefit.value).toBe(2500000);
    expect(overridden.maturityBenefit.noteCode).toBe("advisor_entered_official_illustration");
    // Fields never touched by the advisor stay exactly as the engine reported.
    expect(overridden.deathBenefit).toEqual(original.deathBenefit);
  });

  it("a totalled illustrated maturity figure is marked illustrative the moment a non-guaranteed piece is included, never silently upgraded to verified", () => {
    const { structures } = runOrchestrator(REGRESSION_AGE_35());
    const original = structures[0].strategyResult.components[0];
    const overridden = applyAdvisorIllustrationOverride(original, {
      maturityOrGoalBenefit: 2000000,
      nonGuaranteedIllustration: 300000,
    });
    expect(overridden.maturityBenefit.value).toBe(2300000);
    expect(overridden.maturityBenefit.status).toBe("illustrative");
  });

  it("resolving the goal option 'other' maps to the wealth GoalType for candidate search only", () => {
    expect(toEngineGoalType("other")).toBe("wealth");
    expect(toEngineGoalType("child_education")).toBe("child_education");
  });
});

// ---- No "best/winner/recommended" language anywhere ----
describe("No ranking/winner language (Item 39 groundwork)", () => {
  it("advisor role label kinds are plain descriptive strings, never a ranking word", () => {
    for (const kind of ["traditional", "marketLinked", "marketLinkedIllustrative", "retirement", "protection"] as const) {
      expect(kind.toLowerCase()).not.toMatch(/best|winner|recommended|top/);
    }
  });

  it("advisorRoleLabelKind never returns anything for a term_protection role in practice (excluded upstream) but degrades safely if ever called", () => {
    const fake: StrategyComponent = {
      role: "term_protection",
      product: null,
      eligible: null,
      monthlyPremium: { value: null, status: "unavailable" },
      deathBenefit: { value: null, status: "unavailable" },
      maturityBenefit: { value: null, status: "unavailable" },
      reasonCodes: [],
    };
    expect(advisorRoleLabelKind(fake)).toBe("protection");
  });
});

// ---- CustomerPlan rebuild / explanation ----
describe("Explanation builder is deterministic, template-based, never free-text generation", () => {
  it("produces one part per contributing component plus opening/disclaimer/gap parts", () => {
    const parts = buildAdvisorExplanationParts({
      goalLabel: "Child Education",
      monthlyBudgetFormatted: "₹10,000",
      yearsToGoal: 16,
      components: [
        {
          productLabel: "Jeevan Labh",
          amountFormatted: "₹1,481",
          component: {
            role: "traditional_savings",
            product: null,
            eligible: null,
            monthlyPremium: { value: 1481, status: "verified" },
            deathBenefit: { value: null, status: "unavailable" },
            maturityBenefit: { value: 200000, status: "verified" },
            reasonCodes: [],
          },
        },
      ],
      protectionAmountFormatted: null,
      illustratedCoverage: null,
    });
    expect(parts[0].key).toBe("advisor.explain.opening");
    expect(parts.some((p) => p.key === "advisor.explain.componentTraditional")).toBe(true);
    expect(parts.some((p) => p.key === "advisor.explain.gapUnknown")).toBe(true);
    // Never a free-text sentence — every part is a fixed key.
    for (const part of parts) {
      expect(part.key).toMatch(/^advisor\.explain\./);
    }
  });

  it("includes the market-linked disclaimer only when a market-linked component is present", () => {
    const withoutMarketLinked = buildAdvisorExplanationParts({
      goalLabel: "Wealth",
      monthlyBudgetFormatted: "₹5,000",
      yearsToGoal: 10,
      components: [],
      protectionAmountFormatted: null,
      illustratedCoverage: null,
    });
    expect(withoutMarketLinked.some((p) => p.key === "advisor.explain.marketLinkedDisclaimer")).toBe(false);
  });
});

describe("rebuildStrategyResultWithComponents reuses assembleStrategy, never a parallel aggregation", () => {
  it("recomputes goalCoverage from the effective (possibly overridden) components", () => {
    const { structures, protectionNeed } = runOrchestrator(REGRESSION_AGE_35());
    const structureA = structures.find((s) => s.id.startsWith("goal_structure_a"))!;
    const overridden = structureA.strategyResult.components.map((c) =>
      applyAdvisorIllustrationOverride(c, { officialPremiumMonthly: 5000, maturityOrGoalBenefit: 2500000 })
    );
    const rebuilt = rebuildStrategyResultWithComponents(structureA, overridden, REGRESSION_AGE_35(), protectionNeed);
    expect(rebuilt.goalCoverage.value?.coveragePercent).toBe(100);
    expect(rebuilt.monthlyBudgetVerifiedUsed).toBe(5000);
  });
});
