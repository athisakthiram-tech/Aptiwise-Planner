"use client";

// Top orchestrator for the customer-facing results experience (Section
// 2's journey). Computes the planning pipeline once per profile change
// (Section 20 — never re-runs all 31 product engines on every render)
// and drives a small, in-place view state machine rather than the
// wizard's linear step counter, so this stays "progressive disclosure",
// not seven separate pages.

import { useMemo, useState } from "react";
import { GoalInput } from "@/types";
import { buildProfileFromGoalInput } from "@/lib/planning/customerProfile";
import { runPlanningPipeline } from "@/lib/planning/planningPipeline";
import { groupStrategiesByFamily, toggleCompareSelection, MAX_COMPARE_SELECTIONS } from "@/lib/planning/resultsViewModel";
import { StrategyFamily, StrategyResult } from "@/lib/planning/strategyTypes";
import { FinancialPicture } from "@/components/planner/results/FinancialPicture";
import { StrategyFamilyCard } from "@/components/planner/results/StrategyFamilyCard";
import { StrategyCard } from "@/components/planner/results/StrategyCard";
import { StrategyDetails } from "@/components/planner/results/StrategyDetails";
import { StrategyComparison } from "@/components/planner/results/StrategyComparison";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

type ResultsView =
  | { kind: "overview" }
  | { kind: "family"; family: StrategyFamily }
  | { kind: "detail"; strategyId: string };

export function PlannerResults({ goal, locale }: { goal: GoalInput; locale: Locale }) {
  const [existingInvestments, setExistingInvestments] = useState<number | null>(null);
  const [outstandingLiabilities, setOutstandingLiabilities] = useState<number | null>(null);
  const [view, setView] = useState<ResultsView>({ kind: "overview" });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // Recomputed only when an actual input changes — every one of the 31
  // registered engines runs once here, not once per render.
  const profile = useMemo(
    () => ({
      ...buildProfileFromGoalInput(goal),
      existingInvestments,
      outstandingLiabilities,
    }),
    [goal, existingInvestments, outstandingLiabilities]
  );

  const pipeline = useMemo(() => runPlanningPipeline({ profile }), [profile]);
  const familyGroups = useMemo(() => groupStrategiesByFamily(pipeline.strategies), [pipeline.strategies]);

  const allStrategiesById = useMemo(() => {
    const map = new Map<string, StrategyResult>();
    for (const s of pipeline.strategies) map.set(s.id, s);
    return map;
  }, [pipeline.strategies]);

  const selectedStrategiesForCompare = compareIds
    .map((id) => allStrategiesById.get(id))
    .filter((s): s is StrategyResult => s != null);

  function toggleCompare(id: string) {
    setCompareIds((current) => toggleCompareSelection(current, id));
  }

  if (view.kind === "detail") {
    const strategy = allStrategiesById.get(view.strategyId);
    if (strategy) {
      return (
        <StrategyDetails
          strategy={strategy}
          protectionNeed={pipeline.protectionNeed}
          profile={profile}
          locale={locale}
          onBack={() => setView({ kind: "family", family: strategy.family })}
        />
      );
    }
  }

  if (view.kind === "family") {
    const group = familyGroups.find((g) => g.family === view.family);
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setView({ kind: "overview" })}
          className="self-start text-xs font-semibold text-brand-700"
        >
          {t("results.strategy.back", locale)}
        </button>
        {group?.strategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            protectionNeed={pipeline.protectionNeed}
            locale={locale}
            isSelectedForCompare={compareIds.includes(strategy.id)}
            compareDisabled={compareIds.length >= MAX_COMPARE_SELECTIONS}
            onToggleCompare={() => toggleCompare(strategy.id)}
            onOpenDetails={() => setView({ kind: "detail", strategyId: strategy.id })}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-16">
      <FinancialPicture
        profile={profile}
        protectionNeed={pipeline.protectionNeed}
        goalNeed={pipeline.goalNeed}
        locale={locale}
        existingInvestments={existingInvestments}
        outstandingLiabilities={outstandingLiabilities}
        onChangeExistingInvestments={setExistingInvestments}
        onChangeOutstandingLiabilities={setOutstandingLiabilities}
      />

      <div>
        <p className="mb-1 text-sm font-bold text-ink-900">{t("results.explore.title", locale)}</p>
        <p className="mb-3 text-xs text-ink-500">{t("results.explore.subtitle", locale)}</p>
        <div className="flex flex-col gap-3">
          {familyGroups.map((group) => (
            <StrategyFamilyCard
              key={group.family}
              group={group}
              locale={locale}
              onOpen={() => setView({ kind: "family", family: group.family })}
            />
          ))}
        </div>
      </div>

      {compareIds.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setCompareOpen((o) => !o)}
            className="w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
          >
            {t("results.compare.open", locale)} ({compareIds.length})
          </button>
          {compareOpen && (
            <div className="mt-3">
              <p className="mb-2 text-sm font-bold text-ink-900">{t("results.compare.title", locale)}</p>
              <StrategyComparison strategies={selectedStrategiesForCompare} locale={locale} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
