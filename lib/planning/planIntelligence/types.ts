// Aptiwise LIC Plan Intelligence Model — Phase 1.
//
// This is a PLANNING intelligence layer, not a second calculation
// engine. It never re-derives a premium/benefit number an existing
// registered engine (lib/insurance/providers/lic/engines.ts) already
// calculates — where a registered engine exists, this layer reads and
// re-labels that engine's own verified output. Where no registered
// engine exists (a catalogue-only product), this layer still describes
// the product's real, publicly-documented mechanics and offers a
// clearly-labeled ESTIMATE rather than leaving the product blank.
//
// Every monetary/return figure this layer produces carries a
// DataConfidence tag (see confidence.ts) — never silently presented as
// an official LIC value unless it genuinely is one.

import { GoalType } from "@/types";
import { InsuranceCategory, PremiumFrequency } from "@/types/insurance";
import { ProductRole } from "@/lib/planning/goalOrchestrator/productRoles";

// ---- Confidence / provenance vocabulary (Section 23) ----
// Deliberately SEPARATE from types/insurance.ts's ValueStatus
// (verified/partial/illustrative/conditional/not_applicable/
// unavailable), which answers "was this ONE calculation, for this one
// input, confirmed" at the per-dimension engine-result level. This
// vocabulary answers a different, forward-looking planning question:
// "how was this planning figure obtained at all" — including figures no
// engine result type has ever needed to express, like a historical NAV
// CAGR or a scaled estimate. Do not conflate the two.
export type DataConfidence =
  | "VERIFIED" // taken directly from an official LIC document/registered engine
  | "DERIVED" // mathematically computed from VERIFIED values via a stated formula
  | "ESTIMATED" // approximated via a stated, defensible, deterministic method
  | "HISTORICAL" // an actually-occurred past figure (e.g. ULIP NAV performance)
  | "ILLUSTRATIVE"; // a future scenario assumption, never a promise

// Phase 3B (Section: SOURCE QUALITY) — how the FACT was obtained, kept
// deliberately separate from DataConfidence (which says what KIND of
// value this is — guaranteed/estimated/historical/etc). A HISTORICAL
// bonus rate can be PRIMARY_OFFICIAL (read directly off LIC's own
// circular) or SECONDARY_SINGLE_SOURCE (one aggregator's transcription
// of it) — the DataConfidence tag alone can't distinguish those, and a
// caller reasoning about how much to trust a figure needs both axes.
export type SourceQuality =
  | "PRIMARY_OFFICIAL" // read directly from an LIC brochure/policy document/product page/NAV disclosure
  | "SECONDARY_CORROBORATED" // not LIC's own document, but 2+ independent secondary sources agree
  | "SECONDARY_SINGLE_SOURCE" // exactly one secondary source, uncorroborated
  | "INTERNAL_DERIVATION"; // computed by this repository's own formula from other already-sourced values

export interface Provenance {
  status: DataConfidence;
  method?: string; // required whenever status is DERIVED or ESTIMATED
  sourceReferences: string[]; // e.g. ["lic-736-sales-brochure-current"], catalogue source ids
  asOf?: string; // ISO date, when meaningful (e.g. HISTORICAL NAV data)
  sourceQuality?: SourceQuality;
  // Phase 3 (Section: ESTIMATION CONFIDENCE) — an internal planning-engine
  // signal, separate from DataConfidence, for HOW GOOD a given ESTIMATED/
  // DERIVED/HISTORICAL value's own method is (an exact official table
  // lookup vs. interpolation between nearby values vs. scaling from one
  // distant sample vs. a historical-bonus-based projection). Deliberately
  // NOT surfaced prominently to customers — it exists for the planning
  // engine's own reasoning (e.g. future diversity/selection weighting),
  // not as a customer-facing label. Optional: existing values this phase
  // did not specifically enrich simply omit it, which is not itself a
  // claim of any particular confidence level.
  estimationConfidence?: "HIGH" | "MEDIUM" | "LOW";
}

// A single monetary or numeric planning value, always paired with its
// own provenance — never a bare number a caller could mistake for an
// official figure. `value: null` still requires a provenance record
// (status usually ESTIMATED with method "not_yet_estimatable") so a
// missing figure is never indistinguishable from an unset field.
export interface ProvenancedValue<T = number> {
  value: T | null;
  provenance: Provenance;
}

