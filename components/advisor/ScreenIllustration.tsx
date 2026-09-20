"use client";

// Screen 3 of 4 — Illustration. The 6/8/10 toggle recomputes ONLY the
// market-linked component's own illustrated value (via the same SIP
// formula the Goal Orchestrator's own illustrative fallback already
// uses) — a traditional component's value never changes when the
// advisor taps a different rate, exactly per spec.

import { useState } from "react";
import { GoalStructure } from "@/lib/planning/goalOrchestrator/types";
import { StrategyComponent } from "@/lib/planning/strategyTypes";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import {
  ADVISOR_ILLUSTRATION_RATES_PCT,
  advisorRoleLabelKind,
  combinedIllustratedValue,
  illustratedGoalCoverage,
  isMarketLinkedComponent,
  marketLinkedIllustrationValue,
  roleLabelI18nKey,
  traditionalGoalBenefit,
} from "@/lib/advisor/advisorViewModel";
import { applyAdvisorIllustrationOverride, AdvisorIllustrationOverrideInput } from "@/lib/advisor/advisorIllustrationOverride";
import { OfficialIllustrationForm } from "@/components/advisor/OfficialIllustrationForm";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function componentLabel(component: StrategyComponent): string {
  return component.product ? component.product.productName.replace(/^LIC's /, "") : "—";
}

export function ScreenIllustration({
  structure,
  profile,
  locale,
  onBack,
  onContinue,
}: {
  structure: GoalStructure;
  profile: CustomerFinancialProfile;
  locale: Locale;
  onBack: () => void;
  onContinue: (effectiveComponents: StrategyComponent[], ratePct: number) => void;
}) {
  const [ratePct, setRatePct] = useState<number>(ADVISOR_ILLUSTRATION_RATES_PCT[1]);
  const [overrides, setOverrides] = useState<Record<number, AdvisorIllustrationOverrideInput>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const yearsToGoal = profile.yearsToGoal ?? 0;
  const baseComponents = structure.strategyResult.components;
  const effectiveComponents = baseComponents.map((c, i) => (overrides[i] ? applyAdvisorIllustrationOverride(c, overrides[i]) : c));

  const combined = combinedIllustratedValue(effectiveComponents, yearsToGoal, ratePct);
  const coverage = illustratedGoalCoverage(profile.targetGoalAmount, combined);

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-xs font-semibold text-brand-700">
        {t("advisor.screen3.back", locale)}
      </button>

      <Card className="flex flex-col gap-1">
        <p className="text-base font-bold text-ink-900">{t(`goals.type.${profile.goalType ?? "wealth"}`, locale)}</p>
        <div className="flex justify-between text-xs text-ink-500">
          <span>
            {t("advisor.screen3.goal", locale)}: {profile.targetGoalAmount != null ? formatINRCompact(profile.targetGoalAmount) : "—"}
          </span>
          <span>{yearsToGoal}y</span>
          <span>{profile.monthlyBudget != null ? `${formatINRCompact(profile.monthlyBudget)}/mo` : "—"}</span>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-bold text-ink-900">{t("advisor.screen3.planCombination", locale)}</p>
        {effectiveComponents.map((component, i) => {
          const marketLinked = isMarketLinkedComponent(component);
          const value = marketLinked
            ? marketLinkedIllustrationValue(component, yearsToGoal, ratePct)
            : traditionalGoalBenefit(component);
          const valueLabel = marketLinked
            ? t("advisor.screen3.marketLinkedIllustration", locale)
            : t("advisor.screen3.traditionalGoalBenefit", locale);

          return (
            <div key={i} className="flex flex-col gap-1.5 rounded-lg bg-slate-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink-900">{componentLabel(component)}</span>
                <span className="text-ink-500">
                  {component.monthlyPremium.value != null ? `${formatINRCompact(component.monthlyPremium.value)}/mo` : "—"}
                </span>
              </div>
              <p className="text-[11px] text-ink-500">{t(roleLabelI18nKey(advisorRoleLabelKind(component)), locale)}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-500">
                  {valueLabel}
                  {marketLinked ? ` (${t("advisor.screen3.scenarioLabel", locale, { rate: ratePct })})` : ""}
                </span>
                <span className="font-semibold text-ink-900">{value != null ? formatINRCompact(value) : t("advisor.screen3.unavailable", locale)}</span>
              </div>
              {value == null &&
                (editingIndex === i ? (
                  <OfficialIllustrationForm
                    locale={locale}
                    onCancel={() => setEditingIndex(null)}
                    onSave={(override) => {
                      setOverrides((prev) => ({ ...prev, [i]: override }));
                      setEditingIndex(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingIndex(i)}
                    className="self-start text-xs font-semibold text-brand-700"
                  >
                    {t("advisor.screen3.enterOfficialIllustration", locale)}
                  </button>
                ))}
            </div>
          );
        })}
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-bold text-ink-900">{t("advisor.screen3.illustrationTitle", locale)}</p>
        <div className="flex gap-2">
          {ADVISOR_ILLUSTRATION_RATES_PCT.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setRatePct(rate)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                ratePct === rate ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-900"
              }`}
            >
              {rate}%
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 rounded-lg bg-white p-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500">{t("advisor.screen3.combinedIllustratedValue", locale)}</span>
            <span className="font-semibold text-ink-900">{combined != null ? formatINRCompact(combined) : t("advisor.screen3.unavailable", locale)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500">{t("advisor.screen3.goal", locale)}</span>
            <span className="font-semibold text-ink-900">{profile.targetGoalAmount != null ? formatINRCompact(profile.targetGoalAmount) : "—"}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500">
              {coverage != null && coverage.remainingGap === 0
                ? t("advisor.screen3.illustratedSurplus", locale)
                : t("advisor.screen3.illustratedGap", locale)}
            </span>
            <span className="font-semibold text-ink-900">
              {coverage == null
                ? t("advisor.screen3.unavailable", locale)
                : coverage.remainingGap > 0
                  ? formatINRCompact(coverage.remainingGap)
                  : formatINRCompact(coverage.surplus)}
            </span>
          </div>
        </div>
      </Card>

      <button
        type="button"
        onClick={() => onContinue(effectiveComponents, ratePct)}
        className="w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
      >
        {t("advisor.screen3.continue", locale)}
      </button>
    </div>
  );
}
