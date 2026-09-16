"use client";

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { comparePlanBudget } from "@/lib/insurance/budgetComparison";
import { PLAN_736_RULES, PLAN_736_UIN } from "@/lib/insurance/providers/lic/plans/plan736";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

// UI convenience only — Plan 736 has no maximum Basic Sum Assured per the
// brochure ("No Limit"). This just bounds the slider; it is not a
// product rule.
const SUM_ASSURED_SLIDER_MAX = 2000000;

// Jeevan Labh only offers three fixed Policy Term / PPT pairs (16/10,
// 21/15, 25/16) — this filters those terms down to the ones this age is
// actually eligible for, it never invents an in-between term.
function validPolicyTerms(age: number): number[] {
  return Object.keys(PLAN_736_RULES.termPptPairs)
    .map(Number)
    .filter((term) => {
      const maxEntryAge = PLAN_736_RULES.maxEntryAgeByTerm[term];
      return age <= maxEntryAge && age + term <= PLAN_736_RULES.maxMaturityAge;
    });
}

export function Plan736Configurator({
  product,
  goal,
  locale,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
}) {
  const terms = validPolicyTerms(goal.age);
  const [sumAssured, setSumAssured] = useState<number>(PLAN_736_RULES.minBasicSumAssured);
  const [policyTermYears, setPolicyTermYears] = useState<number | undefined>(
    terms.includes(goal.yearsToGoal) ? goal.yearsToGoal : terms[0]
  );

  if (terms.length === 0) {
    return (
      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        {t("plan736.noValidTerm", locale, { age: goal.age })}
      </div>
    );
  }

  // Premium Paying Term always follows the chosen Policy Term — the
  // brochure only offers these as fixed pairs, so there is nothing for
  // the customer to pick independently here.
  const premiumPayingTermYears =
    policyTermYears != null ? PLAN_736_RULES.termPptPairs[policyTermYears] : undefined;

  const engine = getLicProductEngine("736", PLAN_736_UIN);
  const context = {
    age: goal.age,
    basicSumAssured: sumAssured,
    policyTermYears,
    premiumPayingTermYears,
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const premium = engine?.calculatePremium?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const liquidity = engine?.evaluateLiquidity?.(context);
  const budget = comparePlanBudget(goal.monthlyBudget, premium);

  const reasonCodes = eligibility?.reasonCodes ?? [];

  const sliderStep =
    sumAssured <= PLAN_736_RULES.sumAssuredIncrement.lowerBandMaxInclusive
      ? PLAN_736_RULES.sumAssuredIncrement.lowerBandMultiple
      : PLAN_736_RULES.sumAssuredIncrement.upperBandMultiple;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">{t("plan736.configLabel", locale)}</p>
        <Slider
          label={t("plan736.basicSumAssured", locale)}
          emoji="❤️"
          value={sumAssured}
          min={PLAN_736_RULES.minBasicSumAssured}
          max={SUM_ASSURED_SLIDER_MAX}
          step={sliderStep}
          displayValue={formatINRCompact(sumAssured)}
          onChange={setSumAssured}
          hint={t("plan736.configHint", locale)}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("plan736.policyTerm", locale)}</p>
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
        {premiumPayingTermYears != null && (
          <p className="mt-1.5 text-xs text-ink-500">
            {t("plan736.pptFollowsTerm", locale, { ppt: premiumPayingTermYears })}
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500">✓ {t("common.eligibilityLabel", locale)}</p>
        <p className="text-amber-700">
          {eligibility?.eligible === true
            ? t("plan736.eligibilityPass", locale)
            : t("plan736.eligibilityFail", locale)}
        </p>
        {reasonCodes.map((rc, i) => (
          <p key={`${rc.code}-${i}`} className="mt-0.5 text-xs text-ink-500">
            {t(`plan736.reason.${rc.code}`, locale, rc.params)}
          </p>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500">🧾 {t("common.premiumLabel", locale)}</p>
        {premium?.available && premium.premium != null ? (
          <>
            <p className="text-ink-900">
              {t("plan736.verifiedPremium", locale, {
                amount: formatINRCompact(premium.premium),
              })}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              {t("plan736.monthlyEquivalentNote", locale, {
                amount: formatINRCompact(premium.premium / 12),
              })}
            </p>
          </>
        ) : (
          <>
            <p className="text-amber-700">{t("plan736.premiumUnavailable", locale)}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {t("plan736.premiumUnavailableReason", locale)}
            </p>
          </>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-1">
          {t("plan736.budgetComparison", locale)}
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
              <span className="text-ink-500">{t("plan736.premiumEquivalent", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(budget.monthlyEquivalent as number)}
                {t("common.perMonthSuffix", locale)}
              </span>
            </div>
            <p className={`mt-2 font-semibold ${budget.withinBudget ? "text-brand-700" : "text-amber-700"}`}>
              {budget.withinBudget
                ? t("plan736.withinBudget", locale)
                : t("plan736.aboveBudget", locale)}
            </p>
            <p className="mt-1 text-xs text-ink-500">{t("plan736.budgetNote", locale)}</p>
          </div>
        ) : (
          <p className="text-amber-700">{t("plan736.budgetNotVerified", locale)}</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-1.5">
          ❤️ {t("common.benefitsLabel", locale)}
        </p>
        <div className="rounded-lg bg-slate-50 p-3 text-sm flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-ink-500">❤️ {t("plan736.basicSumAssured", locale)}</span>
            <span className="font-medium text-ink-900">{formatINRCompact(sumAssured)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">{t("plan736.baseMaturityBenefit", locale)}</span>
            <span className="font-medium text-ink-900">
              {benefits?.available && benefits.maturityBenefit != null
                ? formatINRCompact(benefits.maturityBenefit)
                : t("common.notCalculated", locale)}
            </span>
          </div>
          {guaranteed?.sumAssuredOnDeath != null ? (
            <div className="flex justify-between">
              <span className="text-ink-500">{t("plan736.familyProtection", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(guaranteed.sumAssuredOnDeath)}
              </span>
            </div>
          ) : guaranteed?.sumAssuredOnDeathMinimum != null ? (
            <p className="text-xs text-ink-500">
              {t("plan736.familyProtectionFloor", locale, {
                amount: formatINRCompact(guaranteed.sumAssuredOnDeathMinimum),
              })}
            </p>
          ) : null}
          <div className="flex justify-between">
            <span className="text-ink-500">🎁 {t("common.bonusesLabel", locale)}</span>
            <span className="font-medium text-ink-900">{t("common.notIncluded", locale)}</span>
          </div>
          <p className="text-xs text-ink-500">{t("common.bonusDisclaimer", locale)}</p>
        </div>
      </div>

      {liquidity && (
        <div>
          <p className="text-xs font-semibold text-ink-500 mb-1">💧 {t("plan736.liquidity", locale)}</p>
          <p className="text-xs text-ink-500">{t("plan736.liquidityFacts", locale)}</p>
        </div>
      )}

      {guaranteed && (
        <Disclosure locale={locale} label={t("common.howCalculated", locale)}>
          {t("plan736.calculationExplain", locale)}
        </Disclosure>
      )}
    </div>
  );
}