// ---- Identity (Section 1) ----
export interface PlanIdentity {
  productName: string;
  planNumber: string;
  uin: string;
  version: string; // the UIN's own version suffix, e.g. "V03"
  active: boolean;
  category: InsuranceCategory;
  hasRegisteredEngine: boolean; // whether lib/insurance/providers/lic/engines.ts has a real calculator
}

// ---- Product nature (Section 2) ----
export type ProductNature =
  | "TRADITIONAL_PARTICIPATING"
  | "TRADITIONAL_NON_PARTICIPATING"
  | "WHOLE_LIFE"
  | "MONEY_BACK"
  | "INCOME_ORIENTED"
  | "ENDOWMENT"
  | "PENSION"
  | "ANNUITY"
  | "MARKET_LINKED"
  | "SINGLE_PREMIUM"
  | "LIMITED_PREMIUM"
  | "REGULAR_PREMIUM";

// ---- Eligibility (Section 3) — reused, never re-verified here ----
export interface EligibilitySummary {
  minEntryAge: number | null;
  maxEntryAge: number | null;
  minMaturityAge: number | null;
  maxMaturityAge: number | null;
  minPolicyTermYears: number | null;
  maxPolicyTermYears: number | null;
  validTermOptions: readonly number[] | null; // set only when terms are a discrete set, not a range
  minPremiumOrBsa: { minBasicSumAssured: number | null; minPremium: number | null };
  premiumModes: readonly PremiumFrequency[];
  notes: string[];
}

// ---- Premium model (Section 4/5) ----
export type PremiumStructureKind = "SINGLE" | "LIMITED" | "REGULAR" | "CUSTOMER_CHOSEN";

export type PptRelationship =
  | { kind: "EQUALS_TERM" } // Regular Pay: PPT === Policy Term
  | { kind: "FIXED_OFFSET"; offsetYears: number } // PPT = Term - offset
  | { kind: "FIXED_PAIRING" } // a specific published Term<->PPT table
  | { kind: "INDEPENDENT_CHOICE" } // PPT is a genuine, separately-priced choice
  | { kind: "DERIVED_FROM_AGE" } // Term/PPT both fully determined by entry age
  | { kind: "NOT_APPLICABLE" }; // single premium, or premium isn't LIC-calculated at all

export type PremiumCalculationReadiness =
  | "VERIFIED_TABLE" // an exact, registered engine can confirm arbitrary in-range configurations it has sample data for
  | "SAMPLE_ONLY" // only exact brochure sample points resolve via the registered engine
  | "ESTIMABLE" // no registered engine (or an incomplete one), but a defensible estimation method exists
  | "NOT_YET_ESTIMATABLE"; // no defensible method exists yet — must not be guessed

export interface PremiumModel {
  structure: PremiumStructureKind;
  pptRelationship: PptRelationship;
  calculationReadiness: PremiumCalculationReadiness;
  minimumContribution: ProvenancedValue;
  notes: string[];
}

// ---- Premium estimation interface (Section 5) ----
export interface EstimatePremiumInput {
  planKey: string; // `${planNumber}::${uin}`
  age: number;
  policyTermYears?: number;
  premiumPayingTermYears?: number;
  targetBasicSumAssured?: number;
  premiumMode?: PremiumFrequency;
}

export interface EstimatePremiumResult {
  amountMonthly: number | null;
  amountAnnual: number | null;
  provenance: Provenance;
}

// ---- Benefit model (Section 6) ----
export type BenefitType =
  | "MATURITY"
  | "SURVIVAL"
  | "INCOME"
  | "GUARANTEED_ADDITION"
  | "LOYALTY_ADDITION"
  | "SIMPLE_REVERSIONARY_BONUS"
  | "FINAL_ADDITIONAL_BONUS"
  | "MARKET_LINKED_FUND_VALUE"
  | "ANNUITY"
  | "LIFE_PROTECTION"
  | "OTHER_CONTRACTUAL_BENEFIT";

export type BenefitCharacter = "GUARANTEED" | "NON_GUARANTEED" | "MARKET_LINKED" | "HISTORICAL" | "ESTIMATED";

export interface BenefitDescriptor {
  type: BenefitType;
  character: BenefitCharacter;
  description: string; // one-line, factual, no marketing language
  timing: "AT_MATURITY" | "SCHEDULED_INTERVALS" | "ON_DEATH" | "DEFERRED_THEN_RECURRING" | "CONTINUOUS_ACCUMULATION";
}

// ---- Cash-flow model (Section 7) ----
export type CashFlowEventKind = "PREMIUM_OUTFLOW" | "SURVIVAL_BENEFIT" | "INCOME_PAYMENT" | "MATURITY_BENEFIT" | "DEATH_BENEFIT" | "CHARGE_DEDUCTION";

