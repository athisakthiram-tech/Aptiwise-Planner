// Shared goal-coverage maths: how much of a target a projected value
// covers. Pure, status-agnostic — callers decide whether the projected
// value itself is verified/illustrative/unavailable.

export interface GoalCoverage {
  coveragePercent: number;
  remainingGap: number;
  surplus: number;
}

export function calculateGoalCoverage(
  targetGoalAmount: number,
  projectedGoalValue: number
): GoalCoverage {
  const coveragePercent =
    targetGoalAmount > 0 ? Math.round((projectedGoalValue / targetGoalAmount) * 100) : 0;
  const remainingGap = Math.max(0, Math.round(targetGoalAmount - projectedGoalValue));
  const surplus = Math.max(0, Math.round(projectedGoalValue - targetGoalAmount));
  return { coveragePercent, remainingGap, surplus };
}
