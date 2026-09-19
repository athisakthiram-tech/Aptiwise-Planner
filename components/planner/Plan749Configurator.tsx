"use client";

// LIC's Nivesh Plus (Plan 749) — a Single-Premium-only unit-linked savings
// plan with a genuine Basic Sum Assured (a 1.25x/10x multiple of Single
// Premium the customer chooses), but the maturity/vesting value depends
// on NAV performance and is NEVER projected here — same guardrail as
// Plan867Configurator/Plan873Configurator. This component never shows a
// "projected corpus" or "expected returns" figure.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { PLAN_749_RULES, PLAN_749_UIN, Plan749BsaOption } from "@/lib/insurance/providers/lic/plans/plan749";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function Plan749Configurator({
  product,
  goal,
  locale,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
}) {
  const [singlePremium, setSinglePremium] = useState<number>(PLAN_749_RULES.minPremium);
  const [bsaOption, setBsaOption] = useState<Plan749BsaOption>(1);

  const age = goal.age;
  const termRange = PLAN_749_RULES.policyTermRangeForOption(bsaOption, age);
  const [policyTermYears, setPolicyTermYears] = useState<number>(
    Math.min(Math.max(goal.yearsToGoal, termRange?.min ?? 10), termRange?.max ?? 25)
  );
  const activeTerm = termRange
    ? Math.min(Math.max(policyTermYears, termRange.min), termRange.max)
    : policyTermYears;

  const engine = getLicProductEngine("749", PLAN_749_UIN);
  const context = {
    age,
    policyTermYears: activeTerm,
    annualPremium: singlePremium,
    productSpecificInputs: { bsaOption },
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const costs = engine?.calculateCosts?.(context);
  const liquidity = engine?.evaluateLiquidity?.(context);

  const reasonCodes = eligibility?.reasonCodes ?? [];
  const maturityAge = age + activeTerm;

  const terms: number[] = [];
  if (termRange) {
    for (let term = termRange.min; term <= termRange.max; term += Math.max(1, Math.round((termRange.max - termRange.min) / 4) || 1)) {
      terms.push(term);
    }
    if (!terms.includes(termRange.max)) terms.push(termRange.max);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        {t("lic.pension.marketLinkedWarning", locale)}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">{t("lic.annuity.purchasePriceLabel", locale)}</p>
        <Slider
          label={t("lic.annuity.purchasePriceLabel", locale)}
          emoji="💰"
          value={singlePremium}
          min={PLAN_749_RULES.minPremium}
          max={Math.max(PLAN_749_RULES.minPremium * 10, 2000000)}
          step={PLAN_749_RULES.premiumMultiple}
          displayValue={formatINRCompact(singlePremium)}
          onChange={setSinglePremium}
          hint={t("lic.pension.premiumHint", locale, { min: formatINRCompact(PLAN_749_RULES.minPremium) })}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.indexplus.bsaMultipleLabel", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {([1, 2] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setBsaOption(opt)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                bsaOption === opt ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {t("lic.indexplus.bsaMultipleOption", locale, { multiple: PLAN_749_RULES.bsaMultiple[opt] })}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.pension.policyTerm", locale)}</p>
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
        <p className="mt-1.5 text-xs text-ink-500">{t("lic.indexplus.maturityAgeNote", locale, { age: maturityAge })}</p>
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
        <p className="text-xs font-semibold text-ink-500 mb-1.5">❤️ {t("common.benefitsLabel", locale)}</p>
        <div className="rounded-lg bg-slate-50 p-3 text-sm flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-ink-500">{t("lic.indexplus.basicSumAssuredLabel", locale)}</span>
            <span className="font-medium text-ink-900">
              {guaranteed?.basicSumAssured != null ? formatINRCompact(guaranteed.basicSumAssured) : t("common.notCalculated", locale)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">{t("common.familyProtectionLabel", locale)}</span>
            <span className="font-medium text-ink-900">
              {benefits?.available && benefits.deathBenefit != null
                ? formatINRCompact(benefits.deathBenefit)
                : t("common.notCalculated", locale)}
            </span>
          </div>
          {guaranteed?.guaranteedAdditionsCumulative != null && (
            <div className="flex justify-between">
              <span className="text-ink-500">{t("lic.pension.guaranteedAdditions", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(guaranteed.guaranteedAdditionsCumulative)}
              </span>
            </div>
          )}
          <p className="text-xs text-ink-500">{t("lic.pension.guaranteedAdditionsNote", locale)}</p>
          <p className="mt-1 text-xs font-semibold text-amber-700">{t("lic.pension.noMaturityProjection", locale)}</p>
        </div>
      </div>

      {costs && (
        <div>
          <p className="text-xs font-semibold text-ink-500 mb-1.5">🧾 {t("lic.pension.charges", locale)}</p>
          <div className="rounded-lg bg-slate-50 p-3 text-sm flex flex-col gap-2">
            {costs.fundManagementCharge.value != null && (
              <div className="flex justify-between">
                <span className="text-ink-500">{t("lic.pension.fundManagementCharge", locale)}</span>
                <span className="font-medium text-ink-900">{costs.fundManagementCharge.value}% p.a.</span>
              </div>
            )}
            {costs.mortalityCharge.value != null ? (
              <div className="flex justify-between">
                <span className="text-ink-500">{t("lic.pension.mortalityCharge", locale)}</span>
                <span className="font-medium text-ink-900">₹{costs.mortalityCharge.value}/1000 p.a.</span>
              </div>
            ) : (
              <p className="text-xs text-ink-500">{t("common.notCalculated", locale)}</p>
            )}
            <p className="text-xs text-ink-500">{t("lic.pension.otherChargesNote", locale)}</p>
          </div>
        </div>
      )}

      {liquidity && (
        <div>
          <p className="text-xs font-semibold text-ink-500 mb-1">💧 {t("lic.std.liquidity", locale)}</p>
          <p className="text-xs text-ink-500">{t("lic.indexplus.liquidityFacts", locale)}</p>
        </div>
      )}

      <Disclosure locale={locale} label={t("common.howCalculated", locale)}>
        {t("lic.indexplus.calculationExplain", locale)}
      </Disclosure>
    </div>
  );
}
