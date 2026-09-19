// Stage C, Section 9/14: the saved plan's product structure. Every LIC
// product is identified by name + Plan Number + UIN together (never name
// alone) — Plan Number/UIN are literal, untranslated labels, matching the
// existing precedent in components/planner/results/StrategyDetails.tsx.

import { CustomerPlan } from "@/lib/customerPlan/types";
import { categoryI18nKey } from "@/lib/planning/resultsViewModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/planner/results/StatusBadge";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-ink-500">{label}</span>
      <span className="text-right font-medium text-ink-900">{value}</span>
    </div>
  );
}

function ValueRow({
  labelKey,
  value,
  status,
  locale,
}: {
  labelKey: string;
  value: number | null;
  status: import("@/types/insurance").ValueStatus;
  locale: Locale;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-ink-500">{t(labelKey, locale)}</span>
      <span className="flex items-center gap-1.5 font-medium text-ink-900">
        {value != null ? formatINRCompact(value) : "—"}
        <StatusBadge status={status} locale={locale} />
      </span>
    </div>
  );
}

export function PlanStructure({ plan, locale }: { plan: CustomerPlan; locale: Locale }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-ink-900">{t("customerPlan.planStructure", locale)}</p>
      {plan.selectedStrategy.components.map((component, i) => (
        <Card key={i} className="flex flex-col gap-2.5">
          {component.product ? (
            <>
              <p className="text-sm font-bold text-ink-900">{component.product.productName}</p>
              <IdentityRow label="Plan Number" value={component.product.planNumber} />
              <IdentityRow label="UIN" value={component.product.uin} />
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-500">{t("results.detail.category", locale)}</span>
                <span className="font-medium text-ink-900">{t(categoryI18nKey(component.product.category), locale)}</span>
              </div>
            </>
          ) : (
            <p className="text-sm font-bold text-ink-900">{t("results.strategy.investmentLabel", locale)}</p>
          )}

          <ValueRow labelKey="results.detail.premiumStatus" value={component.premium.value} status={component.premium.status} locale={locale} />
          <ValueRow labelKey="results.detail.protection" value={component.deathBenefit.value} status={component.deathBenefit.status} locale={locale} />
          <ValueRow labelKey="results.detail.maturityBenefit" value={component.maturityBenefit.value} status={component.maturityBenefit.status} locale={locale} />

          {component.investmentIllustration && (
            <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-2.5 text-xs">
              <p className="font-semibold text-ink-700">
                📈 {t("results.journey.investmentIllustration", locale)}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">{t("results.detail.premiumStatus", locale)}</span>
                <span className="font-medium text-ink-900">
                  {formatINRCompact(component.investmentIllustration.contributionAmount)}
                  {t("common.perMonthSuffix", locale)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">{t("results.goal.time", locale)}</span>
                <span className="font-medium text-ink-900">
                  {t("common.yearsValue", locale, { n: component.investmentIllustration.years })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">{t("sip.ratePa", locale, { rate: component.investmentIllustration.ratePct })}</span>
                <span className="font-medium text-ink-900">{formatINRCompact(component.investmentIllustration.projectedValue)}</span>
              </div>
              <p className="text-ink-500">{t("results.warning.illustration_only_not_guaranteed_returns", locale)}</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
