"use client";

// Screen 1 of 4 — Customer. Deliberately minimal: no underwriting
// questionnaire, no financial-engine terminology. Every field here is
// either fed straight into CustomerFinancialProfile (age/goal/amount/
// years/budget/risk) or kept purely as a display label the advisor sees
// later (customer name, profession) — never used in any calculation.

import { ReactNode } from "react";
import { GoalType, RiskComfort } from "@/types";
import { AdvisorGoalOption } from "@/lib/advisor/advisorViewModel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export interface AdvisorCustomerInput {
  customerName: string;
  profession: string;
  age: number | null;
  goalOption: AdvisorGoalOption;
  targetGoalAmount: number | null;
  yearsToGoal: number | null;
  monthlyBudget: number | null;
  riskComfort: RiskComfort | null;
}

const GOAL_OPTIONS: { id: AdvisorGoalOption; labelKey: string; emoji: string }[] = [
  { id: "child_education", labelKey: "goals.type.child_education", emoji: "🎓" },
  { id: "marriage", labelKey: "goals.type.marriage", emoji: "💍" },
  { id: "retirement", labelKey: "goals.type.retirement", emoji: "🌴" },
  { id: "wealth", labelKey: "goals.type.wealth", emoji: "💰" },
  { id: "home", labelKey: "goals.type.home", emoji: "🏠" },
  { id: "other", labelKey: "advisor.goalType.other", emoji: "✨" },
];

const RISK_OPTIONS: { id: RiskComfort; labelKey: string }[] = [
  { id: "low", labelKey: "advisor.screen1.riskConservative" },
  { id: "medium", labelKey: "advisor.screen1.riskBalanced" },
  { id: "high", labelKey: "advisor.screen1.riskGrowth" },
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-semibold text-ink-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-900";

export function ScreenCustomer({
  value,
  onChange,
  onSubmit,
  locale,
}: {
  value: AdvisorCustomerInput;
  onChange: (next: AdvisorCustomerInput) => void;
  onSubmit: () => void;
  locale: Locale;
}) {
  const set = <K extends keyof AdvisorCustomerInput>(key: K, v: AdvisorCustomerInput[K]) =>
    onChange({ ...value, [key]: v });

  const canSubmit =
    value.age != null &&
    value.age > 0 &&
    value.targetGoalAmount != null &&
    value.targetGoalAmount > 0 &&
    value.yearsToGoal != null &&
    value.yearsToGoal > 0 &&
    value.monthlyBudget != null &&
    value.monthlyBudget > 0;

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <Field label={t("advisor.screen1.customerName", locale)}>
          <input
            type="text"
            value={value.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("advisor.screen1.insurer", locale)}>
            <input type="text" value="LIC" disabled className={`${inputClass} bg-slate-50 text-ink-500`} />
          </Field>
          <Field label={t("advisor.screen1.age", locale)}>
            <input
              type="number"
              value={value.age ?? ""}
              onChange={(e) => set("age", e.target.value === "" ? null : Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label={t("advisor.screen1.profession", locale)}>
          <input
            type="text"
            value={value.profession}
            onChange={(e) => set("profession", e.target.value)}
            className={inputClass}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-bold text-ink-900">{t("advisor.screen1.goalQuestion", locale)}</p>
        <div className="grid grid-cols-3 gap-2">
          {GOAL_OPTIONS.map((opt) => {
            const active = opt.id === value.goalOption;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => set("goalOption", opt.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-center transition ${
                  active ? "border-brand-500 bg-brand-50" : "border-slate-100 bg-white"
                }`}
              >
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-[11px] font-semibold text-ink-900">{t(opt.labelKey, locale)}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("advisor.screen1.goalAmount", locale)}>
            <input
              type="number"
              value={value.targetGoalAmount ?? ""}
              onChange={(e) => set("targetGoalAmount", e.target.value === "" ? null : Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label={t("advisor.screen1.yearsToGoal", locale)}>
            <input
              type="number"
              value={value.yearsToGoal ?? ""}
              onChange={(e) => set("yearsToGoal", e.target.value === "" ? null : Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label={t("advisor.screen1.monthlyCapacity", locale)}>
          <input
            type="number"
            value={value.monthlyBudget ?? ""}
            onChange={(e) => set("monthlyBudget", e.target.value === "" ? null : Number(e.target.value))}
            className={inputClass}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink-700">{t("advisor.screen1.riskPreference", locale)}</p>
        <div className="grid grid-cols-3 gap-2">
          {RISK_OPTIONS.map((opt) => {
            const active = opt.id === value.riskComfort;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => set("riskComfort", opt.id)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  active ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-900"
                }`}
              >
                {t(opt.labelKey, locale)}
              </button>
            );
          })}
        </div>
      </Card>

      <Button onClick={onSubmit} disabled={!canSubmit} className="w-full">
        {t("advisor.screen1.cta", locale)}
      </Button>
    </div>
  );
}

// Re-exported so AdvisorPlanner.tsx (and tests) can build a default input
// without duplicating this shape.
export function defaultAdvisorCustomerInput(overrides: Partial<AdvisorCustomerInput> = {}): AdvisorCustomerInput {
  return {
    customerName: "",
    profession: "",
    age: null,
    goalOption: "child_education" as GoalType,
    targetGoalAmount: null,
    yearsToGoal: null,
    monthlyBudget: null,
    riskComfort: null,
    ...overrides,
  };
}
