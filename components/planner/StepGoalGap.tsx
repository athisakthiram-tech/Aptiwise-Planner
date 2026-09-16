"use client";

import { useMemo, useState } from "react";
import { GoalInput } from "@/types";
import { getGoalOption } from "@/data/goalOptions";
import { calculateGoalGap } from "@/lib/calculations/goalGap";
import { formatINR, formatINRCompact } from "@/lib/calculations/format";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";
import { Card } from "@/components/ui/Card";

export function StepGoalGap({ goal, locale }: { goal: GoalInput; locale: Locale }) {
  const gapResult = useMemo(
    () =>
      calculateGoalGap({
        targetAmount: goal.targetAmount,
        monthlyBudget: goal.monthlyBudget,
        years: goal.yearsToGoal,
      }),
    [goal.targetAmount, goal.monthlyBudget, goal.yearsToGoal]
  );
  const goalOption = getGoalOption(goal.goalType);
  const [selectedRate, setSelectedRate] = useState(gapResult.scenarios[0]?.annualRatePct);
  const selected =
    gapResult.scenarios.find((s) => s.annualRatePct === selectedRate) ?? gapResult.scenarios[0];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold text-ink-500">{t("goalGap.title", locale)}</p>
        <div className="mt-1 flex items-center gap-2 text-sm text-ink-700">
          <span>{goalOption.emoji}</span>
          <span>{goalOption.label}</span>
        </div>
        <div className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">
          {formatINRCompact(goal.targetAmount)}
        </div>
        <p className="text-xs text-ink-500">
          {t("goalGap.neededIn", locale, { years: goal.yearsToGoal })}
        </p>
      </div>

      <Card>
        <p className="text-xs font-semibold text-ink-500">💰 {t("goalGap.canSetAside", locale)}</p>
        <p className="text-xl font-bold text-ink-900">
          {formatINRCompact(goal.monthlyBudget)}
          {t("common.perMonthSuffix", locale)}
        </p>
      </Card>

      <Card>
        <p className="text-xs font-semibold text-ink-500">{t("goalGap.yourContributions", locale)}</p>
        <p className="text-xl font-bold text-ink-900">{formatINR(gapResult.totalContributions)}</p>
      </Card>

      <div>
        <p className="text-sm font-semibold text-ink-700 mb-1">
          📊 {t("goalGap.journeyTitle", locale)}
        </p>
        <p className="text-xs text-ink-500 mb-3">{t("goalGap.chooseScenario", locale)}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {gapResult.scenarios.map((s) => (
            <button
              key={s.annualRatePct}
              type="button"
              onClick={() => setSelectedRate(s.annualRatePct)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                selectedRate === s.annualRatePct
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-ink-700"
              }`}
            >
              {t("goalGap.illustration", locale, { rate: s.annualRatePct })}
            </button>
          ))}
        </div>

        {selected && (
          <Card className="flex flex-col gap-4">
            <div>
              <div className="mb-1 flex justify-between text-xs text-ink-500">
                <span>🎯 {t("goalGap.goalLabel", locale)}</span>
                <span className="font-semibold text-ink-900">
                  {formatINRCompact(gapResult.targetAmount)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-full rounded-full bg-ink-900" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs text-ink-500">
                <span>📈 {t("goalGap.illustrativeValue", locale)}</span>
                <span className="font-semibold text-ink-900">
                  {formatINRCompact(selected.projectedValue)} ·{" "}
                  {t("goalGap.ofGoal", locale, { percent: selected.goalCoveragePercent })}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${Math.min(100, selected.goalCoveragePercent)}%` }}
                />
              </div>
            </div>

            {selected.gap > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-amber-700">⚠️ {t("goalGap.potentialGap", locale)}</span>
                <span className="font-semibold text-amber-700">
                  {formatINRCompact(selected.gap)}
                </span>
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-brand-700">✓ {t("goalGap.surplus", locale)}</span>
                <span className="font-semibold text-brand-700">
                  {formatINRCompact(selected.surplus)}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5 rounded-lg bg-slate-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-500">💰 {t("goalGap.youContribute", locale)}</span>
                <span className="font-medium text-ink-900">
                  {formatINRCompact(gapResult.totalContributions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">📈 {t("goalGap.illustrativeGrowth", locale)}</span>
                <span className="font-medium text-ink-900">
                  {formatINRCompact(selected.illustrativeGrowth)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">🎯 {t("goalGap.illustrativeValue", locale)}</span>
                <span className="font-medium text-ink-900">
                  {formatINRCompact(selected.projectedValue)}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        ⚠️ {t("common.notGuaranteed", locale)}
      </div>
    </div>
  );
}
