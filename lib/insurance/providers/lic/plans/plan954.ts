// Verified rule implementation for LIC's New Tech-Term (Plan 954, UIN
// 512N351V02). A Non-Par, Online-only pure risk term plan — broader
// eligibility (entry age up to 65, maturity up to 80) and a simpler,
// 2-tier Basic Sum Assured band structure than Digi Term/Yuva Term, with
// an OFFSET-based Limited Premium Paying Term (Policy Term minus 5 or
// minus 10) rather than a fixed 10/15-year choice. Uses the shared
// pure-term engine (pureTermShared.ts) — see
// docs/lic-plan954-verification.md.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_New_Tech_Term_Sales_Brochure_4_inch_x_9_inch_Eng_2.pdf —
// the ONLY source for every rule below.

import { BenefitCalculationResult, EligibilityResult, LicCalculatorInput, PremiumCalculationResult } from "@/types/insurance";
import * as engine from "./pureTermShared";
import { PureTermRules } from "./pureTermShared";

export const PLAN_954_UIN = "512N351V02";

const SOURCE_VERSION = "LIC's New Tech-Term Sales Brochure, UIN 512N351V02";

export const PLAN_954_RULES: PureTermRules = {
  minEntryAge: 18,
  maxEntryAge: 65,
  // No separate minimum age at maturity is published for this plan
  // (unlike Digi Term/Yuva Term) — never assumed.
  maxMaturityAge: 80,
  minPolicyTermYears: 10,
  // Limited Premium Paying Term = Policy Term - 5 (for terms 10-40) or
  // Policy Term - 10 (for terms 15-40) — an offset choice, not a fixed
  // 10/15-year pair like Digi Term/Yuva Term.
  limitedPptOptionsForTerm(policyTermYears) {
    const options = [policyTermYears - 5];
    if (policyTermYears >= 15) options.push(policyTermYears - 10);
    return options;
  },
  minBasicSumAssured: 5000000,
  sumAssuredBands: [
    { maxInclusive: 7500000, multiple: 500000 },
    { maxInclusive: null, multiple: 2500000 },
  ],
  levelMaxPolicyTermYears: 40,
  // Option II (Increasing Sum Assured) max Policy Term by age band and
  // Basic Sum Assured band (brochure §2.f, p.3) — only the lowest BSA
  // band has extra age-based caps; the higher bands are simply "40 years,
  // subject to maximum Age at Maturity" for every eligible age.
  increasingMaxTermBandsRegularLimited: [
    { minAge: 18, maxAge: 27, bsaMaxExclusive: 10000000, maxPolicyTermYears: 40 },
    { minAge: 28, maxAge: 36, bsaMaxExclusive: 10000000, maxPolicyTermYears: 35 },
    { minAge: 37, maxAge: 42, bsaMaxExclusive: 10000000, maxPolicyTermYears: 33 },
    { minAge: 43, maxAge: 65, bsaMaxExclusive: 10000000, maxPolicyTermYears: 40 },
    { minAge: 18, maxAge: 65, bsaMaxExclusive: null, maxPolicyTermYears: 40 },
  ],
  increasingMaxTermBandsSingle: [
    { minAge: 18, maxAge: 24, bsaMaxExclusive: 10000000, maxPolicyTermYears: 40 },
    { minAge: 25, maxAge: 27, bsaMaxExclusive: 10000000, maxPolicyTermYears: 35 },
    { minAge: 28, maxAge: 46, bsaMaxExclusive: 10000000, maxPolicyTermYears: 31 },
    { minAge: 47, maxAge: 65, bsaMaxExclusive: 10000000, maxPolicyTermYears: 40 },
    { minAge: 18, maxAge: 65, bsaMaxExclusive: null, maxPolicyTermYears: 40 },
  ],
  deathBenefit: { regularLimitedAnnualizedPremiumMultiple: 7, singlePremiumMultiple: 1.25 },
  // Sample Illustrative Premium (§6, p.5): BSA Rs.1,00,00,000 (Rs.1
  // Crore), Non-Smoker Male standard lives, term 20 years.
  sampleIllustrativePremium: {
    basicSumAssured: 10000000,
    levelRows: [
      { age: 20, policyTermYears: 20, regular: 7047, limitedByPpt: { 15: 8091, 10: 10266 }, single: 75603 },
      { age: 30, policyTermYears: 20, regular: 9135, limitedByPpt: { 15: 10527, 10: 13572 }, single: 100833 },
      { age: 40, policyTermYears: 20, regular: 17889, limitedByPpt: { 15: 20737, 10: 26878 }, single: 203187 },
    ],
    increasingRows: [
      { age: 20, policyTermYears: 20, regular: 9345, limitedByPpt: { 15: 10760, 10: 13795 }, single: 102617 },
      { age: 30, policyTermYears: 20, regular: 13083, limitedByPpt: { 15: 15219, 10: 19669 }, single: 147562 },
      { age: 40, policyTermYears: 20, regular: 27846, limitedByPpt: { 15: 32396, 10: 42224 }, single: 320684 },
    ],
  },
};

type Plan954Input = LicCalculatorInput;

export function evaluateEligibility(input: Plan954Input): EligibilityResult {
  return engine.evaluateEligibility(PLAN_954_RULES, input);
}

export function calculatePremium(input: Plan954Input): PremiumCalculationResult {
  return engine.calculatePremium(PLAN_954_RULES, input, SOURCE_VERSION);
}

export function calculateBenefits(input: Plan954Input): BenefitCalculationResult {
  return engine.calculateBenefits(PLAN_954_RULES, input, SOURCE_VERSION);
}
