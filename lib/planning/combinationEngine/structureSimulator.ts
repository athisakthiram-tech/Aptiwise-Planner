// Stage 9 — Cash-Flow Simulation. Builds each component's own dated
// cash-flow events (reusing Phase 1's cashFlowModel.ts building blocks,
// never re-deriving them) plus a PPT/released-capacity timeline for the
// whole structure.
//
// Guaranteed/non-guaranteed/market-linked/estimated status is carried on
// every synthesized event via this layer's own DataConfidence
// vocabulary (see confidence.ts): a maturity value approximated from a
// GUARANTEED-character benefit is tagged DERIVED (mathematically read
// off a verified/estimated Basic Sum Assured, but not itself a
// registered engine's own confirmed benefit illustration); a
// market-linked component's projected value is tagged ILLUSTRATIVE
// (never a promise); bonus/non-guaranteed additions are NOT fabricated
// here at all — their absence is a documented data gap (see planner.ts).

import { buildPremiumOutflowEvents, cashFlowEvent } from "@/lib/planning/planIntelligence/cashFlowModel";
import { CashFlowEvent, DataConfidence } from "@/lib/planning/planIntelligence/types";
import { CandidateStructure, CashFlowPhase, StructureComponent } from "@/lib/planning/combinationEngine/types";
import { sipFutureValue, ILLUSTRATION_RATES_PCT } from "@/lib/calculations/sip";

// A market-linked (ULIP) component has no fixed Basic Sum Assured to
// treat as a maturity-value stand-in (its accumulation is a formula of
// the premium actually paid, per productNature). None of this
// catalogue's registered ULIP profiles currently carry a verified,
// product-specific official illustration rate (ulipModel.ts's
// officialIllustration is null for all of them today) — rather than
// leaving the component's goal-year contribution silently absent (which
// would starve every mixed-with-a-ULIP structure's cash-flow analysis
// of its single largest inflow and produce a degenerate IRR), this
// reuses the SAME generic SIP illustration rate already used
// product-wide for market-linked planning scenarios (lib/calculations/
// sip.ts, also used by the advisor 4-screen MVP), clearly tagged
// ILLUSTRATIVE and never presented as this product's own official
// illustration. This is a documented data gap, not a fabricated
// product-specific figure — see planner.ts's DATA GAPS reporting.
const ULIP_PLANNING_SCENARIO_RATE_PCT = ILLUSTRATION_RATES_PCT[Math.floor(ILLUSTRATION_RATES_PCT.length / 2)];

export function componentCashFlowEvents(component: StructureComponent, yearsToGoal: number): CashFlowEvent[] {
  const premiumMonthly = component.monthlyAllocation.value;
  if (premiumMonthly == null) return [];
  const ppt = component.premiumPayingTermYears ?? component.policyTermYears ?? yearsToGoal;

  const events = buildPremiumOutflowEvents({
    premiumPerPeriod: { value: premiumMonthly * 12, provenance: component.monthlyAllocation.provenance },
    premiumPayingTermYears: ppt,
  });

  const maturityYear = component.policyTermYears ?? yearsToGoal;
  const maturityDescriptor = component.benefitModel.find((b) => b.type === "MATURITY" || b.type === "MARKET_LINKED_FUND_VALUE");

  if (maturityDescriptor && component.marketLinked) {
    // Fund value is a formula of premiums actually paid, not of a fixed
    // Basic Sum Assured — projected via the generic SIP illustration
    // formula at a single planning-scenario rate (see module header).
    const projectedValue = sipFutureValue(premiumMonthly, ULIP_PLANNING_SCENARIO_RATE_PCT, ppt);
    events.push(
      cashFlowEvent(maturityYear, "MATURITY_BENEFIT", {
        value: projectedValue,
        provenance: {
          status: "ILLUSTRATIVE",
          method: `${ULIP_PLANNING_SCENARIO_RATE_PCT}% Illustrative Growth Scenario applied via the standard SIP future-value formula over ${ppt} year(s) of contributions — this product's own official illustration rate is not yet verified in this repository, so a generic planning-scenario rate is used instead of a fabricated product-specific one`,
          sourceReferences: [],
        },
      })
    );
  } else if (maturityDescriptor && component.basicSumAssured != null) {
    const status: DataConfidence = maturityDescriptor.character === "GUARANTEED" ? "DERIVED" : "ESTIMATED";
    events.push(
      cashFlowEvent(maturityYear, "MATURITY_BENEFIT", {
        value: component.basicSumAssured,
        provenance: {
          status,
          method: "planning estimate: assumes maturity value approximates the configured Basic Sum Assured — bonuses/additions are a documented data gap in this phase, not fabricated here",
          sourceReferences: [],
        },
      })
    );
  }

  // Income/survival-benefit products (money-back, whole-life income,
  // pension/annuity) genuinely have a scheduled payout structure this
  // phase does not model with exact per-interval amounts — surfaced as
  // a data gap rather than guessed at (see planner.ts's dataGaps list).

  return events;
}

// Reports how much of the structure's own combined premium is still
// being paid, and how much monthly capacity a completed PPT has freed,
// in each phase between now and the goal year — never re-invested
// automatically (Phase 2 only MODELS the release; it doesn't assume
// where freed capacity goes), and never described as a payout.
export function buildTimeline(components: StructureComponent[], monthlyCapacity: number, yearsToGoal: number): CashFlowPhase[] {
  const boundaries = new Set<number>([0, yearsToGoal]);
  for (const c of components) {
    const ppt = c.premiumPayingTermYears ?? c.policyTermYears ?? yearsToGoal;
    if (ppt > 0 && ppt < yearsToGoal) boundaries.add(ppt);
  }
  const sortedBoundaries = [...boundaries].sort((a, b) => a - b);

  const phases: CashFlowPhase[] = [];
  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const fromYear = sortedBoundaries[i];
    const toYear = sortedBoundaries[i + 1];
    const allocatedMonthly = components
      .filter((c) => (c.premiumPayingTermYears ?? c.policyTermYears ?? yearsToGoal) > fromYear)
      .reduce((sum, c) => sum + (c.monthlyAllocation.value ?? 0), 0);
    phases.push({ fromYear, toYear, allocatedMonthly, freeMonthly: Math.max(0, monthlyCapacity - allocatedMonthly) });
  }
  return phases;
}

export function simulateStructure(structure: CandidateStructure, yearsToGoal: number, monthlyCapacity: number): CandidateStructure {
  const events = structure.components.flatMap((c) => componentCashFlowEvents(c, yearsToGoal));
  const timeline = buildTimeline(structure.components, monthlyCapacity, yearsToGoal);
  return { ...structure, events, timeline };
}
