import { GoalNeedResult } from "@/lib/planning/goalNeeds";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function GoalSummaryCard({
  profile,
  goalNeed,
  locale,
}: {
  profile: CustomerFinancialProfile;
  goalNeed: GoalNeedResult;
  locale: Locale;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-bold text-ink-900">{t("results.goal.title", locale)}</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-ink-500">{t("results.goal.target", locale)}</p>
          <p className="text-lg font-bold text-ink-900">
            {profile.targetGoalAmount != null ? formatINRCompact(profile.targetGoalAmount) : t("results.goal.notProvided", locale)}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-500">{t("results.goal.time", locale)}</p>
          <p className="text-lg font-bold text-ink-900">
            {profile.yearsToGoal != null
              ? t("common.yearsValue", locale, { n: profile.yearsToGoal })
              : t("results.goal.notProvided", locale)}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-500">{t("results.goal.currentResources", locale)}</p>
          <p className="text-base font-semibold text-ink-900">
            {profile.existingInvestments != null
              ? formatINRCompact(profile.existingInvestments)
              : t("results.goal.notProvided", locale)}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-500">{t("results.goal.goalGap", locale)}</p>
          <p className="text-base font-semibold text-ink-900">
            {goalNeed.remainingGoalGap != null ? formatINRCompact(goalNeed.remainingGoalGap) : t("results.goal.notProvided", locale)}
          </p>
        </div>
      </div>
    </Card>
  );
}
