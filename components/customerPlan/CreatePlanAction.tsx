"use client";

// Stage C, Section 16: the single entry point into the customer-plan
// flow. An advisor picks exactly ONE explored strategy and creates a
// plan from it here — plans are never auto-created for every generated
// strategy, and the advisor is never forced to compare first.

import { useState } from "react";
import { StrategyResult } from "@/lib/planning/strategyTypes";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { GoalNeedResult } from "@/lib/planning/goalNeeds";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { CustomerPlan, CustomerPlanFundingContext } from "@/lib/customerPlan/types";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function CreatePlanAction({
  strategy,
  protectionNeed,
  goalNeed,
  profile,
  locale,
  fundingContext,
  onCreated,
}: {
  strategy: StrategyResult;
  protectionNeed: ProtectionNeedResult;
  goalNeed: GoalNeedResult;
  profile: CustomerFinancialProfile;
  locale: Locale;
  // Optional (Goal Orchestrator V2) — set only when this strategy came
  // from a GoalStructure; absent for the original per-family strategy
  // flow.
  fundingContext?: CustomerPlanFundingContext;
  onCreated: (plan: CustomerPlan) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    try {
      const plan = createCustomerPlan({
        customerProfile: profile,
        protectionNeed,
        goalNeed,
        selectedStrategy: strategy,
        locale,
        fundingContext,
      });
      setError(null);
      onCreated(plan);
    } catch {
      // createCustomerPlan throws only when it would otherwise produce an
      // internally-inconsistent snapshot — surfaced here rather than
      // silently swallowed, but never crashing the Planner.
      setError(t("customerPlan.createFailed", locale));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleCreate}
        className="w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
      >
        {t("customerPlan.create", locale)}
      </button>
      {error && <p className="text-center text-xs text-amber-700">{error}</p>}
    </div>
  );
}
