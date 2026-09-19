import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateStrategies } from "@/lib/planning/strategyGenerator";
import { StrategyResult } from "@/lib/planning/strategyTypes";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

function buildRealScenario() {
  // Chosen so a protection_investment strategy exists whose term
  // component (Plan 894/859, no Increasing Sum Assured option) always
  // returns a verified death benefit even without an exact premium
  // match — see lib/planning/plans/pureTermShared.ts's absoluteAmount
  // fallback, already relied on by tests/planning-strategyGenerator.test.ts.
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
  const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
  const strategy = strategies.find(
    (s) => s.family === "protection_investment" && s.components[0].product?.planNumber === "894"
  ) as StrategyResult;
  expect(strategy).toBeDefined();
  return { profile: p, protectionNeed, goalNeed, strategy };
}

const FIXED_ID = "plan-fixed-test-id";
const FIXED_TIME = new Date("2026-01-15T10:00:00.000Z");

describe("createCustomerPlan — deterministic snapshot", () => {
  it("is deterministic given injected id/time providers", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const planA = createCustomerPlan({
      customerProfile: p,
      protectionNeed,
      goalNeed,
      selectedStrategy: strategy,
      locale: "en",
      idProvider: () => FIXED_ID,
      nowProvider: () => FIXED_TIME,
    });
    const planB = createCustomerPlan({
      customerProfile: p,
      protectionNeed,
      goalNeed,
      selectedStrategy: strategy,
      locale: "en",
      idProvider: () => FIXED_ID,
      nowProvider: () => FIXED_TIME,
    });
    expect(planA).toEqual(planB);
  });

  it("uses a fresh id/timestamp by default across two calls", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const planA = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    const planB = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    expect(planA.id).not.toBe(planB.id);
  });
});

describe("createCustomerPlan — deep-copy behavior (Section 1/10)", () => {
  it("does not retain a live reference to the source StrategyResult's arrays", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });

    // Mutate the ORIGINAL strategy object after the plan was created.
    strategy.assumptions.push("mutated_after_snapshot");
    strategy.components[0].reasonCodes.push("NO_ELIGIBLE_PRODUCTS");

    expect(plan.selectedStrategy.assumptions).not.toContain("mutated_after_snapshot");
    expect(plan.selectedStrategy.components[0].reasonCodes).not.toContain("NO_ELIGIBLE_PRODUCTS");
  });

  it("mutating the returned plan does not affect the source strategy", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    plan.selectedStrategy.warnings.push("mutated_after_creation");
    expect(strategy.warnings).not.toContain("mutated_after_creation");
  });
});

describe("createCustomerPlan — product identity preserved (Section 5)", () => {
  it("preserves Plan Number, UIN, product name and category for every LIC component", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    const productComponent = plan.selectedStrategy.components.find((c) => c.product != null)!;
    expect(productComponent.product!.planNumber).toBe("894");
    expect(productComponent.product!.uin).toMatch(/^512[A-Z]\d{3}V\d{2}$/);
    expect(productComponent.product!.productName).toContain("Jeevan Raksha");
    expect(productComponent.product!.category).toBe("term_protection");
    expect(productComponent.provider).toBe("LIC");
  });

  it("never sets a provider/sourceId for the illustrative-investment component", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    const investmentComponent = plan.selectedStrategy.components.find((c) => c.role === "illustrative_investment")!;
    expect(investmentComponent.product).toBeNull();
    expect(investmentComponent.provider).toBeNull();
  });
});

