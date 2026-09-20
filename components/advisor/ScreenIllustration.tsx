"use client";

// Screen 3 of 4 — Illustration. Shows exactly ONE selected structure in
// detail, built entirely from AdvisorStructureView (the Phase 2/3/3B
// engine's own output, adapted for display by
// lib/advisor/combinationPlanModel.ts) — no separate calculation
// happens in this component. Guaranteed/contractual figures are always
// shown separately from estimated participating figures and from
// illustrative market-linked figures; a gap/surplus is only ever called
// "guaranteed" when every rupee behind it is guaranteed.

import { useState } from "react";
import { AdvisorComponentView, AdvisorGoalOption, AdvisorStructureView, goalOptionI18nKey, roleLabelI18nKey } from "@/lib/advisor/combinationPlanModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function ComponentDetailsDrawer({ component, locale }: { component: AdvisorComponentView; locale: Locale }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={() => setOpen((o) => !o)} className="self-start text-[11px] font-semibold text-brand-700">
        {open ? "▾ " : "▸ "}
        {t("advisor.screen3.detailsToggle", locale)}
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 rounded-lg bg-white p-2 text-[11px] text-ink-500">
          <div className="flex justify-between">
            <span>{t("advisor.screen3.detailsPlanNumber", locale)}</span>
            <span className="font-semibold text-ink-700">{component.planNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>UIN</span>
            <span className="font-semibold text-ink-700">{component.uin}</span>
          </div>
          {component.premiumIsEstimated && <p>{t("advisor.screen3.detailsEstimatedNote", locale)}</p>}
          <p>{t("advisor.screen3.detailsSourceNote", locale)}</p>
        </div>
      )}
    </div>
  );
}

function TraditionalBenefitRows({ component, locale }: { component: AdvisorComponentView; locale: Locale }) {
  const guaranteed = component.guaranteedAtGoal ?? 0;
  const participating = component.participatingEstimateAtGoal ?? 0;
  const total = guaranteed + participating;
  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-ink-500">{t("advisor.screen3.guaranteedMaturity", locale)}</span>
        <span className="font-semibold text-ink-900">{formatINRCompact(guaranteed)}</span>
      </div>
      {participating > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-ink-500">{t("advisor.screen3.estimatedParticipating", locale)}</span>
            <span className="font-semibold text-ink-900">~{formatINRCompact(participating)}</span>
          </div>
          <p className="text-[10px] text-ink-400">{t("advisor.screen3.bonusNotGuaranteed", locale)}</p>
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-1">
        <span className="font-semibold text-ink-700">{t("advisor.screen3.planningMaturity", locale)}</span>
        <span className="font-bold text-ink-900">{participating > 0 ? "~" : ""}{formatINRCompact(total)}</span>
      </div>
    </div>
  );
}

function UlipBenefitRows({ component, locale }: { component: AdvisorComponentView; locale: Locale }) {
  const illus = component.ulipIllustration;
  if (!illus) return null;
  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-ink-500">{t("advisor.screen3.ulipPremium", locale)}</span>
        <span className="font-semibold text-ink-900">{formatINRCompact(component.monthlyPremium)}/mo</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ink-500">{t("advisor.screen3.ulipCharges", locale)}</span>
        <span className="font-semibold text-ink-900">{illus.fmcPercent}% p.a.</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ink-500">{t("advisor.screen3.ulipLowerScenario", locale, { rate: illus.lowerRatePct })}</span>
        <span className="font-semibold text-ink-900">{illus.lowerValue != null ? `~${formatINRCompact(illus.lowerValue)}` : "—"}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ink-500">{t("advisor.screen3.ulipHigherScenario", locale, { rate: illus.higherRatePct })}</span>
        <span className="font-semibold text-ink-900">{illus.higherValue != null ? `~${formatINRCompact(illus.higherValue)}` : "—"}</span>
      </div>
      <p className="text-[10px] text-ink-400">{t("advisor.screen3.notGuaranteedNote", locale)}</p>
    </div>
  );
}

function ComponentCard({ component, locale }: { component: AdvisorComponentView; locale: Locale }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">{component.productName}</p>
        <span className="text-xs font-semibold text-ink-900">
          {formatINRCompact(component.monthlyPremium)}/mo
          {component.premiumIsEstimated && <span className="ml-1 text-[10px] text-amber-600">{t("advisor.screen2.estimated", locale)}</span>}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-2 text-[11px] text-ink-500">
        <span>{t(roleLabelI18nKey(component.roleLabel), locale)}</span>
        {component.premiumPayingTermYears != null && <span>· {t("advisor.screen2.payFor", locale, { years: component.premiumPayingTermYears })}</span>}
        {component.policyTermYears != null && <span>· {t("advisor.screen2.termYears", locale, { years: component.policyTermYears })}</span>}
      </div>

      <p className="text-[11px] font-semibold text-ink-500">
        {component.marketLinked ? t("advisor.screen3.illustrationNotGuaranteed", locale) : t("advisor.screen3.guaranteedContractual", locale)}
      </p>

      {component.marketLinked ? <UlipBenefitRows component={component} locale={locale} /> : <TraditionalBenefitRows component={component} locale={locale} />}

      {component.protectionDescription && <p className="text-[11px] text-ink-500">🛡 {component.protectionDescription}</p>}

      <ComponentDetailsDrawer component={component} locale={locale} />
    </div>
  );
}

