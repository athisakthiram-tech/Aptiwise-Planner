import { GoalInput } from "@/types";
import { buildInvestmentProjections } from "@/lib/calculations/sip";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function Step5Investment({ goal, locale }: { goal: GoalInput; locale: Locale }) {
  const projections = buildInvestmentProjections({
    monthlyAmount: goal.monthlyBudget,
    years: goal.yearsToGoal,
  });
  const maxValue = Math.max(...projections.map((p) => p.futureValue));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">{t("sip.title", locale)}</h2>
        <p className="text-sm text-ink-500 mt-1">
          {t("sip.subtitle", locale, {
            amount: formatINRCompact(goal.monthlyBudget),
            years: goal.yearsToGoal,
          })}
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        {projections.map((p) => {
          const widthPct = Math.max(8, Math.round((p.futureValue / maxValue) * 100));
          return (
            <div key={p.annualRatePct}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-semibold text-ink-700">
                  {t("sip.ratePa", locale, { rate: p.annualRatePct })}
                </span>
                <span className="text-lg font-bold text-ink-900">
                  {formatINRCompact(p.futureValue)}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </Card>

      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        {t("sip.disclaimer", locale)}
      </div>
    </div>
  );
}
