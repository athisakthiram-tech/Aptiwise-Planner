"use client";

// Shared configurator for the "pure risk" Level/Increasing Sum Assured
// term plans (Digi Term/876, Yuva Term/875, New Tech-Term/954). These
// plans share a genuinely different shape from every endowment plan
// elsewhere in this codebase: no maturity benefit at all (so no budget-
// vs-maturity comparison block), a Regular/Limited/Single premium mode
// choice, and a Level (Option I) vs Increasing (Option II) Sum Assured
// choice — one component driven by a small per-product config object,
// instead of three near-identical files.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { SumAssuredBand } from "@/lib/insurance/providers/lic/plans/shared";
import { TermDeathBenefitOption, TermPremiumMode } from "@/lib/insurance/providers/lic/plans/pureTermShared";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export interface PureTermConfig {
  planNumber: string;
  uin: string;
  minBasicSumAssured: number;
  sumAssuredBands: SumAssuredBand[];
  sumAssuredSliderMax: number;
  minPolicyTermYears: number;
  maxPolicyTermYears: number;
  limitedPptOptionsForTerm(policyTermYears: number): number[];
}

export function PureTermConfigurator({
  product,
  goal,
  locale,
  config,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
  config: PureTermConfig;
}) {
  const [sumAssured, setSumAssured] = useState<number>(config.minBasicSumAssured);
  const [policyTermYears, setPolicyTermYears] = useState<number>(
    Math.min(Math.max(goal.yearsToGoal, config.minPolicyTermYears), config.maxPolicyTermYears)
  );
  const [mode, setMode] = useState<TermPremiumMode>("regular");
  const [selectedPpt, setSelectedPpt] = useState<number | undefined>(undefined);
  const [option, setOption] = useState<TermDeathBenefitOption>("I");

  const limitedPptOptions = config.limitedPptOptionsForTerm(policyTermYears);
  const activePpt =
    selectedPpt != null && limitedPptOptions.includes(selectedPpt) ? selectedPpt : limitedPptOptions[0];

  const engine = getLicProductEngine(config.planNumber, config.uin);
  const context = {
    age: goal.age,
    basicSumAssured: sumAssured,
    policyTermYears,
    premiumPayingTermYears: mode === "limited" ? activePpt : mode === "regular" ? policyTermYears : undefined,
    premiumMode: mode === "single" ? ("single" as const) : ("yearly" as const),
    productSpecificInputs: { deathBenefitOption: option },
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
        <div className="flex flex-wrap gap-2">
          {(["regular", "limited", "single"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                mode === m ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {t(`lic.term.mode.${m}`, locale)}
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

      {mode === "limited" && limitedPptOptions.length > 0 && (
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
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.term.deathBenefitOption", locale)}</p>
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
              {t(`lic.term.option.${opt}`, locale)}
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
            {mode === "single"
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
            <span className="text-ink-500">❤️ {t("lic.std.basicSumAssured", locale)}</span>
            <span className="font-medium text-ink-900">{formatINRCompact(sumAssured)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">{t("lic.std.familyProtection", locale)}</span>
            <span className="font-medium text-ink-900">
              {benefits?.available && benefits.deathBenefit != null
                ? formatINRCompact(benefits.deathBenefit)
                : t("common.notCalculated", locale)}
            </span>
          </div>
          {option === "II" && guaranteed?.absoluteAmountAssuredFromPolicyYear16 != null && (
            <p className="text-xs text-ink-500">
              {t("lic.term.increasingNote", locale, {
                amount: formatINRCompact(guaranteed.absoluteAmountAssuredFromPolicyYear16),
              })}
            </p>
          )}
          <p className="text-xs text-ink-500">{t("lic.term.noMaturityBenefit", locale)}</p>
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
          <p className="text-xs text-ink-500">{t("lic.term.liquidityFacts", locale)}</p>
        </div>
      )}

      {guaranteed && (
        <Disclosure locale={locale} label={t("common.howCalculated", locale)}>
          {t("lic.term.calculationExplain", locale)}
        </Disclosure>
      )}
    </div>
  );
}
