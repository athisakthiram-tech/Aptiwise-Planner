"use client";

import { useState } from "react";
import { GoalInput, StrategyId } from "@/types";
import { getGoalOption } from "@/data/goalOptions";
import { getStrategyById } from "@/lib/recommendations/strategies";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function Step8Final({
  goal,
  strategyId,
  locale,
}: {
  goal: GoalInput;
  strategyId: StrategyId;
  locale: Locale;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const goalOption = getGoalOption(goal.goalType);
  const strategy = getStrategyById(strategyId)!;

  const showComingNext = (featureKey: string) =>
    setNotice(t("finalPlan.comingNext", locale, { feature: t(featureKey, locale) }));

  return (
    <div className="flex flex-col gap-5">
      <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white ring-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
          {t("finalPlan.title", locale)}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-3xl">{goalOption.emoji}</span>
          <span className="text-xl font-extrabold">{t(goalOption.label, locale)}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <div className="text-brand-100 text-xs">{t("finalPlan.duration", locale)}</div>
            <div className="font-bold">{t("common.yearsValue", locale, { n: goal.yearsToGoal })}</div>
          </div>
          <div>
            <div className="text-brand-100 text-xs">💰 {t("goals.monthlyBudget", locale)}</div>
            <div className="font-bold">{formatINRCompact(goal.monthlyBudget)}</div>
          </div>
          <div>
            <div className="text-brand-100 text-xs">🛡️ {t("protection.label", locale)}</div>
            <div className="font-bold">{formatINRCompact(goal.existingLifeCover)}</div>
          </div>
          <div>
            <div className="text-brand-100 text-xs">
              {t("finalPlan.investmentAllocation", locale)}
            </div>
            <div className="font-bold">{strategy.growthAllocationPct}%</div>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-white/10 p-3">
          <div className="text-brand-100 text-xs">{t("finalPlan.selectedStrategy", locale)}</div>
          <div className="font-bold">
            {strategy.emoji} {t(strategy.title, locale)}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" onClick={() => showComingNext("finalPlan.sharePlan")}>
          {t("finalPlan.share", locale)}
        </Button>
        <Button variant="secondary" onClick={() => showComingNext("finalPlan.downloadPlan")}>
          {t("finalPlan.download", locale)}
        </Button>
        <Button variant="secondary" onClick={() => showComingNext("finalPlan.savePlan")}>
          {t("finalPlan.save", locale)}
        </Button>
      </div>

      {notice && (
        <div className="rounded-xl2 bg-slate-100 p-3.5 text-xs text-ink-700 text-center">
          {notice}
        </div>
      )}

      <div className="rounded-xl2 bg-slate-100 p-3.5 text-xs text-ink-500 leading-relaxed">
        {t("finalPlan.disclaimer", locale)}
      </div>
    </div>
  );
}
