import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateGoalStructures } from "@/lib/planning/goalOrchestrator/goalStructureGenerator";
import { generateStrategies } from "@/lib/planning/strategyGenerator";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { validateCustomerPlan } from "@/lib/customerPlan/customerPlanValidation";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

const FUNDING = { fundingPersonLabel: "Father", beneficiaryLabel: "Child" };

// Age 30 (not the regression scenario's own age) is used here purely
// because it's the one age this codebase's registered engines resolve a
// genuinely verified premium at (Plan 736's own published sample row) —
// needed so this test can assert real, non-null configuration values
// instead of only exercising the all-unavailable path.
function buildGoalStructure(overrides: Partial<CustomerFinancialProfile> = {}) {
  const p = profile({
    age: 30,
    monthlyBudget: 10000,
    goalType: "child_education",
    targetGoalAmount: 2500000,
    yearsToGoal: 16,
    riskComfort: "medium",
    ...overrides,
  });
  const protectionNeed = calculateProtectionNeed({ profile: p });
  const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });
  const structures = generateGoalStructures({ profile: p, protectionNeed, goalNeed, funding: FUNDING });
  return { profile: p, protectionNeed, goalNeed, structures };
}

describe("Goal Orchestrator -> createCustomerPlan — a GoalStructure feeds the EXISTING proposal pipeline unchanged (Section 23)", () => {
  it("createCustomerPlan accepts a GoalStructure's strategyResult directly, with no new architecture", () => {
    const { profile: p, protectionNeed, goalNeed, structures } = buildGoalStructure();
    expect(structures.length).toBeGreaterThan(0);
    const structure = structures[0];
    const plan = createCustomerPlan({
      customerProfile: p,
      protectionNeed,
      goalNeed,
      selectedStrategy: structure.strategyResult,
      locale: "en",
      fundingContext: structure.funding,
    });
    expect(validateCustomerPlan(plan).valid).toBe(true);
    expect(plan.selectedStrategy.strategyId).toBe(structure.strategyResult.id);
  });

  it("preserves fundingContext (funding person and beneficiary) on the snapshot", () => {
    const { profile: p, protectionNeed, goalNeed, structures } = buildGoalStructure();
    const structure = structures[0];
    const plan = createCustomerPlan({
      customerProfile: p,
      protectionNeed,
      goalNeed,
      selectedStrategy: structure.strategyResult,
      locale: "en",
      fundingContext: structure.funding,
    });
    expect(plan.fundingContext).toEqual(FUNDING);
  });

  it("omits fundingContext entirely when the caller doesn't supply one, rather than fabricating labels", () => {
    const { profile: p, protectionNeed, goalNeed, structures } = buildGoalStructure();
    const structure = structures[0];
    const plan = createCustomerPlan({
      customerProfile: p,
      protectionNeed,
      goalNeed,
      selectedStrategy: structure.strategyResult,
      locale: "en",
    });
    expect(plan.fundingContext).toBeUndefined();
  });

  it("preserves each component's Basic Sum Assured / Policy Term / Premium Paying Term configuration when the engine actually resolved one", () => {
    const { profile: p, protectionNeed, goalNeed, structures } = buildGoalStructure();
    const withConfiguration = structures
      .flatMap((s) => s.strategyResult.components)
      .find((c) => c.configuration != null);
    expect(withConfiguration).toBeDefined();

    const structureWithConfig = structures.find((s) =>
      s.strategyResult.components.some((c) => c.configuration != null)
    )!;
    const plan = createCustomerPlan({
      customerProfile: p,
      protectionNeed,
      goalNeed,
      selectedStrategy: structureWithConfig.strategyResult,
      locale: "en",
      fundingContext: structureWithConfig.funding,
    });
    const snapshotComponent = plan.selectedStrategy.components.find((c) => c.configuration != null)!;
    const sourceComponent = structureWithConfig.strategyResult.components.find((c) => c.configuration != null)!;
    expect(snapshotComponent.configuration).toEqual(sourceComponent.configuration);
    // Deep-copied, not the same object reference surviving the JSON
    // round-trip inside createCustomerPlan.
    sourceComponent.configuration!.basicSumAssured = -1;
    expect(snapshotComponent.configuration!.basicSumAssured).not.toBe(-1);
  });

  it("omits configuration on a component that never had one (e.g. an illustrative-investment role), never backfilling a guess", () => {
    const { profile: p, protectionNeed, goalNeed, structures } = buildGoalStructure();
    const structureWithIllustrative = structures.find((s) =>
      s.strategyResult.components.some((c) => c.role === "illustrative_investment")
    );
    if (structureWithIllustrative) {
      const plan = createCustomerPlan({
        customerProfile: p,
        protectionNeed,
        goalNeed,
        selectedStrategy: structureWithIllustrative.strategyResult,
        locale: "en",
        fundingContext: structureWithIllustrative.funding,
      });
      const illustrativeSnapshot = plan.selectedStrategy.components.find((c) => c.role === "illustrative_investment")!;
      expect(illustrativeSnapshot.configuration).toBeUndefined();
    }
  });
});

describe("Goal Orchestrator -> createCustomerPlan — old plans (pre-existing fields) remain valid (Section 23)", () => {
  it("a plan built the ORIGINAL way (no fundingContext, no component configuration) still validates successfully", () => {
    const p = profile({
      age: 30,
      monthlyBudget: 15000,
      yearsToGoal: 20,
      goalType: "child_education",
      targetGoalAmount: 3000000,
      riskComfort: "medium",
    });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });
    // Deliberately NOT going through the Goal Orchestrator at all — this
    // is the legacy strategyGenerator path old drafts were built from.
    const strategy = generateStrategies({ profile: p, protectionNeed, goalNeed })[0];
    const plan = createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
    expect(validateCustomerPlan(plan).valid).toBe(true);
    expect(plan.fundingContext).toBeUndefined();
    for (const component of plan.selectedStrategy.components) {
      expect(component.configuration).toBeUndefined();
    }
  });

  it("a plan snapshot missing fundingContext/configuration entirely (simulating a plan saved before these fields existed) still passes validation", () => {
    const { profile: p, protectionNeed, goalNeed, structures } = buildGoalStructure();
    const structure = structures[0];
    const plan = createCustomerPlan({
      customerProfile: p,
      protectionNeed,
      goalNeed,
      selectedStrategy: structure.strategyResult,
      locale: "en",
      fundingContext: structure.funding,
    });
    // Simulate an old, already-persisted plan by stripping the new
    // fields out entirely (round-tripping through JSON, as
    // customerPlanStorage.ts would when reading a saved draft).
    const legacyShaped = JSON.parse(JSON.stringify(plan));
    delete legacyShaped.fundingContext;
    for (const component of legacyShaped.selectedStrategy.components) {
      delete component.configuration;
    }
    expect(validateCustomerPlan(legacyShaped).valid).toBe(true);
  });
});
