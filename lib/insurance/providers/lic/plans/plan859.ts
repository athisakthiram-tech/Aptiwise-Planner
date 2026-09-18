// Verified rule implementation for LIC's Saral Jeevan Bima (Plan 859,
// UIN 512N341V01). A Non-Par pure risk term plan with NO Level/Increasing
// Sum Assured choice (like Jeevan Raksha/894) and a 10x (not 7x)
// annualised-premium multiple in its Death Benefit formula. Uses the
// shared pure-term engine (pureTermShared.ts) — see
// docs/lic-plan859-verification.md.
//
// A 45-day waiting period applies from commencement of risk: a
// non-accidental death during this window pays only a refund of 100% of
// premiums received (no Sum Assured at all), while an accidental death
// during the window — or ANY death after it — pays the normal Sum
// Assured on Death computed below. This engine models only the
// post-waiting-period (normal) formula, since the reduced waiting-period
// benefit needs a "was death accidental / how many days since inception"
// fact this engine's single-call context can never carry — see
// docs/lic-plan859-verification.md for the full citation.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Saral_Jeevan_Bima_Sales_Brochure_30032026-ENG.pdf — the
// ONLY source for every rule below.

import { BenefitCalculationResult, EligibilityResult, LicCalculatorInput, PremiumCalculationResult } from "@/types/insurance";
import * as engine from "./pureTermShared";
import { PureTermRules } from "./pureTermShared";

export const PLAN_859_UIN = "512N341V01";

const SOURCE_VERSION = "LIC's Saral Jeevan Bima Sales Brochure, UIN 512N341V01";

export const PLAN_859_RULES: PureTermRules = {
  minEntryAge: 18,
  maxEntryAge: 65,
  // No separate minimum age at maturity is published for this plan.
  maxMaturityAge: 70,
  minPolicyTermYears: 5,
  // Fixed Limited Premium Paying Term options (5 or 10 years),
  // independent of the chosen Policy Term.
  limitedPptOptionsForTerm() {
    return [5, 10];
  },
  minBasicSumAssured: 500000,
  sumAssuredBands: [{ maxInclusive: null, multiple: 50000 }],
  levelMaxPolicyTermYears: 40, // subject to max maturity age of 70
  increasingMaxTermBandsRegularLimited: [],
  increasingMaxTermBandsSingle: [],
  hasIncreasingOption: false,
  // Unlike every other plan in this family, the Regular/Limited
  // multiple here is 10x annualised premium, not 7x.
  deathBenefit: { regularLimitedAnnualizedPremiumMultiple: 10, singlePremiumMultiple: 1.25 },
  // Sample Illustrative Premium (§5, p.5): two separate published
  // points, exact lookup only for each.
  //  - BSA Rs.5,00,000, age 30, term 20: the only point with published
  //    Limited (PPT 5/10) premiums.
  //  - BSA Rs.10,00,000, term 25, 5 ages: Regular/Single only — no
  //    Limited premium is published at this BSA/term, so limitedByPpt is
  //    deliberately empty rather than reusing the other point's figures.
  sampleIllustrativePremium: {
    basicSumAssured: 500000,
    levelRows: [
      { age: 30, policyTermYears: 20, regular: 2095, limitedByPpt: { 10: 3010, 5: 4955 }, single: 20310 },
    ],
    increasingRows: [],
  },
};

// A second, independent sample point (BSA Rs.10,00,000, term 25 years,
// Regular/Single only) — kept as a separate exported table rather than
// merged into PLAN_859_RULES.sampleIllustrativePremium, since the shared
// engine's calculatePremium only ever matches a single basicSumAssured.
export const PLAN_859_ALT_SAMPLE_PREMIUM = {
  basicSumAssured: 1000000,
  policyTermYears: 25,
  rows: [
    { age: 25, regular: 3850, single: 41610 },
    { age: 30, regular: 4670, single: 52260 },
    { age: 35, regular: 6110, single: 70840 },
    { age: 40, regular: 8340, single: 98630 },
    { age: 45, regular: 11660, single: 138230 },
  ],
} as const;

type Plan859Input = LicCalculatorInput;

export function evaluateEligibility(input: Plan859Input): EligibilityResult {
  return engine.evaluateEligibility(PLAN_859_RULES, input);
}

export function calculatePremium(input: Plan859Input): PremiumCalculationResult {
  return engine.calculatePremium(PLAN_859_RULES, input, SOURCE_VERSION);
}

export function calculateBenefits(input: Plan859Input): BenefitCalculationResult {
  return engine.calculateBenefits(PLAN_859_RULES, input, SOURCE_VERSION);
}