function GoalAnalysisCard({ structure, locale }: { structure: AdvisorStructureView; locale: Locale }) {
  const ga = structure.goalAnalysis;
  const gapKey = ga.totalAtGoalFullyGuaranteed
    ? ga.gapOrSurplus.kind === "SURPLUS"
      ? "advisor.screen3.surplus"
      : "advisor.screen3.gap"
    : ga.gapOrSurplus.kind === "SURPLUS"
      ? "advisor.screen3.estimatedSurplus"
      : "advisor.screen3.estimatedGap";

  return (
    <Card className="flex flex-col gap-2">
      <p className="text-sm font-bold text-ink-900">{t("advisor.screen3.goalAnalysisTitle", locale)}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-500">{t("advisor.screen3.goal", locale)}</span>
        <span className="font-semibold text-ink-900">{formatINRCompact(ga.goalAmount)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-500">{t("advisor.screen3.planningValueAtGoal", locale)}</span>
        <span className="font-semibold text-ink-900">
          {ga.totalAtGoal != null ? `${ga.totalAtGoalFullyGuaranteed ? "" : "~"}${formatINRCompact(ga.totalAtGoal)}` : "—"}
        </span>
      </div>
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
      {ga.incomeAfterGoal != null && ga.incomeAfterGoal > 0 && (
        <p className="text-[11px] text-ink-500">{t("advisor.screen3.incomeAfterGoal", locale, { amount: formatINRCompact(ga.incomeAfterGoal) })}</p>
      )}
    </Card>
  );
}

function TimelineCard({ structure, locale }: { structure: AdvisorStructureView; locale: Locale }) {
  const phases = structure.timeline;
  if (phases.length === 0) return null;
  const rows: { key: string; text: string }[] = [];
  rows.push({
    key: "start",
    text: t("advisor.screen3.timelineAgeAmount", locale, { age: phases[0].fromAge, amount: formatINRCompact(phases[0].allocatedMonthly) }),
  });
  for (let i = 1; i < phases.length; i++) {
    const prev = phases[i - 1];
    const curr = phases[i];
    if (curr.allocatedMonthly < prev.allocatedMonthly) {
      rows.push({
        key: `complete-${i}`,
        text: t("advisor.screen3.timelinePremiumCompletes", locale, { age: curr.fromAge, years: curr.fromYear }),
      });
    }
    if (curr.allocatedMonthly > 0) {
      rows.push({
        key: `amount-${i}`,
        text: t("advisor.screen3.timelineAgeAmount", locale, { age: curr.fromAge, amount: formatINRCompact(curr.allocatedMonthly) }),
      });
    }
  }
  const last = phases[phases.length - 1];
  rows.push({ key: "goal", text: t("advisor.screen3.timelineGoalYear", locale, { age: last.toAge }) });

  return (
    <Card className="flex flex-col gap-2">
      <p className="text-sm font-bold text-ink-900">{t("advisor.screen3.timelineTitle", locale)}</p>
      <div className="flex flex-col gap-1 text-xs text-ink-700">
        {rows.map((row) => (
          <p key={row.key}>• {row.text}</p>
        ))}
      </div>
    </Card>
  );
}

export function ScreenIllustration({
  structure,
  goalOption,
  monthlyBudget,
  locale,
  onBack,
  onContinue,
}: {
  structure: AdvisorStructureView;
  goalOption: AdvisorGoalOption;
  monthlyBudget: number | null;
  locale: Locale;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-xs font-semibold text-brand-700">
        {t("advisor.screen3.back", locale)}
      </button>

      <p className="text-base font-bold text-ink-900">{t("advisor.screen3.title", locale)}</p>

      <Card className="flex flex-col gap-1">
        <p className="text-sm font-bold text-ink-900">{t(goalOptionI18nKey(goalOption), locale)}</p>
        <div className="flex justify-between text-xs text-ink-500">
          <span>
            {t("advisor.screen3.goal", locale)}: {formatINRCompact(structure.goalAnalysis.goalAmount)}
          </span>
          <span>{structure.yearsToGoal}y</span>
          <span>{monthlyBudget != null ? `${formatINRCompact(monthlyBudget)}/mo` : "—"}</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-xs">
          <span className="font-semibold text-ink-700">{t("advisor.screen3.planningStructure", locale)}</span>
          <span className="font-bold text-ink-900">{formatINRCompact(structure.monthlyTotal)}/mo</span>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-bold text-ink-900">{t("advisor.screen3.componentDetails", locale)}</p>
        {structure.components.map((component) => (
          <ComponentCard key={`${component.planNumber}-${component.uin}`} component={component} locale={locale} />
        ))}
      </Card>

      <GoalAnalysisCard structure={structure} locale={locale} />
      <TimelineCard structure={structure} locale={locale} />

      <button
        type="button"
        onClick={onContinue}
        className="w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
      >
        {t("advisor.screen3.continue", locale)}
      </button>
    </div>
  );
}
