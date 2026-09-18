"use client";

// Shared configurator for LIC's four Immediate/Deferred Annuity ("Pension")
// products (Jeevan Akshay-VII/857, Saral Pension/862, Smart Pension/879,
// New Jeevan Shanti/758) — one component driven by a small per-product
// config object, mirroring PureTermConfigurator's pattern. These plans
// have no maturity benefit and no Basic Sum Assured; the customer instead
// pays a Purchase Price and picks an Annuity Option, and the exact annuity
// amount is only ever shown when it matches the plan's one published
// illustration point (see annuityShared.ts) — never interpolated.

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { AnnuityMode } from "@/lib/insurance/providers/lic/plans/annuityShared";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export interface AnnuityConfigOption {
  code: string;
  isJointLife?: boolean;
}

export interface AnnuityConfig {
  planNumber: string;
  uin: string;
  minEntryAge: number;
  maxEntryAge: number;
  defaultPurchasePrice: number;
  purchasePriceSliderMin: number;
  purchasePriceSliderMax: number;
  options: AnnuityConfigOption[];
  defaultAge: number;
  defaultSecondaryAge?: number;
  hasDefermentPeriod?: boolean;
  minDefermentPeriodYears?: number;
  maxDefermentPeriodYears?: number;
  defaultDefermentPeriodYears?: number;
}

const MODES: AnnuityMode[] = ["yearly", "half_yearly", "quarterly", "monthly"];

