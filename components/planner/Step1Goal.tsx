"use client";

import { GoalInput } from "@/types";
import { GOAL_TYPE_OPTIONS, RISK_COMFORT_OPTIONS } from "@/data/goalOptions";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { formatINRCompact } from "@/lib/calculations/format";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function Step1Goal({
  goal,
  onChange,
  locale,
}: {
  goal: GoalInput;
  onChange: (goal: GoalInput) => void;
  locale: Locale;
}) {
  const set = <K extends keyof GoalInput>(key: K, value: GoalInput[K]) =>
    onChange({ ...goal, [key]: value });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">{t("goals.title", locale)}</h2>
        <p className="text-sm text-ink-500 mt-1">{t("goals.subtitle", locale)}</p>
      </div>

      <Card>
        <p className="text-sm font-semibold text-ink-700 mb-3">
          {t("goals.chooseGoal", locale)}
        </p>
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
                  {t(opt.label, locale)}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <Slider
          label={t("goals.age", locale)}
          emoji="🎂"
          value={goal.age}
          min={18}
          max={70}
          displayValue={t("common.yearsValueShort", locale, { n: goal.age })}
          onChange={(v) => set("age", v)}
        />
        <Slider
          label={t("goals.monthlyBudget", locale)}
          emoji="💰"
          value={goal.monthlyBudget}
          min={500}
          max={100000}
          step={500}
          displayValue={formatINRCompact(goal.monthlyBudget)}
          onChange={(v) => set("monthlyBudget", v)}
        />
        <Slider
          label={t("goals.targetAmount", locale)}
          emoji="🎯"
          value={goal.targetAmount}
          min={100000}
          max={50000000}
          step={100000}
          displayValue={formatINRCompact(goal.targetAmount)}
          onChange={(v) => set("targetAmount", v)}
        />
        <Slider
          label={t("goals.yearsToGoal", locale)}
          emoji="⏳"
          value={goal.yearsToGoal}
          min={1}
          max={40}
          displayValue={t("common.yearsValueShort", locale, { n: goal.yearsToGoal })}
          onChange={(v) => set("yearsToGoal", v)}
        />
        <Slider
          label={t("goals.existingLifeCover", locale)}
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
        <p className="text-sm font-semibold text-ink-700 mb-3">{t("risk.title", locale)}</p>
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
                  {t(opt.label, locale)}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