export interface CashFlowEvent {
  yearFromStart: number;
  kind: CashFlowEventKind;
  amount: ProvenancedValue;
}

// A qualitative shape descriptor — used even when no configuration has
// been priced yet, so the intelligence layer is never "empty" just
// because an exact number is missing (Section 22).
export type CashFlowPattern =
  | "LUMP_SUM_OUTFLOW_THEN_LUMP_SUM_MATURITY" // single premium -> one maturity payout
  | "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY" // regular/limited premium -> one maturity payout
  | "LEVEL_OUTFLOW_THEN_SCHEDULED_SURVIVAL_PAYMENTS" // money-back style
  | "LEVEL_OUTFLOW_THEN_DEFERRED_RECURRING_INCOME" // income/whole-life style
  | "PURCHASE_PRICE_THEN_DEFERRED_RECURRING_ANNUITY" // deferred annuity
  | "PURCHASE_PRICE_THEN_IMMEDIATE_RECURRING_ANNUITY" // immediate annuity
  | "PREMIUM_MINUS_CHARGES_INTO_MARKET_LINKED_FUND"; // ULIP

// ---- Return analysis (Section 8) ----
export interface ReturnAnalysis {
  totalPremiumPaid: ProvenancedValue;
  guaranteedBenefitsReceived: ProvenancedValue;
  nonGuaranteedIllustratedBenefits: ProvenancedValue;
  incomeReceived: ProvenancedValue;
  maturityValue: ProvenancedValue;
  goalYearValue: ProvenancedValue;
  totalValueReceived: ProvenancedValue;
  irrPercent: ProvenancedValue; // NEVER labeled "interest rate"; NEVER VERIFIED/guaranteed unless every underlying cash flow is guaranteed
}

// ---- ULIP-specific intelligence (Sections 9/10/11) ----
export interface UlipFundCharacteristics {
  fundName: string;
  assetClass: "EQUITY" | "DEBT" | "BALANCED" | "INDEX" | "OTHER";
  notes: string[];
}

export interface UlipHistoricalPerformancePoint {
  fundName: string;
  periodLabel: "1Y" | "3Y_CAGR" | "5Y_CAGR" | "10Y_CAGR" | "SINCE_INCEPTION";
  startDate: string | null;
  endDate: string | null;
  returnPercent: number | null;
  source: string;
  asOf: string | null;
  status: "HISTORICAL"; // fixed — never anything else on this record
}

export interface UlipOfficialIllustration {
  ratesPct: readonly number[]; // the product/version's OWN prescribed illustration rates — never a hardcoded global 6/8/10
  source: string;
  status: "ILLUSTRATIVE"; // fixed
}

export interface UlipIntelligence {
  funds: UlipFundCharacteristics[];
  historicalPerformance: UlipHistoricalPerformancePoint[];
  officialIllustration: UlipOfficialIllustration | null;
  charges: { name: string; description: string; provenance: Provenance }[];
  lockInYears: number | null;
}

// ---- Need suitability (Sections 12/13) ----
export type NeedTag =
  | "CHILD_EDUCATION"
  | "CHILD_MARRIAGE"
  | "RETIREMENT"
  | "WEALTH_ACCUMULATION"
  | "REGULAR_INCOME"
  | "LONG_TERM_SAVINGS"
  | "LEGACY"
  | "HOME_GOAL"
  | "SCHEDULED_LIQUIDITY"
  | "MARKET_LINKED_GROWTH"
  | "CAPITAL_PRESERVATION"
  | "LIFELONG_INCOME";

export type NeedFit = "STRONG_FIT" | "POSSIBLE_FIT" | "WEAK_FIT" | "NOT_APPLICABLE";

export interface NeedFitAssessment {
  need: NeedTag;
  fit: NeedFit;
  reasoning: string; // mechanics-based, factual — never "this is the best plan for X"
}

// Maps an advisor-facing GoalType onto the finer-grained NeedTag
// vocabulary this layer reasons over — a goal can imply more than one
// need (e.g. "wealth" implies both WEALTH_ACCUMULATION and
// LONG_TERM_SAVINGS).
export const GOAL_TYPE_TO_NEED_TAGS: Record<GoalType, NeedTag[]> = {
  child_education: ["CHILD_EDUCATION", "LONG_TERM_SAVINGS"],
  marriage: ["CHILD_MARRIAGE", "LONG_TERM_SAVINGS"],
  retirement: ["RETIREMENT", "LIFELONG_INCOME", "REGULAR_INCOME"],
  wealth: ["WEALTH_ACCUMULATION", "LONG_TERM_SAVINGS", "MARKET_LINKED_GROWTH"],
  home: ["HOME_GOAL", "LONG_TERM_SAVINGS"],
  family_protection: ["LEGACY", "CAPITAL_PRESERVATION"],
};

