// Configuration-specific budget comparison, independent of category
// matching (lib/insurance/matching.ts) and of any single plan. Only ever
// "verified" when an exact premium was actually returned by a plan's
// premium engine — never derived from monthlyBudget alone.

import { PlanBudgetComparison, PremiumCalculationResult } from "@/types/insurance";

export function comparePlanBudget(
  customerMonthlyBudget: number,
  premium: PremiumCalculationResult | undefined
): PlanBudgetComparison {
  if (!premium || !premium.available || premium.premium == null) {
    return { verified: false, customerMonthlyBudget };
  }

  const annualPremium = premium.premium;
  const monthlyEquivalent = annualPremium / 12;

  return {
    verified: true,
    customerMonthlyBudget,
    annualPremium,
    monthlyEquivalent,
    withinBudget: customerMonthlyBudget >= monthlyEquivalent,
  };
}
