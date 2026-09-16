"use client";

import { GoalInput, PlanBuilderSelection } from "@/types";
import { getGoalOption } from "@/data/goalOptions";
import { ILLUSTRATION_RATES_PCT } from "@/lib/calculations/sip";
import { formatINRCompact } from "@/lib/calculations/format";
import { buildPlan, PLAN_STRUCTURE_PRESETS } from "@/lib/planner/planBuilder";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function StepPlanBuilder({
  goal,
  selection,
  onChange,
  locale,
}: {
  goal: GoalInput;
  selection: PlanBuilderSelection;
  onChange: (next: PlanBuilderSelection) => void;
  locale: Locale;
}) {
  const goalOption = getGoalOption(goal.goalType);
  // Defensive clamp for display only — buildPlan() clamps identically, so
  // this never disagrees with the calculated result even if the customer
  // lowered their monthly budget after this allocation was set.
  const protectionAllocation = Math.min(selection.protectionAllocation, goal.monthlyBudget);
  const goalAllocation = goal.monthlyBudget - protectionAllocation;

  const result = buildPlan({
    targetAmount: goal.targetAmount,
    monthlyBudget: goal.monthlyBudget,
    years: goal.yearsToGoal,
    protectionAllocation,
    annualScenarioRate: selection.annualScenarioRate,
  });

  const setProtectionAllocation = (value: number) =>
    onChange({ ...selection, protectionAllocation: value });
  const setScenarioRate = (rate: number) => onChange({ ...selection, annualScenarioRate: rate });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">{t("planBuilder.title", locale)}</h2>
        <p className="text-sm text-ink-500 mt-1">{t("planBuilder.subtitle", locale)}</p>
      </div>

      <Card>
        <p className="text-xs font-semibold text-ink-500">
          {t("planBuilder.monthlyCapacity", locale)}
        </p>
        <p className="text-2xl font-extrabold text-ink-900">
          {formatINRCompact(goal.monthlyBudget)}
        </p>
        <p className="mt-1 text-xs text-ink-500">{t("planBuilder.startingIllustration", locale)}</p>
      </Card>

      <Card className="flex flex-col gap-4">
        <Slider
          label={t("planBuilder.protectionAllocationLabel", locale)}
          emoji="🛡️"
          value={protectionAllocation}
          min={0}
          max={goal.monthlyBudget}
          step={500}
          displayValue={`${formatINRCompact(protectionAllocation)}${t("common.perMonthSuffix", locale)}`}
          onChange={setProtectionAllocation}
        />
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>
            🛡️ {t("protection.label", locale)}: {formatINRCompact(protectionAllocation)}
            {t("common.perMonthSuffix", locale)}
          </span>
          <span>
            📈 {t("planBuilder.goalBuilding", locale)}: {formatINRCompact(goalAllocation)}
            {t("common.perMonthSuffix", locale)}
          </span>
        </div>
      </Card>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">{t("planBuilder.scenario", locale)}</p>
        <div className="flex flex-wrap gap-2">
          {ILLUSTRATION_RATES_PCT.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setScenarioRate(rate)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                selection.annualScenarioRate === rate
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-ink-700"
              }`}
            >
              {t("goalGap.illustration", locale, { rate })}
            </button>
          ))}
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-ink-700">
          {t("planBuilder.yearIllustration", locale, { years: goal.yearsToGoal })}
        </p>

        <div>
          <div className="mb-1 flex justify-between text-xs text-ink-500">
            <span>🎯 {t("goalGap.goalLabel", locale)}</span>
            <span className="font-semibold text-ink-900">
              {formatINRCompact(goal.targetAmount)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full rounded-full bg-ink-900" />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-ink-500">
            <span>📊 {t("planBuilder.illustrativeGoalValue", locale)}</span>
            <span className="font-semibold text-ink-900">
              {formatINRCompact(result.illustrativeGoalValue)} ·{" "}
              {t("goalGap.ofGoal", locale, { percent: result.goalCoveragePercent })}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.min(100, result.goalCoveragePercent)}%` }}
            />
          </div>
        </div>

        {result.goalGap > 0 ? (
          <div className="flex justify-between text-sm">
            <span className="text-amber-700">⚠️ {t("planBuilder.potentialGap", locale)}</span>
            <span className="font-semibold text-amber-700">
              {formatINRCompact(result.goalGap)}
            </span>
          </div>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="text-brand-700">✓ {t("planBuilder.targetReached", locale)}</span>
            <span className="font-semibold text-brand-700">
              {formatINRCompact(result.goalSurplus)}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5 rounded-lg bg-slate-50 p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-ink-500">
              💰 {t("planBuilder.youContributeTowardGoal", locale)}
            </span>
            <span className="font-medium text-ink-900">
              {formatINRCompact(result.goalContribution)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">📈 {t("goalGap.illustrativeGrowth", locale)}</span>
            <span className="font-medium text-ink-900">
              {formatINRCompact(result.illustrativeGrowth)}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-500">
            🛡️ {t("planBuilder.protectionAdequacy", locale)}
          </span>
          <span className="text-xs font-semibold text-amber-700">
            ⚠️ {t("planBuilder.needsAssessment", locale)}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-500">{t("planBuilder.protectionAdequacyNote", locale)}</p>
      </Card>

      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        ⚠️ {t("common.notGuaranteed", locale)}
      </div>

      <div>
        <p className="text-sm font-semibold text-ink-700 mb-1">
          {t("planBuilder.compareStructures", locale)}
        </p>
        <p className="text-xs text-ink-500 mb-3">{t("planBuilder.structuresDisclaimer", locale)}</p>

        <div className="flex flex-col gap-3">
          {PLAN_STRUCTURE_PRESETS.map((preset) => {
            const presetProtection = Math.round(
              (preset.protectionPercent / 100) * goal.monthlyBudget
            );
            const presetResult = buildPlan({
              targetAmount: goal.targetAmount,
              monthlyBudget: goal.monthlyBudget,
              years: goal.yearsToGoal,
              protectionAllocation: presetProtection,
              annualScenarioRate: selection.annualScenarioRate,
            });
            return (
              <Card key={preset.id}>
                <p className="text-sm font-bold text-ink-900">{t(preset.labelKey, locale)}</p>
                <p className="text-xs text-ink-500">
                  {goalOption.emoji} {t(goalOption.label, locale)}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-ink-500">
                      🛡️ {t("planBuilder.protectionPerMonth", locale)}
                    </div>
                    <div className="font-semibold text-ink-900">
                      {formatINRCompact(presetResult.protectionAllocation)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-ink-500">
                      📈 {t("planBuilder.goalBuildingPerMonth", locale)}
                    </div>
                    <div className="font-semibold text-ink-900">
                      {formatINRCompact(presetResult.goalAllocation)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-ink-500">
                      💰 {t("planBuilder.goalContributionLabel", locale)}
                    </div>
                    <div className="font-semibold text-ink-900">
                      {formatINRCompact(presetResult.goalContribution)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-ink-500">
                      📊 {t("planBuilder.illustrativeGoalValue", locale)}
                    </div>
                    <div className="font-semibold text-ink-900">
                      {formatINRCompact(presetResult.illustrativeGoalValue)}
                    </div>
                  </div>
                </div>
                <p
                  className={`mt-2 text-xs font-semibold ${
                    presetResult.goalGap > 0 ? "text-amber-700" : "text-brand-700"
                  }`}
                >
                  {presetResult.goalGap > 0
                    ? `⚠️ ${t("planBuilder.potentialGap", locale)}: ${formatINRCompact(presetResult.goalGap)}`
                    : `✓ ${t("planBuilder.targetReached", locale)}`}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
