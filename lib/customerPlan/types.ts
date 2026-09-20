// Customer Plan (proposal) domain model. A CustomerPlan is a STABLE
// SNAPSHOT captured at creation time — never a live reference to a
// StrategyResult, ProtectionNeedResult, GoalNeedResult or product
// engine. Once created, a plan's calculated figures never change even if
// a product engine, rate table, or the strategy generator itself is
// updated later — see createCustomerPlan.ts's header comment.
//
// This module is intentionally plain-data-only (no functions, no class
// instances) so a CustomerPlan can be JSON-serialized to local storage
// and read back byte-for-byte.

import { GoalType } from "@/types";
import { InsuranceCategory, ValueStatus } from "@/types/insurance";
import { GoalCoverage } from "@/lib/calculations/goalCoverage";
import { ComparisonValue, RiskLevel } from "@/lib/comparison/protectionAdjustedComparison";
import { StrategyComponentRole, StrategyFamily, StrategyReasonCode } from "@/lib/planning/strategyTypes";
import { Locale } from "@/lib/i18n/types";

// Bumped whenever the shape of CustomerPlan changes in a way old drafts
// can't be read as-is — see customerPlanMigration.ts for the version
// boundary this guards.
export const CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION = 1;

export interface CustomerPlanIdentity {
  name: string | null;
  phone: string | null;
}

export interface CustomerPlanGoalSnapshot {
  goalType: GoalType | null;
  targetAmount: number | null;
  yearsToGoal: number | null;
  currentResources: number | null;
  // The selected structure's own contribution toward this goal —
  // never upgraded past whatever status that contribution actually has
  // (verified/illustrative/unavailable/...).
  structureValue: number | null;
  goalCoveragePercent: number | null;
  remainingGoalGap: number | null;
  structureValueStatus: ValueStatus;
  // The customer-level goal-need completeness (independent of which
  // structure was picked) — "calculated"/"partial"/"unavailable" mapped
  // onto the shared ValueStatus vocabulary for a single consistent type.
  status: ValueStatus;
}

export interface CustomerPlanProtectionSnapshot {
  requiredProtection: number | null;
  requiredStatus: ValueStatus;
  existingProtection: number | null;
  protectionProvidedByStructure: number | null;
  protectionProvidedByStructureStatus: ValueStatus;
  remainingProtectionGap: number | null;
  remainingProtectionGapStatus: ValueStatus;
  methodology: string;
}

export interface CustomerPlanBudgetSnapshot {
  monthlyBudgetAvailable: number | null;
  monthlyBudgetVerifiedUsed: number | null;
  monthlyBudgetUsageStatus: ValueStatus;
  remainingBudget: number | null;
}

export interface CustomerPlanFinancialPicture {
  goal: CustomerPlanGoalSnapshot;
  protection: CustomerPlanProtectionSnapshot;
  budget: CustomerPlanBudgetSnapshot;
}

export interface CustomerPlanInvestmentIllustrationSnapshot {
  contributionAmount: number;
  years: number;
  ratePct: number;
  projectedValue: number;
  status: "illustrative";
  disclaimerCode: "illustration_only_not_guaranteed_returns";
}

export interface CustomerPlanProductSnapshot {
  productName: string;
  planNumber: string;
  uin: string;
  category: InsuranceCategory;
  // A stable, joinable reference back to the catalogue entry this
  // snapshot was taken from — never used to re-derive a value, only to
  // help a future feature (PDF, CRM, ...) look the product back up.
  sourceId: string;
}

export interface CustomerPlanComponentSnapshot {
  role: StrategyComponentRole;
  provider: "LIC" | null;
  product: CustomerPlanProductSnapshot | null;
  eligible: boolean | null;
  premium: ComparisonValue<number>;
  deathBenefit: ComparisonValue<number>;
  maturityBenefit: ComparisonValue<number>;
  investmentIllustration: CustomerPlanInvestmentIllustrationSnapshot | null;
  reasonCodes: StrategyReasonCode[];
  // Optional and additive (Goal Orchestrator V2) — the exact Basic Sum
  // Assured/Policy Term/Premium Paying Term this component's engine call
  // actually used, when a component came from
  // lib/planning/goalOrchestrator/**. Absent for every plan created
  // before this field existed, and absent for components that never had
  // a configured BSA (e.g. the illustrative-investment role) — never
  // backfilled or guessed. Deliberately never conflated with
  // maturityBenefit/deathBenefit or with the customer's stated goal
  // amount, which are each tracked as their own separate field.
  configuration?: { basicSumAssured: number | null; policyTermYears: number | null; premiumPayingTermYears: number | null };
}

export interface CustomerPlanSelectedStrategy {
  strategyId: string;
  family: StrategyFamily;
  components: CustomerPlanComponentSnapshot[];
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

// Machine-readable, localizable-later disclosure codes — see
// disclosures.ts for how these are derived from the strategy's own
// statuses (never a hardcoded wall of legal text).
export type CustomerPlanDisclosureCode =
  | "illustrative_investment_values"
  | "non_guaranteed_benefits"
  | "premium_requires_verification"
  | "tax_treatment_conditional"
  | "costs_unavailable"
  | "liquidity_conditional"
  | "market_linked_values"
  | "eligibility_not_underwriting_approval";

export interface CustomerPlanSourceMetadata {
  // A human-readable note (not re-parsed by any code) that this is a
  // point-in-time snapshot, not a live view — shown in "Important
  // information" so an advisor understands why re-opening a draft never
  // reflects a since-updated rate table.
  snapshotNote: "snapshot_not_live_reference";
  strategyIdAtCreation: string;
}

// Who the goal is funded by and who benefits from it — distinct from
// `customer` (the advisor's contact, i.e. who this proposal is FOR).
// Optional and additive (Goal Orchestrator V2); absent for every plan
// created before goal structures existed, and never inferred/guessed
// when the orchestrator itself didn't receive this information.
export interface CustomerPlanFundingContext {
  fundingPersonLabel: string | null;
  beneficiaryLabel: string | null;
}

export interface CustomerPlan {
  id: string;
  schemaVersion: number;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
  localeAtCreation: Locale;
  customer: CustomerPlanIdentity;
  financialPicture: CustomerPlanFinancialPicture;
  selectedStrategy: CustomerPlanSelectedStrategy;
  disclosures: CustomerPlanDisclosureCode[];
  sourceMetadata: CustomerPlanSourceMetadata;
  fundingContext?: CustomerPlanFundingContext;
}

// A lightweight, storage-list-friendly view of a plan — used by
// customerPlanStorage.ts's listDrafts() so the draft list doesn't need
// to fully parse/hold every saved plan in memory at once.
export interface CustomerPlanDraftSummary {
  id: string;
  customerName: string | null;
  goalType: GoalType | null;
  family: StrategyFamily;
  createdAt: string;
  updatedAt: string;
}
