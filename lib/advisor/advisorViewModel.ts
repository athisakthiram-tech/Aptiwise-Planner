// View-model helpers for the 4-screen Advisor MVP. Pure, React-free,
// deterministic — no financial calculation happens here beyond the
// already-tested lib/calculations/sip.ts SIP formula, applied only to
// components this module itself classifies as market-linked. A
// traditional component's value is NEVER recomputed at 6/8/10 — its
// figure always comes straight from the engine (or an advisor's own
// official-illustration override), unaffected by the rate toggle.

import { StrategyComponent } from "@/lib/planning/strategyTypes";
import { sipFutureValue } from "@/lib/calculations/sip";
import { calculateGoalCoverage, GoalCoverage } from "@/lib/calculations/goalCoverage";
import { GoalType } from "@/types";

// Screen 1's own goal picker adds "Other" — a display-only option with
// no dedicated GoalType/goalTag data of its own. It maps onto "wealth"
// (general-purpose accumulation products) purely for candidate search;
// every screen still shows the customer's literal choice via its own
// i18n key, never silently relabels "Other" as "Wealth" to the advisor.
export type AdvisorGoalOption = GoalType | "other";

export function toEngineGoalType(option: AdvisorGoalOption): GoalType {
  return option === "other" ? "wealth" : option;
}

// 6/8/10 only — deliberately narrower than
// lib/calculations/sip.ts's own ILLUSTRATION_RATES_PCT (which also
// carries a 12% scenario used elsewhere in the app); Screen 3's own
// spec asks for exactly these three toggle buttons.
export const ADVISOR_ILLUSTRATION_RATES_PCT = [6, 8, 10] as const;

// A component is "market-linked" for illustration purposes when it is
// either a real registered ULIP (market_linked_savings) or the Goal
// Orchestrator's own illustrative continued-savings fallback
// (illustrative_investment) — both are NAV/market-return-dependent and
// share the exact same "illustration only, not guaranteed" treatment.
export function isMarketLinkedComponent(component: StrategyComponent): boolean {
  return component.role === "market_linked_savings" || component.role === "illustrative_investment";
}

// Recomputes a market-linked component's illustrated value at a given
// rate using the SAME SIP formula the Goal Orchestrator already uses for
// its own illustrative fallback — reused, not reimplemented. Returns
// null (never a fabricated number) when the component's own monthly
// contribution isn't known.
export function marketLinkedIllustrationValue(
  component: StrategyComponent,
  horizonYears: number,
  ratePct: number
): number | null {
  if (!isMarketLinkedComponent(component)) return null;
  const monthly = component.monthlyPremium.value;
  if (monthly == null || monthly <= 0) return null;
  const years = component.illustration?.years ?? horizonYears;
  if (years <= 0) return null;
  return sipFutureValue(monthly, ratePct, years);
}

// A traditional (non-market-linked) component's own goal-relevant
// benefit — always its maturityBenefit exactly as the engine (or an
// advisor override) reports it. Never scaled by the illustration rate.
//
// Critical safety gate (mirrors the Goal Orchestrator's own
// combinedGoalResource() in goalStructureGenerator.ts): an engine can
// report a genuinely verified maturity value for a Basic Sum Assured
// whose PREMIUM it could not confirm at all (e.g. a single-premium
// product probed in a monthly-budget context) — counting that value
// here would claim the customer can afford a benefit whose cost is
// unknown. The maturity value only counts once its own premium is
// either genuinely verified or a direct, known customer choice
// ("not_applicable" — e.g. an annuity's Purchase Price); an
// "unavailable" premium excludes it, never silently treated as free.
export function traditionalGoalBenefit(component: StrategyComponent): number | null {
  if (isMarketLinkedComponent(component)) return null;
  const premiumKnownOrDirect = component.monthlyPremium.status === "verified" || component.monthlyPremium.status === "not_applicable";
  if (!premiumKnownOrDirect) return null;
  return component.maturityBenefit.value;
}

// The combined illustrated value across every component in a structure,
// at one chosen rate — null (never a partial guess) unless EVERY
// component's relevant figure is known, matching the same "never claim
// a false total" rule the Goal Orchestrator's own combinedGoalResource()
// already applies.
export function combinedIllustratedValue(
  components: readonly StrategyComponent[],
  horizonYears: number,
  ratePct: number
): number | null {
  let total = 0;
  for (const component of components) {
    const value = isMarketLinkedComponent(component)
      ? marketLinkedIllustrationValue(component, horizonYears, ratePct)
      : traditionalGoalBenefit(component);
    if (value == null) return null;
    total += value;
  }
  return total;
}

export function illustratedGoalCoverage(
  targetGoalAmount: number | null,
  combinedValue: number | null
): GoalCoverage | null {
  if (targetGoalAmount == null || targetGoalAmount <= 0 || combinedValue == null) return null;
  return calculateGoalCoverage(targetGoalAmount, combinedValue);
}

// Screen 2's plain-language role label — deliberately coarser than the
// Goal Orchestrator's own ProductRole vocabulary (GOAL_ACCUMULATION,
// MARKET_LINKED_ACCUMULATION, ...), which stays entirely internal.
export type AdvisorRoleLabelKind = "traditional" | "marketLinked" | "marketLinkedIllustrative" | "retirement" | "protection";

export function advisorRoleLabelKind(component: StrategyComponent): AdvisorRoleLabelKind {
  switch (component.role) {
    case "market_linked_savings":
      return "marketLinked";
    case "illustrative_investment":
      return "marketLinkedIllustrative";
    case "retirement_income":
      return "retirement";
    case "term_protection":
      return "protection";
    default:
      return "traditional";
  }
}

export function roleLabelI18nKey(kind: AdvisorRoleLabelKind): string {
  return `advisor.role.${kind}`;
}
