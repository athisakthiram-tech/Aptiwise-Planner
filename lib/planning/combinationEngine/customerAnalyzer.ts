// Stage 1 — Customer Understanding. Converts a raw PlanningRequest into
// planning characteristics. Profession is ALWAYS only a hint — see
// professionModel.ts's own header comment — and explicit customer data
// (age/goal/amount/years/capacity/riskPreference) always takes priority.

import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { GOAL_TYPE_TO_NEED_TAGS } from "@/lib/planning/planIntelligence/types";
import { inferProfessionProfile, getProfessionCashFlowHints } from "@/lib/planning/planIntelligence/professionModel";
import { buildCustomerSuitabilityProfile } from "@/lib/planning/planIntelligence/customerSuitability";
import { CustomerAnalysis, GoalShape, MarketLinkedPreference, PlanningRequest, RiskPreference } from "@/lib/planning/combinationEngine/types";
import { RiskComfort } from "@/types";

function riskPreferenceToRiskComfort(pref: RiskPreference | null | undefined): RiskComfort | null {
  switch (pref) {
    case "conservative":
      return "low";
    case "balanced":
      return "medium";
    case "growth":
      return "high";
    default:
      return null;
  }
}

// A search PREFERENCE/CONSTRAINT, never a product-name selector (see
// types.ts's MarketLinkedPreference comment). "conservative" is treated
// as an explicit rejection of market risk for Stage 3's elimination step
// — matching the spec's own worked example verbatim — never a
// percentage allocation cap.
function marketLinkedPreferenceFor(pref: RiskPreference | null | undefined): MarketLinkedPreference {
  switch (pref) {
    case "conservative":
      return "MINIMIZE";
    case "growth":
      return "MAXIMIZE_WITHIN_REASON";
    case "balanced":
    default:
      return "MODERATE";
  }
}

function goalShapeFor(goal: PlanningRequest["goal"]): GoalShape {
  return goal === "retirement" ? "RECURRING_INCOME_AT_TARGET_YEAR" : "LUMP_SUM_AT_TARGET_YEAR";
}

export function analyzeCustomer(request: PlanningRequest): CustomerAnalysis {
  const professionProfile = inferProfessionProfile(request.profession);
  const professionHints = getProfessionCashFlowHints(professionProfile);

  const financialProfile: CustomerFinancialProfile = {
    ...UNKNOWN_CUSTOMER_PROFILE,
    age: request.age,
    monthlyBudget: request.monthlyCapacity,
    goalType: request.goal,
    targetGoalAmount: request.goalAmount,
    yearsToGoal: request.yearsToGoal,
    riskComfort: riskPreferenceToRiskComfort(request.riskPreference),
    existingInvestments: request.existingInvestments ?? null,
    existingLifeCover: request.existingLifeCover ?? null,
    outstandingLiabilities: request.outstandingLiabilities ?? null,
  };

  const suitability = buildCustomerSuitabilityProfile(financialProfile, professionProfile);

  return {
    request,
    financialProfile,
    professionProfile,
    professionHints,
    suitability,
    goalShape: goalShapeFor(request.goal),
    needTags: GOAL_TYPE_TO_NEED_TAGS[request.goal] ?? [],
    marketLinkedPreference: marketLinkedPreferenceFor(request.riskPreference),
    // Section "VERY IMPORTANT — SINGLE PREMIUM": this phase never infers
    // lump-sum capital from a monthly capacity figure. A future request
    // shape may add an explicit lump-sum field; until then this is
    // always false, and every single-premium product is treated as
    // structurally incompatible with an immediate-purchase monthly plan
    // (see candidateGenerator.ts).
    hasLumpSumCapital: false,
  };
}
