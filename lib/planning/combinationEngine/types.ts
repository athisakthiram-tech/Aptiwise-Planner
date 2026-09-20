// Aptiwise Plan Combination Brain — Phase 2.
//
// This module NEVER re-derives Phase 1's own intelligence (eligibility,
// need-fit reasoning, benefit mechanics, premium estimation) — every
// judgment about a single product comes from
// lib/planning/planIntelligence/registry.ts, called as-is. This layer's
// only job is SEARCH: which products, in which configurations, combined
// how, produce a useful structure for THIS customer's situation.

import { GoalType } from "@/types";
import {
  BenefitDescriptor,
  CashFlowEvent,
  DataConfidence,
  ExtendedProductRole,
  NeedTag,
  PlanIntelligenceProfile,
  ProfessionCashFlowHints,
  ProfessionProfile,
  ProvenancedValue,
  ReturnAnalysis,
} from "@/lib/planning/planIntelligence/types";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { CustomerSuitabilityProfile } from "@/lib/planning/planIntelligence/types";

// ---- Input (spec's own PlanningRequest shape) ----
export type RiskPreference = "conservative" | "balanced" | "growth";

export interface PlanningRequest {
  age: number;
  profession?: string | null; // free text — a HINT only, see customerAnalyzer.ts
  goal: GoalType;
  goalAmount: number;
  yearsToGoal: number;
  monthlyCapacity: number;
  riskPreference?: RiskPreference | null;
  // Optional existing-customer fields, used only if provided — never
  // required, never guessed.
  existingInvestments?: number | null;
  existingLifeCover?: number | null;
  outstandingLiabilities?: number | null;
}

// ---- Stage 1: Customer understanding ----
export type GoalShape = "LUMP_SUM_AT_TARGET_YEAR" | "RECURRING_INCOME_AT_TARGET_YEAR";

// Deliberately NOT a boolean "allowMarketLinked" — risk preference is a
// SEARCH PREFERENCE/CONSTRAINT, never a product-name selector, and
// "conservative" still doesn't ban a customer from ever seeing a
// market-linked alternative in principle; it only makes market exposure
// a hard exclusion for THIS phase's elimination step (Stage 3's own
// worked example: "market-linked product where customer explicitly
// rejects market risk"). MODERATE/MAXIMIZE never force a minimum
// market-linked allocation — they only change what search treats as
// undesirable-but-not-impossible.
export type MarketLinkedPreference = "MINIMIZE" | "MODERATE" | "MAXIMIZE_WITHIN_REASON";

export interface CustomerAnalysis {
  request: PlanningRequest;
  financialProfile: CustomerFinancialProfile; // built once, reused for every Phase 1 registry call
  professionProfile: ProfessionProfile;
  professionHints: ProfessionCashFlowHints;
  suitability: CustomerSuitabilityProfile;
  goalShape: GoalShape;
  needTags: NeedTag[];
  marketLinkedPreference: MarketLinkedPreference;
  hasLumpSumCapital: boolean; // always false unless a caller explicitly models it — see planner.ts's own comment
}

// ---- Stage 2/3: candidate analysis + filtering ----
export interface CandidateAnalysis {
  profile: PlanIntelligenceProfile;
  ageEligible: boolean | "UNKNOWN";
  horizonCompatible: boolean | "UNKNOWN";
  needCompatible: boolean;
  relevantNeedFits: { need: NeedTag; fit: string; reasoning: string }[];
  premiumStructureCompatible: boolean;
  marketRiskCompatible: boolean;
  eliminated: boolean;
  eliminationReasons: string[];
}

// ---- Stage 4: configuration generation ----
export interface CandidateConfiguration {
  planNumber: string;
  uin: string;
  policyTermYears: number | null;
  premiumPayingTermYears: number | null;
  basicSumAssuredCandidate: number | null; // the BSA/allocation this configuration was PROBED at
  monthlyPremium: ProvenancedValue; // what the probe actually resolved (may differ in status from a request)
  role: ExtendedProductRole;
}

// ---- Stage 5-8: structures ----
export interface StructureComponent {
  planNumber: string;
  uin: string;
  productName: string;
  role: ExtendedProductRole;
  monthlyAllocation: ProvenancedValue;
  policyTermYears: number | null;
  premiumPayingTermYears: number | null;
  basicSumAssured: number | null;
  benefitModel: BenefitDescriptor[];
  cashFlowPattern: PlanIntelligenceProfile["cashFlowPattern"];
  marketLinked: boolean;
}

export interface CashFlowPhase {
  fromYear: number;
  toYear: number;
  allocatedMonthly: number;
  freeMonthly: number;
}

export interface CandidateStructure {
  id: string;
  components: StructureComponent[];
  timeline: CashFlowPhase[];
  events: CashFlowEvent[]; // per-component events merged, from Phase 1's cash-flow model
}

// ---- Stage 10-13: analysis ----
export interface StructureGoalAnalysis {
  totalContributions: ProvenancedValue;
  guaranteedPortion: ProvenancedValue;
  nonGuaranteedPortion: ProvenancedValue;
  marketLinkedIllustrativePortion: ProvenancedValue;
  incomeReceivedBeforeGoal: ProvenancedValue;
  incomeReceivedAfterGoal: ProvenancedValue;
  goalYearValue: ProvenancedValue; // guaranteed + non-guaranteed + market-linked, never double counted
  goalAmount: number;
  goalCoveragePercent: ProvenancedValue;
  gapOrSurplus: { kind: "GAP" | "SURPLUS" | "UNKNOWN"; amount: ProvenancedValue };
  irrPercent: ProvenancedValue;
  perComponentReturn: { planNumber: string; uin: string; returnAnalysis: ReturnAnalysis }[];
}

export type StructureReasonCode =
  | "MATCHES_GOAL_HORIZON"
  | "LIMITED_PREMIUM_FREES_CAPACITY"
  | "ADDS_MARKET_LINKED_GROWTH"
  | "PROVIDES_GOAL_YEAR_LUMP_SUM"
  | "SINGLE_COMPONENT_USES_FULL_CAPACITY"
  | "COMBINES_GUARANTEED_AND_MARKET_LINKED"
  | "COMBINES_TWO_GUARANTEED_COMPONENTS"
  | "PROVIDES_SCHEDULED_LIQUIDITY"
  | "PROVIDES_RECURRING_INCOME"
  | "GOAL_COVERAGE_ESTIMATED_NOT_VERIFIED"
  | "USES_RELEASED_POST_PPT_CAPACITY";

export interface AnalyzedStructure {
  structure: CandidateStructure;
  goalAnalysis: StructureGoalAnalysis;
  dataConfidence: DataConfidence;
  reasonCodes: StructureReasonCode[];
  explanationParts: { key: string; params?: Record<string, string | number> }[];
  monthlyBudgetUsed: ProvenancedValue;
}

export interface PlanningResult {
  finalStructures: AnalyzedStructure[]; // max 3, labeled Structure A/B/C by the caller — never ranked here
  stats: {
    productsAnalyzed: number;
    productsEliminated: number;
    configurationsGenerated: number;
    singleProductStructures: number;
    pairsTested: number;
    validPairs: number;
    triplesTested: number;
    validTriples: number;
    finalSimulatedStructures: number;
    runtimeMs: number;
  };
}
