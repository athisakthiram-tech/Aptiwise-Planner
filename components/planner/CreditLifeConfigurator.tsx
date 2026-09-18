"use client";

// Shared configurator for LIC's decreasing Credit Life plans (Yuva
// Credit Life/877, Digi Credit Life/878). A genuinely different shape
// from every other plan in this codebase: no maturity benefit, a
// declining (not level/increasing) Sum Assured on Death driven by a
// chosen interest rate, and a "Policy Term unlocks progressively longer
// Premium Paying Terms" mechanic instead of a fixed PPT set.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { SumAssuredBand } from "@/lib/insurance/providers/lic/plans/shared";
import { CREDIT_LIFE_INTEREST_RATES, CreditLifeInterestRate } from "@/lib/insurance/providers/lic/plans/creditLifeShared";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export interface CreditLifeConfig {
  planNumber: string;
  uin: string;
  minBasicSumAssured: number;
  sumAssuredBands: SumAssuredBand[];
  sumAssuredSliderMax: number;
  minPolicyTermYears: number;
  maxPolicyTermYears: number;
  limitedPptOptionsForTerm(policyTermYears: number): number[];
}

export function CreditLifeConfigurator({
  product,
  goal,
  locale,
  config,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
  config: CreditLifeConfig;
}) {
  const [sumAssured, setSumAssured] = useState<number>(config.minBasicSumAssured);
  const [policyTermYears, setPolicyTermYears] = useState<number>(
    Math.min(Math.max(goal.yearsToGoal, config.minPolicyTermYears), config.maxPolicyTermYears)
  );
  const [isSingle, setIsSingle] = useState(true);
  const [selectedPpt, setSelectedPpt] = useState<number | undefined>(undefined);
  const [interestRate, setInterestRate] = useState<CreditLifeInterestRate>(8);

  const limitedPptOptions = config.limitedPptOptionsForTerm(policyTermYears);
  const activePpt =
    selectedPpt != null && limitedPptOptions.includes(selectedPpt) ? selectedPpt : limitedPptOptions[0];

  const engine = getLicProductEngine(config.planNumber, config.uin);
  const context = {
    age: goal.age,
    basicSumAssured: sumAssured,
    policyTermYears,
    premiumPayingTermYears: isSingle ? undefined : activePpt,
    premiumMode: isSingle ? ("single" as const) : ("yearly" as const),
    productSpecificInputs: { interestRate },
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const premium = engine?.calculatePremium?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const liquidity = engine?.evaluateLiquidity?.(context);

  const reasonCodes = eligibility?.reasonCodes ?? [];
  const sliderStep =
    config.sumAssuredBands.find((b) => b.maxInclusive != null && sumAssured <= b.maxInclusive) ??
    config.sumAssuredBands[config.sumAssuredBands.length - 1];

  const policyTerms: number[] = [];
  for (let term = config.minPolicyTermYears; term <= config.maxPolicyTermYears; term += 5) {
    policyTerms.push(term);
  }
  if (!policyTerms.includes(config.maxPolicyTermYears)) policyTerms.push(config.maxPolicyTermYears);

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

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.term.premiumMode", locale)}</p>
        <div className="flex gap-2">
          {([true, false] as const).map((single) => (
            <button
              key={String(single)}
              type="button"
              onClick={() => setIsSingle(single)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                isSingle === single ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {t(`lic.term.mode.${single ? "single" : "limited"}`, locale)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.std.policyTerm", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {policyTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setPolicyTermYears(term)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                policyTermYears === term ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {t("common.yearsValueShort", locale, { n: term })}
            </button>
          ))}
        </div>
      </div>

      {!isSingle && limitedPptOptions.length > 0 && (
        <div>
          <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.std.premiumPayingTerm", locale)}</p>
          <div className="flex flex-wrap gap-2">
            {limitedPptOptions.map((ppt) => (
              <button
                key={ppt}
                type="button"
                onClick={() => setSelectedPpt(ppt)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  activePpt === ppt ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
                }`}
              >
                {t("common.yearsValueShort", locale, { n: ppt })}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.credit.interestRate", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {CREDIT_LIFE_INTEREST_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setInterestRate(rate)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                interestRate === rate ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {rate}%
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-ink-500">{t("lic.credit.interestRateHint", locale)}</p>
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
            {isSingle
              ? t("lic.std.verifiedSinglePremium", locale, { amount: formatINRCompact(premium.premium) })
              : t("lic.std.verifiedPremium", locale, { amount: formatINRCompact(premium.premium) })}
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
            <span className="text-ink-500">❤️ {t("lic.credit.sumAssuredAtInception", locale)}</span>
            <span className="font-medium text-ink-900">
              {benefits?.available && benefits.deathBenefit != null
                ? formatINRCompact(benefits.deathBenefit)
                : t("common.notCalculated", locale)}
            </span>
          </div>
          {guaranteed?.sumAssuredOnDeathAtFinalPolicyYear != null && (
            <p className="text-xs text-ink-500">
              {t("lic.credit.decreasingNote", locale, {
                amount: formatINRCompact(Math.round(guaranteed.sumAssuredOnDeathAtFinalPolicyYear)),
              })}
            </p>
          )}
          <p className="text-xs text-ink-500">{t("lic.term.noMaturityBenefit", locale)}</p>
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
          <p className="text-xs text-ink-500">{t("lic.term.liquidityFacts", locale)}</p>
        </div>
      )}

      {guaranteed && (
        <Disclosure locale={locale} label={t("common.howCalculated", locale)}>
          {t("lic.credit.calculationExplain", locale)}
        </Disclosure>
      )}
    </div>
  );
}
