import { GoalInput } from "@/types";
import { getGoalOption } from "@/data/goalOptions";
import { totalPlannedContributions, goalProgressPct } from "@/lib/calculations/contributions";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function Step2Summary({ goal, locale }: { goal: GoalInput; locale: Locale }) {
  const goalOption = getGoalOption(goal.goalType);
  const totalContributions = totalPlannedContributions(
    goal.monthlyBudget,
    goal.yearsToGoal
  );
  const progressPct = goalProgressPct(totalContributions, goal.targetAmount);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">{t("summary.title", locale)}</h2>
        <p className="text-sm text-ink-500 mt-1">{t("summary.subtitle", locale)}</p>
      </div>

      <Card className="bg-brand-600 text-white ring-0">
        <div className="text-3xl">{goalOption.emoji}</div>
        <div className="mt-1 text-base font-semibold">{t(goalOption.label, locale)}</div>
        <div className="mt-4 text-xs uppercase tracking-wide text-brand-100">
          {t("goals.targetAmount", locale)}
        </div>
        <div className="text-3xl font-extrabold tracking-tight">
          {formatINRCompact(goal.targetAmount)}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          emoji="💰"
          label={t("goals.monthlyBudget", locale)}
          value={formatINRCompact(goal.monthlyBudget)}
        />
        <StatTile
          emoji="⏳"
          label={t("summary.time", locale)}
          value={t("common.yearsValue", locale, { n: goal.yearsToGoal })}
        />
        <StatTile
          emoji="🛡️"
          label={t("goals.existingLifeCover", locale)}
          value={formatINRCompact(goal.existingLifeCover)}
        />
        <StatTile
          emoji="🎂"
          label={t("summary.currentAge", locale)}
          value={t("common.yearsValueShort", locale, { n: goal.age })}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-ink-700">
            {t("summary.totalContributions", locale)}
          </p>
          <p className="text-sm font-bold text-ink-900">
            {formatINRCompact(totalContributions)}
          </p>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-500">
          {t("summary.contributionsExplain", locale, {
            amount: formatINRCompact(goal.monthlyBudget),
            years: goal.yearsToGoal,
            pct: progressPct,
          })}
        </p>
      </Card>
    </div>
  );
}
