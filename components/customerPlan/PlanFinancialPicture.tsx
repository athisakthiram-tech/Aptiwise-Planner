// Stage C, Section 8: renders a saved CustomerPlan's financial picture
// (goal / protection / budget) using the exact same visuals as the live
// Results UI — via lib/customerPlan/planViewModel.ts's adapters, never a
// second, duplicated derivation of these figures.

import { CustomerPlan } from "@/lib/customerPlan/types";
import {
  protectionVisualDataFromPlan,
  goalVisualDataFromPlan,
  budgetPresentationFromPlan,
} from "@/lib/customerPlan/planViewModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { ProtectionVisual } from "@/components/planner/results/ProtectionVisual";
import { GoalCoverageVisual } from "@/components/planner/results/GoalCoverageVisual";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function PlanFinancialPicture({ plan, locale }: { plan: CustomerPlan; locale: Locale }) {
  const protectionVisual = protectionVisualDataFromPlan(plan);
  const goalVisual = goalVisualDataFromPlan(plan);
  const budget = budgetPresentationFromPlan(plan);

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-bold text-ink-900">{t("results.goal.title", locale)}</p>
        <GoalCoverageVisual data={goalVisual} locale={locale} />
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-bold text-ink-900">{t("results.protection.title", locale)}</p>
        <ProtectionVisual data={protectionVisual} locale={locale} />
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-sm font-bold text-ink-900">{t("results.budget.title", locale)}</p>
        {/* Section 6's critical rule, replayed from the frozen snapshot:
            never imply "within budget" when part of the premium was
            unverified at the moment this plan was created. */}
        {budget.kind === "verified" ? (
          <div className="flex flex-col gap-0.5 text-xs">
            <p className="font-semibold text-emerald-700">{t("results.budget.withinBudget", locale)}</p>
            <p className="text-ink-500">{t("results.budget.verifiedUsed", locale, { amount: formatINRCompact(budget.used) })}</p>
            {budget.remaining != null && (
              <p className="text-ink-500">{t("results.budget.remaining", locale, { amount: formatINRCompact(budget.remaining) })}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-semibold text-amber-700">{t("results.budget.premiumRequiresVerification", locale)}</p>
            {budget.illustrativeInvestmentAmount != null && (
              <p className="text-ink-500">
                {t("results.budget.investmentBeforeAdjustment", locale, {
                  amount: formatINRCompact(budget.illustrativeInvestmentAmount),
                })}
              </p>
            )}
            <p className="font-semibold text-amber-700">{t("results.budget.cannotVerifyTotal", locale)}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
