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

// Single status vocabulary shared by the comparison layer
// (lib/comparison/protectionAdjustedComparison.ts re-exports this same
// type as `ValueStatus`) and the engine/capability layer below. One
// vocabulary, never two incompatible systems. "partial" is for a
// capability/value that is verified for some inputs but not others (e.g.
// Plan 733's premium engine: exact sample-table matches only).
export type ValueStatus =
  | "verified"
  | "partial"
  | "illustrative"
  | "conditional"
  | "not_applicable"
  | "unavailable";

// Alias kept distinct in name only, for readability at engine/capability
// call sites — same type, same values, resolved by the same rules.
export type ProductCapabilityStatus = ValueStatus;

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
    | "withdrawn_page"
    | "official_tax_source"
    | "other_official";
  url: string;
  checkedAt: string;
  title?: string;
  /** Stable identifier so an engine result can cite exactly which source it used. */
  id?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
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

// ---- Scalable engine + verification framework ----
// One architecture for every LIC product, not one calculator per policy.
// A product with no registered engine still gets full, honest capability
// reporting (identity/status verified, every financial dimension
// unavailable) purely from the catalogue — see
// lib/insurance/capabilities.ts.

// A single verified fact, for future product rule tables (e.g. an entry
// age limit). `sourceId` refers to an OfficialProductSource.id.
export interface VerifiedFact<T> {
  value: T;
  sourceId: string;
  verifiedAt: string;
  notes?: string;
}

// A generic alias for the existing {code, params} reason-code shape,
// reused (not duplicated) so every engine dimension can report stable,
// translatable reasons the same way EligibilityResult already does.
export type ReasonCode = EligibilityReason;

// Standard wrapper for any engine dimension that doesn't already have an
// established result shape (EligibilityResult/PremiumCalculationResult/
// BenefitCalculationResult keep their existing shapes unchanged). Unknown
// is always `value: null` with a non-verified status — never 0, NaN, or
// Infinity standing in for "not calculated".
export interface EngineResult<T> {
  status: ValueStatus;
  value: T | null;
  sourceIds: string[];
  reasonCodes?: ReasonCode[];
}

// Per-product capability snapshot across every dimension the app can ever
// show. Reuses ValueStatus directly — see ProductCapabilityStatus above.
export interface ProductCapabilities {
  eligibility: ProductCapabilityStatus;
  premium: ProductCapabilityStatus;
  benefits: ProductCapabilityStatus;
  familyProtection: ProductCapabilityStatus;
  tax: ProductCapabilityStatus;
  costs: ProductCapabilityStatus;
  liquidity: ProductCapabilityStatus;
}

// Inputs a generic engine method might need. Only fields that a wizard
// screen could plausibly already have are included — no underwriting
// questionnaire, no unnecessary personal data.
export interface LicCalculationContext {
  age?: number;
  gender?: "male" | "female" | "other";
  basicSumAssured?: number;
  policyTermYears?: number;
  premiumPayingTermYears?: number;
  premiumMode?: PremiumFrequency;
  annualPremium?: number;
  monthlyBudget?: number;
  goalAmount?: number;
  goalHorizonYears?: number;
  existingLifeCover?: number;
  taxContext?: {
    regime?: "old" | "new";
    annualIncome?: number;
  };
}

export interface TaxTreatmentResult {
  premiumGst: EngineResult<number>;
  premiumDeduction: EngineResult<number>;
  maturityTax: EngineResult<string>;
  familyProtectionTax: EngineResult<string>;
}

export interface CostStructureResult {
  expenseRatio: EngineResult<number>;
  fundManagementCharge: EngineResult<number>;
  mortalityCharge: EngineResult<number>;
  adminCharge: EngineResult<number>;
  exitLoad: EngineResult<number>;
}

export interface FamilyProtectionResult {
  amount: EngineResult<number>;
}

export interface LiquidityResult {
  surrenderAvailable: EngineResult<boolean>;
  loanAvailable: EngineResult<boolean>;
}

// The generic per-product contract. Every method is optional — a missing
// method means that dimension resolves to "unavailable" via the
// capability resolver, never 0/false/not_applicable. Eligibility/premium/
// benefits deliberately keep their existing, already-tested result
// shapes rather than being wrapped in EngineResult, so registering an
// existing engine (e.g. Plan 733) never requires changing its formulas
// or its callers.
export interface LicProductEngine {
  provider: string;
  planNumber: string;
  uin: string;
  capabilities: ProductCapabilities;
  evaluateEligibility?(input: LicCalculationContext): EligibilityResult;
  calculatePremium?(input: LicCalculationContext): PremiumCalculationResult;
  calculateBenefits?(input: LicCalculationContext): BenefitCalculationResult;
  calculateFamilyProtection?(input: LicCalculationContext): FamilyProtectionResult;
  evaluateTaxTreatment?(input: LicCalculationContext): TaxTreatmentResult;
  calculateCosts?(input: LicCalculationContext): CostStructureResult;
  evaluateLiquidity?(input: LicCalculationContext): LiquidityResult;
}

// ---- Reusable rule-component abstractions (interfaces only) ----
// Shared shapes future product-family rule modules can implement so a new
// plan needs only data + wiring, not a bespoke calculator. None of these
// are implemented yet — only Plan 733's own inline rules exist today, and
// it is not being refactored onto these to avoid touching its verified
// behaviour. Only defined where a second product would plausibly reuse
// the exact same shape.
export interface AgeRule {
  minEntryAge: number;
  maxEntryAge: number;
  minMaturityAge?: number;
  maxMaturityAge?: number;
}

export interface TermRule {
  minPolicyTermYears: number;
  maxPolicyTermYears: number;
}

export interface PremiumPayingTermRule {
  // Either a fixed offset from policy term (e.g. "term - 3") or an
  // explicit allowed-values list — a product declares whichever applies.
  offsetFromPolicyTermYears?: number;
  allowedValuesYears?: number[];
}

export interface SumAssuredRule {
  minBasicSumAssured: number;
  maxBasicSumAssured: number | null;
  incrementRule: (sumAssured: number) => boolean;
}

export interface DeathBenefitRule {
  describe(context: LicCalculationContext): EngineResult<number>;
}

export interface MaturityBenefitRule {
  describe(context: LicCalculationContext): EngineResult<number>;
}

export interface SurvivalBenefitRule {
  describe(context: LicCalculationContext): EngineResult<number>;
}

export interface BonusRule {
  guaranteed: false;
  types: readonly string[];
}

export interface GuaranteedAdditionRule {
  guaranteed: true;
  describe(context: LicCalculationContext): EngineResult<number>;
}

export interface LoanRule {
  available: boolean;
  describe(context: LicCalculationContext): EngineResult<number>;
}

export interface SurrenderRule {
  minPremiumsPaidYears?: number;
  describe(context: LicCalculationContext): EngineResult<number>;
}

export interface TaxRule {
  describe(context: LicCalculationContext): TaxTreatmentResult;
}

export interface ChargeRule {
  describe(context: LicCalculationContext): CostStructureResult;
}
