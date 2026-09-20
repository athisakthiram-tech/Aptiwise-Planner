// Cash-flow timeline: represents the customer's monthly planning
// capacity across the entire goal horizon, phase by phase, as each
// component's premium-paying term (PPT) completes. This is the
// mechanical core of "premium obligation completed -> capacity becomes
// available again" (never described as "LIC gives the premium back" —
// this module doesn't describe anything in English at all; it only
// produces numbers a UI layer localizes).
//
// Pure and side-effect-free: no engine call, no product knowledge, just
// arithmetic over already-known monthly premiums and PPTs.

export interface TimelineComponentInput {
  // The component's known monthly premium commitment. A component whose
  // premium is genuinely unknown must be excluded by the caller before
  // reaching this function — this module never treats "unknown" as 0.
  monthlyPremium: number;
  // null means "pays for the entire horizon" (no PPT shorter than the
  // goal horizon is known/configured for this component).
  premiumPayingTermYears: number | null;
}

export interface CashFlowPhase {
  fromYear: number; // 1-indexed, inclusive
  toYear: number; // 1-indexed, inclusive
  allocatedMonthly: number;
  freeMonthly: number;
}

export function buildCashFlowTimeline(params: {
  horizonYears: number;
  monthlyCapacity: number;
  components: TimelineComponentInput[];
}): CashFlowPhase[] {
  const { horizonYears, monthlyCapacity, components } = params;
  if (horizonYears <= 0) return [];

  // A phase boundary starts wherever some component's PPT completes
  // (that component's premium stops being due the following year) —
  // collecting every such boundary, plus the timeline's own start/end,
  // gives every year range where the allocated total is constant.
  const boundaries = new Set<number>([1, horizonYears + 1]);
  for (const component of components) {
    const ppt = component.premiumPayingTermYears;
    if (ppt != null && ppt > 0 && ppt < horizonYears) {
      boundaries.add(ppt + 1);
    }
  }

  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
  const phases: CashFlowPhase[] = [];

  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const fromYear = sortedBoundaries[i];
    const toYear = sortedBoundaries[i + 1] - 1;
    const allocatedMonthly = components.reduce((sum, component) => {
      const stillPaying = component.premiumPayingTermYears == null || fromYear <= component.premiumPayingTermYears;
      return sum + (stillPaying ? component.monthlyPremium : 0);
    }, 0);
    phases.push({
      fromYear,
      toYear,
      allocatedMonthly,
      freeMonthly: Math.max(0, monthlyCapacity - allocatedMonthly),
    });
  }

  return phases;
}

// Convenience for "how much capacity is free starting the year right
// after this component's PPT completes" — the number the orchestrator
// actually needs when deciding whether a second component is worth
// generating (Sections 9/13/14).
export function freeMonthlyCapacityAfterPpt(params: {
  horizonYears: number;
  monthlyCapacity: number;
  components: TimelineComponentInput[];
  afterYear: number;
}): number {
  const phases = buildCashFlowTimeline(params);
  const phase = phases.find((p) => params.afterYear >= p.fromYear && params.afterYear <= p.toYear);
  return phase ? phase.freeMonthly : params.monthlyCapacity;
}
