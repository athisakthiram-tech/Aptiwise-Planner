"use client";

// Section 3 (top summary) + the "minimal wizard addition" from Section 1:
// a small, optional, collapsed-by-default panel for the couple of extra
// inputs (existing investments, outstanding liabilities) the planning
// engine can use if the customer/advisor has them handy — the existing
// wizard itself is not changed.

import { useState } from "react";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { GoalNeedResult } from "@/lib/planning/goalNeeds";
import { GoalSummaryCard } from "@/components/planner/results/GoalSummaryCard";
import { ProtectionSummaryCard } from "@/components/planner/results/ProtectionSummaryCard";
import { BudgetSummaryCard } from "@/components/planner/results/BudgetSummaryCard";
import { Slider } from "@/components/ui/Slider";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";
import { formatINRCompact } from "@/lib/calculations/format";

export function FinancialPicture({
  profile,
  protectionNeed,
  goalNeed,
  locale,
  existingInvestments,
  outstandingLiabilities,
  onChangeExistingInvestments,
  onChangeOutstandingLiabilities,
}: {
  profile: CustomerFinancialProfile;
  protectionNeed: ProtectionNeedResult;
  goalNeed: GoalNeedResult;
  locale: Locale;
  existingInvestments: number | null;
  outstandingLiabilities: number | null;
  onChangeExistingInvestments: (value: number) => void;
  onChangeOutstandingLiabilities: (value: number) => void;
}) {
  const [extrasOpen, setExtrasOpen] = useState(false);
  const sliderMax = Math.max((profile.targetGoalAmount ?? 1000000) * 2, 2000000);

  return (
    <div className="flex flex-col gap-3">
      <GoalSummaryCard profile={profile} goalNeed={goalNeed} locale={locale} />
      <ProtectionSummaryCard protectionNeed={protectionNeed} locale={locale} />
      <BudgetSummaryCard monthlyBudget={profile.monthlyBudget} locale={locale} />

      <div>
        <button
          type="button"
          onClick={() => setExtrasOpen((o) => !o)}
          className="text-xs font-semibold text-brand-700"
        >
          {extrasOpen ? t("results.extras.hideLabel", locale) : t("results.extras.toggleLabel", locale)}
        </button>
        {extrasOpen && (
          <div className="mt-3 flex flex-col gap-4 rounded-xl2 bg-slate-50 p-4">
            <p className="text-xs text-ink-500">{t("results.extras.intro", locale)}</p>
            <Slider
              label={t("results.extras.existingInvestments", locale)}
              emoji="💰"
              value={existingInvestments ?? 0}
              min={0}
              max={sliderMax}
              step={50000}
              displayValue={formatINRCompact(existingInvestments ?? 0)}
              onChange={onChangeExistingInvestments}
            />
            <Slider
              label={t("results.extras.outstandingLiabilities", locale)}
              emoji="🧾"
              value={outstandingLiabilities ?? 0}
              min={0}
              max={sliderMax}
              step={50000}
              displayValue={formatINRCompact(outstandingLiabilities ?? 0)}
              onChange={onChangeOutstandingLiabilities}
            />
          </div>
        )}
      </div>
    </div>
  );
}
