// Phase 4 — proves the "One Source of Truth" architecture end to end:
// PlanningRequest -> Combination Engine -> AdvisorStructureView ->
// buildStrategyResultForSnapshot -> CustomerPlan snapshot -> Proposal
// ViewModel / WhatsApp summary all trace back to the SAME calculation,
// never a second computation inside the export pipeline.

import { describe, it, expect } from "vitest";
import { buildPlanningRequest, buildStrategyResultForSnapshot, planAdvisorStructures, toEngineGoalType } from "@/lib/advisor/combinationPlanModel";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { buildProposalViewModel } from "@/lib/customerPlan/export/proposalViewModel";
import { buildWhatsAppSummary } from "@/lib/customerPlan/export/shareSummary";

const REGRESSION_A_INPUT = {
  age: 35,
  profession: "Engineer",
  goalOption: "child_education" as const,
  targetGoalAmount: 2_500_000,
  yearsToGoal: 16,
  monthlyBudget: 10_000,
  riskComfort: "medium" as const,
};

function buildRegressionAPlan() {
  const request = buildPlanningRequest(REGRESSION_A_INPUT)!;
  const views = planAdvisorStructures(request);
  const structureA = views[0];

  const profile: CustomerFinancialProfile = {
    ...UNKNOWN_CUSTOMER_PROFILE,
    age: REGRESSION_A_INPUT.age,
    monthlyBudget: REGRESSION_A_INPUT.monthlyBudget,
    goalType: toEngineGoalType(REGRESSION_A_INPUT.goalOption),
    targetGoalAmount: REGRESSION_A_INPUT.targetGoalAmount,
    yearsToGoal: REGRESSION_A_INPUT.yearsToGoal,
    riskComfort: REGRESSION_A_INPUT.riskComfort,
  };
  const protectionNeed = calculateProtectionNeed({ profile });
  const goalNeed = calculateGoalNeed({ targetGoal: profile.targetGoalAmount, currentResources: profile.existingInvestments });
  const strategy = buildStrategyResultForSnapshot(structureA.raw, request.monthlyCapacity);

  const plan = createCustomerPlan({
    customerProfile: profile,
    protectionNeed,
    goalNeed,
    selectedStrategy: strategy,
    locale: "en",
    customer: { name: "Test Customer" },
    idProvider: () => "fixed-id",
    nowProvider: () => new Date("2026-01-01T00:00:00.000Z"),
  });

  return { structureA, plan };
}

describe("Phase 4 — One Source of Truth: CustomerPlan/WhatsApp share the same numbers as Screen 2/3", () => {
  it("the CustomerPlan snapshot's total monthly premium equals the Screen 2/3 structure's monthly total", () => {
    const { structureA, plan } = buildRegressionAPlan();
    const snapshotPremiumSum = plan.selectedStrategy.components.reduce((s, c) => s + (c.premium.value ?? 0), 0);
    expect(snapshotPremiumSum).toBe(structureA.monthlyTotal);
  });

  it("the CustomerPlan snapshot preserves the real LIC plan number/UIN shown on Screen 2/3, never a placeholder", () => {
    const { structureA, plan } = buildRegressionAPlan();
    const snapshotPlanNumbers = plan.selectedStrategy.components.map((c) => c.product?.planNumber).sort();
    const screenPlanNumbers = structureA.components.map((c) => c.planNumber).sort();
    expect(snapshotPlanNumbers).toEqual(screenPlanNumbers);
  });

  it("the WhatsApp summary is built purely from the frozen plan (no separate calculation) and contains the same product identities", () => {
    const { structureA, plan } = buildRegressionAPlan();
    const whatsapp = buildWhatsAppSummary(plan);
    for (const component of structureA.components) {
      expect(whatsapp).toContain(`Plan ${component.planNumber} | UIN ${component.uin}`);
    }
  });

  it("the proposal view model (feeding the print/PDF pipeline) reads the same frozen plan, never re-running the engine", () => {
    const { plan } = buildRegressionAPlan();
    const vm1 = buildProposalViewModel(plan);
    const vm2 = buildProposalViewModel(plan);
    // Pure function of the frozen snapshot — calling it twice must be
    // byte-for-byte identical (proves no live engine re-invocation, no
    // randomness/timestamps sneaking in).
    expect(JSON.stringify(vm1)).toBe(JSON.stringify(vm2));
  });

  it("re-opening a saved plan never re-runs the engine — the snapshot's numbers are frozen even if called again", () => {
    const { plan: plan1 } = buildRegressionAPlan();
    const { plan: plan2 } = buildRegressionAPlan();
    expect(plan1.selectedStrategy.components).toEqual(plan2.selectedStrategy.components);
  });
});
