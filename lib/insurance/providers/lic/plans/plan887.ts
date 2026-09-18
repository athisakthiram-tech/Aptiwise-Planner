// Verified rule implementation for LIC's Bima Kavach (Plan 887, UIN
// 512N360V01). A Non-Par pure risk term plan offering lifetime risk
// cover (up to age 100) — same Level/Increasing Sum Assured shape as
// Digi Term/Yuva Term/New Tech-Term. Uses the shared pure-term engine
// (pureTermShared.ts) — see docs/lic-plan887-verification.md.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Bima_Kavach_Sales_Brochure_Eng_03122025.pdf — the ONLY
// source for every rule below.

import { BenefitCalculationResult, EligibilityResult, LicCalculatorInput, PremiumCalculationResult } from "@/types/insurance";
import * as engine from "./pureTermShared";
import { PureTermRules } from "./pureTermShared";

export const PLAN_887_UIN = "512N360V01";

const SOURCE_VERSION = "LIC's Bima Kavach Sales Brochure, UIN 512N360V01";

export const PLAN_887_RULES: PureTermRules = {
  minEntryAge: 18,
  // The brochure allows entry above 60 "on case-to-case basis"; this
  // engine enforces the standard hard ceiling of 65 only.
  maxEntryAge: 65,
  minMaturityAge: 28,
  maxMaturityAge: 100, // "Lifetime Risk Cover (up to 100 years)"
  minPolicyTermYears: 10,
  // Fixed Limited Premium Paying Term options (5, 10 or 15 years),
  // each needing a minimum Policy Term (10/15/20 years respectively).
  limitedPptOptionsForTerm(policyTermYears) {
    const options: number[] = [];
    if (policyTermYears >= 10) options.push(5);
    if (policyTermYears >= 15) options.push(10);
    if (policyTermYears >= 20) options.push(15);
    return options;
  },
  minBasicSumAssured: 20000000, // Rs.2,00,00,000 — confirmed by the brochure's own sample premium (BSA Rs.2 crore)
  sumAssuredBands: [
    { maxInclusive: 27500000, multiple: 500000 },
    { maxInclusive: null, multiple: 2500000 },
  ],
  levelMaxPolicyTermYears: 82, // subject to max maturity age of 100
  // Option II (Increasing Sum Assured): no separate age/BSA-banded
  // term-cap table is published for this plan (unlike Digi Term/Yuva
  // Term/New Tech-Term) — the max term is the same 82 years, subject to
  // maximum maturity age, for both Options.
  increasingMaxTermBandsRegularLimited: [{ minAge: 18, maxAge: 65, bsaMaxExclusive: null, maxPolicyTermYears: 82 }],
  increasingMaxTermBandsSingle: [{ minAge: 18, maxAge: 65, bsaMaxExclusive: null, maxPolicyTermYears: 82 }],
  deathBenefit: { regularLimitedAnnualizedPremiumMultiple: 7, singlePremiumMultiple: 1.25 },
  // Sample Illustrative Premium (§7, p.10): BSA Rs.2,00,00,000 (Rs.2
  // Crore), Non-Smoker Male standard lives, term 20 years.
  sampleIllustrativePremium: {
    basicSumAssured: 20000000,
    levelRows: [
      { age: 20, policyTermYears: 20, regular: 12600, limitedByPpt: { 15: 14800, 10: 19200 }, single: 134600 },
      { age: 30, policyTermYears: 20, regular: 19000, limitedByPpt: { 15: 22200, 10: 28800 }, single: 204800 },
      { age: 40, policyTermYears: 20, regular: 43600, limitedByPpt: { 15: 50800, 10: 66600 }, single: 475800 },
    ],
    increasingRows: [
      { age: 20, policyTermYears: 20, regular: 17200, limitedByPpt: { 15: 20000, 10: 26200 }, single: 185600 },
      { age: 30, policyTermYears: 20, regular: 28200, limitedByPpt: { 15: 33200, 10: 43200 }, single: 307800 },
      { age: 40, policyTermYears: 20, regular: 68600, limitedByPpt: { 15: 80200, 10: 105400 }, single: 754800 },
    ],
  },
};

type Plan887Input = LicCalculatorInput;

export function evaluateEligibility(input: Plan887Input): EligibilityResult {
  return engine.evaluateEligibility(PLAN_887_RULES, input);
}

export function calculatePremium(input: Plan887Input): PremiumCalculationResult {
  return engine.calculatePremium(PLAN_887_RULES, input, SOURCE_VERSION);
}

export function calculateBenefits(input: Plan887Input): BenefitCalculationResult {
  return engine.calculateBenefits(PLAN_887_RULES, input, SOURCE_VERSION);
}
