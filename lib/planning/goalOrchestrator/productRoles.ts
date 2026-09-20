// Product Role model — a deterministic classification of what a
// registered LIC product's VERIFIED mechanics can actually do for a
// goal structure, derived only from the product's own catalogue
// category (already verified against LIC's official category pages —
// see lib/insurance/providers/lic/catalogue.ts's own audit header).
// This never inspects a product's popularity/fame and never invents a
// mechanic a category doesn't genuinely have.
//
// A product may carry more than one role — e.g. a traditional endowment
// plan genuinely combines a death benefit (protection) with a maturity
// benefit (goal accumulation), because that is how LIC's own category
// page describes savings/endowment plans, not because this module
// decided to be generous.

import { InsuranceCategory, InsuranceProduct } from "@/types/insurance";

export type ProductRole =
  | "GOAL_ACCUMULATION"
  | "INCOME_GENERATION"
  | "SCHEDULED_LIQUIDITY"
  | "MARKET_LINKED_ACCUMULATION"
  | "LONG_TERM_PROTECTION_SAVINGS"
  | "RETIREMENT"
  | "PROTECTION_ONLY";

// Category -> role mapping, one entry per InsuranceCategory so this
// table can never silently miss a category (TypeScript enforces
// exhaustiveness via the Record type below).
const ROLES_BY_CATEGORY: Record<InsuranceCategory, ProductRole[]> = {
  // A pure risk plan has no maturity/accumulation value at all — it must
  // never occupy a normal goal-funding component (Section 14/18).
  term_protection: ["PROTECTION_ONLY"],
  // Endowment: a guaranteed death benefit AND a guaranteed maturity
  // benefit are both part of the product's own published mechanics.
  savings_endowment: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  // Whole life: primarily long-horizon protection-plus-savings; still a
  // legitimate (if less common) goal-accumulation vehicle depending on
  // the specific plan's maturity/survival benefit design.
  whole_life: ["LONG_TERM_PROTECTION_SAVINGS", "GOAL_ACCUMULATION"],
  // Money-back/child plans pay scheduled survival benefits at intervals
  // before the final maturity payout — a genuinely different cash-flow
  // shape from a lump-sum endowment, alongside the same protection +
  // accumulation mechanics.
  money_back_child: ["GOAL_ACCUMULATION", "SCHEDULED_LIQUIDITY", "LONG_TERM_PROTECTION_SAVINGS"],
  // Pension/annuity products exist to convert a corpus/premium into
  // retirement income — never a general-purpose goal-accumulation slot
  // for a non-retirement goal.
  pension: ["RETIREMENT", "INCOME_GENERATION"],
  // Unit-linked: accumulation whose value depends on market performance
  // — never treated as guaranteed, never auto-selected (see
  // goalStructureGenerator.ts).
  market_linked_ulip: ["MARKET_LINKED_ACCUMULATION"],
  // Micro-insurance in this catalogue is small-sum-assured protection —
  // not a meaningful goal-accumulation vehicle for the goal amounts this
  // orchestrator deals with.
  micro_insurance: ["PROTECTION_ONLY"],
};

export function deriveProductRoles(product: InsuranceProduct): ProductRole[] {
  return ROLES_BY_CATEGORY[product.category] ?? [];
}

// A product can fund a normal goal-accumulation component only if at
// least one of its roles is something other than pure protection. This
// is the single gate that keeps term/micro-insurance products out of
// every goal-funding slot (Sections 14 and 18) — never a per-call
// special case scattered through the generator.
export function isGoalFundingRole(role: ProductRole): boolean {
  return role !== "PROTECTION_ONLY";
}

export function hasGoalFundingRole(product: InsuranceProduct): boolean {
  return deriveProductRoles(product).some(isGoalFundingRole);
}
