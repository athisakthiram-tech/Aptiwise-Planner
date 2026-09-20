"use client";

// Screen 4 of 4 — What Advisor Says. The final useful output: a
// deterministic, template-based explanation (never free-text
// generation) plus the EXISTING WhatsApp/PDF/Save-draft actions via
// CustomerPlanPreview — reused unchanged, never a second proposal
// system.

import { useMemo, useState } from "react";
import { StrategyComponent } from "@/lib/planning/strategyTypes";
import { GoalStructure } from "@/lib/planning/goalOrchestrator/types";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { GoalNeedResult } from "@/lib/planning/goalNeeds";
import { rebuildStrategyResultWithComponents } from "@/lib/advisor/advisorPlanRebuild";
import {
  ADVISOR_ILLUSTRATION_RATES_PCT,
  advisorRoleLabelKind,
  combinedIllustratedValue,
  illustratedGoalCoverage,
  roleLabelI18nKey,
} from "@/lib/advisor/advisorViewModel";
import { buildAdvisorExplanationParts } from "@/lib/advisor/advisorExplanation";
import { getProtectionVisualData } from "@/lib/planning/resultsViewModel";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { CustomerPlanPreview } from "@/components/customerPlan/CustomerPlanPreview";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function componentLabel(component: StrategyComponent): string {
  return component.product ? component.product.productName.replace(/^LIC's /, "") : "—";
}

export function ScreenExplain({
  structure,
  effectiveComponents,
  selectedRatePct,
  profile,
  protectionNeed,
  goalNeed,
  customerName,
  locale,
  onBack,
}: {
  structure: GoalStructure;
  effectiveComponents: StrategyComponent[];
  selectedRatePct: number;
  profile: CustomerFinancialProfile;
  protectionNeed: ProtectionNeedResult;
  goalNeed: GoalNeedResult;
  customerName: string;
  locale: Locale;
  onBack: () => void;
}) {
  const [plan, setPlan] = useState<CustomerPlan | null>(null);

  const rebuiltStrategy = useMemo(
    () => rebuildStrategyResultWithComponents(structure, effectiveComponents, profile, protectionNeed),
    [structure, effectiveComponents, profile, protectionNeed]
  );

  const protectionVisual = getProtectionVisualData(rebuiltStrategy, protectionNeed);
  const yearsToGoal = profile.yearsToGoal ?? 0;

  const explanationParts = useMemo(() => {
    const goalLabel = t(`goals.type.${profile.goalType ?? "wealth"}`, locale);
    const illustratedCoverage = illustratedGoalCoverage(
      profile.targetGoalAmount,
      combinedIllustratedValue(effectiveComponents, yearsToGoal, selectedRatePct)
    );
    return buildAdvisorExplanationParts({
      goalLabel,
      monthlyBudgetFormatted: profile.monthlyBudget != null ? formatINRCompact(profile.monthlyBudget) : "—",
      yearsToGoal,
      components: effectiveComponents
        .filter((c) => c.monthlyPremium.value != null)
        .map((c) => ({ productLabel: componentLabel(c), amountFormatted: formatINRCompact(c.monthlyPremium.value as number), component: c })),
      protectionAmountFormatted: protectionVisual.providedByStructure != null ? formatINRCompact(protectionVisual.providedByStructure) : null,
      illustratedCoverage,
    });
  }, [profile, effectiveComponents, yearsToGoal, selectedRatePct, protectionVisual.providedByStructure, locale]);

  function handleCreatePlan() {
    try {
      const created = createCustomerPlan({
        customerProfile: profile,
        protectionNeed,
        goalNeed,
        selectedStrategy: rebuiltStrategy,
        locale,
        customer: { name: customerName },
      });
      setPlan(created);
    } catch {
      setPlan(null);
    }
  }

  if (plan) {
    return (
      <CustomerPlanPreview
        plan={plan}
        locale={locale}
        onBack={() => setPlan(null)}
        onPlanChange={setPlan}
        onViewDrafts={() => {}}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-xs font-semibold text-brand-700">
        {t("advisor.screen4.back", locale)}
      </button>

      <p className="text-base font-bold text-ink-900">{t("advisor.screen4.title", locale)}</p>

      <Card className="flex flex-col gap-1">
        <p className="text-sm font-bold text-ink-900">{t(`goals.type.${profile.goalType ?? "wealth"}`, locale)}</p>
        <div className="flex justify-between text-xs text-ink-500">
          <span>{profile.targetGoalAmount != null ? formatINRCompact(profile.targetGoalAmount) : "—"}</span>
          <span>{yearsToGoal}y</span>
          <span>{profile.monthlyBudget != null ? `${formatINRCompact(profile.monthlyBudget)}/mo` : "—"}</span>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink-500">{t("advisor.screen4.selectedProducts", locale)}</p>
        {effectiveComponents.map((component, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-ink-900">
              {componentLabel(component)} <span className="text-ink-500">({t(roleLabelI18nKey(advisorRoleLabelKind(component)), locale)})</span>
            </span>
            <span className="font-semibold text-ink-900">
              {component.monthlyPremium.value != null ? `${formatINRCompact(component.monthlyPremium.value)}/mo` : "—"}
            </span>
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink-500">{t("advisor.screen3.illustrationTitle", locale)}</p>
        {ADVISOR_ILLUSTRATION_RATES_PCT.map((rate) => {
          const value = combinedIllustratedValue(effectiveComponents, yearsToGoal, rate);
          return (
            <div key={rate} className="flex items-center justify-between text-xs">
              <span className="text-ink-500">{rate}%</span>
              <span className="font-semibold text-ink-900">{value != null ? formatINRCompact(value) : t("advisor.screen3.unavailable", locale)}</span>
            </div>
          );
        })}
      </Card>

      {protectionVisual.providedByStructure != null && (
        <Card className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-500">{t("advisor.screen4.protectionApplicable", locale)}</span>
          <span className="text-sm font-semibold text-ink-900">{formatINRCompact(protectionVisual.providedByStructure)}</span>
        </Card>
      )}

      <Card className="flex flex-col gap-2">
        <p className="text-sm font-bold text-ink-900">{t("advisor.screen4.explanationTitle", locale)}</p>
        <div className="flex flex-col gap-2 text-xs text-ink-700">
          {explanationParts.map((part, i) => (
            <p key={i}>{t(part.key, locale, part.params)}</p>
          ))}
        </div>
      </Card>

      <button
        type="button"
        onClick={handleCreatePlan}
        className="w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
      >
        {t("customerPlan.create", locale)}
      </button>
    </div>
  );
}
