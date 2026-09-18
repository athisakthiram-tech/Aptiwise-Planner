// Verified rule implementation for LIC's Digi Term (Plan 876, UIN
// 512N356V02). A Non-Par, Online-only, pure risk term plan — no maturity
// benefit, no surrender value (except Unexpired Risk Premium Value,
// recorded but not computed), no loan. Uses the shared pure-term engine
// (pureTermShared.ts) with this plan's own eligibility/premium/rebate
// data — see docs/lic-plan876-verification.md.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): Digi_Term_-_Sales_Brochure_April_25.pdf — the ONLY source
// for every rule below.

import { BenefitCalculationResult, EligibilityResult, LicCalculatorInput, PremiumCalculationResult } from "@/types/insurance";
import * as engine from "./pureTermShared";
import { PureTermRules } from "./pureTermShared";

export const PLAN_876_UIN = "512N356V02";

const SOURCE_VERSION = "LIC's Digi Term Sales Brochure, UIN 512N356V02";

export const PLAN_876_RULES: PureTermRules = {
  minEntryAge: 18,
  maxEntryAge: 45,
  minMaturityAge: 33,
  maxMaturityAge: 75,
  minPolicyTermYears: 15,
  // Fixed Limited Premium Paying Term options (10 or 15 years),
  // independent of the chosen Policy Term — the 15-year option needs a
  // Policy Term of at least 20 years.
  limitedPptOptionsForTerm(policyTermYears) {
    return policyTermYears >= 20 ? [10, 15] : [10];
  },
  minBasicSumAssured: 5000000,
  sumAssuredBands: [
    { maxInclusive: 7500000, multiple: 100000 },
    { maxInclusive: 15000000, multiple: 2500000 },
    { maxInclusive: 40000000, multiple: 5000000 },
    { maxInclusive: null, multiple: 10000000 },
  ],
  levelMaxPolicyTermYears: 40,
  // Option II (Increasing Sum Assured) max Policy Term by age band and
  // Basic Sum Assured band (brochure §2.g.ii, p.3-4).
  increasingMaxTermBandsRegularLimited: [
    { minAge: 18, maxAge: 21, bsaMaxExclusive: 10000000, maxPolicyTermYears: 40 },
    { minAge: 22, maxAge: 24, bsaMaxExclusive: 10000000, maxPolicyTermYears: 36 },
    { minAge: 25, maxAge: 28, bsaMaxExclusive: 10000000, maxPolicyTermYears: 31 },
    { minAge: 29, maxAge: 35, bsaMaxExclusive: 10000000, maxPolicyTermYears: 28 },
    { minAge: 36, maxAge: 45, bsaMaxExclusive: 10000000, maxPolicyTermYears: 26 },
    { minAge: 18, maxAge: 19, bsaMaxExclusive: 25000000, maxPolicyTermYears: 40 },
    { minAge: 20, maxAge: 21, bsaMaxExclusive: 25000000, maxPolicyTermYears: 36 },
    { minAge: 22, maxAge: 26, bsaMaxExclusive: 25000000, maxPolicyTermYears: 30 },
    { minAge: 27, maxAge: 28, bsaMaxExclusive: 25000000, maxPolicyTermYears: 28 },
    { minAge: 29, maxAge: 32, bsaMaxExclusive: 25000000, maxPolicyTermYears: 25 },
    { minAge: 33, maxAge: 39, bsaMaxExclusive: 25000000, maxPolicyTermYears: 22 },
    { minAge: 40, maxAge: 45, bsaMaxExclusive: 25000000, maxPolicyTermYears: 21 },
    { minAge: 18, maxAge: 24, bsaMaxExclusive: 50000000, maxPolicyTermYears: 40 },
    { minAge: 25, maxAge: 28, bsaMaxExclusive: 50000000, maxPolicyTermYears: 35 },
    { minAge: 29, maxAge: 45, bsaMaxExclusive: 50000000, maxPolicyTermYears: 30 },
    { minAge: 18, maxAge: 45, bsaMaxExclusive: null, maxPolicyTermYears: 40 },
  ],
  increasingMaxTermBandsSingle: [
    { minAge: 18, maxAge: 22, bsaMaxExclusive: 10000000, maxPolicyTermYears: 40 },
    { minAge: 23, maxAge: 25, bsaMaxExclusive: 10000000, maxPolicyTermYears: 35 },
    { minAge: 26, maxAge: 29, bsaMaxExclusive: 10000000, maxPolicyTermYears: 30 },
    { minAge: 30, maxAge: 36, bsaMaxExclusive: 10000000, maxPolicyTermYears: 28 },
    { minAge: 37, maxAge: 45, bsaMaxExclusive: 10000000, maxPolicyTermYears: 27 },
    { minAge: 18, maxAge: 21, bsaMaxExclusive: 25000000, maxPolicyTermYears: 40 },
    { minAge: 22, maxAge: 24, bsaMaxExclusive: 25000000, maxPolicyTermYears: 35 },
    { minAge: 25, maxAge: 28, bsaMaxExclusive: 25000000, maxPolicyTermYears: 30 },
    { minAge: 29, maxAge: 33, bsaMaxExclusive: 25000000, maxPolicyTermYears: 28 },
    { minAge: 34, maxAge: 45, bsaMaxExclusive: 25000000, maxPolicyTermYears: 25 },
    { minAge: 18, maxAge: 45, bsaMaxExclusive: 50000000, maxPolicyTermYears: 40 },
    { minAge: 18, maxAge: 45, bsaMaxExclusive: null, maxPolicyTermYears: 40 },
  ],
  deathBenefit: { regularLimitedAnnualizedPremiumMultiple: 7, singlePremiumMultiple: 1.25 },
  // Sample Illustrative Premium (§7, p.8): BSA Rs.50,00,000, Non-Smoker
  // Male standard lives, term 20 years.
  sampleIllustrativePremium: {
    basicSumAssured: 5000000,
    levelRows: [
      { age: 20, policyTermYears: 20, regular: 3600, limitedByPpt: { 15: 4100, 10: 5200 }, single: 37750 },
      { age: 30, policyTermYears: 20, regular: 4700, limitedByPpt: { 15: 5400, 10: 6950 }, single: 50850 },
      { age: 40, policyTermYears: 20, regular: 9400, limitedByPpt: { 15: 10850, 10: 14050 }, single: 104900 },
    ],
    increasingRows: [
      { age: 20, policyTermYears: 20, regular: 4650, limitedByPpt: { 15: 5350, 10: 6850 }, single: 50100 },
      { age: 30, policyTermYears: 20, regular: 6600, limitedByPpt: { 15: 7650, 10: 9850 }, single: 72950 },
      { age: 40, policyTermYears: 20, regular: 14400, limitedByPpt: { 15: 16750, 10: 21700 }, single: 163250 },
    ],
  },
};

type Plan876Input = LicCalculatorInput;

export function evaluateEligibility(input: Plan876Input): EligibilityResult {
  return engine.evaluateEligibility(PLAN_876_RULES, input);
}

export function calculatePremium(input: Plan876Input): PremiumCalculationResult {
  return engine.calculatePremium(PLAN_876_RULES, input, SOURCE_VERSION);
}

export function calculateBenefits(input: Plan876Input): BenefitCalculationResult {
  return engine.calculateBenefits(PLAN_876_RULES, input, SOURCE_VERSION);
}
