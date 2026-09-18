"use client";

// LIC's Index Plus (Plan 873) — a unit-linked savings plan with a genuine
// Basic Sum Assured (a 7x/10x multiple of Annualized Premium the customer
// chooses), but the maturity/vesting value depends on NAV performance and
// is NEVER projected here — same guardrail as Plan867Configurator. This
// component never shows a "projected corpus" or "expected returns" figure.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import {
  PLAN_873_RULES,
  PLAN_873_UIN,
  Plan873BsaMultiple,
  Plan873PremiumMode,
  annualizedPremium,
} from "@/lib/insurance/providers/lic/plans/plan873";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const PREMIUM_MODES: Plan873PremiumMode[] = ["yearly", "half_yearly", "quarterly", "monthly"];

export function Plan873Configurator({
  product,
  goal,
  locale,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
}) {
  const [mode, setMode] = useState<Plan873PremiumMode>("yearly");
  const [premium, setPremium] = useState<number>(PLAN_873_RULES.minPremiumByMode.yearly);
  const [bsaMultiple, setBsaMultiple] = useState<Plan873BsaMultiple>(7);
  const [policyTermYears, setPolicyTermYears] = useState<number>(
    Math.min(Math.max(goal.yearsToGoal, 10), PLAN_873_RULES.maxPolicyTermYears)
  );

  const minPremium = PLAN_873_RULES.minPremiumByMode[mode];
  const activePremium = Math.max(premium, minPremium);
  const annualized = annualizedPremium(activePremium, mode);

  const engine = getLicProductEngine("873", PLAN_873_UIN);
  const context = {
    age: goal.age,
    policyTermYears,
    premiumMode: mode,
    annualPremium: activePremium,
    productSpecificInputs: { bsaMultiple },
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const costs = engine?.calculateCosts?.(context);
  const liquidity = engine?.evaluateLiquidity?.(context);

  const reasonCodes = eligibility?.reasonCodes ?? [];
  const maturityAge = goal.age + policyTermYears;
  const maxEntryAgeFor10x = PLAN_873_RULES.maxEntryAgeFor10x;

  const terms: number[] = [];
  for (let term = 10; term <= PLAN_873_RULES.maxPolicyTermYears; term += 5) {
    terms.push(term);
  }
  if (!terms.includes(PLAN_873_RULES.maxPolicyTermYears)) terms.push(PLAN_873_RULES.maxPolicyTermYears);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        {t("lic.pension.marketLinkedWarning", locale)}
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
          min={minPremium}
          max={Math.max(minPremium * 20, 500000)}
          step={mode === "yearly" ? 1000 : 250}
          displayValue={formatINRCompact(activePremium)}
          onChange={setPremium}
          hint={t("lic.pension.premiumHint", locale, { min: formatINRCompact(minPremium) })}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.indexplus.bsaMultipleLabel", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {([7, 10] as const)
            .filter((m) => m === 7 || goal.age <= maxEntryAgeFor10x)
            .map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setBsaMultiple(m)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  bsaMultiple === m ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
                }`}
              >
                {t("lic.indexplus.bsaMultipleOption", locale, { multiple: m })}
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
                policyTermYears === term ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
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
            <span className="text-ink-500">{t("lic.pension.assuredDeathBenefit", locale)}</span>
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
