"use client";

import { useState } from "react";
import { GoalInput, StrategyId } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Step1Goal } from "@/components/planner/Step1Goal";
import { Step2Summary } from "@/components/planner/Step2Summary";
import { Step3Strategy } from "@/components/planner/Step3Strategy";
import { Step4Compare } from "@/components/planner/Step4Compare";
import { Step5Investment } from "@/components/planner/Step5Investment";
import { Step6Risk } from "@/components/planner/Step6Risk";
import { Step7Family } from "@/components/planner/Step7Family";
import { Step8Final } from "@/components/planner/Step8Final";
import { Button } from "@/components/ui/Button";

export const TOTAL_STEPS = 8;

const DEFAULT_GOAL: GoalInput = {
  age: 35,
  monthlyBudget: 10000,
  goalType: "child_education",
  targetAmount: 5000000,
  yearsToGoal: 15,
  existingLifeCover: 1000000,
  riskComfort: "medium",
};

export function Wizard() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<GoalInput>(DEFAULT_GOAL);
  const [strategyId, setStrategyId] = useState<StrategyId>("balanced");

  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const canAdvance = step !== 3 || Boolean(strategyId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-2 pt-1">
        <span className="text-2xl">🧭</span>
        <h1 className="text-lg font-bold tracking-tight">Aptiwise Planner</h1>
      </header>

      <ProgressBar step={step} totalSteps={TOTAL_STEPS} />

      <div className="min-h-[420px]">
        {step === 1 && <Step1Goal goal={goal} onChange={setGoal} />}
        {step === 2 && <Step2Summary goal={goal} />}
        {step === 3 && (
          <Step3Strategy selectedId={strategyId} onSelect={setStrategyId} />
        )}
        {step === 4 && <Step4Compare />}
        {step === 5 && <Step5Investment goal={goal} />}
        {step === 6 && <Step6Risk />}
        {step === 7 && <Step7Family />}
        {step === 8 && <Step8Final goal={goal} strategyId={strategyId} />}
      </div>

      <div className="flex items-center justify-between gap-3 pb-2">
        <Button
          variant="secondary"
          onClick={goBack}
          disabled={step === 1}
          className="flex-1"
        >
          ← Back
        </Button>
        {step < TOTAL_STEPS ? (
          <Button onClick={goNext} disabled={!canAdvance} className="flex-1">
            Continue →
          </Button>
        ) : (
          <Button onClick={() => setStep(1)} className="flex-1">
            Start Over ↺
          </Button>
        )}
      </div>
    </div>
  );
}
