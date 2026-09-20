"use client";

// Top-level 4-screen Advisor MVP: Customer -> Combinations -> Illustration
// -> What Advisor Says. The ENTIRE underlying planning stack (Goal
// Orchestrator V2, product roles, budget solver, cash-flow timeline,
// engine capability, CustomerPlan/proposal export) is reused completely
// unchanged underneath this screen — this file only sequences 4 simple
// views over it. The old 12-step Wizard.tsx is untouched and still
// exists, just no longer the app's rendered entry point (see
// app/page.tsx).

import { useMemo, useState } from "react";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateGoalStructures } from "@/lib/planning/goalOrchestrator/goalStructureGenerator";
import { GoalStructure } from "@/lib/planning/goalOrchestrator/types";
import { StrategyComponent } from "@/lib/planning/strategyTypes";
import { toEngineGoalType, ADVISOR_ILLUSTRATION_RATES_PCT } from "@/lib/advisor/advisorViewModel";
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
  const [effectiveComponents, setEffectiveComponents] = useState<StrategyComponent[] | null>(null);
  const [selectedRatePct, setSelectedRatePct] = useState<number>(ADVISOR_ILLUSTRATION_RATES_PCT[1]);

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

  const structures: GoalStructure[] = useMemo(
    () => generateGoalStructures({ profile, protectionNeed, goalNeed }),
    [profile, protectionNeed, goalNeed]
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
          yearsToGoal={profile.yearsToGoal ?? 0}
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
          profile={profile}
          locale={locale}
          onBack={() => setScreen("combinations")}
          onContinue={(components, ratePct) => {
            setEffectiveComponents(components);
            setSelectedRatePct(ratePct);
            setScreen("explain");
          }}
        />
      )}

      {screen === "explain" && selectedStructure && effectiveComponents && (
        <ScreenExplain
          structure={selectedStructure}
          effectiveComponents={effectiveComponents}
          selectedRatePct={selectedRatePct}
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
