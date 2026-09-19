"use client";

// LIC's Protection Plus (Plan 886) — a unit-linked savings plan whose
// Basic Sum Assured is a customer-chosen multiple of Annualized Premium
// within a published [min, max] band that depends on age/PPT/premium —
// unlike Plan 873/749's discrete option choice. The maturity/vesting
// value depends on NAV performance and is NEVER projected here — same
// guardrail as every other ULIP configurator in this codebase. This
// product also has no Guaranteed Additions feature at all.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import {
  PLAN_886_UIN,
  Plan886Ppt,
  Plan886PremiumMode,
  minBsaMultiple,
  maxBsaMultiple,
  annualizedPremium,
} from "@/lib/insurance/providers/lic/plans/plan886";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const PREMIUM_MODES: Plan886PremiumMode[] = ["yearly", "half_yearly", "quarterly", "monthly"];
const PPT_OPTIONS: Plan886Ppt[] = [5, 7, 10, 15];
const ALLOWED_TERMS_BY_PPT: Record<Plan886Ppt, number[]> = {
  5: [10, 15, 20, 25],
  7: [10, 15, 20, 25],
  10: [10, 15, 20, 25],
  15: [15, 20, 25],
};
const MIN_PREMIUM: Record<Plan886Ppt, number> = { 5: 60000, 7: 60000, 10: 60000, 15: 36000 };

export function Plan886Configurator({
  product,
  goal,
  locale,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
}) {
  const [mode, setMode] = useState<Plan886PremiumMode>("yearly");
  const [ppt, setPpt] = useState<Plan886Ppt>(10);
  const [premium, setPremium] = useState<number>(MIN_PREMIUM[10]);
  const [policyTermYears, setPolicyTermYears] = useState<number>(20);
  const [bsaMultiple, setBsaMultiple] = useState<number>(7);

  const activePremium = Math.max(premium, MIN_PREMIUM[ppt]);
  const allowedTerms = ALLOWED_TERMS_BY_PPT[ppt];
  const activeTerm = allowedTerms.includes(policyTermYears) ? policyTermYears : allowedTerms[0];
  const annualized = annualizedPremium(activePremium, mode);
  const minMultiple = minBsaMultiple(goal.age);
  const maxMultiple = maxBsaMultiple(goal.age, ppt, annualized);
  const activeMultiple = Math.min(Math.max(bsaMultiple, minMultiple), maxMultiple ?? bsaMultiple);

  const engine = getLicProductEngine("886", PLAN_886_UIN);
  const context = {
    age: goal.age,
    policyTermYears: activeTerm,
    premiumPayingTermYears: ppt,
    premiumMode: mode,
    annualPremium: activePremium,
    productSpecificInputs: { bsaMultiple: activeMultiple },
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const costs = engine?.calculateCosts?.(context);
  const liquidity = engine?.evaluateLiquidity?.(context);

  const reasonCodes = eligibility?.reasonCodes ?? [];
  const maturityAge = goal.age + activeTerm;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        {t("lic.pension.marketLinkedWarning", locale)}
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.std.premiumPayingTerm", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {PPT_OPTIONS.map((p) => (
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

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.pension.policyTerm", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {allowedTerms.map((term) => (
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
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.pension.premiumMode", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {PREMIUM_MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                mode === m ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {t(`lic.pension.mode.${m}`, locale)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">{t("lic.pension.premiumLabel", locale)}</p>
        <Slider
          label={t("lic.pension.premiumLabel", locale)}
          emoji="💰"
          value={activePremium}
          min={MIN_PREMIUM[ppt]}
          max={Math.max(MIN_PREMIUM[ppt] * 20, 500000)}
          step={mode === "yearly" ? 1000 : 250}
          displayValue={formatINRCompact(activePremium)}
          onChange={setPremium}
          hint={t("lic.pension.premiumHint", locale, { min: formatINRCompact(MIN_PREMIUM[ppt]) })}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">
          {t("lic.indexplus.bsaMultipleLabel", locale)} ({minMultiple}
          {maxMultiple != null ? `-${maxMultiple}` : "+"}×)
        </p>
        <Slider
          label={t("lic.indexplus.bsaMultipleLabel", locale)}
          emoji="❤️"
          value={activeMultiple}
          min={minMultiple}
          max={maxMultiple ?? minMultiple * 4}
          step={1}
          displayValue={t("lic.indexplus.bsaMultipleOption", locale, { multiple: activeMultiple })}
          onChange={setBsaMultiple}
        />
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
