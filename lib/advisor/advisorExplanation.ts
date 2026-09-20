// Screen 4's "How to explain this to customer" text — built from FIXED,
// deterministic sentence templates (i18n keys with numeric/string
// params), never free-text generation. Each part names an i18n key the
// UI resolves with t(); this module decides WHICH parts apply and in
// WHAT order, never the wording itself, so every sentence stays
// translatable and auditable.

import { StrategyComponent } from "@/lib/planning/strategyTypes";
import { GoalCoverage } from "@/lib/calculations/goalCoverage";
import { formatINRCompact } from "@/lib/calculations/format";
import { advisorRoleLabelKind, isMarketLinkedComponent } from "@/lib/advisor/advisorViewModel";

export interface AdvisorExplanationPart {
  key: string;
  params?: Record<string, string | number>;
}

export interface BuildAdvisorExplanationInput {
  goalLabel: string; // already-translated goal type label
  monthlyBudgetFormatted: string;
  yearsToGoal: number;
  components: { productLabel: string; amountFormatted: string; component: StrategyComponent }[];
  protectionAmountFormatted: string | null;
  illustratedCoverage: GoalCoverage | null; // null when not defensibly computable
}

export function buildAdvisorExplanationParts(input: BuildAdvisorExplanationInput): AdvisorExplanationPart[] {
  const parts: AdvisorExplanationPart[] = [];

  parts.push({
    key: "advisor.explain.opening",
    params: { monthly: input.monthlyBudgetFormatted, goal: input.goalLabel, years: input.yearsToGoal },
  });

  let anyMarketLinked = false;
  for (const { productLabel, amountFormatted, component } of input.components) {
    const kind = advisorRoleLabelKind(component);
    if (isMarketLinkedComponent(component)) anyMarketLinked = true;
    const templateKey =
      kind === "marketLinked"
        ? "advisor.explain.componentMarketLinked"
        : kind === "marketLinkedIllustrative"
          ? "advisor.explain.componentMarketLinkedIllustrative"
          : kind === "retirement"
            ? "advisor.explain.componentRetirement"
            : "advisor.explain.componentTraditional";
    parts.push({ key: templateKey, params: { amount: amountFormatted, product: productLabel } });
  }

  if (anyMarketLinked) {
    parts.push({ key: "advisor.explain.marketLinkedDisclaimer" });
  }

  if (input.protectionAmountFormatted != null) {
    parts.push({ key: "advisor.explain.protection", params: { amount: input.protectionAmountFormatted } });
  }

  if (input.illustratedCoverage == null) {
    parts.push({ key: "advisor.explain.gapUnknown" });
  } else if (input.illustratedCoverage.remainingGap > 0) {
    parts.push({ key: "advisor.explain.gap", params: { amount: formatINRCompact(input.illustratedCoverage.remainingGap) } });
  } else {
    parts.push({ key: "advisor.explain.surplus" });
  }

  return parts;
}
