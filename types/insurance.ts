// Insurance product domain types.
// Provider-agnostic so additional insurers (HDFC Life, SBI Life, ...) can be
// added later as sibling folders under lib/insurance/providers without any
// changes to this shape, the matching engine, or the UI.

import { GoalType } from "@/types";

export type InsuranceCategory =
  | "term_protection"
  | "savings_endowment"
  | "whole_life"
  | "money_back_child"
  | "pension"
  | "market_linked_ulip"
  | "micro_insurance";

export type ProductStatus = "ACTIVE" | "WITHDRAWN" | "REPLACED" | "UNKNOWN";

// Deliberately separate concerns: catalogue identity (name/plan/UIN) being
// verified says nothing about whether eligibility rules, premium,
// benefit, family-protection, tax, cost or liquidity calculations have
// been verified. Each flag must only flip to true when that specific
// thing has actually been verified. The newer fields are optional so
// existing product literals (tests included) don't need updating just to
// add a field they don't yet have an opinion on.
export interface ProductVerification {
  identityVerified: boolean;
  eligibilityRulesVerified: boolean;
  premiumEngineAvailable: boolean;
  benefitEngineAvailable: boolean;
  activeStatusVerified?: boolean;
  familyProtectionVerified?: boolean;
  taxTreatmentVerified?: boolean;
  costStructureVerified?: boolean;
  liquidityVerified?: boolean;
}

// A single piece of official evidence backing a catalogue entry. A
// product may have more than one (e.g. a category-page listing plus a
// brochure). Only small structured facts are stored here — never large
// excerpts of the source document itself.
export interface OfficialProductSource {
  sourceType:
    | "product_category_page"
    | "product_page"
    | "sales_brochure"
    | "policy_document"
    | "press_release"
    | "withdrawn_page";
  url: string;
  checkedAt: string;
  title?: string;
}

export interface InsuranceProduct {
  id: string;
  provider: string;
  productName: string;
  planNumber: string;
  uin: string;
  category: InsuranceCategory;
  goalTags: GoalType[];
  marketLinked: boolean;
  protectionAvailable: boolean;
  status: ProductStatus;
  officialSourceUrl: string;
  sourceCheckedDate: string;
  officialSources?: OfficialProductSource[];
  verification: ProductVerification;
}

// ---- Future calculator result types ----
// undefined/null always means "unknown" or "not available". Never use 0
// to represent an unknown financial value.

export type PremiumFrequency =
  | "monthly"
  | "quarterly"
  | "half_yearly"
  | "yearly"
  | "single";

// A stable, translatable reason code with the numeric parameters needed
// to render it — the UI translates `code` + `params` via t(), so a
// calculator never needs to produce customer-facing English (or Tamil/
// Hindi) sentences itself.
export interface EligibilityReason {
  code: string;
  params?: Record<string, number>;
}

export interface EligibilityResult {
  eligible: boolean | null;
  // Human-readable (English) — kept for logs/dev tooling and backward
  // compatibility. Customer-facing UI should prefer reasonCodes below.
  reasons: string[];
  reasonCodes?: EligibilityReason[];
  missingInputs: string[];
  sourceVersion?: string;
}

export interface PremiumCalculationResult {
  available: boolean;
  premium?: number;
  premiumFrequency?: PremiumFrequency;
  sumAssured?: number;
  missingInputs: string[];
  sourceVersion?: string;
}

export interface BenefitCalculationResult {
  available: boolean;
  guaranteedBenefits?: Record<string, number>;
  nonGuaranteedIllustrations?: Record<string, number>;
  deathBenefit?: number;
  maturityBenefit?: number;
  missingInputs: string[];
  sourceVersion?: string;
}

// A configuration-specific comparison against the customer's stated
// monthly budget — deliberately separate from MatchQuality.budgetVerified
// in lib/insurance/matching.ts, which stays false for category matching
// regardless of this. `verified` is only true once an exact premium was
// actually returned; unknown figures stay undefined, never 0.
export interface PlanBudgetComparison {
  verified: boolean;
  customerMonthlyBudget: number;
  annualPremium?: number;
  monthlyEquivalent?: number;
  withinBudget?: boolean;
}

// Everything a future LIC calculator might need. Only fields backed by an
// actual verified customer input should be populated by the UI today —
// the rest stay optional and calculators must report them via
// `missingInputs` rather than guessing.
export interface LicCalculatorInput {
  age: number;
  gender?: "male" | "female" | "other";
  sumAssured?: number;
  policyTermYears?: number;
  premiumPaymentTermYears?: number;
  premiumFrequency?: PremiumFrequency;
  smokerStatus?: "smoker" | "non_smoker";
  productSpecificInputs?: Record<string, unknown>;
}
