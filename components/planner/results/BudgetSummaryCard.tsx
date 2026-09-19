import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function BudgetSummaryCard({ monthlyBudget, locale }: { monthlyBudget: number | null; locale: Locale }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-sm font-bold text-ink-900">{t("results.budget.title", locale)}</p>
      <p className="text-2xl font-extrabold text-ink-900">
        {monthlyBudget != null ? formatINRCompact(monthlyBudget) : t("results.goal.notProvided", locale)}
        {monthlyBudget != null && <span className="text-sm font-medium text-ink-500">{t("common.perMonthSuffix", locale)}</span>}
      </p>
    </Card>
  );
}
