"use client";

// Top-level 4-screen Advisor MVP: Customer -> Combinations ->
// Illustration -> What Advisor Says.
//
// THE canonical planning path (Phase 4): Screen 1 builds a real
// PlanningRequest and calls lib/advisor/combinationPlanModel.ts's
// planAdvisorStructures(), which itself calls the Phase 2/3/3B
// combination engine (planCombinations()) — never the old Goal
// Orchestrator V2 (lib/planning/goalOrchestrator/*), never a mock
// result. protectionNeeds.ts/goalNeeds.ts are kept and reused unchanged
// (pure, orthogonal calculators, not part of the old planning path this
// phase replaces) purely so createCustomerPlan()/CustomerPlanPreview/
// WhatsApp/PDF continue to work unmodified — see
// combinationPlanModel.ts's buildStrategyResultForSnapshot for the one
// adapter that bridges the new engine's output into that pre-existing
// shape. The old 12-step Wizard.tsx is untouched and still exists, just
// no longer the app's rendered entry point (see app/page.tsx).

import { useMemo, useState } from "react";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { AdvisorStructureView, buildPlanningRequest, planAdvisorStructures, toEngineGoalType } from "@/lib/advisor/combinationPlanModel";
import { ScreenCustomer, AdvisorCustomerInput, defaultAdvisorCustomerInput } from "@/components/advisor/ScreenCustomer";
import { ScreenCombinations } from "@/components/advisor/ScreenCombinations";
import { ScreenIllustration } from "@/components/advisor/ScreenIllustration";
import { ScreenExplain } from "@/components/advisor/ScreenExplain";
import { Locale, LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

type AdvisorScreen = "customer" | "combinations" | "illustration" | "explain";

// A prefilled demo scenario (matches this task's own regression
// scenario) so the 4-screen flow is immediately useful, not a blank
// form — the advisor can change every field on Screen 1.
const DEFAULT_CUSTOMER_INPUT: AdvisorCustomerInput = defaultAdvisorCustomerInput({
  age: 35,
  profession: "",
  goalOption: "child_education",
  targetGoalAmount: 2500000,
  yearsToGoal: 16,
  monthlyBudget: 10000,
  riskComfort: "medium",
});

export function AdvisorPlanner() {
  const [screen, setScreen] = useState<AdvisorScreen>("customer");
  const [customerInput, setCustomerInput] = useState<AdvisorCustomerInput>(DEFAULT_CUSTOMER_INPUT);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);

  // Kept unchanged for createCustomerPlan()'s own required inputs
  // (protection/goal needs are orthogonal to product selection — see
  // this file's own header comment).
  const profile: CustomerFinancialProfile = useMemo(
    () => ({
      ...UNKNOWN_CUSTOMER_PROFILE,
      age: customerInput.age,
      monthlyBudget: customerInput.monthlyBudget,
      goalType: toEngineGoalType(customerInput.goalOption),
      targetGoalAmount: customerInput.targetGoalAmount,
      yearsToGoal: customerInput.yearsToGoal,
      riskComfort: customerInput.riskComfort,
    }),
    [customerInput]
  );

  const protectionNeed = useMemo(() => calculateProtectionNeed({ profile }), [profile]);
  const goalNeed = useMemo(
    () => calculateGoalNeed({ targetGoal: profile.targetGoalAmount, currentResources: profile.existingInvestments }),
    [profile]
  );

  const planningRequest = useMemo(() => buildPlanningRequest(customerInput), [customerInput]);

  const structures: AdvisorStructureView[] = useMemo(
    () => (planningRequest ? planAdvisorStructures(planningRequest) : []),
    [planningRequest]
  );

  const selectedStructure = structures.find((s) => s.id === selectedStructureId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧭</span>
          <h1 className="text-lg font-bold tracking-tight">{t("advisor.appTitle", locale)}</h1>
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

      {screen === "customer" && (
        <ScreenCustomer
          value={customerInput}
          onChange={setCustomerInput}
          onSubmit={() => setScreen("combinations")}
          locale={locale}
        />
      )}

      {screen === "combinations" && (
        <ScreenCombinations
          structures={structures}
          locale={locale}
          onBack={() => setScreen("customer")}
          onViewIllustration={(structureId) => {
            setSelectedStructureId(structureId);
            setScreen("illustration");
          }}
        />
      )}

      {screen === "illustration" && selectedStructure && (
        <ScreenIllustration
          structure={selectedStructure}
          goalOption={customerInput.goalOption}
          monthlyBudget={customerInput.monthlyBudget}
          locale={locale}
          onBack={() => setScreen("combinations")}
          onContinue={() => setScreen("explain")}
        />
      )}

      {screen === "explain" && selectedStructure && (
        <ScreenExplain
          structure={selectedStructure}
          goalOption={customerInput.goalOption}
          profile={profile}
          protectionNeed={protectionNeed}
          goalNeed={goalNeed}
          customerName={customerInput.customerName}
          locale={locale}
          onBack={() => setScreen("illustration")}
        />
      )}
    </div>
  );
}
