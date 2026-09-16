// Plan Builder: pure planning maths for exploring how a customer's
// monthly capacity could be split between a protection allocation and a
// goal-building allocation. This is an interactive planning simulator,
// NOT an investment recommendation engine:
//   - no split is ever labeled "best"/"recommended"/"optimal"
//   - money reserved for protection is never treated as a savings or
//     return-generating contribution, and is never added to the
//     illustrative goal value
// Reuses the existing tested contribution/SIP functions rather than
// re-deriving any formula.

import { PlanBuilderResult } from "@/types";
import { totalPlannedContributions } from "@/lib/calculations/contributions";
import { sipFutureValue } from "@/lib/calculations/sip";

// UI starting point only — a "starting illustration", not a
// recommendation, not "ideal", not "optimal". Advisors and customers are
// expected to move the slider.
export const DEFAULT_PROTECTION_ALLOCATION_PERCENT = 20;

export interface PlanBuilderInput {
  targetAmount: number;
  monthlyBudget: number;
  years: number;
  protectionAllocation: number;
  annualScenarioRate: number;
}

export function buildPlan(input: PlanBuilderInput): PlanBuilderResult {
  const { targetAmount, monthlyBudget, years, annualScenarioRate } = input;

  // Protection allocation can never be negative or exceed the customer's
  // total monthly capacity — goal allocation is always the remainder, so
  // the two always total exactly monthlyBudget (never more, never less).
  const protectionAllocation = Math.min(Math.max(0, input.protectionAllocation), monthlyBudget);
  const goalAllocation = monthlyBudget - protectionAllocation;

  const protectionContribution = totalPlannedContributions(protectionAllocation, years);
  const goalContribution = totalPlannedContributions(goalAllocation, years);

  // Only the goal-building allocation is ever run through the SIP
  // projection — protection money is not investment/savings.
  const illustrativeGoalValue = sipFutureValue(goalAllocation, annualScenarioRate, years);

  const illustrativeGrowth = Math.max(0, Math.round(illustrativeGoalValue - goalContribution));
  const goalGap = Math.max(0, Math.round(targetAmount - illustrativeGoalValue));
  const goalSurplus = Math.max(0, Math.round(illustrativeGoalValue - targetAmount));
  const goalCoveragePercent =
    targetAmount > 0 ? Math.round((illustrativeGoalValue / targetAmount) * 100) : 0;

  return {
    monthlyBudget,
    years,
    protectionAllocation,
    goalAllocation,
    annualScenarioRate,
    protectionContribution,
    goalContribution,
    illustrativeGoalValue,
    illustrativeGrowth,
    goalGap,
    goalSurplus,
    goalCoveragePercent,
  };
}

// Illustrative starting structures for side-by-side exploration only —
// never presented as a ranking or a recommendation (see
// "planBuilder.structuresDisclaimer" in lib/i18n/translations.ts).
export interface PlanStructurePreset {
  id: string;
  labelKey: string;
  protectionPercent: number;
}

export const PLAN_STRUCTURE_PRESETS: PlanStructurePreset[] = [
  {
    id: "protection_focus",
    labelKey: "planBuilder.structure.protectionFocus",
    protectionPercent: 30,
  },
  {
    id: "balanced_illustration",
    labelKey: "planBuilder.structure.balancedIllustration",
    protectionPercent: 20,
  },
  {
    id: "goal_focus",
    labelKey: "planBuilder.structure.goalFocus",
    protectionPercent: 10,
  },
];
