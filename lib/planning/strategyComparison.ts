// Comparison table builder for generated strategies: reshapes
// StrategyResult[] into one row per strategy, same dimensions across
// every row, so an advisor/UI can lay them out side by side. This module
// adds NO scoring, ranking, or "winner" — it only reprojects data that
// strategyGenerator.ts already computed, using the same ComparisonValue/
// ValueStatus semantics as the rest of the app (UNKNOWN != ZERO,
// NOT_APPLICABLE != UNAVAILABLE, ILLUSTRATIVE != VERIFIED).

import { GoalCoverage } from "@/lib/calculations/goalCoverage";
import { ComparisonValue, RiskLevel } from "@/lib/comparison/protectionAdjustedComparison";
import { StrategyFamily, StrategyResult } from "@/lib/planning/strategyTypes";

export interface StrategyComparisonRow {
  id: string;
  family: StrategyFamily;
  familyProtection: ComparisonValue<number>;
  protectionGap: ComparisonValue<number>;
  goalCoverage: ComparisonValue<GoalCoverage>;
  goalGap: ComparisonValue<number>;
  guaranteedBenefits: ComparisonValue<number>;
  nonGuaranteedBenefits: ComparisonValue<number>;
  marketExposure: ComparisonValue<RiskLevel>;
  liquidity: ComparisonValue;
  costs: ComparisonValue;
  taxTreatment: ComparisonValue;
  budgetUsage: ComparisonValue<number>;
}

// A strategy's only non-guaranteed figure today is its illustrative
// investment component's projected value, if it has one — never
// upgraded to "guaranteed" and never fabricated for a strategy that
// doesn't include one.
function nonGuaranteedBenefit(strategy: StrategyResult): ComparisonValue<number> {
  const illustrative = strategy.components.find((c) => c.role === "illustrative_investment");
  if (!illustrative) {
    return { value: null, status: "not_applicable", noteCode: "no_non_guaranteed_component" };
  }
  return illustrative.maturityBenefit;
}

export function buildStrategyComparisonTable(strategies: StrategyResult[]): StrategyComparisonRow[] {
  return strategies.map((strategy) => ({
    id: strategy.id,
    family: strategy.family,
    familyProtection: strategy.protectionCoverage,
    protectionGap: strategy.protectionGap,
    goalCoverage: strategy.goalCoverage,
    goalGap: strategy.goalGap,
    guaranteedBenefits: strategy.guarantees,
    nonGuaranteedBenefits: nonGuaranteedBenefit(strategy),
    marketExposure: strategy.marketExposure,
    liquidity: strategy.liquidity,
    costs: strategy.costs,
    taxTreatment: strategy.taxTreatment,
    budgetUsage: { value: strategy.monthlyBudgetVerifiedUsed, status: strategy.monthlyBudgetUsageStatus },
  }));
}
