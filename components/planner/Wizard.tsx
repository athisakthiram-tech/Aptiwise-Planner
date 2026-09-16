"use client";

import { useState } from "react";
import { GoalInput, PlanBuilderSelection, StrategyId } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Step1Goal } from "@/components/planner/Step1Goal";
import { Step2Summary } from "@/components/planner/Step2Summary";
import { StepGoalGap } from "@/components/planner/StepGoalGap";
import { StepPlanBuilder } from "@/components/planner/StepPlanBuilder";
import { StepLicOptions } from "@/components/planner/StepLicOptions";
import { Step3Strategy } from "@/components/planner/Step3Strategy";
import { Step4Compare } from "@/components/planner/Step4Compare";
import { Step5Investment } from "@/components/planner/Step5Investment";
import { Step6Risk } from "@/components/planner/Step6Risk";
import { Step7Family } from "@/components/planner/Step7Family";
import { Step8Final } from "@/components/planner/Step8Final";
import { Button } from "@/components/ui/Button";
import { Locale, LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";
import { ILLUSTRATION_RATES_PCT } from "@/lib/calculations/sip";
import { DEFAULT_PROTECTION_ALLOCATION_PERCENT } from "@/lib/planner/planBuilder";

export const TOTAL_STEPS = 11;

const DEFAULT_GOAL: GoalInput = {
  age: 35,
  monthlyBudget: 10000,
  goalType: "child_education",
  targetAmount: 5000000,
  yearsToGoal: 15,
  existingLifeCover: 1000000,
  riskComfort: "medium",
};

// Starting illustration only — not a recommendation (see
// lib/planner/planBuilder.ts).
const DEFAULT_PLAN_BUILDER_SELECTION: PlanBuilderSelection = {
  protectionAllocation: Math.round(
    (DEFAULT_PROTECTION_ALLOCATION_PERCENT / 100) * DEFAULT_GOAL.monthlyBudget
  ),
  annualScenarioRate: ILLUSTRATION_RATES_PCT[0],
};

export function Wizard() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<GoalInput>(DEFAULT_GOAL);
  const [strategyId, setStrategyId] = useState<StrategyId>("balanced");
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [planBuilderSelection, setPlanBuilderSelection] = useState<PlanBuilderSelection>(
    DEFAULT_PLAN_BUILDER_SELECTION
  );

  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const canAdvance = step !== 6 || Boolean(strategyId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧭</span>
          <h1 className="text-lg font-bold tracking-tight">Aptiwise Planner</h1>
        </div>
        <div className="flex gap-1">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLocale(l.code)}
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                locale === l.code ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <ProgressBar step={step} totalSteps={TOTAL_STEPS} locale={locale} />

      <div className="min-h-[420px]">
        {step === 1 && <Step1Goal goal={goal} onChange={setGoal} locale={locale} />}
        {step === 2 && <Step2Summary goal={goal} locale={locale} />}
        {step === 3 && <StepGoalGap goal={goal} locale={locale} />}
        {step === 4 && (
          <StepPlanBuilder
            goal={goal}
            selection={planBuilderSelection}
            onChange={setPlanBuilderSelection}
            locale={locale}
          />
        )}
        {step === 5 && <StepLicOptions goal={goal} locale={locale} />}
        {step === 6 && (
          <Step3Strategy selectedId={strategyId} onSelect={setStrategyId} locale={locale} />
        )}
        {step === 7 && <Step4Compare locale={locale} />}
        {step === 8 && <Step5Investment goal={goal} locale={locale} />}
        {step === 9 && <Step6Risk locale={locale} />}
        {step === 10 && <Step7Family locale={locale} />}
        {step === 11 && <Step8Final goal={goal} strategyId={strategyId} locale={locale} />}
      </div>

      <div className="flex items-center justify-between gap-3 pb-2">
        <Button
          variant="secondary"
          onClick={goBack}
          disabled={step === 1}
          className="flex-1"
        >
          ← {t("common.back", locale)}
        </Button>
        {step < TOTAL_STEPS ? (
          <Button onClick={goNext} disabled={!canAdvance} className="flex-1">
            {t("common.continue", locale)} →
          </Button>
        ) : (
          <Button onClick={() => setStep(1)} className="flex-1">
            {t("common.startOver", locale)} ↺
          </Button>
        )}
      </div>
    </div>
  );
}
