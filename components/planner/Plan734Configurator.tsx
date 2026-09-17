"use client";

// Jeevan Tarun (Plan 734) derives its Premium Paying Term (20 - age) and
// Policy Term (25 - age) entirely from entry age — there is no term/PPT
// picker at all — and the customer instead chooses one of 4 Survival
// Benefit Options. That is a genuinely different shape from every other
// Stage 4D/4E plan, so it gets its own (still compact) component rather
// than being forced into StandardEndowmentConfigurator.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { comparePlanBudget } from "@/lib/insurance/budgetComparison";
import {
  PLAN_734_RULES,
  PLAN_734_UIN,
  Plan734SurvivalBenefitOption,
  derivedPolicyTermYears,
  derivedPremiumPayingTermYears,
} from "@/lib/insurance/providers/lic/plans/plan734";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const SUM_ASSURED_SLIDER_MAX = 5000000;

export function Plan734Configurator({
  product,
  goal,
  locale,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
}) {
  const [sumAssured, setSumAssured] = useState<number>(PLAN_734_RULES.minBasicSumAssured);
  const [option, setOption] = useState<Plan734SurvivalBenefitOption>("1");

  const eligibleAge = goal.age >= PLAN_734_RULES.minEntryAge && goal.age <= PLAN_734_RULES.maxEntryAge;

  if (!eligibleAge) {
    return (
      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        {t("lic.std.noValidTerm", locale, { plan: product.planNumber, age: goal.age })}
      </div>
    );
  }

  const premiumPayingTermYears = derivedPremiumPayingTermYears(goal.age);
  const policyTermYears = derivedPolicyTermYears(goal.age);

  const engine = getLicProductEngine("734", PLAN_734_UIN);
  const context = {
    age: goal.age,
    basicSumAssured: sumAssured,
    policyTermYears,
    premiumPayingTermYears,
    premiumMode: "yearly" as const,
    productSpecificInputs: { survivalBenefitOption: option },
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const premium = engine?.calculatePremium?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const liquidity = engine?.evaluateLiquidity?.(context);
  const budget = comparePlanBudget(goal.monthlyBudget, premium);

  const reasonCodes = eligibility?.reasonCodes ?? [];
  const sliderStep =
    sumAssured <= PLAN_734_RULES.sumAssuredBands[0].maxInclusive!
      ? PLAN_734_RULES.sumAssuredBands[0].multiple
      : sumAssured <= PLAN_734_RULES.sumAssuredBands[1].maxInclusive!
        ? PLAN_734_RULES.sumAssuredBands[1].multiple
        : PLAN_734_RULES.sumAssuredBands[2].multiple;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">{t("lic.std.configLabel", locale)}</p>
        <Slider
          label={t("lic.std.basicSumAssured", locale)}
          emoji="❤️"
          value={sumAssured}
          min={PLAN_734_RULES.minBasicSumAssured}
          max={SUM_ASSURED_SLIDER_MAX}
          step={sliderStep}
          displayValue={formatINRCompact(sumAssured)}
          onChange={setSumAssured}
          hint={t("lic.std.configHint", locale)}
        />
      </div>

      <p className="text-xs text-ink-500">
        {t("lic.std.pptFollowsTerm", locale, { ppt: premiumPayingTermYears })} ·{" "}
        {t("common.yearsValueShort", locale, { n: policyTermYears })}
      </p>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.std.survivalBenefitOption", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {(["1", "2", "3", "4"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setOption(opt)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                option === opt ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {t(`lic.std.option.${opt}`, locale)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500">✓ {t("common.eligibilityLabel", locale)}</p>
        <p className="text-amber-700">
          {eligibility?.eligible === true
            ? t("lic.std.eligibilityPass", locale, { plan: product.planNumber })
            : t("lic.std.eligibilityFail", locale, { plan: product.planNumber })}
        </p>
        {reasonCodes.map((rc, i) => (
          <p key={`${rc.code}-${i}`} className="mt-0.5 text-xs text-ink-500">
            {t(`lic.std.reason.${rc.code}`, locale, rc.params)}
          </p>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500">🧾 {t("common.premiumLabel", locale)}</p>
        {premium?.available && premium.premium != null ? (
          <>
            <p className="text-ink-900">
              {t("lic.std.verifiedPremium", locale, { amount: formatINRCompact(premium.premium) })}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              {t("lic.std.monthlyEquivalentNote", locale, {
                amount: formatINRCompact(premium.premium / 12),
              })}
            </p>
          </>
        ) : (
          <>
            <p className="text-amber-700">{t("lic.std.premiumUnavailable", locale)}</p>
            <p className="mt-0.5 text-xs text-ink-500">{t("lic.std.premiumUnavailableReason", locale)}</p>
          </>
        )}
      </div>

      {budget && (
        <div>
          <p className="text-xs font-semibold text-ink-500 mb-1">{t("lic.std.budgetComparison", locale)}</p>
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
                <span className="text-ink-500">{t("lic.std.premiumEquivalent", locale)}</span>
                <span className="font-medium text-ink-900">
                  {formatINRCompact(budget.monthlyEquivalent as number)}
                  {t("common.perMonthSuffix", locale)}
                </span>
              </div>
              <p className={`mt-2 font-semibold ${budget.withinBudget ? "text-brand-700" : "text-amber-700"}`}>
                {budget.withinBudget ? t("lic.std.withinBudget", locale) : t("lic.std.aboveBudget", locale)}
              </p>
              <p className="mt-1 text-xs text-ink-500">{t("lic.std.budgetNote", locale)}</p>
            </div>
          ) : (
            <p className="text-amber-700">{t("lic.std.budgetNotVerified", locale)}</p>
          )}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-1.5">❤️ {t("common.benefitsLabel", locale)}</p>
        <div className="rounded-lg bg-slate-50 p-3 text-sm flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-ink-500">❤️ {t("lic.std.basicSumAssured", locale)}</span>
            <span className="font-medium text-ink-900">{formatINRCompact(sumAssured)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">{t("lic.std.baseMaturityBenefit", locale)}</span>
            <span className="font-medium text-ink-900">
              {benefits?.available && benefits.maturityBenefit != null
                ? formatINRCompact(benefits.maturityBenefit)
                : t("common.notCalculated", locale)}
            </span>
          </div>
          {guaranteed?.survivalBenefitPerInstallment != null && (
            <div className="flex justify-between">
              <span className="text-ink-500">{t("lic.std.survivalBenefitPerInstallment", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(guaranteed.survivalBenefitPerInstallment)}
              </span>
            </div>
          )}
          {guaranteed?.sumAssuredOnDeath != null && (
            <div className="flex justify-between">
              <span className="text-ink-500">{t("lic.std.familyProtection", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(guaranteed.sumAssuredOnDeath)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-500">🎁 {t("common.bonusesLabel", locale)}</span>
            <span className="font-medium text-ink-900">{t("common.notIncluded", locale)}</span>
          </div>
          <p className="text-xs text-ink-500">{t("common.bonusDisclaimer", locale)}</p>
        </div>
      </div>

      {liquidity && (
        <div>
          <p className="text-xs font-semibold text-ink-500 mb-1">💧 {t("lic.std.liquidity", locale)}</p>
          <p className="text-xs text-ink-500">{t("lic.std.liquidityFacts", locale)}</p>
        </div>
      )}

      {guaranteed && (
        <Disclosure locale={locale} label={t("common.howCalculated", locale)}>
          {t("lic.std.calculationExplain", locale)}
        </Disclosure>
      )}
    </div>
  );
}
