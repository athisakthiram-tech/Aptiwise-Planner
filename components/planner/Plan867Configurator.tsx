"use client";

// LIC's New Pension Plus (Plan 867) — a unit-linked pension plan with a
// genuinely different shape from every other product in this app: there
// is no Basic Sum Assured (the customer chooses a premium directly), and
// the maturity/vesting value depends on NAV performance and can NEVER be
// projected here. This component never shows a "projected corpus" or
// "expected returns" figure — only the two guaranteed, market-
// independent components (Guaranteed Additions, Assured Death Benefit)
// and the plan's real, published charges.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct, PremiumFrequency } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { PLAN_867_RULES, PLAN_867_UIN, Plan867PremiumMode } from "@/lib/insurance/providers/lic/plans/plan867";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const PREMIUM_MODES: Plan867PremiumMode[] = ["single", "yearly", "half_yearly", "quarterly", "monthly"];

export function Plan867Configurator({
  product,
  goal,
  locale,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
}) {
  const [mode, setMode] = useState<Plan867PremiumMode>("yearly");
  const [premium, setPremium] = useState<number>(PLAN_867_RULES.minPremiumByMode.yearly);
  const [policyTermYears, setPolicyTermYears] = useState<number>(
    Math.min(
      Math.max(goal.yearsToGoal, PLAN_867_RULES.minPolicyTermYears),
      PLAN_867_RULES.maxPolicyTermYears
    )
  );

  const minPremium = PLAN_867_RULES.minPremiumByMode[mode];
  const activePremium = Math.max(premium, minPremium);

  const engine = getLicProductEngine("867", PLAN_867_UIN);
  const context = {
    age: goal.age,
    policyTermYears,
    premiumMode: mode as PremiumFrequency,
    annualPremium: activePremium,
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const costs = engine?.calculateCosts?.(context);
  const liquidity = engine?.evaluateLiquidity?.(context);

  const reasonCodes = eligibility?.reasonCodes ?? [];
  const vestingAge = goal.age + policyTermYears;

  const terms: number[] = [];
  for (let term = PLAN_867_RULES.minPolicyTermYears; term <= PLAN_867_RULES.maxPolicyTermYears; term += 5) {
    terms.push(term);
  }
  if (!terms.includes(PLAN_867_RULES.maxPolicyTermYears)) terms.push(PLAN_867_RULES.maxPolicyTermYears);

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
          max={Math.max(minPremium * 20, 1000000)}
          step={mode === "single" ? 10000 : 1000}
          displayValue={formatINRCompact(activePremium)}
          onChange={setPremium}
          hint={t("lic.pension.premiumHint", locale, { min: formatINRCompact(minPremium) })}
        />
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
        <p className="mt-1.5 text-xs text-ink-500">{t("lic.pension.vestingAgeNote", locale, { age: vestingAge })}</p>
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
            <span className="text-ink-500">{t("lic.pension.assuredDeathBenefit", locale)}</span>
            <span className="font-medium text-ink-900">
              {guaranteed?.assuredDeathBenefitAtInception != null
                ? formatINRCompact(guaranteed.assuredDeathBenefitAtInception)
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
            {costs.mortalityCharge.value != null && (
              <div className="flex justify-between">
                <span className="text-ink-500">{t("lic.pension.mortalityCharge", locale)}</span>
                <span className="font-medium text-ink-900">{costs.mortalityCharge.value}%</span>
              </div>
            )}
            <p className="text-xs text-ink-500">{t("lic.pension.otherChargesNote", locale)}</p>
          </div>
        </div>
      )}

      {liquidity && (
        <div>
          <p className="text-xs font-semibold text-ink-500 mb-1">💧 {t("lic.std.liquidity", locale)}</p>
          <p className="text-xs text-ink-500">{t("lic.pension.liquidityFacts", locale)}</p>
        </div>
      )}

      <Disclosure locale={locale} label={t("common.howCalculated", locale)}>
        {t("lic.pension.calculationExplain", locale)}
      </Disclosure>
    </div>
  );
}
