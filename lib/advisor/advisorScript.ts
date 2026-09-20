// Phase 4 — a small, deterministic, template-based advisor script.
// Every line is one of a fixed set of i18n-templated sentences filled in
// from the SAME AdvisorStructureView Screens 2/3/4 already render — no
// external LLM, no free-text generation, no separate calculation.

import { AdvisorComponentView, AdvisorGoalAnalysisView, AdvisorGoalOption, goalOptionI18nKey, roleLabelI18nKey } from "@/lib/advisor/combinationPlanModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export interface AdvisorScriptLine {
  key: string;
  text: string;
}

export interface BuildAdvisorScriptInput {
  customerName: string;
  goalOption: AdvisorGoalOption;
  goalAmount: number;
  yearsToGoal: number;
  monthlyTotal: number;
  components: AdvisorComponentView[];
  goalAnalysis: AdvisorGoalAnalysisView;
  locale: Locale;
}

export function buildAdvisorScript(input: BuildAdvisorScriptInput): AdvisorScriptLine[] {
  const { customerName, goalOption, goalAmount, yearsToGoal, monthlyTotal, components, goalAnalysis, locale } = input;
  const goalLabel = t(goalOptionI18nKey(goalOption), locale);
  const lines: AdvisorScriptLine[] = [];

  const openingKey = customerName.trim() ? "advisor.script.openingNamed" : "advisor.script.openingUnnamed";
  lines.push({
    key: "opening",
    text: t(openingKey, locale, {
      name: customerName.trim(),
      goal: goalLabel,
      goalAmount: formatINRCompact(goalAmount),
      years: yearsToGoal,
      monthly: formatINRCompact(monthlyTotal),
    }),
  });

  for (const component of components) {
    lines.push({
      key: `component-${component.planNumber}-${component.uin}`,
      text: t("advisor.script.component", locale, {
        product: component.productName,
        amount: formatINRCompact(component.monthlyPremium),
        role: t(roleLabelI18nKey(component.roleLabel), locale),
      }),
    });
  }

  const protectiveProducts = components.filter((c) => c.hasLifeProtection).map((c) => c.productName);
  if (protectiveProducts.length > 0) {
    lines.push({
      key: "protection",
      text: t("advisor.script.protection", locale, { description: protectiveProducts.join(", ") }),
    });
  }

  if (goalAnalysis.totalAtGoal != null && goalAnalysis.coveragePercent != null) {
    if (goalAnalysis.gapOrSurplus.kind === "SURPLUS" && goalAnalysis.gapOrSurplus.amount != null && goalAnalysis.gapOrSurplus.amount > 0) {
      lines.push({
        key: "goalCoverage",
        text: t("advisor.script.goalCoverageSurplus", locale, { goal: goalLabel, amount: formatINRCompact(goalAnalysis.gapOrSurplus.amount) }),
      });
    } else if (goalAnalysis.coveragePercent >= 100) {
      lines.push({ key: "goalCoverage", text: t("advisor.script.goalCoverageFull", locale, { goal: goalLabel }) });
    } else if (goalAnalysis.gapOrSurplus.amount != null) {
      lines.push({
        key: "goalCoverage",
        text: t("advisor.script.goalCoverageGap", locale, {
          goal: goalLabel,
          percent: goalAnalysis.coveragePercent,
          amount: formatINRCompact(goalAnalysis.gapOrSurplus.amount),
        }),
      });
    }
  }

  if (components.some((c) => c.marketLinked)) {
    lines.push({ key: "marketLinkedCaveat", text: t("advisor.script.marketLinkedCaveat", locale) });
  }

  return lines;
}
