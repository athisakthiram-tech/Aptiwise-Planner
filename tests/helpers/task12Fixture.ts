// Task 12's realistic development fixture, shared by the integration
// tests (tests/integration-*.test.tsx) so each one traces the SAME
// real customer through the real planning pipeline rather than a
// synthetic/hand-built strategy.
//
// Age 32, monthly planning budget ₹15,000, Goal: Child Education
// ₹30,00,000 in 15 years, existing life cover ₹5,00,000, existing
// investments ₹4,00,000, liabilities ₹15,00,000.
//
// Real, documented output for this fixture (verified via a one-off
// trace during this audit, not asserted values invented for a test):
//   Protection Need  = ₹41,00,000 (calculated)
//   Protection Gap   = ₹36,00,000 (calculated)
//   Goal Gap         = ₹26,00,000 (calculated)
//   Families generated = protection_investment, traditional_protection,
//                         market_linked_insurance, traditional_structure
// The protection_investment / Plan 894 (Jeevan Raksha) structure is
// used as "the ONE selected strategy" throughout these integration
// tests: it already has enough verified inputs (a verified death
// benefit and guarantees figure) to build a meaningful CustomerPlan,
// while its term premium honestly stays "Requires verification" (Plan
// 894's own published sample table has no row for age 32) — exactly
// the "verification behavior is correct" case Task 5/6 describe, never
// papered over.

import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed, ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed, GoalNeedResult } from "@/lib/planning/goalNeeds";
import { generateStrategies } from "@/lib/planning/strategyGenerator";
import { StrategyResult } from "@/lib/planning/strategyTypes";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { Locale } from "@/lib/i18n/types";

export function buildTask12Profile(): CustomerFinancialProfile {
  return {
    ...UNKNOWN_CUSTOMER_PROFILE,
    age: 32,
    monthlyBudget: 15000,
    goalType: "child_education",
    targetGoalAmount: 3000000,
    yearsToGoal: 15,
    existingLifeCover: 500000,
    existingInvestments: 400000,
    outstandingLiabilities: 1500000,
    riskComfort: "medium",
  };
}

export interface Task12Pipeline {
  profile: CustomerFinancialProfile;
  protectionNeed: ProtectionNeedResult;
  goalNeed: GoalNeedResult;
  strategies: StrategyResult[];
  selectedStrategy: StrategyResult;
}

export function runTask12Pipeline(): Task12Pipeline {
  const profile = buildTask12Profile();
  const protectionNeed = calculateProtectionNeed({ profile });
  const goalNeed = calculateGoalNeed({ targetGoal: profile.targetGoalAmount, currentResources: profile.existingInvestments });
  const strategies = generateStrategies({ profile, protectionNeed, goalNeed });
  const selectedStrategy = strategies.find(
    (s) => s.family === "protection_investment" && s.components[0].product?.planNumber === "894"
  )!;
  return { profile, protectionNeed, goalNeed, strategies, selectedStrategy };
}

export function buildTask12Plan(
  locale: Locale = "en",
  customer?: { name?: string | null; phone?: string | null }
): CustomerPlan {
  const { profile, protectionNeed, goalNeed, selectedStrategy } = runTask12Pipeline();
  return createCustomerPlan({
    customerProfile: profile,
    protectionNeed,
    goalNeed,
    selectedStrategy,
    locale,
    customer,
  });
}
