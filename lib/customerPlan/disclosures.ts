// Derives which disclosure codes actually apply to a given strategy,
// from its own already-computed statuses — never a fixed wall of legal
// text shown on every plan regardless of relevance. Pure and
// React-free; the UI layer only resolves each code to localized text.

import { StrategyResult } from "@/lib/planning/strategyTypes";
import { CustomerPlanDisclosureCode } from "@/lib/customerPlan/types";

export function deriveDisclosures(strategy: StrategyResult): CustomerPlanDisclosureCode[] {
  const codes = new Set<CustomerPlanDisclosureCode>();

  for (const component of strategy.components) {
    if (component.role === "illustrative_investment") {
      codes.add("illustrative_investment_values");
    }
    if (component.maturityBenefit.status === "illustrative") {
      codes.add("non_guaranteed_benefits");
    }
    if (component.monthlyPremium.status === "unavailable") {
      codes.add("premium_requires_verification");
    }
    if (component.product) {
      codes.add("eligibility_not_underwriting_approval");
    }
  }

  if (strategy.taxTreatment.status === "conditional" || strategy.taxTreatment.status === "unavailable") {
    codes.add("tax_treatment_conditional");
  }
  if (strategy.costs.status === "unavailable") {
    codes.add("costs_unavailable");
  }
  if (strategy.liquidity.status === "conditional") {
    codes.add("liquidity_conditional");
  }
  if (strategy.marketExposure.value === "market_linked") {
    codes.add("market_linked_values");
  }

  return Array.from(codes);
}
