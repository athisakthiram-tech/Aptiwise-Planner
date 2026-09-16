"use client";

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getPlanEngineForProduct } from "@/lib/insurance/engineRegistry";
import { comparePlanBudget } from "@/lib/insurance/budgetComparison";
import { PLAN_733_RULES } from "@/lib/insurance/providers/lic/plans/plan733";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

// UI convenience only — Plan 733 has no maximum Basic Sum Assured per the
// brochure ("No Limit, subject to underwriting decision"). This just
// bounds the slider; it is not a product rule.
const SUM_ASSURED_SLIDER_MAX = 2000000;

function validPolicyTerms(age: number): number[] {
  const terms: number[] = [];
  for (let t = PLAN_733_RULES.minPolicyTermYears; t <= PLAN_733_RULES.maxPolicyTermYears; t++) {
    const maturityAge = age + t;
    if (maturityAge >= PLAN_733_RULES.minMaturityAge && maturityAge <= PLAN_733_RULES.maxMaturityAge) {
      terms.push(t);
    }
  }
  return terms;
}

export function Plan733Configurator({
  product,
  goal,
  locale,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
}) {
  const terms = validPolicyTerms(goal.age);
  const [sumAssured, setSumAssured] = useState<number>(PLAN_733_RULES.minBasicSumAssured);
  const [policyTermYears, setPolicyTermYears] = useState<number | undefined>(
    terms.includes(goal.yearsToGoal) ? goal.yearsToGoal : terms[0]
  );

  if (terms.length === 0) {
    return (
      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        {t("plan733.noValidTerm", locale, { age: goal.age })}
      </div>
    );
  }

  const engine = getPlanEngineForProduct(product);
  const calculatorInput = { age: goal.age, policyTermYears, sumAssured, product };
  const eligibility = engine.eligibility?.evaluateEligibility(calculatorInput);
  const premium = engine.premium?.calculatePremium(calculatorInput);
  const benefits = engine.benefit?.calculateBenefits(calculatorInput);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const budget = comparePlanBudget(goal.monthlyBudget, premium);

  const reasonCodes = eligibility?.reasonCodes ?? [];

  const sliderStep =
    sumAssured <= PLAN_733_RULES.sumAssuredIncrement.lowerBandMaxInclusive
      ? PLAN_733_RULES.sumAssuredIncrement.lowerBandMultiple
      : PLAN_733_RULES.sumAssuredIncrement.upperBandMultiple;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">{t("plan733.configLabel", locale)}</p>
        <Slider
          label={t("plan733.basicSumAssured", locale)}
          emoji="❤️"
          value={sumAssured}
          min={PLAN_733_RULES.minBasicSumAssured}
          max={SUM_ASSURED_SLIDER_MAX}
          step={sliderStep}
          displayValue={formatINRCompact(sumAssured)}
          onChange={setSumAssured}
          hint={t("plan733.configHint", locale)}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("plan733.policyTerm", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {terms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setPolicyTermYears(term)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                policyTermYears === term
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-ink-700"
              }`}
            >
              {t("common.yearsValueShort", locale, { n: term })}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500">✓ {t("common.eligibilityLabel", locale)}</p>
        <p className="text-amber-700">
          {eligibility?.eligible === true
            ? t("plan733.eligibilityPass", locale)
            : t("plan733.eligibilityFail", locale)}
        </p>
        {reasonCodes.map((rc, i) => (
          <p key={`${rc.code}-${i}`} className="mt-0.5 text-xs text-ink-500">
            {t(`plan733.reason.${rc.code}`, locale, rc.params)}
          </p>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500">🧾 {t("common.premiumLabel", locale)}</p>
        {premium?.available && premium.premium != null ? (
          <>
            <p className="text-ink-900">
              {t("plan733.verifiedPremium", locale, {
                amount: formatINRCompact(premium.premium),
              })}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              {t("plan733.monthlyEquivalentNote", locale, {
                amount: formatINRCompact(premium.premium / 12),
              })}
            </p>
          </>
        ) : (
          <>
            <p className="text-amber-700">{t("plan733.premiumUnavailable", locale)}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {t("plan733.premiumUnavailableReason", locale)}
            </p>
          </>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-1">
          {t("plan733.budgetComparison", locale)}
        </p>
        {budget.verified ? (
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">{t("common.yourBudget", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(budget.customerMonthlyBudget)}
                {t("common.perMonthSuffix", locale)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">{t("plan733.premiumEquivalent", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(budget.monthlyEquivalent as number)}
                {t("common.perMonthSuffix", locale)}
              </span>
            </div>
            <p className={`mt-2 font-semibold ${budget.withinBudget ? "text-brand-700" : "text-amber-700"}`}>
              {budget.withinBudget
                ? t("plan733.withinBudget", locale)
                : t("plan733.aboveBudget", locale)}
            </p>
            <p className="mt-1 text-xs text-ink-500">{t("plan733.budgetNote", locale)}</p>
          </div>
        ) : (
          <p className="text-amber-700">{t("plan733.budgetNotVerified", locale)}</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-1.5">
          ❤️ {t("common.benefitsLabel", locale)}
        </p>
        <div className="rounded-lg bg-slate-50 p-3 text-sm flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-ink-500">❤️ {t("plan733.basicSumAssured", locale)}</span>
            <span className="font-medium text-ink-900">{formatINRCompact(sumAssured)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">{t("plan733.baseMaturityBenefit", locale)}</span>
            <span className="font-medium text-ink-900">
              {benefits?.available && benefits.maturityBenefit != null
                ? formatINRCompact(benefits.maturityBenefit)
                : t("common.notCalculated", locale)}
            </span>
          </div>
          {guaranteed && (
            <p className="text-xs text-ink-500">
              {t("plan733.deathBenefitStructure", locale, {
                income: formatINRCompact(guaranteed.deathBenefitAnnualIncomePerYear),
                lumpsum: formatINRCompact(guaranteed.deathBenefitMaturityComponent),
              })}
            </p>
          )}
          <div className="flex justify-between">
            <span className="text-ink-500">🎁 {t("common.bonusesLabel", locale)}</span>
            <span className="font-medium text-ink-900">{t("common.notIncluded", locale)}</span>
          </div>
          <p className="text-xs text-ink-500">{t("common.bonusDisclaimer", locale)}</p>
        </div>
      </div>

      {guaranteed && (
        <Disclosure locale={locale} label={t("common.howCalculated", locale)}>
          {t("plan733.calculationExplain", locale)}
        </Disclosure>
      )}
    </div>
  );
}
