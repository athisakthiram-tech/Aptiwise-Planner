// The Plan Intelligence public query interface (Section 24). This is the
// ONLY entry point a future combination-search layer should call — it
// never exposes planProfiles.ts's internal `buildProfile` shape directly
// so the underlying data representation can change without breaking
// callers. No LLM/external AI call happens anywhere in this module
// (Section 25) — every function here is a deterministic, pure lookup or
// calculation over the structured profiles in planProfiles.ts.

import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { GoalType } from "@/types";
import {
  ALL_PLAN_INTELLIGENCE_PROFILES,
  getPlanIntelligenceProfile,
} from "@/lib/planning/planIntelligence/planProfiles";
import {
  CashFlowEvent,
  ComplementaryCharacteristic,
  EstimatePremiumInput,
  GOAL_TYPE_TO_NEED_TAGS,
  NeedFitAssessment,
  PlanIntelligenceProfile,
  ProfessionProfile,
  ReturnAnalysis,
} from "@/lib/planning/planIntelligence/types";
import { estimatePremium } from "@/lib/planning/planIntelligence/premiumModel";
import { buildPremiumOutflowEvents, cashFlowEvent } from "@/lib/planning/planIntelligence/cashFlowModel";
import { analyzeReturn } from "@/lib/planning/planIntelligence/returnAnalysis";
import { buildCustomerSuitabilityProfile } from "@/lib/planning/planIntelligence/customerSuitability";

export function getPlanIntelligence(planNumber: string, uin: string): PlanIntelligenceProfile | undefined {
  return getPlanIntelligenceProfile(planNumber, uin);
}

export function listAllPlanIntelligence(): readonly PlanIntelligenceProfile[] {
  return ALL_PLAN_INTELLIGENCE_PROFILES;
}

// Section 24: "eligible planning products" for a customer — active
// products whose published entry-age band (where known) includes the
// customer's age. A product with no verified age band (eligibility
// fields null) is included rather than silently excluded — Section 22's
// "no empty intelligence" philosophy — but is clearly distinguishable
// via its own dataConfidence field.
export function getEligiblePlanningProducts(customer: CustomerFinancialProfile): PlanIntelligenceProfile[] {
  return ALL_PLAN_INTELLIGENCE_PROFILES.filter((profile) => {
    if (!profile.identity.active) return false;
    if (customer.age == null) return true; // unknown age never excludes a product outright
    const { minEntryAge, maxEntryAge } = profile.eligibility;
    if (minEntryAge != null && customer.age < minEntryAge) return false;
    if (maxEntryAge != null && customer.age > maxEntryAge) return false;
    return true;
  });
}

export interface PlanNeedAnalysis {
  planNumber: string;
  uin: string;
  productName: string;
  mechanicsFit: NeedFitAssessment[]; // the plan's own static, goal-agnostic mechanics fit (planProfiles.ts)
  ageEligible: boolean | "UNKNOWN";
  horizonCompatible: boolean | "UNKNOWN"; // can the plan's own term range plausibly reach the customer's stated horizon
  budgetCompatible: "VERIFIED_WITHIN_BUDGET" | "ESTIMATED_WITHIN_BUDGET" | "EXCEEDS_BUDGET" | "UNKNOWN";
  premiumEstimate: ReturnType<typeof estimatePremium> | null;
}

