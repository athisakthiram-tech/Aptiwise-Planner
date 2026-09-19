// Goal Need engine: how much of a customer's stated financial goal is
// already covered by known resources, and how much remains. Reuses the
// existing, tested goal-coverage maths (lib/calculations/goalCoverage.ts)
// rather than re-deriving the percentage/gap/surplus formula.
//
// Goal coverage percentage is informational only — it is NEVER turned
// into a monthly-budget allocation percentage anywhere in this module or
// its callers. See strategyGenerator.ts, which never divides a budget by
// a coverage percentage.

import { ValueStatus } from "@/types/insurance";
import { GoalCoverage, calculateGoalCoverage } from "@/lib/calculations/goalCoverage";
import { weakestStatus } from "@/lib/planning/statusUtils";

export type GoalNeedStatus = "calculated" | "partial" | "unavailable";

// A resource the caller has already computed elsewhere (a verified LIC
// product's maturity benefit, an illustrative SIP projection, etc.) —
// this module never invents or looks up such a figure itself, it only
// combines resources the caller hands it along with each one's own
// honest status.
export interface GoalResource {
  amount: number;
  status: ValueStatus;
}

export interface GoalNeedInput {
  targetGoal: number | null;
  // The customer's own already-held assets earmarked for this goal.
  currentResources: number | null;
  // Optional additional resource(s) — e.g. a specific product's
  // maturity benefit (verified) or a SIP scenario (illustrative). Never
  // required; omitting it just means the goal need is assessed on
  // currentResources alone.
  projectedResources?: GoalResource | null;
}

export interface GoalNeedResult {
  targetGoal: number | null;
  currentResources: number | null;
  projectedResources: number | null;
  goalCoverageAmount: number | null;
  goalCoveragePercent: number | null;
  remainingGoalGap: number | null;
  surplus: number | null;
  status: GoalNeedStatus;
  // The weakest status among whatever resources were actually combined
  // into goalCoverageAmount — never upgraded past the weakest input.
  confidence: ValueStatus;
}

function unavailableResult(targetGoal: number | null, currentResources: number | null, projectedResources: number | null): GoalNeedResult {
  return {
    targetGoal,
    currentResources,
    projectedResources,
    goalCoverageAmount: null,
    goalCoveragePercent: null,
    remainingGoalGap: null,
    surplus: null,
    status: "unavailable",
    confidence: "unavailable",
  };
}

export function calculateGoalNeed(input: GoalNeedInput): GoalNeedResult {
  const { targetGoal, currentResources, projectedResources } = input;

  // Zero or invalid targets are handled explicitly, not by letting a
  // division silently produce Infinity/NaN — an unset or non-positive
  // goal is treated the same honest way as any other missing input.
  if (targetGoal == null || targetGoal <= 0) {
    return unavailableResult(targetGoal ?? null, currentResources ?? null, projectedResources?.amount ?? null);
  }

  const knownResourceValues: number[] = [];
  const knownResourceStatuses: ValueStatus[] = [];
  if (currentResources != null) {
    knownResourceValues.push(currentResources);
    // The customer's own stated resources are taken as a known fact
    // (not an LIC-sourced figure, but not a guess either).
    knownResourceStatuses.push("verified");
  }
  if (projectedResources != null) {
    knownResourceValues.push(projectedResources.amount);
    knownResourceStatuses.push(projectedResources.status);
  }

  if (knownResourceValues.length === 0) {
    return unavailableResult(targetGoal, currentResources ?? null, projectedResources?.amount ?? null);
  }

  const goalCoverageAmount = knownResourceValues.reduce((sum, value) => sum + value, 0);
  const coverage: GoalCoverage = calculateGoalCoverage(targetGoal, goalCoverageAmount);

  // "partial" whenever currentResources itself is unknown — even if a
  // projected resource is known, an unknown current-resources figure
  // means the true coverage picture is still incomplete.
  const status: GoalNeedStatus = currentResources == null ? "partial" : "calculated";

  return {
    targetGoal,
    currentResources: currentResources ?? null,
    projectedResources: projectedResources?.amount ?? null,
    goalCoverageAmount,
    goalCoveragePercent: coverage.coveragePercent,
    remainingGoalGap: coverage.remainingGap,
    surplus: coverage.surplus,
    status,
    confidence: weakestStatus(knownResourceStatuses),
  };
}
