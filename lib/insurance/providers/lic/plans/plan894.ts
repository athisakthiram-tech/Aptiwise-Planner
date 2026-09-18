// Verified rule implementation for LIC's Jeevan Raksha (Plan 894, UIN
// 512N368V01). A Non-Par pure risk term plan with NO Level/Increasing
// Sum Assured choice — its Absolute Amount is always flat Basic Sum
// Assured (Option I only, forced via hasIncreasingOption: false). Uses
// the shared pure-term engine (pureTermShared.ts) — see
// docs/lic-plan894-verification.md.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Jeevan_Raksha_English_Sales_brochure.pdf — the ONLY
// source for every rule below.

import { BenefitCalculationResult, EligibilityResult, LicCalculatorInput, PremiumCalculationResult } from "@/types/insurance";
import * as engine from "./pureTermShared";
import { PureTermRules } from "./pureTermShared";

export const PLAN_894_UIN = "512N368V01";

const SOURCE_VERSION = "LIC's Jeevan Raksha Sales Brochure, UIN 512N368V01";

export const PLAN_894_RULES: PureTermRules = {
  minEntryAge: 18,
  maxEntryAge: 45,
  minMaturityAge: 33,
  maxMaturityAge: 60,
  minPolicyTermYears: 15,
  // Fixed Limited Premium Paying Term options (10 or 15 years) — the
  // 15-year option needs a Policy Term of at least 20 years.
  limitedPptOptionsForTerm(policyTermYears) {
    return policyTermYears >= 20 ? [10, 15] : [10];
  },
  minBasicSumAssured: 500000,
  sumAssuredBands: [
    { maxInclusive: 700000, multiple: 50000 },
    { maxInclusive: null, multiple: 100000 },
  ],
  levelMaxPolicyTermYears: 42, // subject to max maturity age of 60
  // No Increasing Sum Assured option exists for this plan, so these
  // bands are never consulted (see hasIncreasingOption below).
  increasingMaxTermBandsRegularLimited: [],
  increasingMaxTermBandsSingle: [],
  hasIncreasingOption: false,
  deathBenefit: { regularLimitedAnnualizedPremiumMultiple: 7, singlePremiumMultiple: 1.25 },
  // Sample Illustrative Premium (§7, p.7): BSA Rs.5,00,000, Non-Smoker
  // Male standard lives, term 20 years. The "increasingRows" table below
  // is left equal to the level rows since this plan has no separate
  // Increasing option — the shared engine never selects it (option is
  // always forced to "I").
  sampleIllustrativePremium: {
    basicSumAssured: 500000,
    levelRows: [
      { age: 20, policyTermYears: 20, regular: 2290, limitedByPpt: { 15: 2555, 10: 3150 }, single: 19035 },
      { age: 30, policyTermYears: 20, regular: 2730, limitedByPpt: { 15: 3070, 10: 3825 }, single: 23805 },
      { age: 40, policyTermYears: 20, regular: 4435, limitedByPpt: { 15: 5035, 10: 6390 }, single: 41770 },
    ],
    increasingRows: [],
  },
};

type Plan894Input = LicCalculatorInput;

export function evaluateEligibility(input: Plan894Input): EligibilityResult {
  return engine.evaluateEligibility(PLAN_894_RULES, input);
}

export function calculatePremium(input: Plan894Input): PremiumCalculationResult {
  return engine.calculatePremium(PLAN_894_RULES, input, SOURCE_VERSION);
}

export function calculateBenefits(input: Plan894Input): BenefitCalculationResult {
  return engine.calculateBenefits(PLAN_894_RULES, input, SOURCE_VERSION);
}
