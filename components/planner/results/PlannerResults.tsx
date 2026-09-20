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
import { generateGoalStructures } from "@/lib/planning/goalOrchestrator/goalStructureGenerator";
import { GoalStructure } from "@/lib/planning/goalOrchestrator/types";
import { FinancialPicture } from "@/components/planner/results/FinancialPicture";
import { StrategyFamilyCard } from "@/components/planner/results/StrategyFamilyCard";
import { StrategyCard } from "@/components/planner/results/StrategyCard";
import { StrategyDetails } from "@/components/planner/results/StrategyDetails";
import { StrategyComparison } from "@/components/planner/results/StrategyComparison";
import { GoalStructureCard } from "@/components/planner/results/GoalStructureCard";
import { GoalStructureTimeline } from "@/components/planner/results/GoalStructureTimeline";
import { CustomerPlanPreview } from "@/components/customerPlan/CustomerPlanPreview";
import { DraftPlans } from "@/components/customerPlan/DraftPlans";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

type ResultsView =
  | { kind: "overview" }
  | { kind: "family"; family: StrategyFamily }
  | { kind: "detail"; strategyId: string }
  | { kind: "goalDetail"; structureId: string }
  | { kind: "goalTimeline"; structureId: string }
  | { kind: "planPreview"; plan: CustomerPlan }
  | { kind: "draftPlans" };

export function PlannerResults({ goal, locale }: { goal: GoalInput; locale: Locale }) {
  const [existingInvestments, setExistingInvestments] = useState<number | null>(null);
  const [outstandingLiabilities, setOutstandingLiabilities] = useState<number | null>(null);
  const [view, setView] = useState<ResultsView>({ kind: "overview" });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  // Section 20 — optional, display-only labels. Never fed into any
  // calculation (see goalOrchestrator/types.ts's FundingContext comment);
  // a blank field is simply "not provided", never inferred.
  const [fundingPersonLabel, setFundingPersonLabel] = useState("");
  const [beneficiaryLabel, setBeneficiaryLabel] = useState("");

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

  // Goal Orchestrator V2 — a layer above the existing pipeline, reusing
  // its already-computed protectionNeed/goalNeed rather than
  // recalculating them a second time.
  const goalStructures = useMemo(
    () =>
      generateGoalStructures({
        profile,
        protectionNeed: pipeline.protectionNeed,
        goalNeed: pipeline.goalNeed,
        funding: {
          fundingPersonLabel: fundingPersonLabel.trim() ? fundingPersonLabel.trim() : null,
          beneficiaryLabel: beneficiaryLabel.trim() ? beneficiaryLabel.trim() : null,
        },
      }),
    [profile, pipeline.protectionNeed, pipeline.goalNeed, fundingPersonLabel, beneficiaryLabel]
  );

  const goalStructuresById = useMemo(() => {
    const map = new Map<string, GoalStructure>();
    for (const s of goalStructures) map.set(s.id, s);
    return map;
  }, [goalStructures]);

  const selectedStrategiesForCompare = compareIds
    .map((id) => allStrategiesById.get(id))
    .filter((s): s is StrategyResult => s != null);

  function toggleCompare(id: string) {
    setCompareIds((current) => toggleCompareSelection(current, id));
  }

  if (view.kind === "planPreview") {
    return (
      <CustomerPlanPreview
        plan={view.plan}
        locale={locale}
        onBack={() => setView({ kind: "overview" })}
        onPlanChange={(updated) => setView({ kind: "planPreview", plan: updated })}
        onViewDrafts={() => setView({ kind: "draftPlans" })}
      />
    );
  }

  if (view.kind === "draftPlans") {
    return (
      <DraftPlans
        locale={locale}
        onBack={() => setView({ kind: "overview" })}
        onOpen={(plan) => setView({ kind: "planPreview", plan })}
      />
    );
  }

  if (view.kind === "detail") {
    const strategy = allStrategiesById.get(view.strategyId);
    if (strategy) {
      return (
        <StrategyDetails
          strategy={strategy}
          protectionNeed={pipeline.protectionNeed}
          goalNeed={pipeline.goalNeed}
          profile={profile}
          locale={locale}
          onBack={() => setView({ kind: "family", family: strategy.family })}
          onCreatePlan={(plan) => setView({ kind: "planPreview", plan })}
        />
      );
    }
  }

  if (view.kind === "goalDetail") {
    const structure = goalStructuresById.get(view.structureId);
    if (structure) {
      return (
        <StrategyDetails
          strategy={structure.strategyResult}
          protectionNeed={pipeline.protectionNeed}
          goalNeed={pipeline.goalNeed}
          profile={profile}
          locale={locale}
          fundingContext={structure.funding}
          onBack={() => setView({ kind: "overview" })}
          onCreatePlan={(plan) => setView({ kind: "planPreview", plan })}
        />
      );
    }
  }

  if (view.kind === "goalTimeline") {
    const structure = goalStructuresById.get(view.structureId);
    if (structure) {
      return <GoalStructureTimeline structure={structure} locale={locale} onBack={() => setView({ kind: "overview" })} />;
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

      <button
        type="button"
        onClick={() => setView({ kind: "draftPlans" })}
        className="self-start text-xs font-semibold text-brand-700"
      >
        {t("customerPlan.viewDraftPlans", locale)}
      </button>

      <div>
        <p className="mb-1 text-sm font-bold text-ink-900">{t("goalOrchestrator.sectionTitle", locale)}</p>
        <p className="mb-3 text-xs text-ink-500">{t("goalOrchestrator.sectionSubtitle", locale)}</p>

        <Card className="mb-3 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-ink-500">{t("goalOrchestrator.goal", locale)}</span>
              <span className="font-semibold text-ink-900">
                {profile.goalType ? t(`goals.type.${profile.goalType}`, locale) : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-ink-500">{t("goalOrchestrator.monthlyCapacity", locale)}</span>
              <span className="font-semibold text-ink-900">
                {profile.monthlyBudget != null ? formatINRCompact(profile.monthlyBudget) : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-ink-500">{t("goalOrchestrator.horizon", locale)}</span>
              <span className="font-semibold text-ink-900">
                {profile.yearsToGoal != null ? t("goalOrchestrator.horizonYears", locale, { years: profile.yearsToGoal }) : "—"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-ink-500">{t("goalOrchestrator.fundingPerson", locale)}</span>
              <input
                type="text"
                value={fundingPersonLabel}
                onChange={(e) => setFundingPersonLabel(e.target.value)}
                placeholder={t("goalOrchestrator.fundingPersonInput", locale)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-ink-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-ink-500">{t("goalOrchestrator.beneficiary", locale)}</span>
              <input
                type="text"
                value={beneficiaryLabel}
                onChange={(e) => setBeneficiaryLabel(e.target.value)}
                placeholder={t("goalOrchestrator.beneficiaryInput", locale)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-ink-900"
              />
            </label>
          </div>
        </Card>

        {goalStructures.length > 0 ? (
          <div className="flex flex-col gap-3">
            {goalStructures.map((structure) => (
              <GoalStructureCard
                key={structure.id}
                structure={structure}
                protectionNeed={pipeline.protectionNeed}
                profile={profile}
                locale={locale}
                onViewTimeline={() => setView({ kind: "goalTimeline", structureId: structure.id })}
                onDetails={() => setView({ kind: "goalDetail", structureId: structure.id })}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-500">{t("goalOrchestrator.noStructures", locale)}</p>
        )}

        <p className="mt-3 text-[11px] text-ink-500">{t("goalOrchestrator.planningDisclaimer", locale)}</p>
      </div>

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