export function AnnuityConfigurator({
  product,
  goal,
  locale,
  config,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
  config: AnnuityConfig;
}) {
  const [purchasePrice, setPurchasePrice] = useState<number>(config.defaultPurchasePrice);
  const [mode, setMode] = useState<AnnuityMode>("yearly");
  const [optionCode, setOptionCode] = useState<string>(config.options[0]?.code ?? "");
  const [secondaryAge, setSecondaryAge] = useState<number>(config.defaultSecondaryAge ?? goal.age);
  const [defermentPeriodYears, setDefermentPeriodYears] = useState<number>(
    config.defaultDefermentPeriodYears ?? config.minDefermentPeriodYears ?? 1
  );

  const age = Math.min(Math.max(config.defaultAge, config.minEntryAge), config.maxEntryAge);
  const selectedOption = config.options.find((o) => o.code === optionCode);

  const engine = getLicProductEngine(config.planNumber, config.uin);
  const context = {
    age,
    annualPremium: purchasePrice,
    premiumMode: mode,
    productSpecificInputs: {
      annuityOption: optionCode,
      secondaryAge: selectedOption?.isJointLife ? secondaryAge : undefined,
      ...(config.hasDefermentPeriod ? { defermentPeriodYears } : {}),
    },
  };
  const eligibility = engine?.evaluateEligibility?.(context);
  const benefits = engine?.calculateBenefits?.(context);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const liquidity = engine?.evaluateLiquidity?.(context);

  const reasonCodes = eligibility?.reasonCodes ?? [];
  const annuityAmount = guaranteed?.annuityAmountPerPayment;

  function liquidityStatusText(status: string | undefined, value: boolean | null | undefined): string {
    if (status === "verified") return t(value ? "lic.annuity.status.yes" : "lic.annuity.status.no", locale);
    return t("lic.annuity.status.conditional", locale);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">{t("lic.annuity.purchasePriceLabel", locale)}</p>
        <Slider
          label={t("lic.annuity.purchasePriceLabel", locale)}
          emoji="💰"
          value={purchasePrice}
          min={config.purchasePriceSliderMin}
          max={config.purchasePriceSliderMax}
          step={100000}
          displayValue={formatINRCompact(purchasePrice)}
          onChange={setPurchasePrice}
          hint={t("lic.annuity.purchasePriceHint", locale)}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.annuity.modeLabel", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
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

      {config.hasDefermentPeriod && (
        <div>
          <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.annuity.defermentPeriodLabel", locale)}</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              { length: (config.maxDefermentPeriodYears ?? 5) - (config.minDefermentPeriodYears ?? 1) + 1 },
              (_, i) => (config.minDefermentPeriodYears ?? 1) + i
            ).map((years) => (
              <button
                key={years}
                type="button"
                onClick={() => setDefermentPeriodYears(years)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  defermentPeriodYears === years ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
                }`}
              >
                {t("common.yearsValueShort", locale, { n: years })}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-500">
            {t("lic.annuity.defermentPeriodHint", locale, {
              min: config.minDefermentPeriodYears ?? 1,
              max: config.maxDefermentPeriodYears ?? 5,
            })}
          </p>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("lic.annuity.optionLabel", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {config.options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => setOptionCode(opt.code)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                optionCode === opt.code ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {t("lic.annuity.optionCode", locale, { code: opt.code })}
              {opt.isJointLife ? ` · ${t("lic.annuity.jointLifeBadge", locale)}` : ""}
            </button>
          ))}
        </div>
      </div>

      {selectedOption?.isJointLife && (
        <div>
          <Slider
            label={t("lic.annuity.secondaryAgeLabel", locale)}
            emoji="👤"
            value={secondaryAge}
            min={config.minEntryAge}
            max={config.maxEntryAge}
            step={1}
            displayValue={String(secondaryAge)}
            onChange={setSecondaryAge}
            hint={t("lic.annuity.secondaryAgeHint", locale)}
          />
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
        <p className="text-xs font-semibold text-ink-500 mb-1.5">{t("lic.annuity.annuityAmountLabel", locale)}</p>
        {annuityAmount != null ? (
          <p className="text-ink-900 text-lg font-semibold">
            {formatINRCompact(annuityAmount)}
            {t("common.perYearSuffix", locale)}
          </p>
        ) : (
          <p className="text-amber-700">{t("lic.annuity.annuityAmountUnavailable", locale)}</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-1.5">{t("lic.annuity.deathBenefitLabel", locale)}</p>
        <div className="rounded-lg bg-slate-50 p-3 text-sm flex flex-col gap-1.5">
          {benefits?.available && selectedOption ? (
            <p className="text-ink-900">
              {(() => {
                const dbt =
                  optionCode && benefits.deathBenefit != null
                    ? guaranteed?.deathBenefitGuaranteedPeriodTotalAtInception != null
                      ? "guaranteedPeriod"
                      : "fullPurchasePrice"
                    : benefits.deathBenefit === 0
                      ? "none"
                      : "notComputed";
                if (dbt === "none") return t("lic.annuity.deathBenefit.none", locale);
                if (dbt === "fullPurchasePrice") {
                  const pct = Math.round(((benefits.deathBenefit as number) / purchasePrice) * 100);
                  return t("lic.annuity.deathBenefit.fullPurchasePrice", locale, {
                    pct,
                    amount: formatINRCompact(benefits.deathBenefit as number),
                  });
                }
                if (dbt === "guaranteedPeriod") {
                  return t("lic.annuity.deathBenefit.guaranteedPeriod", locale, {
                    years: Math.round(
                      (benefits.deathBenefit as number) / (guaranteed?.annuityAmountPerPayment ?? 1)
                    ),
                    amount: formatINRCompact(benefits.deathBenefit as number),
                  });
                }
                return t("lic.annuity.deathBenefit.notComputed", locale);
              })()}
            </p>
          ) : (
            <p className="text-amber-700">{t("common.notCalculated", locale)}</p>
          )}
          <p className="text-xs text-ink-500">{t("lic.annuity.maturityNote", locale)}</p>
        </div>
      </div>

      {liquidity && (
        <div>
          <p className="text-xs font-semibold text-ink-500 mb-1.5">💧 {t("lic.std.liquidity", locale)}</p>
          <div className="rounded-lg bg-slate-50 p-3 text-sm flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-ink-500">{t("lic.annuity.loanLabel", locale)}</span>
              <span className="font-medium text-ink-900">
                {liquidityStatusText(liquidity.loanAvailable.status, liquidity.loanAvailable.value)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">{t("lic.annuity.surrenderLabel", locale)}</span>
              <span className="font-medium text-ink-900">
                {liquidityStatusText(liquidity.surrenderAvailable.status, liquidity.surrenderAvailable.value)}
              </span>
            </div>
            {liquidity.surrenderAvailable.reasonCodes?.some(
              (rc) => rc.code === "surrender_requires_critical_illness"
            ) && <p className="text-xs text-ink-500">{t("lic.annuity.surrenderCriticalIllnessNote", locale)}</p>}
          </div>
        </div>
      )}

      <Disclosure locale={locale} label={t("common.howCalculated", locale)}>
        {t("lic.annuity.calculationExplain", locale)}
      </Disclosure>
    </div>
  );
}
