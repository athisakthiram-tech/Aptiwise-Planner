// Need suitability (Sections 12/13). A single, centralized reasoning
// function driven entirely by a plan's own MECHANICS (cash-flow pattern,
// market risk, protection, income/liquidity shape) — never a per-product
// special case, and never keyed off a product's marketing name. Every
// planProfiles.ts entry calls this same function with its own factual
// mechanics; the reasoning text is generated here once, consistently.
//
// This produces a PLAN-LEVEL, goal-agnostic assessment ("does this
// product's cash-flow SHAPE typically suit this need"), independent of
// any one customer's exact horizon/capacity. registry.ts's
// analyzePlanForNeed() layers the specific customer's numbers on top of
// this (Section 13's worked example: "maturity near year 16" is a
// customer-specific check, done there, not here).

import { CashFlowPattern, NeedFit, NeedFitAssessment, NeedTag } from "@/lib/planning/planIntelligence/types";

export interface PlanMechanicsForNeedFit {
  cashFlowPattern: CashFlowPattern;
  marketRisk: "NONE" | "MARKET_LINKED";
  hasLifeProtection: boolean;
  isSinglePremium: boolean;
}

const LUMP_SUM_PATTERNS: CashFlowPattern[] = [
  "LUMP_SUM_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  "LEVEL_OUTFLOW_THEN_SCHEDULED_SURVIVAL_PAYMENTS",
];
const SCHEDULED_LIQUIDITY_PATTERNS: CashFlowPattern[] = ["LEVEL_OUTFLOW_THEN_SCHEDULED_SURVIVAL_PAYMENTS"];
const RECURRING_INCOME_PATTERNS: CashFlowPattern[] = [
  "LEVEL_OUTFLOW_THEN_DEFERRED_RECURRING_INCOME",
  "PURCHASE_PRICE_THEN_DEFERRED_RECURRING_ANNUITY",
  "PURCHASE_PRICE_THEN_IMMEDIATE_RECURRING_ANNUITY",
];

function fit(fitLevel: NeedFit, need: NeedTag, reasoning: string): NeedFitAssessment {
  return { need, fit: fitLevel, reasoning };
}

export function assessNeedFit(need: NeedTag, mechanics: PlanMechanicsForNeedFit): NeedFitAssessment {
  const { cashFlowPattern, marketRisk, hasLifeProtection } = mechanics;
  const producesLumpSum = LUMP_SUM_PATTERNS.includes(cashFlowPattern);
  const producesScheduledLiquidity = SCHEDULED_LIQUIDITY_PATTERNS.includes(cashFlowPattern);
  const producesRecurringIncome = RECURRING_INCOME_PATTERNS.includes(cashFlowPattern);
  const isMarketLinked = marketRisk === "MARKET_LINKED";

  switch (need) {
    case "CHILD_EDUCATION":
    case "CHILD_MARRIAGE":
      if (producesLumpSum) {
        return fit("STRONG_FIT", need, "Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.");
      }
      if (producesRecurringIncome) {
        return fit("WEAK_FIT", need, "Produces ongoing recurring income after a deferment point rather than a lump sum at the goal horizon — less directly useful for a one-time large expense.");
      }
      if (isMarketLinked) {
        return fit("POSSIBLE_FIT", need, "Can accumulate a lump sum by the horizon if the horizon is long enough to absorb market risk, but the payout amount is never guaranteed.");
      }
      return fit("WEAK_FIT", need, "Cash-flow mechanics do not clearly produce a lump sum at a chosen horizon.");

    case "RETIREMENT":
    case "LIFELONG_INCOME":
    case "REGULAR_INCOME":
      if (producesRecurringIncome) {
        return fit("STRONG_FIT", need, "Directly produces recurring income (deferred or immediate), matching the core requirement of a retirement/regular-income goal.");
      }
      if (producesLumpSum) {
        return fit("POSSIBLE_FIT", need, "Produces a lump sum that could fund retirement income only if separately annuitized or drawn down — not itself an income-generating mechanic.");
      }
      return fit("WEAK_FIT", need, "Cash-flow mechanics do not produce recurring income.");

    case "WEALTH_ACCUMULATION":
    case "MARKET_LINKED_GROWTH":
      if (isMarketLinked) {
        return fit("STRONG_FIT", need, "Market-linked accumulation directly targets growth, appropriate when the customer accepts market risk over a sufficient horizon.");
      }
      if (producesLumpSum) {
        return fit("POSSIBLE_FIT", need, "Produces a lump sum with guaranteed/participating growth, but without market participation the growth ceiling is lower than a market-linked vehicle.");
      }
      return fit("WEAK_FIT", need, "Cash-flow mechanics are not oriented toward accumulation/growth.");

    case "CAPITAL_PRESERVATION":
      if (!isMarketLinked && producesLumpSum) {
        return fit("STRONG_FIT", need, "Guaranteed/contractual maturity mechanics with no market exposure directly suit capital preservation.");
      }
      if (isMarketLinked) {
        return fit("WEAK_FIT", need, "Market-linked value can fall as well as rise — not oriented toward capital preservation.");
      }
      return fit("POSSIBLE_FIT", need, "Some contractual protection exists but the mechanics are not primarily preservation-oriented.");

    case "LONG_TERM_SAVINGS":
      if (producesLumpSum || producesRecurringIncome) {
        return fit("STRONG_FIT", need, "Level premiums over an extended Premium Paying Term building toward a maturity/income benefit is a direct long-term savings mechanic.");
      }
      return fit("POSSIBLE_FIT", need, "Mechanics can support long-term savings depending on the chosen configuration.");

    case "LEGACY":
      if (hasLifeProtection && !mechanics.isSinglePremium) {
        return fit("STRONG_FIT", need, "Ongoing life protection combined with a maturity/survival benefit supports a legacy/estate-planning use case.");
      }
      if (hasLifeProtection) {
        return fit("POSSIBLE_FIT", need, "Life protection exists, but a single-premium structure gives less flexibility for long-term legacy planning than a limited/regular-pay structure.");
      }
      return fit("WEAK_FIT", need, "No life protection mechanic — legacy/estate needs are not directly served.");

    case "HOME_GOAL":
      if (producesLumpSum) {
        return fit("POSSIBLE_FIT", need, "A lump-sum maturity benefit can contribute toward a home-purchase goal if the horizon aligns, though this is a general-purpose accumulation mechanic, not home-specific.");
      }
      return fit("WEAK_FIT", need, "Cash-flow mechanics do not produce a lump sum aligned to a purchase-style goal.");

    case "SCHEDULED_LIQUIDITY":
      if (producesScheduledLiquidity) {
        return fit("STRONG_FIT", need, "Pays scheduled survival benefits at fixed intervals before maturity — a direct match for a need requiring periodic access to funds.");
      }
      return fit("WEAK_FIT", need, "No scheduled interim payments — funds are only accessible at maturity/surrender.");
  }
}