// ---- Profession / customer suitability (Sections 14/15/16) ----
export type ProfessionProfile =
  | "SALARIED_STABLE"
  | "SALARIED_VARIABLE"
  | "SELF_EMPLOYED"
  | "BUSINESS_OWNER"
  | "PROFESSIONAL"
  | "AGRICULTURE_SEASONAL"
  | "IRREGULAR_INCOME"
  | "RETIRED"
  | "OTHER";

// Planning HINTS only — never a product mapping, and always overridden
// by explicit customer-provided data (see customerSuitability.ts).
export interface ProfessionCashFlowHints {
  incomeStability: "STABLE" | "VARIABLE" | "SEASONAL" | "UNKNOWN";
  monthlyPredictability: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  longPptSustainability: "LIKELY_SUSTAINABLE" | "UNCERTAIN" | "UNLIKELY" | "UNKNOWN";
  preferredPremiumModeHint: PremiumFrequency | "NO_STRONG_PREFERENCE";
  liquidityImportance: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
}

export type HorizonBand = "SHORT" | "MEDIUM" | "LONG";
export type CapacityBand = "LOW" | "MEDIUM" | "HIGH";
export type LiquidityNeedBand = "REQUIRES_LIQUIDITY" | "CAN_ACCEPT_LOCK_IN" | "UNKNOWN";
export type RiskPostureBand = "PREFERS_STABILITY" | "BALANCED" | "ACCEPTS_MARKET_RISK" | "UNKNOWN";

export interface CustomerSuitabilityProfile {
  horizon: HorizonBand;
  capacity: CapacityBand;
  needsLumpSum: boolean;
  needsRecurringIncome: boolean;
  riskPosture: RiskPostureBand;
  liquidityNeed: LiquidityNeedBand;
}

// ---- Combination roles / pairing intelligence (Sections 17/18) ----
// Reuses lib/planning/goalOrchestrator/productRoles.ts's ProductRole
// vocabulary, extended with two additional roles this Phase 1 model
// needs that the (goal-accumulation-only) Goal Orchestrator didn't:
export type ExtendedProductRole = ProductRole | "LEGACY" | "CAPITAL_STABILITY";

export interface ComplementaryCharacteristic {
  characteristic: string; // e.g. "stable maturity-oriented accumulation"
  complementsRolesWith: ExtendedProductRole[];
  reasoning: string;
}

// ---- Strengths / tradeoffs (Section 19) — factual, never superlative ----
export interface FactualCharacteristic {
  label: string; // e.g. "limited premium obligation", never "best-in-class"
  detail: string;
}

// ---- The full profile (top-level shape from the spec) ----
export interface PlanIntelligenceProfile {
  identity: PlanIdentity;
  productNature: ProductNature[];
  eligibility: EligibilitySummary;
  premiumModel: PremiumModel;
  benefitModel: BenefitDescriptor[];
  protectionModel: { hasLifeProtection: boolean; description: string };
  cashFlowPattern: CashFlowPattern;
  returnCharacteristics: {
    calculationReadiness: PremiumCalculationReadiness; // premium side
    irrCalculable: boolean;
    notes: string[];
  };
  liquidityCharacteristics: { surrenderAvailable: DataConfidence | "NOT_APPLICABLE"; loanAvailable: DataConfidence | "NOT_APPLICABLE"; lockInYears: number | null; notes: string[] };
  marketRisk: "NONE" | "MARKET_LINKED";
  ulip: UlipIntelligence | null;
  needSuitability: NeedFitAssessment[];
  professionSuitability: string[]; // qualitative notes, e.g. "limited-pay structure suits variable-income customers who can front-load savings"
  combinationRoles: ExtendedProductRole[];
  complementaryCharacteristics: ComplementaryCharacteristic[];
  strengths: FactualCharacteristic[];
  tradeoffs: FactualCharacteristic[];
  usefulWhen: string[];
  lessUsefulWhen: string[];
  dataConfidence: DataConfidence; // the WEAKEST confidence among this profile's own load-bearing fields
  sources: string[];
}
