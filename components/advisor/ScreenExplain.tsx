"use client";

// Screen 4 of 4 — What Advisor Says. The final useful output: a
// deterministic, template-based explanation (never free-text
// generation, see lib/advisor/advisorScript.ts) plus the EXISTING
// WhatsApp/PDF/Save-draft actions via CustomerPlanPreview — reused
// unchanged, never a second proposal system. "Create Plan" adapts the
// SAME selected AnalyzedStructure (via combinationPlanModel.ts's
// buildStrategyResultForSnapshot) into the pre-existing StrategyResult
// shape so every downstream number (CustomerPlan snapshot, WhatsApp,
// PDF) traces back to this one calculation, never recomputed.
//
// Customer-facing language avoids "death"/"mortality" — a policy's life
// cover is always "Family Protection".

import { useMemo, useState } from "react";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { GoalNeedResult } from "@/lib/planning/goalNeeds";
import { AdvisorGoalOption, AdvisorStructureView, buildStrategyResultForSnapshot, goalOptionI18nKey, roleLabelI18nKey } from "@/lib/advisor/combinationPlanModel";
import { buildAdvisorScript } from "@/lib/advisor/advisorScript";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { CustomerPlanPreview } from "@/components/customerPlan/CustomerPlanPreview";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function ScreenExplain({
  structure,
  goalOption,
  profile,
  protectionNeed,
  goalNeed,
  customerName,
  locale,
  onBack,
}: {
  structure: AdvisorStructureView;
  goalOption: AdvisorGoalOption;
  profile: CustomerFinancialProfile;
  protectionNeed: ProtectionNeedResult;
  goalNeed: GoalNeedResult;
  customerName: string;
  locale: Locale;
  onBack: () => void;
}) {
  const [plan, setPlan] = useState<CustomerPlan | null>(null);

  const rebuiltStrategy = useMemo(
    () => buildStrategyResultForSnapshot(structure.raw, profile.monthlyBudget ?? structure.monthlyTotal),
    [structure, profile.monthlyBudget]
  );

  const ga = structure.goalAnalysis;
  const protectiveComponents = structure.components.filter((c) => c.hasLifeProtection);

  const scriptLines = useMemo(
    () =>
      buildAdvisorScript({
        customerName,
        goalOption,
        goalAmount: ga.goalAmount,
        yearsToGoal: structure.yearsToGoal,
        monthlyTotal: structure.monthlyTotal,
        components: structure.components,
        goalAnalysis: ga,
        locale,
      }),
    [customerName, goalOption, ga, structure, locale]
  );

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

  const gapKey = ga.totalAtGoalFullyGuaranteed
    ? ga.gapOrSurplus.kind === "SURPLUS"
      ? "advisor.screen3.surplus"
      : "advisor.screen3.gap"
    : ga.gapOrSurplus.kind === "SURPLUS"
      ? "advisor.screen3.estimatedSurplus"
      : "advisor.screen3.estimatedGap";

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-xs font-semibold text-brand-700">
        {t("advisor.screen4.back", locale)}
      </button>

      <p className="text-base font-bold text-ink-900">{t("advisor.screen4.title", locale)}</p>

      <Card className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-ink-500">{t("advisor.screen4.customerGoal", locale)}</p>
        <p className="text-sm font-bold text-ink-900">{t(goalOptionI18nKey(goalOption), locale)}</p>
        <div className="flex justify-between text-xs text-ink-500">
          <span>{formatINRCompact(ga.goalAmount)}</span>
          <span>{structure.yearsToGoal}y</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-xs">
          <span className="font-semibold text-ink-700">{t("advisor.screen4.monthlyPlan", locale)}</span>
          <span className="font-bold text-ink-900">{formatINRCompact(structure.monthlyTotal)}/mo</span>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink-500">{t("advisor.screen4.products", locale)}</p>
        {structure.components.map((component) => (
          <div key={`${component.planNumber}-${component.uin}`} className="flex items-center justify-between text-xs">
            <span className="text-ink-900">
              {component.productName} <span className="text-ink-500">({t(roleLabelI18nKey(component.roleLabel), locale)})</span>
            </span>
            <span className="font-semibold text-ink-900">{formatINRCompact(component.monthlyPremium)}/mo</span>
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink-500">{t("advisor.screen4.whatYouPay", locale)}</p>
        {structure.allocations.map((allocation, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-ink-500">{structure.components[i]?.productName}</span>
            <span className="font-semibold text-ink-900">
              {formatINRCompact(allocation.amount)} ({allocation.percent}%)
            </span>
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink-500">{t("advisor.screen4.whatYouMayReceive", locale)}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-500">{t("advisor.screen3.planningValueAtGoal", locale)}</span>
          <span className="font-semibold text-ink-900">
            {ga.totalAtGoal != null ? `${ga.totalAtGoalFullyGuaranteed ? "" : "~"}${formatINRCompact(ga.totalAtGoal)}` : "—"}
          </span>
        </div>
      </Card>

      {protectiveComponents.length > 0 && (
        <Card className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-ink-500">{t("advisor.screen4.familyProtection", locale)}</p>
          {protectiveComponents.map((component) => (
            <p key={`${component.planNumber}-${component.uin}`} className="text-xs text-ink-700">
              {component.productName}
            </p>
          ))}
        </Card>
      )}

      <Card className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink-500">{t("advisor.screen4.goalProgress", locale)}</p>
        {ga.coveragePercent != null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500">{t("advisor.screen3.goalCoverage", locale)}</span>
            <span className="font-semibold text-ink-900">{ga.coveragePercent}%</span>
          </div>
        )}
        {ga.gapOrSurplus.kind !== "UNKNOWN" && ga.gapOrSurplus.amount != null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500">{t(gapKey, locale)}</span>
            <span className="font-semibold text-ink-900">{formatINRCompact(ga.gapOrSurplus.amount)}</span>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-sm font-bold text-ink-900">{t("advisor.screen4.explanationTitle", locale)}</p>
        <div className="flex flex-col gap-2 text-xs text-ink-700">
          {scriptLines.map((line) => (
            <p key={line.key}>{line.text}</p>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-ink-500">{t("advisor.screen4.importantNotes", locale)}</p>
        <p className="text-[11px] text-ink-500">{t("advisor.disclosure.text", locale)}</p>
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
