"use client";

import { useState } from "react";
import { GoalInput } from "@/types";
import { ILLUSTRATION_RATES_PCT } from "@/lib/calculations/sip";
import { formatINRCompact } from "@/lib/calculations/format";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getPlanEngineForProduct } from "@/lib/insurance/engineRegistry";
import {
  ComparisonValue,
  ProtectionAdjustedComparison,
  buildInvestmentScenarioComparison,
  buildPlan733Comparison,
} from "@/lib/comparison/protectionAdjustedComparison";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const PLAN_733_PRODUCT = LIC_CATALOGUE.find((p) => p.id === "lic-733")!;

function statusText(status: ComparisonValue["status"], locale: Locale): string {
  return t(`comparison.status.${status}`, locale);
}

function numericText(cv: ComparisonValue<number>, locale: Locale): string {
  return cv.value != null ? formatINRCompact(cv.value) : statusText(cv.status, locale);
}

function noteText(cv: ComparisonValue<unknown>, locale: Locale): string | null {
  return cv.noteCode ? t(`comparison.note.${cv.noteCode}`, locale) : null;
}

function Row({
  emoji,
  label,
  value,
  note,
}: {
  emoji: string;
  label: string;
  value: string;
  note?: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <span className="text-ink-500">
        {emoji} {label}
      </span>
      <span className="text-right">
        <span className="font-semibold text-ink-900">{value}</span>
        {note && <span className="block text-[11px] text-ink-500">{note}</span>}
      </span>
    </div>
  );
}

function ComparisonCard({
  emoji,
  comparison,
  locale,
}: {
  emoji: string;
  comparison: ProtectionAdjustedComparison;
  locale: Locale;
}) {
  const { goal, protection, tax, costs, risk, liquidity, guarantees } = comparison;
  const coverage = goal.coverage.value;

  return (
    <Card className="flex flex-col gap-1">
      <p className="text-sm font-bold text-ink-900">
        {emoji} {t(comparison.titleKey, locale)}
      </p>

      <div className="mt-1">
        <div className="mb-1 flex justify-between text-xs text-ink-500">
          <span>🎯 {t("comparison.goalCoverage", locale)}</span>
          <span className="font-semibold text-ink-900">
            {coverage ? `${coverage.coveragePercent}%` : statusText(goal.coverage.status, locale)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ width: `${coverage ? Math.min(100, Math.max(0, coverage.coveragePercent)) : 0}%` }}
          />
        </div>
        {coverage && (
          <p className="mt-1 text-[11px] text-ink-500">
            {coverage.remainingGap > 0
              ? `⚠️ ${t("comparison.remainingGoalGap", locale)}: ${formatINRCompact(coverage.remainingGap)}`
              : `✓ ${t("planBuilder.targetReached", locale)}`}
          </p>
        )}
        {noteText(goal.projectedValue, locale) && (
          <p className="mt-0.5 text-[11px] text-ink-500">{noteText(goal.projectedValue, locale)}</p>
        )}
      </div>

      <div className="mt-2 divide-y divide-slate-100 rounded-lg bg-slate-50 px-3">
        <Row
          emoji="🛡️"
          label={t(
            protection.hasBuiltInLifeProtection
              ? "comparison.familyProtection"
              : "comparison.builtInLifeProtection",
            locale
          )}
          value={numericText(protection.familyProtectionAmount, locale)}
          note={noteText(protection.familyProtectionAmount, locale)}
        />
        <Row
          emoji="🧾"
          label={t("comparison.premiumGst", locale)}
          value={statusText(tax.premiumGst.status, locale)}
          note={noteText(tax.premiumGst, locale)}
        />
        <Row
          emoji="🧾"
          label={t("comparison.maturityTaxTreatment", locale)}
          value={statusText(tax.maturityTaxTreatment.status, locale)}
          note={noteText(tax.maturityTaxTreatment, locale)}
        />
        <Row
          emoji="💳"
          label={t("comparison.expenseRatio", locale)}
          value={numericText(costs.expenseRatio, locale)}
          note={noteText(costs.expenseRatio, locale)}
        />
        <Row
          emoji="💳"
          label={t("comparison.exitLoad", locale)}
          value={numericText(costs.exitLoad, locale)}
          note={noteText(costs.exitLoad, locale)}
        />
        <Row
          emoji="📈"
          label={t("comparison.marketRisk", locale)}
          value={t(`comparison.riskLevel.${risk.riskLevel.value ?? "not_market_linked"}`, locale)}
        />
        <Row
          emoji="💧"
          label={t("comparison.liquidity", locale)}
          value={statusText(liquidity.status, locale)}
          note={noteText(liquidity, locale)}
        />
        <Row
          emoji="🔒"
          label={t("comparison.guaranteedValue", locale)}
          value={numericText(guarantees.guaranteedValue, locale)}
          note={noteText(guarantees.guaranteedValue, locale)}
        />
        <Row
          emoji="🎁"
          label={t("comparison.nonGuaranteedBenefit", locale)}
          value={numericText(guarantees.nonGuaranteedValue, locale)}
          note={noteText(guarantees.nonGuaranteedValue, locale)}
        />
      </div>
    </Card>
  );
}

