// Adapts a saved CustomerPlan snapshot back into the same
// ProtectionVisualData/GoalVisualData shapes the live Results UI already
// uses (lib/planning/resultsViewModel.ts) — so ProtectionVisual and
// GoalCoverageVisual can render either a live strategy or a frozen
// snapshot without any component changes, and without duplicating their
// formatting/derivation logic here.

import { ProtectionVisualData, GoalVisualData, BudgetPresentation } from "@/lib/planning/resultsViewModel";
import { CustomerPlan } from "@/lib/customerPlan/types";

export function protectionVisualDataFromPlan(plan: CustomerPlan): ProtectionVisualData {
  const { protection } = plan.financialPicture;
  return {
    required: protection.requiredProtection,
    requiredStatus: protection.requiredStatus,
    existing: protection.existingProtection,
    providedByStructure: protection.protectionProvidedByStructure,
    providedByStructureStatus: protection.protectionProvidedByStructureStatus,
    remainingGap: protection.remainingProtectionGap,
    remainingGapStatus: protection.remainingProtectionGapStatus,
  };
}

export function goalVisualDataFromPlan(plan: CustomerPlan): GoalVisualData {
  const { goal } = plan.financialPicture;
  return {
    targetGoal: goal.targetAmount,
    currentResources: goal.currentResources,
    structureValue: goal.structureValue,
    structureValueStatus: goal.structureValueStatus,
    coveragePercent: goal.goalCoveragePercent,
    remainingGap: goal.remainingGoalGap,
    status: goal.status,
  };
}

// Mirrors lib/planning/resultsViewModel.ts's getBudgetPresentation, but
// reads from a frozen CustomerPlan snapshot instead of a live
// StrategyResult — same "never imply within-budget on an unverified
// premium" safety, applied to the saved plan's own recorded figures.
export function budgetPresentationFromPlan(plan: CustomerPlan): BudgetPresentation {
  const { budget } = plan.financialPicture;

  if (budget.monthlyBudgetUsageStatus === "verified" && budget.monthlyBudgetVerifiedUsed != null) {
    return {
      kind: "verified",
      monthlyBudgetAvailable: budget.monthlyBudgetAvailable,
      used: budget.monthlyBudgetVerifiedUsed,
      remaining: budget.remainingBudget,
    };
  }

  const illustrativeComponent = plan.selectedStrategy.components.find(
    (c) => c.role === "illustrative_investment"
  );
  return {
    kind: "unverified",
    monthlyBudgetAvailable: budget.monthlyBudgetAvailable,
    illustrativeInvestmentAmount: illustrativeComponent?.premium.value ?? null,
  };
}
