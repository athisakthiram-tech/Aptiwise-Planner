// Verified rule implementation for LIC's Yuva Term (Plan 875, UIN
// 512N355V02). A Non-Par pure risk term plan — same eligibility/term-cap
// structure as Digi Term (876), sold Offline through agents rather than
// Online-only, with its own premium and rebate figures. Uses the shared
// pure-term engine (pureTermShared.ts) — see
// docs/lic-plan875-verification.md.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): Lic_leaflet_Yuva_Term_4x9_inches_wxh_single_pages.pdf — the
// ONLY source for every rule below.

import { BenefitCalculationResult, EligibilityResult, LicCalculatorInput, PremiumCalculationResult } from "@/types/insurance";
import * as engine from "./pureTermShared";
import { PureTermRules } from "./pureTermShared";

export const PLAN_875_UIN = "512N355V02";

const SOURCE_VERSION = "LIC's Yuva Term Sales Brochure, UIN 512N355V02";

export const PLAN_875_RULES: PureTermRules = {
  minEntryAge: 18,
  maxEntryAge: 45,
  minMaturityAge: 33,
  maxMaturityAge: 75,
  minPolicyTermYears: 15,
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
  // Basic Sum Assured band (brochure §2.g, p.3) — identical structure to
  // Digi Term's own published table.
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
  // Sample Illustrative Premium (§7, p.6): BSA Rs.50,00,000, Non-Smoker
  // Male standard lives, term 20 years.
  sampleIllustrativePremium: {
    basicSumAssured: 5000000,
    levelRows: [
      { age: 20, policyTermYears: 20, regular: 4550, limitedByPpt: { 15: 5250, 10: 6600 }, single: 44350 },
      { age: 30, policyTermYears: 20, regular: 5950, limitedByPpt: { 15: 6850, 10: 8750 }, single: 59550 },
      { age: 40, policyTermYears: 20, regular: 11700, limitedByPpt: { 15: 13600, 10: 17500 }, single: 121900 },
    ],
    increasingRows: [
      { age: 20, policyTermYears: 20, regular: 5850, limitedByPpt: { 15: 6750, 10: 8550 }, single: 58400 },
      { age: 30, policyTermYears: 20, regular: 8250, limitedByPpt: { 15: 9600, 10: 12250 }, single: 84950 },
      { age: 40, policyTermYears: 20, regular: 17850, limitedByPpt: { 15: 20850, 10: 26850 }, single: 188950 },
    ],
  },
};

type Plan875Input = LicCalculatorInput;

export function evaluateEligibility(input: Plan875Input): EligibilityResult {
  return engine.evaluateEligibility(PLAN_875_RULES, input);
}

export function calculatePremium(input: Plan875Input): PremiumCalculationResult {
  return engine.calculatePremium(PLAN_875_RULES, input, SOURCE_VERSION);
}

export function calculateBenefits(input: Plan875Input): BenefitCalculationResult {
  return engine.calculateBenefits(PLAN_875_RULES, input, SOURCE_VERSION);
}