// Section 13's layered design: planProfiles.ts already answered "does
// this product's cash-flow SHAPE suit this need type" (mechanicsFit,
// goal-agnostic). This function layers the SPECIFIC customer's age/
// horizon/budget on top of that — never re-deriving the mechanics
// reasoning, only checking numeric compatibility.
export function analyzePlanForNeed(
  planNumber: string,
  uin: string,
  customer: CustomerFinancialProfile,
  goal: GoalType
): PlanNeedAnalysis | undefined {
  const profile = getPlanIntelligenceProfile(planNumber, uin);
  if (!profile) return undefined;

  const needTags = GOAL_TYPE_TO_NEED_TAGS[goal] ?? [];
  const mechanicsFit = profile.needSuitability.filter((n) => needTags.includes(n.need));

  const ageEligible: boolean | "UNKNOWN" =
    customer.age == null
      ? "UNKNOWN"
      : (profile.eligibility.minEntryAge == null || customer.age >= profile.eligibility.minEntryAge) &&
        (profile.eligibility.maxEntryAge == null || customer.age <= profile.eligibility.maxEntryAge);

  const horizonCompatible: boolean | "UNKNOWN" =
    customer.yearsToGoal == null
      ? "UNKNOWN"
      : profile.eligibility.validTermOptions != null
        ? profile.eligibility.validTermOptions.includes(customer.yearsToGoal)
        : (profile.eligibility.minPolicyTermYears == null || customer.yearsToGoal >= profile.eligibility.minPolicyTermYears) &&
          (profile.eligibility.maxPolicyTermYears == null || customer.yearsToGoal <= profile.eligibility.maxPolicyTermYears);

  let premiumEstimate: ReturnType<typeof estimatePremium> | null = null;
  let budgetCompatible: PlanNeedAnalysis["budgetCompatible"] = "UNKNOWN";
  if (customer.age != null && customer.yearsToGoal != null) {
    const input: EstimatePremiumInput = {
      planKey: `${planNumber}::${uin}`,
      age: customer.age,
      policyTermYears: customer.yearsToGoal,
      targetBasicSumAssured: customer.targetGoalAmount ?? undefined,
    };
    premiumEstimate = estimatePremium(input);
    if (premiumEstimate.amountMonthly != null && customer.monthlyBudget != null) {
      const withinBudget = premiumEstimate.amountMonthly <= customer.monthlyBudget;
      budgetCompatible = withinBudget
        ? premiumEstimate.provenance.status === "VERIFIED"
          ? "VERIFIED_WITHIN_BUDGET"
          : "ESTIMATED_WITHIN_BUDGET"
        : "EXCEEDS_BUDGET";
    }
  }

  return {
    planNumber,
    uin,
    productName: profile.identity.productName,
    mechanicsFit,
    ageEligible,
    horizonCompatible,
    budgetCompatible,
    premiumEstimate,
  };
}

export interface ProductConfiguration {
  planNumber: string;
  uin: string;
  premiumEstimate: ReturnType<typeof estimatePremium>;
  policyTermYears: number | null;
  premiumPayingTermYears: number | null;
  targetBasicSumAssured: number | null;
}

export function estimateProductConfiguration(
  planNumber: string,
  uin: string,
  customer: CustomerFinancialProfile,
  allocationMonthly: number
): ProductConfiguration | undefined {
  const profile = getPlanIntelligenceProfile(planNumber, uin);
  if (!profile || customer.age == null) return undefined;

  const premiumEstimate = estimatePremium({
    planKey: `${planNumber}::${uin}`,
    age: customer.age,
    policyTermYears: customer.yearsToGoal ?? undefined,
    targetBasicSumAssured: customer.targetGoalAmount ?? undefined,
  });

  return {
    planNumber,
    uin,
    premiumEstimate,
    policyTermYears: customer.yearsToGoal,
    premiumPayingTermYears: null,
    targetBasicSumAssured: customer.targetGoalAmount ?? null,
  };
}

// Section 7/24: a simplified, qualitative-but-real cash-flow timeline —
// a premium outflow leg (from the estimate) plus a single terminal event
// whose amount is honestly ESTIMATED (never fabricated), reflecting
// Section 22's "no empty intelligence" philosophy even before a full
// benefit calculator exists for every product/configuration.
export function getProductCashFlows(configuration: ProductConfiguration): CashFlowEvent[] {
  const profile = getPlanIntelligenceProfile(configuration.planNumber, configuration.uin);
  if (!profile) return [];

  const monthlyAmount = configuration.premiumEstimate.amountMonthly;
  const events: CashFlowEvent[] =
    monthlyAmount != null
      ? buildPremiumOutflowEvents({
          premiumPerPeriod: { value: monthlyAmount * 12, provenance: configuration.premiumEstimate.provenance },
          premiumPayingTermYears: configuration.premiumPayingTermYears ?? configuration.policyTermYears,
        })
      : [];

  if (configuration.policyTermYears != null && configuration.targetBasicSumAssured != null) {
    events.push(
      cashFlowEvent(configuration.policyTermYears, "MATURITY_BENEFIT", {
        value: configuration.targetBasicSumAssured,
        provenance: { status: "ESTIMATED", method: "assumes maturity value approximates the target Basic Sum Assured — a planning placeholder, not a calculated benefit", sourceReferences: [] },
      })
    );
  }

  return events;
}

export function getReturnAnalysis(configuration: ProductConfiguration): ReturnAnalysis {
  return analyzeReturn(getProductCashFlows(configuration));
}

export function getComplementaryRoles(planNumber: string, uin: string): ComplementaryCharacteristic[] {
  return getPlanIntelligenceProfile(planNumber, uin)?.complementaryCharacteristics ?? [];
}

// Convenience re-export so a caller building a CustomerSuitabilityProfile
// doesn't need to import two different modules for one logical step.
export { buildCustomerSuitabilityProfile };
export type { ProfessionProfile };
