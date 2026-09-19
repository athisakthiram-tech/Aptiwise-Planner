"use client";

// Section 9: Goal Coverage visualization. Structure value is only ever
// shown at the status the engine reported for it (verified/illustrative/
// unavailable) — never upgraded, and an illustrative figure is always
// labeled as such (Section 9's "clearly label illustrative goal values").

import { GoalVisualData } from "@/lib/planning/resultsViewModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { StatusBadge } from "@/components/planner/results/StatusBadge";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function GoalCoverageVisual({ data, locale }: { data: GoalVisualData; locale: Locale }) {
  if (data.targetGoal == null || data.coveragePercent == null) {
    return <p className="text-xs text-amber-700">{t("results.goalVisual.unavailable", locale)}</p>;
  }

  const pct = Math.min(100, Math.max(0, data.coveragePercent));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-500">{t("results.goalVisual.currentResources", locale)}</span>
        <span className="font-semibold text-ink-900">
          {data.currentResources != null ? formatINRCompact(data.currentResources) : t("results.goal.notProvided", locale)}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-500">{t("results.goalVisual.structureValue", locale)}</span>
        <span className="flex items-center gap-1.5 font-semibold text-ink-900">
          {data.structureValue != null ? formatINRCompact(data.structureValue) : t("results.goal.notProvided", locale)}
          <StatusBadge status={data.structureValueStatus} locale={locale} />
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-500">{t("results.goalVisual.remainingGap", locale)}</span>
        <span className="font-semibold text-ink-900">
          {data.remainingGap != null ? formatINRCompact(data.remainingGap) : t("results.goal.notProvided", locale)}
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs font-semibold text-ink-700">{t("results.goalVisual.coveragePercent", locale, { pct })}</p>

      {data.structureValueStatus === "illustrative" && (
        <p className="text-xs text-ink-500">{t("results.goalVisual.illustrativeNote", locale)}</p>
      )}
    </div>
  );
}
