// Insurance product domain types.
// Provider-agnostic so additional insurers (HDFC Life, SBI Life, ...) can be
// added later as sibling folders under lib/insurance/providers without any
// changes to this shape, the matching engine, or the UI.

import { GoalType } from "@/types";

export type InsuranceCategory =
  | "term_protection"
  | "savings_endowment"
  | "market_linked_ulip"
  | "money_back_child";

export type ProductStatus = "ACTIVE" | "WITHDRAWN" | "UNKNOWN";

// Deliberately separate concerns: catalogue identity (name/plan/UIN) being
// verified says nothing about whether eligibility rules, premium
// calculation, or benefit calculation have been verified. Each flag must
// only flip to true when that specific thing has actually been verified.
export interface ProductVerification {
  identityVerified: boolean;
  eligibilityRulesVerified: boolean;
  premiumEngineAvailable: boolean;
  benefitEngineAvailable: boolean;
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

export interface EligibilityResult {
  eligible: boolean | null;
  reasons: string[];
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
