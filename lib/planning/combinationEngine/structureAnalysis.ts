// Stages 10-12 — Structure Analysis. Computes StructureGoalAnalysis:
// total contributions, guaranteed/non-guaranteed/market-linked
// portions, income before/after goal, goal-year value, gap/surplus, and
// IRR/XIRR — reusing Phase 1's own XIRR routine (never re-implemented)
// and NEVER double-counting a cash-flow event into more than one
// portion bucket.
//
// The guaranteed/non-guaranteed/market-linked split reads the only
// semantic tag a synthesized CashFlowEvent carries — its own
// `amount.provenance.status` (see structureSimulator.ts for how each
// event earns its status): VERIFIED/DERIVED amounts come from
// contractually-grounded mechanics (guaranteed), ESTIMATED amounts
// approximate a non-guaranteed/bonus-dependent benefit, and
// ILLUSTRATIVE amounts are market-linked planning scenarios that are
// never a promise.

import { CashFlowEvent, DataConfidence, ProvenancedValue } from "@/lib/planning/planIntelligence/types";
import { combineProvenance, weakestConfidence } from "@/lib/planning/planIntelligence/confidence";
import { analyzeReturn, calculateXirr } from "@/lib/planning/planIntelligence/returnAnalysis";
import { componentCashFlowEvents } from "@/lib/planning/combinationEngine/structureSimulator";
import { CandidateStructure, StructureGoalAnalysis } from "@/lib/planning/combinationEngine/types";

function sumEvents(events: CashFlowEvent[]): ProvenancedValue {
  if (events.length === 0) return { value: 0, provenance: { status: "VERIFIED", sourceReferences: [] } };
  const amounts = events.map((e) => e.amount);
  if (amounts.some((a) => a.value == null)) {
    return { value: null, provenance: combineProvenance(amounts) };
  }
  return { value: amounts.reduce((sum, a) => sum + (a.value as number), 0), provenance: combineProvenance(amounts) };
}

function classify(events: CashFlowEvent[], statuses: DataConfidence[]): CashFlowEvent[] {
  return events.filter((e) => statuses.includes(e.amount.provenance.status));
}

export function analyzeStructureGoal(structure: CandidateStructure, goalAmount: number, yearsToGoal: number): StructureGoalAnalysis {
  const outflowEvents = structure.events.filter((e) => e.kind === "PREMIUM_OUTFLOW");
  const inflowEvents = structure.events.filter((e) => e.kind !== "PREMIUM_OUTFLOW");

  const guaranteedEvents = classify(inflowEvents, ["VERIFIED", "DERIVED"]);
  const nonGuaranteedEvents = classify(inflowEvents, ["ESTIMATED"]);
  const marketLinkedEvents = classify(inflowEvents, ["ILLUSTRATIVE"]);

  const incomeBeforeGoal = inflowEvents.filter((e) => (e.kind === "INCOME_PAYMENT" || e.kind === "SURVIVAL_BENEFIT") && e.yearFromStart < yearsToGoal);
  const incomeAfterGoal = inflowEvents.filter((e) => (e.kind === "INCOME_PAYMENT" || e.kind === "SURVIVAL_BENEFIT") && e.yearFromStart >= yearsToGoal);
  const goalYearEvents = inflowEvents.filter((e) => e.yearFromStart === yearsToGoal);

  const totalContributions = sumEvents(outflowEvents);
  const guaranteedPortion = sumEvents(guaranteedEvents);
  const nonGuaranteedPortion = sumEvents(nonGuaranteedEvents);
  const marketLinkedIllustrativePortion = sumEvents(marketLinkedEvents);
  const incomeReceivedBeforeGoal = sumEvents(incomeBeforeGoal);
  const incomeReceivedAfterGoal = sumEvents(incomeAfterGoal);
  const goalYearValue = sumEvents(goalYearEvents);

  const goalCoveragePercent: ProvenancedValue =
    goalYearValue.value != null && goalAmount > 0
      ? { value: Math.round((goalYearValue.value / goalAmount) * 10000) / 100, provenance: goalYearValue.provenance }
      : { value: null, provenance: goalYearValue.provenance };

  const gapOrSurplus: StructureGoalAnalysis["gapOrSurplus"] =
    goalYearValue.value == null
      ? { kind: "UNKNOWN", amount: { value: null, provenance: goalYearValue.provenance } }
      : goalYearValue.value >= goalAmount
        ? { kind: "SURPLUS", amount: { value: goalYearValue.value - goalAmount, provenance: goalYearValue.provenance } }
        : { kind: "GAP", amount: { value: goalAmount - goalYearValue.value, provenance: goalYearValue.provenance } };

  let irrPercent: ProvenancedValue = { value: null, provenance: { status: "ESTIMATED", sourceReferences: [] } };
  const knownInflows = inflowEvents.filter((e) => e.amount.value != null);
  if (outflowEvents.length > 0 && knownInflows.length > 0) {
    const signedFlows = [
      ...outflowEvents.map((e) => ({ yearFromStart: e.yearFromStart, amount: -(e.amount.value ?? 0) })),
      ...knownInflows.map((e) => ({ yearFromStart: e.yearFromStart, amount: e.amount.value as number })),
    ];
    const irr = calculateXirr(signedFlows);
    if (irr != null) {
      irrPercent = {
        value: irr,
        provenance: { status: weakestConfidence(knownInflows.map((e) => e.amount.provenance.status)), method: "XIRR over the structure's dated premium outflows and benefit inflows", sourceReferences: [] },
      };
    }
  }

  const perComponentReturn = structure.components.map((c) => ({
    planNumber: c.planNumber,
    uin: c.uin,
    returnAnalysis: analyzeReturn(componentCashFlowEvents(c, yearsToGoal)),
  }));

  return {
    totalContributions,
    guaranteedPortion,
    nonGuaranteedPortion,
    marketLinkedIllustrativePortion,
    incomeReceivedBeforeGoal,
    incomeReceivedAfterGoal,
    goalYearValue,
    goalAmount,
    goalCoveragePercent,
    gapOrSurplus,
    irrPercent,
    perComponentReturn,
  };
}
