"use client";

// Screen 2 of 4 — Combinations. The most important screen: each card
// must be understandable in 5-10 seconds. Consumes ONLY
// AdvisorStructureView[] from lib/advisor/combinationPlanModel.ts — the
// real Phase 2/3/3B engine output, already filtered to real LIC
// products with a usable premium (a broken/partial structure never
// reaches this component at all). Never invents a 3rd option, never
// forces a rounded 70/30 split, never labels a structure best/winner.

import { AdvisorComponentView, AdvisorStructureView, roleLabelI18nKey } from "@/lib/advisor/combinationPlanModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function ComponentRow({ component, locale }: { component: AdvisorComponentView; locale: Locale }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-900">{component.productName}</p>
        <span className="text-sm font-semibold text-ink-900">
          {formatINRCompact(component.monthlyPremium)}/mo
          {component.premiumIsEstimated && (
            <span className="ml-1 text-[10px] font-semibold text-amber-600">
              {t("advisor.screen2.estimated", locale)}
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 text-[11px] text-ink-500">
        <span>{t(roleLabelI18nKey(component.roleLabel), locale)}</span>
        <span className="text-ink-400">
          {t("advisor.screen2.planNumber", locale, { number: component.planNumber })}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-ink-500">
        {component.premiumPayingTermYears != null && (
          <span>{t("advisor.screen2.payFor", locale, { years: component.premiumPayingTermYears })}</span>
        )}
        {component.policyTermYears != null && (
          <span>{t("advisor.screen2.termYears", locale, { years: component.policyTermYears })}</span>
        )}
      </div>
    </div>
  );
}

function OptionCard({
  structure,
  locale,
  onViewIllustration,
}: {
  structure: AdvisorStructureView;
  locale: Locale;
  onViewIllustration: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
          {t("advisor.screen2.structureLabel", locale, { letter: structure.letter })}
        </p>
        <p className="text-sm font-bold text-ink-900">
          {t("advisor.screen2.monthlyPlan", locale)}: {formatINRCompact(structure.monthlyTotal)}/mo
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {structure.components.map((component) => (
          <ComponentRow key={`${component.planNumber}-${component.uin}`} component={component} locale={locale} />
        ))}
      </div>

      {structure.components.length > 1 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-500">{t("advisor.screen2.allocation", locale)}: </span>
          <span className="font-semibold text-ink-900">
            {structure.allocations.map((a) => `${formatINRCompact(a.amount)} (${a.percent}%)`).join(" / ")}
          </span>
        </div>
      )}

      {structure.characteristicI18nKey && (
        <p className="text-[11px] font-medium text-ink-500">{t(structure.characteristicI18nKey, locale)}</p>
      )}

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
  locale,
  onViewIllustration,
  onBack,
}: {
  structures: AdvisorStructureView[];
  locale: Locale;
  onViewIllustration: (structureId: string) => void;
  onBack: () => void;
}) {
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
          {structures.map((structure) => (
            <OptionCard
              key={structure.id}
              structure={structure}
              locale={locale}
              onViewIllustration={() => onViewIllustration(structure.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col gap-1 text-center">
          <p className="text-sm font-semibold text-ink-900">{t("advisor.screen2.noStructures", locale)}</p>
          <p className="text-xs text-ink-500">{t("advisor.screen2.noStructuresHint", locale)}</p>
        </Card>
      )}
    </div>
  );
}
