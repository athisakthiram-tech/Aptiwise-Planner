"use client";

// Amritbaal (Plan 774) toggles between Single and Limited premium
// payment, and that choice changes the valid term range, the Premium
// Paying Term choices and the available Sum-Assured-on-Death Options all
// at once — a genuinely different shape from the other 4 Stage 4D plans,
// so it gets its own (still compact) component rather than being forced
// into StandardEndowmentConfigurator.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { comparePlanBudget } from "@/lib/insurance/budgetComparison";
import { PLAN_774_RULES, PLAN_774_UIN, Plan774DeathBenefitOption } from "@/lib/insurance/providers/lic/plans/plan774";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const SUM_ASSURED_SLIDER_MAX = 5000000;

function validPolicyTerms(age: number, single: boolean): number[] {
  const { minPolicyTermYears, maxPolicyTermYears } = single
    ? PLAN_774_RULES.singlePremium
    : PLAN_774_RULES.limitedPremium;
  const terms: number[] = [];
  for (let term = minPolicyTermYears; term <= maxPolicyTermYears; term++) {
    const maturityAge = age + term;
    if (maturityAge >= PLAN_774_RULES.minMaturityAge && maturityAge <= PLAN_774_RULES.maxMaturityAge) {
      terms.push(term);
    }
  }
  return terms;
}

export function Plan774Configurator({
  product,
  goal,
  locale,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
}) {
  const [single, setSingle] = useState(false);
  const [sumAssured, setSumAssured] = useState<number>(PLAN_774_RULES.minBasicSumAssured);
  const [ppt, setPpt] = useState<number>(PLAN_774_RULES.limitedPremium.pptOptions[0]);
  const [policyTermYears, setPolicyTermYears] = useState<number | undefined>(undefined);
  const [option, setOption] = useState<Plan774DeathBenefitOption>("I");

  const terms = validPolicyTerms(goal.age, single);
  const activeTerm =
    policyTermYears != null && terms.includes(policyTermYears)
      ? policyTermYears
      : terms.includes(goal.yearsToGoal)
        ? goal.yearsToGoal
        : terms[0];
  const availableOptions: Plan774DeathBenefitOption[] = single ? ["III", "IV"] : ["I", "II"];
  const activeOption = availableOptions.includes(option) ? option : availableOptions[0];

  if (terms.length === 0) {
    return (
      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        {t("lic.std.noValidTerm", locale, { plan: product.planNumber, age: goal.age })}
      </div>
    );
  }

  const engine = getLicProductEngine("774", PLAN_774_UIN);
  const context = {
    age: goal.age,
    basicSumAssured: sumAssured,
    policyTermYears: activeTerm,
    premiumPayingTermYears: single ? undefined : ppt,
    premiumMode: single ? ("single" as const) : ("yearly" as const),
    productSpecificInputs: { deathBenefitOption: activeOption },
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const premium = engine?.calculatePremium?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const liquidity = engine?.evaluateLiquidity?.(context);
  const budget = !single ? comparePlanBudget(goal.monthlyBudget, premium) : undefined;

  const reasonCodes = eligibility?.reasonCodes ?? [];
  const sliderStep =
    sumAssured <= PLAN_774_RULES.sumAssuredBands[0].maxInclusive!
      ? PLAN_774_RULES.sumAssuredBands[0].multiple
      : PLAN_774_RULES.sumAssuredBands[1].multiple;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic774.premiumPaymentMode", locale)}</p>
        <div className="flex gap-2">
          {(["limited", "single"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSingle(mode === "single")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                (mode === "single") === single ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {t(`lic774.mode.${mode}`, locale)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">{t("lic.std.configLabel", locale)}</p>
        <Slider
          label={t("lic.std.basicSumAssured", locale)}
          emoji="❤️"
          value={sumAssured}
          min={PLAN_774_RULES.minBasicSumAssured}
          max={SUM_ASSURED_SLIDER_MAX}
          step={sliderStep}
          displayValue={formatINRCompact(sumAssured)}
          onChange={setSumAssured}
          hint={t("lic.std.configHint", locale)}
        />
      </div>

      {!single && (
        <div>
          <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.std.premiumPayingTerm", locale)}</p>
          <div className="flex flex-wrap gap-2">
            {PLAN_774_RULES.limitedPremium.pptOptions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPpt(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  ppt === p ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
                }`}
              >
                {t("common.yearsValueShort", locale, { n: p })}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.std.policyTerm", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {terms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setPolicyTermYears(term)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                activeTerm === term ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {t("common.yearsValueShort", locale, { n: term })}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.std.deathBenefitOption", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {availableOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setOption(opt)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                activeOption === opt ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
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
              {single
                ? t("lic.std.verifiedSinglePremium", locale, { amount: formatINRCompact(premium.premium) })
                : t("lic.std.verifiedPremium", locale, { amount: formatINRCompact(premium.premium) })}
            </p>
            {!single && (
              <p className="mt-0.5 text-xs text-ink-500">
                {t("lic.std.monthlyEquivalentNote", locale, {
                  amount: formatINRCompact(premium.premium / 12),
                })}
              </p>
            )}
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
          {guaranteed?.guaranteedAdditionAtMaturity != null && (
            <p className="text-xs text-ink-500">
              {t("lic.std.guaranteedAdditionNote", locale, {
                amount: formatINRCompact(guaranteed.guaranteedAdditionAtMaturity),
              })}
            </p>
          )}
          {guaranteed?.sumAssuredOnDeath != null ? (
            <div className="flex justify-between">
              <span className="text-ink-500">{t("lic.std.familyProtection", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(guaranteed.sumAssuredOnDeath)}
              </span>
            </div>
          ) : guaranteed?.sumAssuredOnDeathMinimum != null ? (
            <p className="text-xs text-ink-500">
              {t("lic.std.familyProtectionFloor", locale, {
                amount: formatINRCompact(guaranteed.sumAssuredOnDeathMinimum),
              })}
            </p>
          ) : null}
          <div className="flex justify-between">
            <span className="text-ink-500">🎁 {t("common.bonusesLabel", locale)}</span>
            <span className="font-medium text-ink-900">{t("common.notIncluded", locale)}</span>
          </div>
          <p className="text-xs text-ink-500">{t("lic774.nonParNote", locale)}</p>
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
