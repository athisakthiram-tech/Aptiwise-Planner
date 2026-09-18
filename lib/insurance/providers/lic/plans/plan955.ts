// Verified rule implementation for LIC's New Jeevan Amar (Plan 955, UIN
// 512N350V02). A Non-Par pure risk term plan — same Level/Increasing Sum
// Assured shape as Digi Term/Yuva Term/New Tech-Term/Bima Kavach, with an
// offset-based Limited Premium Paying Term (like New Tech-Term) and a
// higher minimum Basic Sum Assured of Rs.25,00,000. Uses the shared
// pure-term engine (pureTermShared.ts) — see
// docs/lic-plan955-verification.md.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Jeevan_amar_Sales_Brochure_4_inch_x_9_inch_Eng_1.pdf —
// the ONLY source for every rule below.

import { BenefitCalculationResult, EligibilityResult, LicCalculatorInput, PremiumCalculationResult } from "@/types/insurance";
import * as engine from "./pureTermShared";
import { PureTermRules } from "./pureTermShared";

export const PLAN_955_UIN = "512N350V02";

const SOURCE_VERSION = "LIC's New Jeevan Amar Sales Brochure, UIN 512N350V02";

export const PLAN_955_RULES: PureTermRules = {
  minEntryAge: 18,
  maxEntryAge: 65,
  // No separate minimum age at maturity is published for this plan.
  maxMaturityAge: 80,
  minPolicyTermYears: 10,
  // Limited Premium Paying Term = Policy Term - 5 (for terms 10-40) or
  // Policy Term - 10 (for terms 15-40) — an offset choice, like New
  // Tech-Term.
  limitedPptOptionsForTerm(policyTermYears) {
    const options = [policyTermYears - 5];
    if (policyTermYears >= 15) options.push(policyTermYears - 10);
    return options;
  },
  minBasicSumAssured: 2500000,
  sumAssuredBands: [
    { maxInclusive: 4000000, multiple: 100000 },
    { maxInclusive: null, multiple: 1000000 },
  ],
  levelMaxPolicyTermYears: 40, // subject to max maturity age of 80
  // Option II (Increasing Sum Assured) max Policy Term by age band and
  // Basic Sum Assured band (brochure §2.f, p.4) — a 4-tier band
  // structure (<50L, 50L-1Cr, 1Cr-2Cr, 2Cr+), simpler than Digi Term's
  // own table but with the same "subject to maximum Age at Maturity"
  // shape for every band once age exceeds the discrete boundary rows.
  increasingMaxTermBandsRegularLimited: [
    { minAge: 18, maxAge: 65, bsaMaxExclusive: 5000000, maxPolicyTermYears: 40 },
    { minAge: 18, maxAge: 27, bsaMaxExclusive: 10000000, maxPolicyTermYears: 40 },
    { minAge: 28, maxAge: 36, bsaMaxExclusive: 10000000, maxPolicyTermYears: 35 },
    { minAge: 37, maxAge: 45, bsaMaxExclusive: 10000000, maxPolicyTermYears: 33 },
    { minAge: 46, maxAge: 65, bsaMaxExclusive: 10000000, maxPolicyTermYears: 40 },
    { minAge: 18, maxAge: 65, bsaMaxExclusive: 20000000, maxPolicyTermYears: 40 },
    { minAge: 18, maxAge: 65, bsaMaxExclusive: null, maxPolicyTermYears: 40 },
  ],
  increasingMaxTermBandsSingle: [
    { minAge: 18, maxAge: 65, bsaMaxExclusive: 5000000, maxPolicyTermYears: 40 },
    { minAge: 18, maxAge: 29, bsaMaxExclusive: 10000000, maxPolicyTermYears: 40 },
    { minAge: 30, maxAge: 41, bsaMaxExclusive: 10000000, maxPolicyTermYears: 38 },
    { minAge: 42, maxAge: 65, bsaMaxExclusive: 10000000, maxPolicyTermYears: 40 },
    { minAge: 18, maxAge: 65, bsaMaxExclusive: 20000000, maxPolicyTermYears: 40 },
    { minAge: 18, maxAge: 65, bsaMaxExclusive: null, maxPolicyTermYears: 40 },
  ],
  deathBenefit: { regularLimitedAnnualizedPremiumMultiple: 7, singlePremiumMultiple: 1.25 },
  // Sample Illustrative Premium (§6, p.8): BSA Rs.50,00,000, Non-Smoker
  // Male standard lives, term 20 years.
  sampleIllustrativePremium: {
    basicSumAssured: 5000000,
    levelRows: [
      { age: 20, policyTermYears: 20, regular: 5959, limitedByPpt: { 15: 6873, 10: 8830 }, single: 57768 },
      { age: 30, policyTermYears: 20, regular: 7830, limitedByPpt: { 15: 9091, 10: 11788 }, single: 78213 },
      { age: 40, policyTermYears: 20, regular: 15441, limitedByPpt: { 15: 18067, 10: 23629 }, single: 160200 },
    ],
    increasingRows: [
      { age: 20, policyTermYears: 20, regular: 7832, limitedByPpt: { 15: 9078, 10: 11748 }, single: 77786 },
      { age: 30, policyTermYears: 20, regular: 11125, limitedByPpt: { 15: 12994, 10: 16954 }, single: 114187 },
      { age: 40, policyTermYears: 20, regular: 23933, limitedByPpt: { 15: 28119, 10: 36946 }, single: 252525 },
    ],
  },
};

type Plan955Input = LicCalculatorInput;

export function evaluateEligibility(input: Plan955Input): EligibilityResult {
  return engine.evaluateEligibility(PLAN_955_RULES, input);
}

export function calculatePremium(input: Plan955Input): PremiumCalculationResult {
  return engine.calculatePremium(PLAN_955_RULES, input, SOURCE_VERSION);
}

export function calculateBenefits(input: Plan955Input): BenefitCalculationResult {
  return engine.calculateBenefits(PLAN_955_RULES, input, SOURCE_VERSION);
}
