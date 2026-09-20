// Combination roles + pairing intelligence (Sections 17/18). Reuses
// lib/planning/goalOrchestrator/productRoles.ts's ProductRole vocabulary
// (never a second, incompatible role system) and extends it with LEGACY/
// CAPITAL_STABILITY, the two roles this Phase 1 model needs that the
// (goal-accumulation-focused) Goal Orchestrator never did.
//
// Pairing intelligence is expressed as COMPLEMENTARY CHARACTERISTICS —
// e.g. "stable maturity-oriented accumulation" complements
// "MARKET_LINKED_ACCUMULATION" — never a hardcoded pair of plan numbers.
// A future combination engine reads these characteristics to reason
// about "what could this product usefully sit alongside," without this
// module ever naming two specific products together.

import { ComplementaryCharacteristic, ExtendedProductRole } from "@/lib/planning/planIntelligence/types";

// A small, reusable library of complementary characteristics — plan
// profiles select whichever genuinely apply to their own mechanics,
// rather than each writing its own free-text reasoning from scratch.
export const COMPLEMENTARY_CHARACTERISTICS: Record<string, ComplementaryCharacteristic> = {
  STABLE_MATURITY_ACCUMULATION: {
    characteristic: "stable, guaranteed-floor, maturity-oriented accumulation",
    complementsRolesWith: ["MARKET_LINKED_ACCUMULATION"],
    reasoning: "A guaranteed accumulation floor pairs naturally with a market-linked component's growth potential — one component anchors the outcome while the other targets upside, without either being forced to do both jobs alone.",
  },
  MARKET_LINKED_GROWTH: {
    characteristic: "market-linked growth potential",
    complementsRolesWith: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS", "CAPITAL_STABILITY"],
    reasoning: "Market-linked growth potential pairs with a capital-stable or guaranteed-floor component so overall goal funding isn't entirely dependent on market performance.",
  },
  SCHEDULED_INTERIM_LIQUIDITY: {
    characteristic: "scheduled interim liquidity",
    complementsRolesWith: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
    reasoning: "Scheduled interim payouts can meet near-term cash needs while a separate lump-sum-oriented component continues accumulating toward the final goal.",
  },
  RECURRING_INCOME: {
    characteristic: "income orientation",
    complementsRolesWith: ["GOAL_ACCUMULATION"],
    reasoning: "An income-generating component can complement a lump-sum goal-accumulation component when the customer has both an ongoing income need and a separate lump-sum requirement.",
  },
  LONG_HORIZON_PROTECTION: {
    characteristic: "long-horizon life protection",
    complementsRolesWith: ["GOAL_ACCUMULATION", "MARKET_LINKED_ACCUMULATION"],
    reasoning: "Standalone long-horizon protection can sit alongside a purely accumulation-focused component (traditional or market-linked) so the accumulation component doesn't have to carry the family's full protection need.",
  },
};

export type { ExtendedProductRole };
