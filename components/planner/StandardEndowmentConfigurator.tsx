"use client";

// Shared configurator for the Stage 4D endowment plans (717, 714, 715,
// 912) whose configuration shape is "Basic Sum Assured + Policy Term
// (+ optionally an independently-chosen Premium Paying Term and/or a
// Sum-Assured-on-Death Option)". One component driven by a small
// per-product config object, instead of four near-identical files.
// Amritbaal (774) additionally toggles between Single and Limited
// premium payment, which changes its term range, PPT choices and Option
// set all at once — that genuinely different shape gets its own
// Plan774Configurator instead of being forced into this shape.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct, PremiumFrequency } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { comparePlanBudget } from "@/lib/insurance/budgetComparison";
import { SumAssuredBand } from "@/lib/insurance/providers/lic/plans/shared";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export interface StandardEndowmentConfig {
  planNumber: string;
  uin: string;
  minBasicSumAssured: number;
  sumAssuredBands: SumAssuredBand[];
  sumAssuredSliderMax: number;
  premiumMode: PremiumFrequency;
  hasIndependentPpt: boolean;
  pptOptions?: readonly number[];
  validPolicyTerms(age: number, ppt?: number): number[];
  pptForTerm?(term: number): number | undefined;
  // A single per-product configuration choice made once at inception,
  // stored under context.productSpecificInputs[inputKey] — e.g. Nav
  // Jeevan Shree/New Jeevan Sathi's Death Benefit Option (inputKey
  // "deathBenefitOption") or Bima Lakshmi/Jeevan Tarun's Survival Benefit
  // Option (inputKey "survivalBenefitOption"). `labelKey` picks which
  // translated heading to show above the picker.
  optionChoice?: {
    inputKey: string;
    labelKey: string;
    values: readonly string[];
  };
}

export function StandardEndowmentConfigurator({
  product,
  goal,
  locale,
  config,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
  config: StandardEndowmentConfig;
}) {
  const [sumAssured, setSumAssured] = useState<number>(config.minBasicSumAssured);
  const [selectedPpt, setSelectedPpt] = useState<number | undefined>(config.pptOptions?.[0]);
  const [policyTermYears, setPolicyTermYears] = useState<number | undefined>(undefined);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    config.optionChoice?.values[0]
  );

  const validTerms = config.validPolicyTerms(goal.age, config.hasIndependentPpt ? selectedPpt : undefined);
  const activeTerm =
    policyTermYears != null && validTerms.includes(policyTermYears)
      ? policyTermYears
      : validTerms.includes(goal.yearsToGoal)
        ? goal.yearsToGoal
        : validTerms[0];

  if (validTerms.length === 0) {
    return (
      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        {t("lic.std.noValidTerm", locale, { plan: product.planNumber, age: goal.age })}
      </div>
    );
  }

  const premiumPayingTermYears = config.hasIndependentPpt ? selectedPpt : config.pptForTerm?.(activeTerm);

  const engine = getLicProductEngine(config.planNumber, config.uin);
  const context = {
    age: goal.age,
    basicSumAssured: sumAssured,
    policyTermYears: activeTerm,
    premiumPayingTermYears,
    premiumMode: config.premiumMode,
    productSpecificInputs:
      config.optionChoice && selectedOption
        ? { [config.optionChoice.inputKey]: selectedOption }
        : undefined,
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const premium = engine?.calculatePremium?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const liquidity = engine?.evaluateLiquidity?.(context);
  // A single (one-time) premium isn't a recurring cost, so comparing it
  // to a monthly budget would be misleading — only shown for recurring
  // premium modes.
  const budget =
    config.premiumMode !== "single" ? comparePlanBudget(goal.monthlyBudget, premium) : undefined;

  const reasonCodes = eligibility?.reasonCodes ?? [];

  const sliderStep =
    config.sumAssuredBands.find((b) => b.maxInclusive != null && sumAssured <= b.maxInclusive) ??
    config.sumAssuredBands[config.sumAssuredBands.length - 1];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">{t("lic.std.configLabel", locale)}</p>
        <Slider
          label={t("lic.std.basicSumAssured", locale)}
          emoji="❤️"
          value={sumAssured}
          min={config.minBasicSumAssured}
          max={config.sumAssuredSliderMax}
          step={sliderStep.multiple}
          displayValue={formatINRCompact(sumAssured)}
          onChange={setSumAssured}
          hint={t("lic.std.configHint", locale)}
        />
      </div>

      {config.hasIndependentPpt && config.pptOptions && (
        <div>
          <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.std.premiumPayingTerm", locale)}</p>
          <div className="flex flex-wrap gap-2">
            {config.pptOptions.map((ppt) => (
              <button
                key={ppt}
                type="button"
                onClick={() => setSelectedPpt(ppt)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  selectedPpt === ppt ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
                }`}
              >
                {t("common.yearsValueShort", locale, { n: ppt })}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.std.policyTerm", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {validTerms.map((term) => (
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
        {!config.hasIndependentPpt && premiumPayingTermYears != null && (
          <p className="mt-1.5 text-xs text-ink-500">
            {t("lic.std.pptFollowsTerm", locale, { ppt: premiumPayingTermYears })}
          </p>
        )}
      </div>

      {config.optionChoice && (
        <div>
          <p className="text-sm font-medium text-ink-700 mb-2">{t(config.optionChoice.labelKey, locale)}</p>
          <div className="flex flex-wrap gap-2">
            {config.optionChoice.values.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedOption(option)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  selectedOption === option ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
                }`}
              >
                {t(`lic.std.option.${option}`, locale)}
              </button>
            ))}
          </div>
        </div>
      )}

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
              {premium.premiumFrequency === "single"
                ? t("lic.std.verifiedSinglePremium", locale, { amount: formatINRCompact(premium.premium) })
                : t("lic.std.verifiedPremium", locale, { amount: formatINRCompact(premium.premium) })}
            </p>
            {premium.premiumFrequency !== "single" && (
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
          {guaranteed?.sumAssuredOnSecondDeathMinimum != null && (
            <p className="text-xs text-ink-500">
              {t("lic.std.secondDeathNote", locale, {
                amount: formatINRCompact(guaranteed.sumAssuredOnSecondDeathMinimum),
              })}
            </p>
          )}
          {guaranteed?.survivalBenefitPerInstallment != null && (
            <div className="flex justify-between">
              <span className="text-ink-500">{t("lic.std.survivalBenefitPerInstallment", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(guaranteed.survivalBenefitPerInstallment)}
              </span>
            </div>
          )}
          {guaranteed?.survivalBenefitAtEndOfPpt != null && (
            <div className="flex justify-between">
              <span className="text-ink-500">{t("lic.std.survivalBenefitAtEndOfPpt", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(guaranteed.survivalBenefitAtEndOfPpt)}
              </span>
            </div>
          )}
          {guaranteed?.regularIncomeBenefitAnnual != null && (
            <div className="flex justify-between">
              <span className="text-ink-500">{t("lic.std.regularIncomeBenefit", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(guaranteed.regularIncomeBenefitAnnual)}
              </span>
            </div>
          )}
          {guaranteed?.boosterIncomeBenefit != null && (
            <div className="flex justify-between">
              <span className="text-ink-500">{t("lic.std.boosterIncomeBenefit", locale)}</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(guaranteed.boosterIncomeBenefit)}
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
