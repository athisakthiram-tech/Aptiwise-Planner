"use client";

// Screen 2 of 4 — Combinations. The most important screen: must be
// understandable in 5 seconds. Deliberately shows ONLY product, monthly
// amount, plain-language role, allocation and goal period — no engine
// capability, provenance, reason codes, confidence or technical status
// anywhere on this screen (that detail stays one tap away, reachable
// from Screen 3/4, never removed — just not shown here).

import { GoalStructure } from "@/lib/planning/goalOrchestrator/types";
import { StrategyComponent } from "@/lib/planning/strategyTypes";
import { advisorRoleLabelKind, roleLabelI18nKey } from "@/lib/advisor/advisorViewModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function componentLabel(component: StrategyComponent): string {
  return component.product ? component.product.productName.replace(/^LIC's /, "") : "—";
}

// Allocation is the relative split BETWEEN this structure's own
// components (never against the customer's full stated capacity) — a
// structure that doesn't use its full capacity still shows a clean
// 100%-of-itself split, matching the spec's own worked examples.
function allocationPercents(components: StrategyComponent[]): (number | null)[] {
  const amounts = components.map((c) => c.monthlyPremium.value);
  if (amounts.some((a) => a == null)) return components.map(() => null);
  const knownAmounts = amounts as number[];
  const total = knownAmounts.reduce((sum, a) => sum + a, 0);
  if (total <= 0) return components.map(() => null);
  return knownAmounts.map((a) => Math.round((a / total) * 100));
}

function OptionCard({
  structure,
  letter,
  yearsToGoal,
  locale,
  onViewIllustration,
}: {
  structure: GoalStructure;
  letter: string;
  yearsToGoal: number;
  locale: Locale;
  onViewIllustration: () => void;
}) {
  const components = structure.strategyResult.components;
  const percents = allocationPercents(components);

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
        {t("advisor.screen2.optionLabel", locale, { letter })}
      </p>

      <div className="flex flex-col gap-2">
        {components.map((component, i) => (
          <div key={i} className="flex flex-col gap-0.5 rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-semibold text-ink-900">{componentLabel(component)}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">{t(roleLabelI18nKey(advisorRoleLabelKind(component)), locale)}</span>
              <span className="font-semibold text-ink-900">
                {component.monthlyPremium.value != null ? `${formatINRCompact(component.monthlyPremium.value)}/mo` : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-ink-500">{t("advisor.screen2.allocation", locale)}: </span>
          <span className="font-semibold text-ink-900">
            {percents.every((p) => p != null) ? percents.map((p) => `${p}%`).join(" / ") : "—"}
          </span>
        </div>
        <div>
          <span className="text-ink-500">{t("advisor.screen2.goalPeriod", locale)}: </span>
          <span className="font-semibold text-ink-900">{yearsToGoal}y</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewIllustration}
        className="w-full rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
      >
        {t("advisor.screen2.viewIllustration", locale)}
      </button>
    </Card>
  );
}

export function ScreenCombinations({
  structures,
  yearsToGoal,
  locale,
  onViewIllustration,
  onBack,
}: {
  structures: GoalStructure[];
  yearsToGoal: number;
  locale: Locale;
  onViewIllustration: (structureId: string) => void;
  onBack: () => void;
}) {
  const letters = ["A", "B", "C"];

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-xs font-semibold text-brand-700">
        {t("advisor.screen2.back", locale)}
      </button>

      <div>
        <p className="text-base font-bold text-ink-900">{t("advisor.screen2.title", locale)}</p>
        <p className="text-xs text-ink-500">{t("advisor.screen2.subtitle", locale)}</p>
      </div>

      {structures.length > 0 ? (
        <div className="flex flex-col gap-3">
          {structures.map((structure, i) => (
            <OptionCard
              key={structure.id}
              structure={structure}
              letter={letters[i] ?? String(i + 1)}
              yearsToGoal={yearsToGoal}
              locale={locale}
              onViewIllustration={() => onViewIllustration(structure.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-500">{t("advisor.screen2.noOptions", locale)}</p>
      )}
    </div>
  );
}
