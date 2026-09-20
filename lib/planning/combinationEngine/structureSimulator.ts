// Stage 9 — Cash-Flow Simulation. Builds each component's own dated
// cash-flow events plus a PPT/released-capacity timeline for the whole
// structure.
//
// Phase 3 update: traditional-product benefit events now come from
// planIntelligence/benefitProjection.ts's projectBenefits() — a
// component-by-component guaranteed/participating breakdown, never the
// old "premium -> Basic Sum Assured only" shortcut — and a market-linked
// component's illustrative fund value is projected from the PRODUCT'S
// OWN official illustration rate (planProfiles.ts's ulip.officialIllustration,
// e.g. [4, 8] for LIC's current ULIP shelf) net of its own published Fund
// Management Charge, never a generic global rate, whenever that data is
// available; the previous generic-SIP fallback is kept only for a
// product this repository has not yet enriched with a real rate.

import { buildPremiumOutflowEvents, cashFlowEvent } from "@/lib/planning/planIntelligence/cashFlowModel";
import { CashFlowEvent, CashFlowEventKind } from "@/lib/planning/planIntelligence/types";
import { CandidateStructure, CashFlowPhase, StructureComponent } from "@/lib/planning/combinationEngine/types";
import { sipFutureValue, ILLUSTRATION_RATES_PCT } from "@/lib/calculations/sip";
import { projectBenefits } from "@/lib/planning/planIntelligence/benefitProjection";

// Fallback for a market-linked product this repository has not yet
// verified a product-specific official illustration rate for (Phase 3
// enriched all 4 of this catalogue's active ULIPs — see
// docs/lic-financial-knowledge-v2.md — so this path is now a safety net
// for a future/unenriched product, not the common case).
const GENERIC_PLANNING_SCENARIO_RATE_PCT = ILLUSTRATION_RATES_PCT[Math.floor(ILLUSTRATION_RATES_PCT.length / 2)];

// All 4 of this catalogue's active LIC ULIPs (Index Plus/873, Nivesh
// Plus/849, SIIP/752, Protection Plus/886) publish an identical 1.35%
// p.a. Fund Management Charge across every available fund (see each
// plan's own planProfiles.ts ulip.charges entry) — applied here as a
// drag on the assumed gross illustration rate, approximating LIC's own
// net-of-charge illustrated value without needing the full per-duration
// illustration table. Mortality charge is NOT deducted (a documented
// data gap — see docs/lic-financial-knowledge-v2.md).
const ULIP_FUND_MANAGEMENT_CHARGE_PCT = 1.35;

function benefitEventKind(type: string): CashFlowEventKind {
  switch (type) {
    case "SURVIVAL":
      return "SURVIVAL_BENEFIT";
    case "INCOME":
      return "INCOME_PAYMENT";
    default:
      return "MATURITY_BENEFIT";
  }
}

export function componentCashFlowEvents(component: StructureComponent, yearsToGoal: number, age: number): CashFlowEvent[] {
  const premiumMonthly = component.monthlyAllocation.value;
  if (premiumMonthly == null) return [];
  const ppt = component.premiumPayingTermYears ?? component.policyTermYears ?? yearsToGoal;
  const maturityYear = component.policyTermYears ?? yearsToGoal;

  const events = buildPremiumOutflowEvents({
    premiumPerPeriod: { value: premiumMonthly * 12, provenance: component.monthlyAllocation.provenance },
    premiumPayingTermYears: ppt,
  });

  const maturityDescriptor = component.benefitModel.find((b) => b.type === "MATURITY" || b.type === "MARKET_LINKED_FUND_VALUE");
  if (!maturityDescriptor) return events; // e.g. pure protection/annuity components with no accumulation leg modeled here

  if (component.marketLinked) {
    const rates = component.ulipOfficialIllustrationRatesPct;
    const grossRatePct = rates && rates.length > 0 ? Math.min(...rates) : GENERIC_PLANNING_SCENARIO_RATE_PCT;
    const netRatePct = rates && rates.length > 0 ? Math.max(0, grossRatePct - ULIP_FUND_MANAGEMENT_CHARGE_PCT) : grossRatePct;
    const projectedValue = sipFutureValue(premiumMonthly, netRatePct, ppt);
    const method =
      rates && rates.length > 0
        ? `Conservative planning scenario: this product's own lower official illustration rate (${grossRatePct}% p.a., of ${rates.join("%/")}% published) net of its published ${ULIP_FUND_MANAGEMENT_CHARGE_PCT}% p.a. Fund Management Charge = ${netRatePct.toFixed(2)}% p.a., applied via the standard SIP future-value formula over ${ppt} year(s) of contributions. Mortality charge is not deducted (a documented approximation). This is a PLANNING_SCENARIO, not this product's official illustration itself and never a promised/guaranteed return.`
        : `${GENERIC_PLANNING_SCENARIO_RATE_PCT}% generic Illustrative Growth Scenario applied via the standard SIP future-value formula over ${ppt} year(s) — this product's own official illustration rate is not yet verified in this repository, so a generic planning-scenario rate is used instead of a fabricated product-specific one.`;
    events.push(
      cashFlowEvent(maturityYear, "MATURITY_BENEFIT", {
        value: projectedValue,
        provenance: { status: "ILLUSTRATIVE", method, sourceReferences: [], estimationConfidence: rates && rates.length > 0 ? "MEDIUM" : "LOW" },
      })
    );
    return events;
  }

  if (component.basicSumAssured != null) {
    const projection = projectBenefits({
      planNumber: component.planNumber,
      uin: component.uin,
      age,
      policyTermYears: maturityYear,
      premiumPayingTermYears: component.premiumPayingTermYears,
      basicSumAssured: component.basicSumAssured,
    });

    for (const projected of projection.components) {
      const kind = benefitEventKind(projected.type);
      if (projected.recurring) {
        for (let year = projected.yearFromStart; year <= projected.recurring.untilYear; year++) {
          events.push(cashFlowEvent(year, kind, projected.amount));
        }
      } else {
        events.push(cashFlowEvent(projected.yearFromStart, kind, projected.amount));
      }
    }
  }

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

export function simulateStructure(structure: CandidateStructure, yearsToGoal: number, monthlyCapacity: number, age: number): CandidateStructure {
  const events = structure.components.flatMap((c) => componentCashFlowEvents(c, yearsToGoal, age));
  const timeline = buildTimeline(structure.components, monthlyCapacity, yearsToGoal);
  return { ...structure, events, timeline };
}
