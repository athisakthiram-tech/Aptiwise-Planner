// Shared types for the strategy/combination engine. A "strategy" here is
// a FEASIBLE PLANNING STRUCTURE, never a recommendation — see
// strategyGenerator.ts's header comment. This module intentionally has NO
// score, rank, rating, or "best"/"recommended" field anywhere; if a
// future change adds one, it is out of scope for this engine's design.

import { InsuranceCategory, ValueStatus } from "@/types/insurance";
import { ComparisonValue, RiskLevel } from "@/lib/comparison/protectionAdjustedComparison";
import { GoalCoverage } from "@/lib/calculations/goalCoverage";

// Machine-readable, localizable-later reason codes. Financial engines
// never generate customer-facing English directly — a UI layer maps each
// code to copy in the customer's chosen language.
export type StrategyReasonCode =
  | "PROTECTION_GAP_PRESENT"
  | "NO_PROTECTION_GAP"
  | "GOAL_FUNDING_REQUIRED"
  | "GOAL_ALREADY_COVERED"
  | "MARKET_RISK_ACCEPTED"
  | "MARKET_RISK_NOT_PREFERRED"
  | "LIQUIDITY_IMPORTANT"
  | "RETIREMENT_GOAL"
  | "PRODUCT_ELIGIBLE"
  | "PRODUCT_NEEDS_MORE_INFO"
  | "PREMIUM_VERIFIED"
  | "PREMIUM_UNAVAILABLE"
  | "ADDITIONAL_PROTECTION_REQUIRED"
  | "NO_ELIGIBLE_PRODUCTS";

export type StrategyFamily =
  | "protection_investment"
  | "traditional_protection"
  | "market_linked_insurance"
  | "traditional_structure"
  | "retirement_structure";

export type StrategyComponentRole =
  | "term_protection"
  | "traditional_savings"
  | "market_linked_savings"
  | "retirement_income"
  | "illustrative_investment";

export interface StrategyProductRef {
  planNumber: string;
  uin: string;
  productName: string;
  category: InsuranceCategory;
}

export interface StrategyComponent {
  role: StrategyComponentRole;
  // null only for the illustrative-investment role, which is not an LIC
  // product at all (see lib/calculations/sip.ts).
  product: StrategyProductRef | null;
  eligible: boolean | null;
  monthlyPremium: ComparisonValue<number>;
  deathBenefit: ComparisonValue<number>;
  maturityBenefit: ComparisonValue<number>;
  reasonCodes: StrategyReasonCode[];
  // Set only for the illustrative-investment role — the rate/duration
  // used to compute `maturityBenefit`, so a later snapshot (e.g.
  // lib/customerPlan) can honestly record what illustration was shown
  // without having to invert sipFutureValue to guess at it.
  illustration?: { ratePct: number; years: number };
  // Set by the Goal Orchestrator (lib/planning/goalOrchestrator/**) for a
  // real LIC product component — the exact Basic Sum Assured/Policy Term/
  // Premium Paying Term the engine was actually called with. Kept
  // deliberately separate from `deathBenefit`/`maturityBenefit`: a Basic
  // Sum Assured is never the same thing as a maturity value or the
  // customer's stated goal amount (see goalOrchestrator's own header
  // comment). Optional and additive — every existing caller that never
  // sets it is unaffected.
  configuration?: { basicSumAssured: number | null; policyTermYears: number | null; premiumPayingTermYears: number | null };
}

export interface StrategyResult {
  id: string;
  family: StrategyFamily;
  components: StrategyComponent[];
  monthlyBudgetAvailable: number | null;
  // NEVER pretends a component's premium is known when it isn't — stays
  // null whenever any contributing component's premium is unavailable.
  monthlyBudgetVerifiedUsed: number | null;
  monthlyBudgetUsageStatus: ValueStatus;
  remainingBudget: number | null;
  protectionCoverage: ComparisonValue<number>;
  protectionGap: ComparisonValue<number>;
  goalCoverage: ComparisonValue<GoalCoverage>;
  goalGap: ComparisonValue<number>;
  marketExposure: ComparisonValue<RiskLevel>;
  liquidity: ComparisonValue;
  guarantees: ComparisonValue<number>;
  costs: ComparisonValue;
  taxTreatment: ComparisonValue;
  assumptions: string[];
  warnings: string[];
  reasonCodes: StrategyReasonCode[];
  confidence: ValueStatus;
}
