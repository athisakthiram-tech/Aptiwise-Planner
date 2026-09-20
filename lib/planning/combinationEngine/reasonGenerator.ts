// Reason-code + deterministic-template explanation generation. NO LLM —
// every reason code is derived from the structure's own already-computed
// facts (component roles, market linkage, PPT vs. goal horizon, benefit
// model), never invented or guessed. Explanation parts are stable
// translation keys + params; actual localized copy is a Phase 3 UI
// concern (out of scope here — see the module header of planner.ts).

import { CandidateStructure, CustomerAnalysis, StructureReasonCode } from "@/lib/planning/combinationEngine/types";

export function generateReasonCodes(structure: CandidateStructure, customer: CustomerAnalysis): StructureReasonCode[] {
  const codes: StructureReasonCode[] = [];
  const components = structure.components;
  const yearsToGoal = customer.request.yearsToGoal;

  if (components.length === 1) {
    codes.push("SINGLE_COMPONENT_USES_FULL_CAPACITY");
  }

  const marketLinkedCount = components.filter((c) => c.marketLinked).length;
  if (components.length > 1 && marketLinkedCount > 0 && marketLinkedCount < components.length) {
    codes.push("COMBINES_GUARANTEED_AND_MARKET_LINKED");
  }
  if (components.length > 1 && marketLinkedCount === 0) {
    codes.push("COMBINES_TWO_GUARANTEED_COMPONENTS");
  }
  if (marketLinkedCount > 0) {
    codes.push("ADDS_MARKET_LINKED_GROWTH");
  }
  if (components.some((c) => c.role === "SCHEDULED_LIQUIDITY")) {
    codes.push("PROVIDES_SCHEDULED_LIQUIDITY");
  }
  if (components.some((c) => c.role === "INCOME_GENERATION" || c.role === "RETIREMENT")) {
    codes.push("PROVIDES_RECURRING_INCOME");
  }
  if (components.some((c) => c.policyTermYears === yearsToGoal)) {
    codes.push("MATCHES_GOAL_HORIZON");
  }
  if (components.some((c) => (c.premiumPayingTermYears ?? c.policyTermYears ?? yearsToGoal) < yearsToGoal)) {
    codes.push("LIMITED_PREMIUM_FREES_CAPACITY", "USES_RELEASED_POST_PPT_CAPACITY");
  }
  if (components.some((c) => c.benefitModel.some((b) => b.type === "MATURITY" || b.type === "MARKET_LINKED_FUND_VALUE"))) {
    codes.push("PROVIDES_GOAL_YEAR_LUMP_SUM");
  }
  if (components.some((c) => c.monthlyAllocation.provenance.status === "ESTIMATED")) {
    codes.push("GOAL_COVERAGE_ESTIMATED_NOT_VERIFIED");
  }

  return Array.from(new Set(codes));
}

export interface ExplanationPart {
  key: string;
  params?: Record<string, string | number>;
}

export function generateExplanationParts(reasonCodes: StructureReasonCode[]): ExplanationPart[] {
  return reasonCodes.map((code) => ({ key: `combinationEngine.reason.${code}` }));
}
