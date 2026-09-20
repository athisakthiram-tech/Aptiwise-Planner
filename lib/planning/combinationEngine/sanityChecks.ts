// Phase 3B (Section 23) — Sanity assertions for the combination engine.
// Pure, deterministic validators — never a silent auto-correction. Used
// both directly by tests and defensively by planner.ts to drop a
// structure that fails a critical check rather than ever surfacing a
// NaN/Infinity/negative-premium result.

import { CandidateConfiguration, CandidateStructure, StructureGoalAnalysis } from "@/lib/planning/combinationEngine/types";
import { CashFlowEvent } from "@/lib/planning/planIntelligence/types";
import { calculateXirr } from "@/lib/planning/planIntelligence/returnAnalysis";

export interface SanityIssue {
  code: string;
  message: string;
}

export function checkConfiguration(config: CandidateConfiguration): SanityIssue[] {
  const issues: SanityIssue[] = [];
  if (config.monthlyPremium.value != null && config.monthlyPremium.value <= 0) {
    issues.push({ code: "PREMIUM_NOT_POSITIVE", message: `Configuration for ${config.planNumber}/${config.uin} has a non-positive premium (${config.monthlyPremium.value}).` });
  }
  if (config.premiumPayingTermYears != null && config.policyTermYears != null && config.premiumPayingTermYears > config.policyTermYears) {
    issues.push({ code: "PPT_EXCEEDS_TERM", message: `Configuration for ${config.planNumber}/${config.uin} has Premium Paying Term (${config.premiumPayingTermYears}) longer than the Policy Term (${config.policyTermYears}).` });
  }
  return issues;
}

export function checkStructureBudget(structure: CandidateStructure, monthlyCapacity: number): SanityIssue[] {
  const totalPremium = structure.components.reduce((sum, c) => sum + (c.monthlyAllocation.value ?? 0), 0);
  if (totalPremium > monthlyCapacity) {
    return [{ code: "OVER_BUDGET", message: `Structure ${structure.id} commits Rs.${totalPremium}/month, exceeding the customer's stated capacity of Rs.${monthlyCapacity}/month.` }];
  }
  return [];
}

// Pass a SINGLE component's own event list (e.g. from
// componentCashFlowEvents), never a multi-component structure's merged
// `events` array — two DIFFERENT components legitimately both pay a
// premium (or both mature) in the same year, which is not double
// counting. What this catches is the same component emitting two events
// for the same (kind, yearFromStart), e.g. a recurring loop and a
// discrete push both landing on the same year.
export function checkNoDuplicateEvents(events: CashFlowEvent[]): SanityIssue[] {
  const seen = new Map<string, number>();
  for (const e of events) {
    const key = `${e.kind}@${e.yearFromStart}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([key]) => key);
  return duplicates.map((key) => ({ code: "DUPLICATE_EVENT", message: `Duplicate (kind@year) event key detected: ${key}.` }));
}

function isFiniteOrNull(value: number | null): boolean {
  return value == null || Number.isFinite(value);
}

export function checkGoalAnalysis(analysis: StructureGoalAnalysis): SanityIssue[] {
  const issues: SanityIssue[] = [];
  for (const [label, field] of [
    ["totalContributions", analysis.totalContributions],
    ["guaranteedPortion", analysis.guaranteedPortion],
    ["nonGuaranteedPortion", analysis.nonGuaranteedPortion],
    ["marketLinkedIllustrativePortion", analysis.marketLinkedIllustrativePortion],
    ["goalYearValue", analysis.goalYearValue],
    ["irrPercent", analysis.irrPercent],
  ] as const) {
    if (!isFiniteOrNull(field.value)) {
      issues.push({ code: "NON_FINITE_VALUE", message: `${label} is not finite (${field.value}) — a goal-year value can never be NaN/Infinity.` });
    }
  }
  // Guaranteed amounts must never be built from HISTORICAL/ILLUSTRATIVE/
  // ESTIMATED cash flows — structureAnalysis.ts's own `classify()`
  // already enforces this by construction (only VERIFIED/DERIVED feed
  // guaranteedPortion), but a provenance status outside that allowed set
  // slipping onto guaranteedPortion would be a real bug worth catching.
  if (analysis.guaranteedPortion.value != null && !["VERIFIED", "DERIVED"].includes(analysis.guaranteedPortion.provenance.status)) {
    issues.push({ code: "GUARANTEED_NOT_GUARANTEED_STATUS", message: `guaranteedPortion carries status ${analysis.guaranteedPortion.provenance.status}, which must never be presented as guaranteed.` });
  }
  return issues;
}

// Re-derives XIRR from the same signed cash flows a structure's own
// analysis used and confirms it reproduces NPV ~ 0 — a second,
// independent check beyond calculateXirr's own internal verification
// (Phase 3's own bug: a numerical-solver artifact must never survive to
// a report).
export function checkXirrReproducesNpv(signedFlows: { yearFromStart: number; amount: number }[], reportedIrrPercent: number | null): SanityIssue[] {
  if (reportedIrrPercent == null) return [];
  const rate = reportedIrrPercent / 100;
  const npv = signedFlows.reduce((sum, c) => sum + c.amount / Math.pow(1 + rate, c.yearFromStart), 0);
  const scale = signedFlows.reduce((sum, c) => sum + Math.abs(c.amount), 0) || 1;
  if (Math.abs(npv) / scale > 1e-3) {
    return [{ code: "IRR_DOES_NOT_ZERO_NPV", message: `Reported IRR ${reportedIrrPercent}% does not reproduce NPV ~ 0 for its own cash flows (relative residual ${(Math.abs(npv) / scale).toFixed(6)}).` }];
  }
  return [];
}

export function checkUlipChargeNeverIncreasesRate(grossRatePct: number, netRatePct: number): SanityIssue[] {
  if (netRatePct > grossRatePct) {
    return [{ code: "CHARGE_INCREASED_RATE", message: `Net rate (${netRatePct}%) exceeds the gross illustration rate (${grossRatePct}%) — a charge can only ever reduce the projected value, never increase it.` }];
  }
  return [];
}

// Convenience: does calculateXirr itself (Phase 3's fixed implementation)
// hold up against an arbitrary, adversarially-shaped cash-flow set —
// used by tests exercising the fix directly.
export function xirrVerifiedOrNull(cashFlows: { yearFromStart: number; amount: number }[]): number | null {
  return calculateXirr(cashFlows);
}
