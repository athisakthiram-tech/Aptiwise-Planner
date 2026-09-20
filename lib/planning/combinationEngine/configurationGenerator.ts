// Stage 4 — Configuration Generation. For every surviving candidate,
// generate feasible (term, PPT, Basic Sum Assured OR direct-premium
// allocation) configurations and price each one via Phase 1's own
// estimation (VERIFIED -> DERIVED -> ESTIMATED, never fabricated).
//
// Two genuinely different product shapes need two different search
// strategies, both real LIC mechanics (never invented here):
//   - SAMPLE-TABLE products (traditional endowments/money-back/etc.):
//     premium is NOT a free choice — it is whatever a valid (age, term,
//     PPT, Basic Sum Assured) combination resolves to. The search tries
//     the product's own published/derivable Basic Sum Assured values.
//   - DIRECT-PREMIUM products (ULIPs, New Pension Plus): the customer
//     chooses the premium directly, and Basic Sum Assured is a formula
//     of that choice. The search instead tries a bounded set of
//     candidate ALLOCATION amounts up to the customer's monthly
//     capacity — this is where genuine "how much of the budget goes
//     here" choice actually exists for these products.
//
// A configuration whose premium already exceeds the customer's ENTIRE
// monthly capacity is pruned here (Stage 5's own "reject over-budget
// structure early" rule) — it could never participate in any structure.

import { getPremiumCalculationDomain } from "@/lib/insurance/premiumCalculationCapability";
import { estimatePremium } from "@/lib/planning/planIntelligence/premiumModel";
import { CandidateAnalysis, CandidateConfiguration, CustomerAnalysis } from "@/lib/planning/combinationEngine/types";
import { ExtendedProductRole } from "@/lib/planning/planIntelligence/types";

// A bounded, deterministic set of allocation amounts for direct-premium
// products — round fractions of the customer's own stated capacity, not
// arbitrary numbers, and never a mandatory 90/10-style ratio (this list
// is a SEARCH CANDIDATE SET explored across many structures, not an
// output). Capped small to keep the search bounded (Section:
// PERFORMANCE).
function allocationCandidates(monthlyCapacity: number): number[] {
  const fractions = [0.2, 0.3, 0.4, 0.5, 0.7, 1.0];
  const amounts = fractions.map((f) => Math.round((monthlyCapacity * f) / 100) * 100).filter((a) => a > 0);
  return Array.from(new Set(amounts));
}

function isDirectPremiumProduct(structure: string): boolean {
  return structure === "CUSTOMER_CHOSEN";
}

// PPT candidates for a product whose PPT is a genuinely independent
// choice — a small, bounded set: full term (no limited pay) plus two
// meaningfully shorter options, never every integer from 1 to term.
function independentPptCandidates(termYears: number): number[] {
  const candidates = [termYears, Math.round(termYears * 0.6), Math.round(termYears * 0.4)];
  return Array.from(new Set(candidates.filter((p) => p > 0 && p <= termYears)));
}

function primaryRole(candidate: CandidateAnalysis): ExtendedProductRole {
  return candidate.profile.combinationRoles[0] ?? "GOAL_ACCUMULATION";
}

function pptCandidatesFor(candidate: CandidateAnalysis, termYears: number): (number | undefined)[] {
  const domain = getPremiumCalculationDomain(candidate.profile.identity.planNumber, candidate.profile.identity.uin);
  const kind = candidate.profile.premiumModel.pptRelationship.kind;
  switch (kind) {
    case "EQUALS_TERM":
      return [termYears];
    case "FIXED_OFFSET": {
      const offset = (candidate.profile.premiumModel.pptRelationship as { kind: "FIXED_OFFSET"; offsetYears: number }).offsetYears;
      const ppt = termYears - offset;
      return ppt > 0 ? [ppt] : [];
    }
    case "FIXED_PAIRING": {
      const derived = domain?.derivePremiumPayingTermYears?.(termYears);
      return derived != null ? [derived] : [undefined];
    }
    case "INDEPENDENT_CHOICE":
      return independentPptCandidates(termYears);
    case "DERIVED_FROM_AGE":
    case "NOT_APPLICABLE":
    default:
      return [undefined];
  }
}

function bsaCandidatesFor(candidate: CandidateAnalysis, goalAmount: number): number[] {
  const domain = getPremiumCalculationDomain(candidate.profile.identity.planNumber, candidate.profile.identity.uin);
  if (domain?.supportedBasicSumAssuredValues && domain.supportedBasicSumAssuredValues.length > 0) {
    return [...domain.supportedBasicSumAssuredValues];
  }
  // No known supported set (catalogue-only product) — seed with the
  // goal amount; estimatePremium will honestly report
  // NOT_YET_ESTIMATABLE if no defensible method applies, never a guess.
  return [goalAmount];
}

export function generateConfigurations(candidate: CandidateAnalysis, customer: CustomerAnalysis): CandidateConfiguration[] {
  const termYears = customer.request.yearsToGoal;
  const planKey = `${candidate.profile.identity.planNumber}::${candidate.profile.identity.uin}`;
  const role = primaryRole(candidate);
  const configurations: CandidateConfiguration[] = [];

  if (isDirectPremiumProduct(candidate.profile.premiumModel.structure)) {
    for (const amount of allocationCandidates(customer.request.monthlyCapacity)) {
      configurations.push({
        planNumber: candidate.profile.identity.planNumber,
        uin: candidate.profile.identity.uin,
        policyTermYears: termYears,
        premiumPayingTermYears: null,
        basicSumAssuredCandidate: null, // BSA is a formula of the chosen premium, not probed here
        monthlyPremium: { value: amount, provenance: { status: "ESTIMATED", method: "direct_customer_chosen_allocation_candidate", sourceReferences: [] } },
        role,
      });
    }
    return configurations;
  }

  for (const ppt of pptCandidatesFor(candidate, termYears)) {
    for (const bsa of bsaCandidatesFor(candidate, customer.request.goalAmount)) {
      const estimate = estimatePremium({
        planKey,
        age: customer.request.age,
        policyTermYears: termYears,
        premiumPayingTermYears: ppt,
        targetBasicSumAssured: bsa,
      });
      if (estimate.amountMonthly == null) continue; // honestly unresolved — never a fabricated placeholder
      if (estimate.amountMonthly > customer.request.monthlyCapacity) continue; // Stage 5's early-prune rule

      configurations.push({
        planNumber: candidate.profile.identity.planNumber,
        uin: candidate.profile.identity.uin,
        policyTermYears: termYears,
        premiumPayingTermYears: ppt ?? null,
        basicSumAssuredCandidate: bsa,
        monthlyPremium: { value: estimate.amountMonthly, provenance: estimate.provenance },
        role,
      });
    }
  }
  return configurations;
}

export function generateAllConfigurations(
  candidates: CandidateAnalysis[],
  customer: CustomerAnalysis
): Map<string, CandidateConfiguration[]> {
  const byPlan = new Map<string, CandidateConfiguration[]>();
  for (const candidate of candidates) {
    if (candidate.eliminated) continue;
    const configs = generateConfigurations(candidate, customer);
    if (configs.length > 0) {
      byPlan.set(`${candidate.profile.identity.planNumber}::${candidate.profile.identity.uin}`, configs);
    }
  }
  return byPlan;
}
