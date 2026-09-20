// Rebuilds a GoalStructure's StrategyResult aggregates (protection
// coverage, goal coverage, budget usage, guarantees, ...) from a
// possibly advisor-overridden component list, reusing the EXACT same
// aggregation function the Goal Orchestrator itself uses
// (strategyGenerator.ts's assembleStrategy) — never a second, parallel
// aggregation implementation. When no override was ever applied, the
// components are value-identical to the original structure, so this is
// safe to call unconditionally.

import { assembleStrategy } from "@/lib/planning/strategyGenerator";
import { combineNumeric } from "@/lib/planning/statusUtils";
import { GoalResource } from "@/lib/planning/goalNeeds";
import { StrategyComponent, StrategyResult } from "@/lib/planning/strategyTypes";
import { GoalStructure } from "@/lib/planning/goalOrchestrator/types";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";

export function rebuildStrategyResultWithComponents(
  structure: GoalStructure,
  effectiveComponents: StrategyComponent[],
  profile: CustomerFinancialProfile,
  protectionNeed: ProtectionNeedResult
): StrategyResult {
  const combinedMaturity = combineNumeric(effectiveComponents.map((c) => c.maturityBenefit));
  const goalResource: GoalResource | null =
    combinedMaturity.value != null ? { amount: combinedMaturity.value, status: combinedMaturity.status } : null;

  const monthlyValues = effectiveComponents.map((c) => c.monthlyPremium.value);
  const monthlyBudgetVerifiedUsed = monthlyValues.every((v) => v != null)
    ? monthlyValues.reduce((sum: number, v) => sum + (v as number), 0)
    : null;

  return assembleStrategy({
    id: structure.strategyResult.id,
    family: structure.strategyResult.family,
    components: effectiveComponents,
    profile,
    protectionNeed,
    goalResource,
    monthlyBudgetVerifiedUsed,
    marketLinked: structure.strategyResult.marketExposure.value === "market_linked",
    assumptions: structure.strategyResult.assumptions,
    warnings: structure.strategyResult.warnings,
    extraReasonCodes: [],
  });
}
