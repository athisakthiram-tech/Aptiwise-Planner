// Dev/internal integration point proving the full pipeline works
// end-to-end:
//
//   Customer Profile
//         -> Protection Need
//         -> Goal Need
//         -> Eligible Registered Products (inside strategyGenerator)
//         -> Strategy Generator
//         -> Comparable StrategyResult[]
//
// This is NOT a customer-facing UI and NOT a final API — this stage's
// scope is proving the wiring works, not redesigning the app (see task
// scope notes). lib/planning/*.test.ts and any dev-only page can call
// this single function rather than re-assembling the pipeline by hand.

import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult, calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { GoalNeedResult, calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateStrategies } from "@/lib/planning/strategyGenerator";
import { StrategyComparisonRow, buildStrategyComparisonTable } from "@/lib/planning/strategyComparison";
import { StrategyResult } from "@/lib/planning/strategyTypes";

export interface PlanningPipelineInput {
  profile: CustomerFinancialProfile;
  // Forwarded to calculateProtectionNeed — see that module's header for
  // why this must be an explicit, caller-supplied assumption rather than
  // an internally-invented number.
  incomeReplacementYears?: number;
  illustrativeRatesPct?: readonly number[];
}

export interface PlanningPipelineResult {
  protectionNeed: ProtectionNeedResult;
  goalNeed: GoalNeedResult;
  strategies: StrategyResult[];
  comparisonTable: StrategyComparisonRow[];
}

export function runPlanningPipeline(input: PlanningPipelineInput): PlanningPipelineResult {
  const profile: CustomerFinancialProfile = input.profile;

  const protectionNeed = calculateProtectionNeed({
    profile,
    incomeReplacementYears: input.incomeReplacementYears,
  });

  const goalNeed = calculateGoalNeed({
    targetGoal: profile.targetGoalAmount,
    currentResources: profile.existingInvestments,
  });

  const strategies = generateStrategies({
    profile,
    protectionNeed,
    goalNeed,
    illustrativeRatesPct: input.illustrativeRatesPct,
  });

  return {
    protectionNeed,
    goalNeed,
    strategies,
    comparisonTable: buildStrategyComparisonTable(strategies),
  };
}
