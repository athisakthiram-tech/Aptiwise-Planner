"use client";

import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getPlanEngineForProduct } from "@/lib/insurance/engineRegistry";
import { Disclosure } from "@/components/ui/Disclosure";
import { Plan733Configurator } from "@/components/planner/Plan733Configurator";
import { Plan736Configurator } from "@/components/planner/Plan736Configurator";
import { Plan774Configurator } from "@/components/planner/Plan774Configurator";
import { StandardEndowmentConfigurator } from "@/components/planner/StandardEndowmentConfigurator";
import {
  PLAN_717_CONFIG,
  PLAN_714_CONFIG,
  PLAN_715_CONFIG,
  PLAN_912_CONFIG,
} from "@/components/planner/standardEndowmentConfigs";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function LicProductDetailSheet({
  product,
  goal,
  locale,
  onClose,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  locale: Locale;
  onClose: () => void;
}) {
  const engine = getPlanEngineForProduct(product);
  const calculatorInput = { age: goal.age, policyTermYears: goal.yearsToGoal, product };

  const eligibility = engine.eligibility?.evaluateEligibility(calculatorInput);
  const premium = engine.premium?.calculatePremium(calculatorInput);
  const benefits = engine.benefit?.calculateBenefits(calculatorInput);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;

  const eligibilityText = !eligibility
    ? t("lic.eligibility.notIntegrated", locale)
    : eligibility.eligible === true
      ? t("lic.eligibility.passes", locale)
      : eligibility.eligible === false
        ? t("lic.eligibility.notEligible", locale)
        : t("lic.eligibility.needsDetails", locale);
  const eligibilityReason =
    eligibility && eligibility.eligible !== true ? eligibility.reasons[0] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-ink-500">🛡️ {product.provider}</div>
            <div className="text-lg font-extrabold uppercase text-ink-900">
              {product.productName.replace(/^LIC's /, "")}
            </div>
            <div className="text-xs text-ink-500">Plan {product.planNumber}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close", locale)}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-ink-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-ink-500">{t("lic.whyItAppeared", locale)}</p>
            <p className="text-ink-900">{t("lic.categoryMatchReason", locale)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-500 mb-1.5">{t("lic.yourDetails", locale)}</p>
            <div className="grid grid-cols-2 gap-y-1 rounded-lg bg-slate-50 p-3 text-ink-900">
              <span>👤 {t("common.age", locale)}</span>
              <span className="text-right font-medium">{goal.age}</span>
              <span>💰 {t("common.budget", locale)}</span>
              <span className="text-right font-medium">
                {formatINRCompact(goal.monthlyBudget)}
                {t("common.perMonthSuffix", locale)}
              </span>
              <span>⏳ {t("common.horizon", locale)}</span>
              <span className="text-right font-medium">
                {t("common.yearsValue", locale, { n: goal.yearsToGoal })}
              </span>
            </div>
          </div>

          {product.planNumber === "733" ? (
            <Plan733Configurator product={product} goal={goal} locale={locale} />
          ) : product.planNumber === "736" ? (
            <Plan736Configurator product={product} goal={goal} locale={locale} />
          ) : product.planNumber === "774" ? (
            <Plan774Configurator product={product} goal={goal} locale={locale} />
          ) : product.planNumber === "717" ? (
            <StandardEndowmentConfigurator product={product} goal={goal} locale={locale} config={PLAN_717_CONFIG} />
          ) : product.planNumber === "714" ? (
            <StandardEndowmentConfigurator product={product} goal={goal} locale={locale} config={PLAN_714_CONFIG} />
          ) : product.planNumber === "715" ? (
            <StandardEndowmentConfigurator product={product} goal={goal} locale={locale} config={PLAN_715_CONFIG} />
          ) : product.planNumber === "912" ? (
            <StandardEndowmentConfigurator product={product} goal={goal} locale={locale} config={PLAN_912_CONFIG} />
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-ink-500">
                  👤 {t("common.eligibilityLabel", locale)}
                </p>
                <p className="text-amber-700">{eligibilityText}</p>
                {eligibilityReason && (
                  <p className="mt-0.5 text-xs text-ink-500">{eligibilityReason}</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-ink-500">
                  🧾 {t("common.premiumLabel", locale)}
                </p>
                <p className="text-amber-700">
                  {premium?.available && premium.premium != null
                    ? `${formatINRCompact(premium.premium)}${t("common.perYearSuffix", locale)}`
                    : t("lic.premiumUnavailable", locale)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-ink-500">
                  ❤️ {t("common.familyProtectionLabel", locale)}
                </p>
                {guaranteed ? (
                  <p className="text-ink-900">
                    {t("lic.deathBenefitStructure", locale, {
                      income: formatINRCompact(guaranteed.deathBenefitAnnualIncomePerYear),
                      lumpsum: formatINRCompact(guaranteed.deathBenefitMaturityComponent),
                    })}
                  </p>
                ) : (
                  <p className="text-amber-700">{t("common.notCalculated", locale)}</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-ink-500">
                  🎯 {t("common.maturityLabel", locale)}
                </p>
                {benefits?.available && benefits.maturityBenefit != null ? (
                  <p className="text-ink-900">
                    {t("lic.maturityGuaranteed", locale, {
                      amount: formatINRCompact(benefits.maturityBenefit),
                    })}
                  </p>
                ) : (
                  <p className="text-amber-700">{t("common.notCalculated", locale)}</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-ink-500">
                  🎁 {t("common.bonusesLabel", locale)}
                </p>
                <p className="text-ink-500">{t("common.bonusDisclaimer", locale)}</p>
              </div>

              {guaranteed && (
                <Disclosure locale={locale} label={t("common.howCalculated", locale)}>
                  {t("lic.calculationExplain", locale)}
                </Disclosure>
              )}
            </>
          )}
        </div>

        <p className="mt-5 text-xs font-medium text-ink-700">
          {t("common.underwritingDisclaimer", locale)}
        </p>

        <div className="mt-3 rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
          {t("lic.verifyBeforeSale", locale, { url: product.officialSourceUrl })}
        </div>
      </div>
    </div>
  );
}
