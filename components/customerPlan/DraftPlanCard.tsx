// Stage C, Section 22: one row in the local Draft Plans list — no
// complex CRM interface, just Open/Delete and the minimum identifying
// information (customer name or "Unnamed customer", goal, created date,
// selected strategy family).

import { CustomerPlanDraftSummary } from "@/lib/customerPlan/types";
import { FAMILY_META } from "@/lib/planning/resultsViewModel";
import { getGoalOption } from "@/data/goalOptions";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function DraftPlanCard({
  summary,
  locale,
  onOpen,
  onDelete,
}: {
  summary: CustomerPlanDraftSummary;
  locale: Locale;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const goalOption = summary.goalType ? getGoalOption(summary.goalType) : null;
  const createdDate = new Date(summary.createdAt).toLocaleDateString(locale === "en" ? "en-IN" : locale);

  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold text-ink-900">{summary.customerName ?? t("customerPlan.unnamedCustomer", locale)}</p>
        <p className="text-xs text-ink-500">
          {goalOption ? `${goalOption.emoji} ${t(goalOption.label, locale)}` : t("results.goal.notProvided", locale)}
          {" · "}
          {t(FAMILY_META[summary.family].titleKey, locale)}
        </p>
        <p className="text-[11px] text-ink-400">{t("customerPlan.createdOn", locale, { date: createdDate })}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onOpen} className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
          {t("customerPlan.open", locale)}
        </button>
        <button type="button" onClick={onDelete} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-900">
          {t("customerPlan.delete", locale)}
        </button>
      </div>
    </Card>
  );
}
