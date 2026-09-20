// Stage 2/3 — Analyze ALL products, then eliminate only CLEARLY
// incompatible candidates. Every judgment about a single product's
// mechanics/eligibility/need-fit comes from
// lib/planning/planIntelligence/registry.ts — this module only decides
// which of those already-computed facts justify elimination, and NEVER
// stops at the first candidate (produces a full CandidateAnalysis[]
// before anything downstream ever looks at one entry).

import { getEligiblePlanningProducts, analyzePlanForNeed } from "@/lib/planning/planIntelligence/registry";
import { CandidateAnalysis, CustomerAnalysis } from "@/lib/planning/combinationEngine/types";

const WEAK_OR_NA = new Set(["WEAK_FIT", "NOT_APPLICABLE"]);

export function generateCandidateAnalyses(customer: CustomerAnalysis): CandidateAnalysis[] {
  // Every ACTIVE, age-plausible non-term product — Phase 1's own
  // eligibility gate, never re-derived here.
  const profiles = getEligiblePlanningProducts(customer.financialProfile);

  return profiles.map((profile) => {
    const analysis = analyzePlanForNeed(profile.identity.planNumber, profile.identity.uin, customer.financialProfile, customer.request.goal);

    const ageEligible = analysis?.ageEligible ?? "UNKNOWN";
    const horizonCompatible = analysis?.horizonCompatible ?? "UNKNOWN";
    const relevantNeedFits = (analysis?.mechanicsFit ?? []).map((f) => ({ need: f.need, fit: f.fit, reasoning: f.reasoning }));
    // "Need compatible" means at least one relevant need tag is a
    // STRONG or POSSIBLE fit — a product whose ONLY relevant need tags
    // are WEAK_FIT/NOT_APPLICABLE genuinely cannot serve this goal by
    // its own mechanics (Stage 3's "goal timing fundamentally
    // incompatible" example).
    const needCompatible = relevantNeedFits.length === 0 ? true : relevantNeedFits.some((f) => !WEAK_OR_NA.has(f.fit));

    // Section "VERY IMPORTANT — SINGLE PREMIUM": a single-premium
    // product cannot be funded from a monthly-capacity-only request
    // unless the customer analysis explicitly models lump-sum capital.
    const premiumStructureCompatible = profile.premiumModel.structure !== "SINGLE" || customer.hasLumpSumCapital;

    // Stage 3's own worked example: "market-linked product where
    // customer explicitly rejects market risk". A "conservative" risk
    // preference is treated as that explicit rejection for elimination
    // purposes — never a soft deprioritization at this stage (soft
    // preference weighting happens later, in structure selection).
    const marketRiskCompatible = profile.marketRisk !== "MARKET_LINKED" || customer.marketLinkedPreference !== "MINIMIZE";

    const eliminationReasons: string[] = [];
    if (ageEligible === false) eliminationReasons.push("age_impossible");
    if (horizonCompatible === false) eliminationReasons.push("term_impossible");
    if (!needCompatible) eliminationReasons.push("goal_timing_fundamentally_incompatible");
    if (!premiumStructureCompatible) eliminationReasons.push("single_premium_structure_impossible_from_monthly_capacity");
    if (!marketRiskCompatible) eliminationReasons.push("market_linked_product_rejected_by_risk_preference");

    return {
      profile,
      ageEligible,
      horizonCompatible,
      needCompatible,
      relevantNeedFits,
      premiumStructureCompatible,
      marketRiskCompatible,
      eliminated: eliminationReasons.length > 0,
      eliminationReasons,
    };
  });
}
