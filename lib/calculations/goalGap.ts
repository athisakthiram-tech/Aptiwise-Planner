// Goal-gap analysis: pure planning maths, not investment advice. Reuses
// the existing tested contribution and SIP-projection functions rather
// than re-deriving any formula.

import { GoalGapResult, GoalGapScenario } from "@/types";
import { totalPlannedContributions } from "@/lib/calculations/contributions";
import { buildInvestmentProjections, ILLUSTRATION_RATES_PCT } from "@/lib/calculations/sip";

export interface GoalGapInput {
  targetAmount: number;
  monthlyBudget: number;
  years: number;
}

export function calculateGoalGap(
  input: GoalGapInput,
  ratesPct: readonly number[] = ILLUSTRATION_RATES_PCT
): GoalGapResult {
  const { targetAmount, monthlyBudget, years } = input;
  const totalContributions = totalPlannedContributions(monthlyBudget, years);
  const projections = buildInvestmentProjections(
    { monthlyAmount: monthlyBudget, years },
    ratesPct
  );

  const scenarios: GoalGapScenario[] = projections.map(({ annualRatePct, futureValue }) => {
    const projectedValue = futureValue;
    const gap = Math.max(0, Math.round(targetAmount - projectedValue));
    const surplus = Math.max(0, Math.round(projectedValue - targetAmount));
    const illustrativeGrowth = Math.max(0, Math.round(projectedValue - totalContributions));
    const goalCoveragePercent =
      targetAmount > 0 ? Math.round((projectedValue / targetAmount) * 100) : 0;
    const status: GoalGapScenario["status"] =
      gap > 0 ? "shortfall" : surplus > 0 ? "surplus" : "on_track";

    return {
      annualRatePct,
      projectedValue,
      gap,
      surplus,
      illustrativeGrowth,
      goalCoveragePercent,
      status,
    };
  });

  return { targetAmount, monthlyBudget, years, totalContributions, scenarios };
}