export function StepFullPicture({ goal, locale }: { goal: GoalInput; locale: Locale }) {
  const [scenarioRate, setScenarioRate] = useState<number>(ILLUSTRATION_RATES_PCT[0]);

  // Age + term only — no Basic Sum Assured has been collected globally,
  // so this stays honestly "unavailable" rather than guessing one (see
  // Plan733Configurator, which has the same constraint).
  const plan733Engine = getPlanEngineForProduct(PLAN_733_PRODUCT);
  const benefits = plan733Engine.benefit?.calculateBenefits({
    age: goal.age,
    policyTermYears: goal.yearsToGoal,
    product: PLAN_733_PRODUCT,
  });

  const insuranceComparison = buildPlan733Comparison({
    targetAmount: goal.targetAmount,
    horizonYears: goal.yearsToGoal,
    product: PLAN_733_PRODUCT,
    benefits,
  });

  const investmentComparison = buildInvestmentScenarioComparison({
    targetAmount: goal.targetAmount,
    monthlyAmount: goal.monthlyBudget,
    years: goal.yearsToGoal,
    annualRatePct: scenarioRate,
  });

  const anyGap =
    (insuranceComparison.goal.coverage.value?.remainingGap ?? 0) > 0 ||
    (investmentComparison.goal.coverage.value?.remainingGap ?? 0) > 0;

  const midYear = Math.round(goal.yearsToGoal / 2);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">{t("fullPicture.title", locale)}</h2>
        <p className="text-sm text-ink-500 mt-1">{t("fullPicture.subtitle", locale)}</p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-ink-500">{t("goalGap.goalLabel", locale)}</p>
            <p className="text-lg font-extrabold text-ink-900">
              {formatINRCompact(goal.targetAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-ink-500">{t("summary.time", locale)}</p>
            <p className="text-lg font-extrabold text-ink-900">
              {t("common.yearsValue", locale, { n: goal.yearsToGoal })}
            </p>
          </div>
        </div>
      </Card>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("planBuilder.scenario", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {ILLUSTRATION_RATES_PCT.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setScenarioRate(rate)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                scenarioRate === rate ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {t("goalGap.illustration", locale, { rate })}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <ComparisonCard emoji="🏦" comparison={insuranceComparison} locale={locale} />
        <ComparisonCard emoji="📈" comparison={investmentComparison} locale={locale} />
      </div>

      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        ⚠️ {t("common.notGuaranteed", locale)}
      </div>

      <Card>
        <p className="text-sm font-semibold text-ink-700 mb-3">
          🛡️ {t("comparison.protectionDuringJourney", locale)}
        </p>
        <div className="flex items-center justify-between text-[11px] text-ink-500">
          <span>{t("comparison.timelineToday", locale)}</span>
          <span className="flex-1 border-t border-dashed border-slate-300 mx-2" />
          <span>{t("common.yearsValueShort", locale, { n: midYear })}</span>
          <span className="flex-1 border-t border-dashed border-slate-300 mx-2" />
          <span>{t("comparison.timelineGoalYear", locale)}</span>
        </div>
        <p className="mt-3 text-xs text-ink-500">{t("comparison.separateInsuranceNote", locale)}</p>
      </Card>

      {anyGap && (
        <div>
          <p className="text-sm font-semibold text-ink-700 mb-1">
            ⚠️ {t("comparison.remainingGoalGap", locale)}
          </p>
          <p className="text-xs text-ink-500 mb-2">{t("comparison.exploreGap", locale)}</p>
          <div className="flex flex-wrap gap-2 text-[11px] text-ink-500">
            <span className="rounded-full bg-slate-100 px-2.5 py-1">
              🏦 {t("comparison.option.additionalInsurance", locale)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1">
              📊 {t("comparison.option.marketLinkedInsurance", locale)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1">
              📈 {t("comparison.option.investmentStrategy", locale)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1">
              🛡️📈 {t("comparison.option.protectionPlusInvestment", locale)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
