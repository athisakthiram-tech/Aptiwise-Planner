// Cash-flow model (Section 7) — central to future combination planning.
// Represents a product's customer-facing cash flow as a plain list of
// dated events, so a future combination engine can merge timelines from
// different product mechanics (lump-sum maturity, scheduled survival
// payments, deferred annuity income, ULIP fund accumulation) without
// needing to understand each product's own internal formula.

import { CashFlowEvent, CashFlowEventKind, CashFlowPattern } from "@/lib/planning/planIntelligence/types";
import { ProvenancedValue } from "@/lib/planning/planIntelligence/types";

export function cashFlowEvent(yearFromStart: number, kind: CashFlowEventKind, amount: ProvenancedValue): CashFlowEvent {
  return { yearFromStart, kind, amount };
}

// Builds the premium-outflow leg of a timeline — level for
// regular/limited pay, a single outflow at year 0 for single premium.
export function buildPremiumOutflowEvents(params: {
  premiumPerPeriod: ProvenancedValue;
  premiumPayingTermYears: number | null; // null => single premium (one outflow only)
}): CashFlowEvent[] {
  if (params.premiumPayingTermYears == null) {
    return [cashFlowEvent(0, "PREMIUM_OUTFLOW", params.premiumPerPeriod)];
  }
  const events: CashFlowEvent[] = [];
  for (let year = 0; year < params.premiumPayingTermYears; year++) {
    events.push(cashFlowEvent(year, "PREMIUM_OUTFLOW", params.premiumPerPeriod));
  }
  return events;
}

// A qualitative description of a pattern — used even before any specific
// premium/BSA has been priced, so "what does the money flow look like"
// is never blocked on an exact calculator (Section 22).
export function describeCashFlowPattern(pattern: CashFlowPattern): string {
  switch (pattern) {
    case "LUMP_SUM_OUTFLOW_THEN_LUMP_SUM_MATURITY":
      return "One premium paid at inception; one benefit paid at maturity (or on earlier death).";
    case "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY":
      return "Level premiums paid through the Premium Paying Term; a single maturity benefit paid at the end of the Policy Term.";
    case "LEVEL_OUTFLOW_THEN_SCHEDULED_SURVIVAL_PAYMENTS":
      return "Level premiums paid through the Premium Paying Term; a series of scheduled survival benefit payments during the Policy Term, plus a final maturity payment.";
    case "LEVEL_OUTFLOW_THEN_DEFERRED_RECURRING_INCOME":
      return "Level premiums paid through the Premium Paying Term; income/survival benefits begin after a defined point and continue on a recurring basis.";
    case "PURCHASE_PRICE_THEN_DEFERRED_RECURRING_ANNUITY":
      return "A single Purchase Price paid upfront; annuity income begins after a chosen deferment period and recurs thereafter.";
    case "PURCHASE_PRICE_THEN_IMMEDIATE_RECURRING_ANNUITY":
      return "A single Purchase Price paid upfront; annuity income begins immediately and recurs on the chosen frequency.";
    case "PREMIUM_MINUS_CHARGES_INTO_MARKET_LINKED_FUND":
      return "Premiums are paid, applicable charges are deducted, and the remainder is invested into unit-linked funds whose value depends on market performance.";
  }
}
