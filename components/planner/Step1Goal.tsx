"use client";

import { GoalInput } from "@/types";
import { GOAL_TYPE_OPTIONS, RISK_COMFORT_OPTIONS } from "@/data/goalOptions";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { formatINRCompact } from "@/lib/calculations/format";

export function Step1Goal({
  goal,
  onChange,
}: {
  goal: GoalInput;
  onChange: (goal: GoalInput) => void;
}) {
  const set = <K extends keyof GoalInput>(key: K, value: GoalInput[K]) =>
    onChange({ ...goal, [key]: value });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">Let&apos;s plan your goal 🎯</h2>
        <p className="text-sm text-ink-500 mt-1">
          A few quick details to build a visual plan together.
        </p>
      </div>

      <Card>
        <p className="text-sm font-semibold text-ink-700 mb-3">Choose a goal</p>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_TYPE_OPTIONS.map((opt) => {
            const active = opt.id === goal.goalType;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => set("goalType", opt.id)}
                className={`rounded-xl border-2 px-3 py-3 text-left transition ${
                  active
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="text-xl">{opt.emoji}</div>
                <div className="mt-1 text-xs font-semibold text-ink-900">
                  {opt.label}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <Slider
          label="Your age"
          emoji="🎂"
          value={goal.age}
          min={18}
          max={70}
          displayValue={`${goal.age} yrs`}
          onChange={(v) => set("age", v)}
        />
        <Slider
          label="Monthly budget"
          emoji="💰"
          value={goal.monthlyBudget}
          min={500}
          max={100000}
          step={500}
          displayValue={formatINRCompact(goal.monthlyBudget)}
          onChange={(v) => set("monthlyBudget", v)}
        />
        <Slider
          label="Target amount"
          emoji="🎯"
          value={goal.targetAmount}
          min={100000}
          max={50000000}
          step={100000}
          displayValue={formatINRCompact(goal.targetAmount)}
          onChange={(v) => set("targetAmount", v)}
        />
        <Slider
          label="Years to goal"
          emoji="⏳"
          value={goal.yearsToGoal}
          min={1}
          max={40}
          displayValue={`${goal.yearsToGoal} yrs`}
          onChange={(v) => set("yearsToGoal", v)}
        />
        <Slider
          label="Existing life cover"
          emoji="🛡️"
          value={goal.existingLifeCover}
          min={0}
          max={20000000}
          step={100000}
          displayValue={formatINRCompact(goal.existingLifeCover)}
          onChange={(v) => set("existingLifeCover", v)}
        />
      </Card>

      <Card>
        <p className="text-sm font-semibold text-ink-700 mb-3">
          Risk comfort
        </p>
        <div className="grid grid-cols-3 gap-2">
          {RISK_COMFORT_OPTIONS.map((opt) => {
            const active = opt.id === goal.riskComfort;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => set("riskComfort", opt.id)}
                className={`rounded-xl border-2 py-3 text-center transition ${
                  active
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="text-xl">{opt.emoji}</div>
                <div className="mt-1 text-xs font-semibold text-ink-900">
                  {opt.label}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
