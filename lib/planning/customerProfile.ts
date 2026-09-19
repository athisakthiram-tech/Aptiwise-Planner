// Customer financial profile: the domain model the whole planning layer
// (protection needs, goal needs, product eligibility, strategy
// generation) is built on top of. Deliberately separate from React state
// and from the existing wizard's GoalInput (types/index.ts) — the wizard
// doesn't collect most of these fields yet, so every field here is
// nullable and `null` always means "unknown", never a silently-assumed
// zero.

import { GoalInput, GoalType, RiskComfort } from "@/types";

// How much the customer values being able to access money early versus
// locking it into a long-term contract. Kept as a small closed enum
// (mirrors RiskComfort's shape) rather than a free-text field so the
// strategy generator can reason about it deterministically.
export type LiquidityPreference = "low" | "medium" | "high";

export interface CustomerFinancialProfile {
  age: number | null;
  monthlyBudget: number | null;
  annualIncome: number | null;
  goalType: GoalType | null;
  targetGoalAmount: number | null;
  yearsToGoal: number | null;
  existingLifeCover: number | null;
  // Existing investments/assets the customer could draw on toward the
  // stated goal (or, more generally, that reduce what a protection
  // shortfall would otherwise have to fully replace).
  existingInvestments: number | null;
  outstandingLiabilities: number | null;
  numberOfDependants: number | null;
  // Optional — only used by protectionNeeds.ts when the caller also
  // supplies an explicit incomeReplacementYears assumption (see that
  // module's header comment for why this is never invented internally).
  annualFamilyExpenses: number | null;
  riskComfort: RiskComfort | null;
  liquidityPreference: LiquidityPreference | null;
}

// Every field defaults to `null` (unknown) — this is the safe baseline a
// caller can spread over with whatever it actually knows, rather than
// every call site having to repeat the same 13-field null object.
export const UNKNOWN_CUSTOMER_PROFILE: CustomerFinancialProfile = {
  age: null,
  monthlyBudget: null,
  annualIncome: null,
  goalType: null,
  targetGoalAmount: null,
  yearsToGoal: null,
  existingLifeCover: null,
  existingInvestments: null,
  outstandingLiabilities: null,
  numberOfDependants: null,
  annualFamilyExpenses: null,
  riskComfort: null,
  liquidityPreference: null,
};

// Bridges the existing wizard's GoalInput into the new, richer profile.
// GoalInput's own fields (age/monthlyBudget/goalType/targetAmount/
// yearsToGoal/existingLifeCover/riskComfort) are non-nullable today
// because the wizard forces an answer for each of them — those become
// known values here. Every field the wizard doesn't collect yet
// (annualIncome, existingInvestments, outstandingLiabilities,
// numberOfDependants, annualFamilyExpenses, liquidityPreference) stays
// `null`, never a fabricated 0 or default.
export function buildProfileFromGoalInput(goal: GoalInput): CustomerFinancialProfile {
  return {
    ...UNKNOWN_CUSTOMER_PROFILE,
    age: goal.age,
    monthlyBudget: goal.monthlyBudget,
    goalType: goal.goalType,
    targetGoalAmount: goal.targetAmount,
    yearsToGoal: goal.yearsToGoal,
    existingLifeCover: goal.existingLifeCover,
    riskComfort: goal.riskComfort,
  };
}