describe("createCustomerPlan — status/value preservation (Section 6, 24)", () => {
  it("preserves the verified death benefit and its status exactly", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    const term = plan.selectedStrategy.components.find((c) => c.product?.planNumber === "894")!;
    expect(term.deathBenefit.status).toBe("verified");
    // Basic Sum Assured is fed directly from the calculated protection
    // gap (liabilities 1,000,000 + unfunded goal 2,600,000 = 3,600,000),
    // and Jeevan Raksha's own Death Benefit is always at least the BSA
    // itself, verified, even without an exact premium match.
    expect(term.deathBenefit.value).toBe(3600000);
  });

  it("keeps an unavailable premium unavailable — never fabricated as 0", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    const term = plan.selectedStrategy.components.find((c) => c.product?.planNumber === "894")!;
    expect(term.premium.status).toBe("unavailable");
    expect(term.premium.value).toBeNull();
  });

  it("keeps monthlyBudgetVerifiedUsed unknown, never 0, when the premium is unverified", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    expect(strategy.monthlyBudgetUsageStatus).toBe("unavailable");
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    expect(plan.financialPicture.budget.monthlyBudgetUsageStatus).toBe("unavailable");
    expect(plan.financialPicture.budget.monthlyBudgetVerifiedUsed).toBeNull();
  });

  it("labels the investment component's projected value illustrative, never verified", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    const investment = plan.selectedStrategy.components.find((c) => c.role === "illustrative_investment")!;
    expect(investment.maturityBenefit.status).toBe("illustrative");
    expect(investment.investmentIllustration).not.toBeNull();
    expect(investment.investmentIllustration!.status).toBe("illustrative");
    expect(investment.investmentIllustration!.disclaimerCode).toBe("illustration_only_not_guaranteed_returns");
  });

  it("snapshots the exact illustration rate/duration/contribution used", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const investmentComponent = strategy.components.find((c) => c.role === "illustrative_investment")!;
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    const snapshot = plan.selectedStrategy.components.find((c) => c.role === "illustrative_investment")!
      .investmentIllustration!;
    expect(snapshot.years).toBe(investmentComponent.illustration!.years);
    expect(snapshot.ratePct).toBe(investmentComponent.illustration!.ratePct);
    expect(snapshot.contributionAmount).toBe(investmentComponent.monthlyPremium.value);
    expect(snapshot.projectedValue).toBe(investmentComponent.maturityBenefit.value);
  });
});

describe("createCustomerPlan — reason codes, warnings, assumptions preserved", () => {
  it("preserves the strategy's own reason codes, warnings and assumptions verbatim", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    expect(plan.selectedStrategy.reasonCodes.sort()).toEqual([...strategy.reasonCodes].sort());
    expect(plan.selectedStrategy.warnings.sort()).toEqual([...strategy.warnings].sort());
    expect(plan.selectedStrategy.assumptions.sort()).toEqual([...strategy.assumptions].sort());
  });
});

describe("createCustomerPlan — nulls preserved (Section 3)", () => {
  it("never converts an unknown financial value to zero anywhere in the snapshot", () => {
    const p = profile({ age: 30, monthlyBudget: 15000, yearsToGoal: 20, riskComfort: "medium" });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: null, currentResources: null });
    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const strategy = strategies.find((s) => s.family === "protection_investment")!;
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });

    expect(plan.financialPicture.goal.targetAmount).toBeNull();
    expect(plan.financialPicture.goal.currentResources).toBeNull();
    // existingLifeCover was never provided in this profile — stays
    // unknown (null), never silently treated as "no cover" (0).
    expect(plan.financialPicture.protection.existingProtection).toBeNull();
  });
});

describe("createCustomerPlan — customer identity (Section 2)", () => {
  it("works as an anonymous plan when no customer identity is given", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    expect(plan.customer.name).toBeNull();
    expect(plan.customer.phone).toBeNull();
  });

  it("captures a provided name and phone, trimmed", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({
      customerProfile: p,
      protectionNeed,
      goalNeed,
      selectedStrategy: strategy,
      locale: "en",
      customer: { name: "  Test Customer  ", phone: " 9999999999 " },
    });
    expect(plan.customer.name).toBe("Test Customer");
    expect(plan.customer.phone).toBe("9999999999");
  });

  it("treats a blank name/phone as not provided (null), not an empty string", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({
      customerProfile: p,
      protectionNeed,
      goalNeed,
      selectedStrategy: strategy,
      locale: "en",
      customer: { name: "   ", phone: "" },
    });
    expect(plan.customer.name).toBeNull();
    expect(plan.customer.phone).toBeNull();
  });
});

describe("createCustomerPlan — no ranking/recommendation fields anywhere", () => {
  it("never includes a score/rank/best/recommended/winner field on the plan", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    const json = JSON.stringify(plan).toLowerCase();
    for (const forbidden of ["\"score\"", "\"rank\"", "\"best\"", "\"recommended\"", "\"winner\"", "\"optimal\""]) {
      expect(json).not.toContain(forbidden);
    }
  });
});

describe("createCustomerPlan — schema version and metadata", () => {
  it("stamps the current schema version and snapshot metadata", () => {
    const { profile: p, protectionNeed, goalNeed, strategy } = buildRealScenario();
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    expect(plan.schemaVersion).toBe(1);
    expect(plan.sourceMetadata.snapshotNote).toBe("snapshot_not_live_reference");
    expect(plan.sourceMetadata.strategyIdAtCreation).toBe(strategy.id);
    expect(plan.localeAtCreation).toBe("en");
  });
});
