"use client";

// New Jeevan Sathi - Single Premium (Plan 888) has a Death Benefit Option
// toggle that changes the valid Policy Term set AND the maximum entry/
// maturity age all at once (Option I: terms 10/15/20/25, max entry 60;
// Option II: terms 10/15 only, max entry 35) — the same
// Amritbaal-style interdependency that keeps this out of
// StandardEndowmentConfigurator's generic shape.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { PLAN_888_RULES, PLAN_888_UIN, Plan888DeathBenefitOption } from "@/lib/insurance/providers/lic/plans/plan888";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const SUM_ASSURED_SLIDER_MAX = 5000000;

function validPolicyTerms(age: number, option: Plan888DeathBenefitOption): number[] {
  const maxEntryAge = PLAN_888_RULES.maxEntryAgeByOption[option];
  if (age > maxEntryAge) return [];
  const maxMaturityAge = PLAN_888_RULES.maxMaturityAgeByOption[option];
  return (PLAN_888_RULES.policyTermOptionsByOption[option] as readonly number[]).filter(
    (term) => age + term >= PLAN_888_RULES.minMaturityAge && age + term <= maxMaturityAge
  );
}

export function Plan888Configurator({
  product,
  goal,
  locale,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
}) {
  const [sumAssured, setSumAssured] = useState<number>(PLAN_888_RULES.minBasicSumAssured);
  const [option, setOption] = useState<Plan888DeathBenefitOption>("I");
  const [policyTermYears, setPolicyTermYears] = useState<number | undefined>(undefined);

  const terms = validPolicyTerms(goal.age, option);
  const activeTerm =
    policyTermYears != null && terms.includes(policyTermYears)
      ? policyTermYears
      : terms.includes(goal.yearsToGoal)
        ? goal.yearsToGoal
        : terms[0];

  if (terms.length === 0) {
    return (
      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        {t("lic.std.noValidTerm", locale, { plan: product.planNumber, age: goal.age })}
      </div>
    );
  }

  const engine = getLicProductEngine("888", PLAN_888_UIN);
  const context = {
    age: goal.age,
    basicSumAssured: sumAssured,
    policyTermYears: activeTerm,
    premiumMode: "single" as const,
    productSpecificInputs: { deathBenefitOption: option },
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const premium = engine?.calculatePremium?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const liquidity = engine?.evaluateLiquidity?.(context);

  const reasonCodes = eligibility?.reasonCodes ?? [];
  const sliderStep = 25000;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">{t("lic.std.configLabel", locale)}</p>
        <Slider
          label={t("lic.std.basicSumAssured", locale)}
          emoji="❤️"
          value={sumAssured}
          min={PLAN_888_RULES.minBasicSumAssured}
          max={SUM_ASSURED_SLIDER_MAX}
          step={sliderStep}
          displayValue={formatINRCompact(sumAssured)}
          onChange={setSumAssured}
          hint={t("lic.std.configHint", locale)}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.std.deathBenefitOption", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {(["I", "II"] as const).map((opt) => (
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
          <p className="text-ink-900">
            {t("lic.std.verifiedSinglePremium", locale, { amount: formatINRCompact(premium.premium) })}
          </p>
        ) : (
          <>
            <p className="text-amber-700">{t("lic.std.premiumUnavailable", locale)}</p>
            <p className="mt-0.5 text-xs text-ink-500">{t("lic.std.premiumUnavailableReason", locale)}</p>
          </>
        )}
      </div>

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
          {guaranteed?.sumAssuredOnSecondDeathMinimum != null && (
            <p className="text-xs text-ink-500">
              {t("lic.std.secondDeathNote", locale, {
                amount: formatINRCompact(guaranteed.sumAssuredOnSecondDeathMinimum),
              })}
            </p>
          )}
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
