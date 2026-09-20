"use client";

// Section 20's timeline screen — a lightweight, mobile-first cash-flow
// view with no chart dependency. Renders the phases already computed by
// lib/planning/goalOrchestrator/cashFlowTimeline.ts (no new calculation
// happens here) as a simple stacked list, one row per phase, plus a
// marker for the goal year at the horizon's end.

import { GoalStructure } from "@/lib/planning/goalOrchestrator/types";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function GoalStructureTimeline({
  structure,
  locale,
  onBack,
}: {
  structure: GoalStructure;
  locale: Locale;
  onBack: () => void;
}) {
  const { timeline } = structure;
  const horizonYear = timeline.length > 0 ? timeline[timeline.length - 1].toYear : null;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-xs font-semibold text-brand-700">
        {t("goalOrchestrator.timelineBack", locale)}
      </button>

      <p className="text-base font-bold text-ink-900">{t("goalOrchestrator.timelineTitle", locale)}</p>

      <div className="flex flex-col gap-2">
        {timeline.map((phase, i) => (
          <Card key={i} className="flex flex-col gap-2 p-4">
            <p className="text-sm font-bold text-ink-900">
              {t("goalOrchestrator.timelinePhaseYears", locale, { from: phase.fromYear, to: phase.toYear })}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{
                  width: `${phase.allocatedMonthly + phase.freeMonthly > 0 ? Math.round((phase.allocatedMonthly / (phase.allocatedMonthly + phase.freeMonthly)) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ink-500">
                {t("goalOrchestrator.timelinePaying", locale, { amount: formatINRCompact(phase.allocatedMonthly) })}
              </span>
              <span className="text-ink-500">
                {t("goalOrchestrator.timelineFree", locale, { amount: formatINRCompact(phase.freeMonthly) })}
              </span>
            </div>
            {phase.toYear === horizonYear && (
              <p className="text-xs font-semibold text-brand-700">
                {t("goalOrchestrator.timelineGoalYear", locale, { year: phase.toYear })}
              </p>
            )}
          </Card>
        ))}
        {timeline.length === 0 && <p className="text-xs text-ink-500">—</p>}
      </div>
    </div>
  );
}
