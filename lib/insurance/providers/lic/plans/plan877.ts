// Verified rule implementation for LIC's Yuva Credit Life (Plan 877, UIN
// 512N357V01). A Non-Par, decreasing (credit life) term plan — the Sum
// Assured on Death follows a chosen-interest-rate loan-amortisation
// schedule (see creditLifeShared.ts), no maturity benefit, no surrender
// value (except Unexpired Risk Premium Value, recorded but not
// computed), no loan. See docs/lic-plan877-verification.md.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): Lic_leaflet_Yuva_Credit_4x9_inches_wxh.pdf — the ONLY source
// for every rule below.

import { BenefitCalculationResult, EligibilityResult, LicCalculatorInput, PremiumCalculationResult } from "@/types/insurance";
import * as engine from "./creditLifeShared";
import { CreditLifeRules } from "./creditLifeShared";

export const PLAN_877_UIN = "512N357V01";

const SOURCE_VERSION = "LIC's Yuva Credit Life Sales Brochure, UIN 512N357V01";

export const PLAN_877_RULES: CreditLifeRules = {
  minEntryAge: 18,
  maxEntryAge: 45,
  minMaturityAge: 23,
  maxMaturityAge: 75,
  minPolicyTermYears: 5,
  maxPolicyTermYears: 30,
  // A longer Policy Term unlocks progressively longer Premium Paying
  // Term choices (all shorter ones remain available too): PPT 5 needs
  // Term >= 10; PPT 10 needs Term >= 15; PPT 15 needs Term >= 25.
  limitedPptOptionsForTerm(policyTermYears) {
    const options: number[] = [];
    if (policyTermYears >= 10) options.push(5);
    if (policyTermYears >= 15) options.push(10);
    if (policyTermYears >= 25) options.push(15);
    return options;
  },
  // Note: the brochure also allows a relaxed minimum Basic Sum Assured
  // of Rs.20,00,000 (with differential premium rates) for housing-loan-
  // linked purchases where the sanctioned loan itself is below
  // Rs.50,00,000 — not modeled here, since no differential rate table for
  // that band was published (see docs/lic-plan877-verification.md).
  minBasicSumAssured: 5000000,
  sumAssuredBands: [
    { maxInclusive: 7500000, multiple: 100000 },
    { maxInclusive: 15000000, multiple: 2500000 },
    { maxInclusive: 40000000, multiple: 5000000 },
    { maxInclusive: null, multiple: 10000000 },
  ],
  // Sample Illustrative Premium (§7, p.5): Male, Non-Smoker, Policy Term
  // 25 years, BSA Rs.50,00,000, interest rate 8%.
  sampleIllustrativePremium: {
    basicSumAssured: 5000000,
    interestRate: 8,
    rows: [
      { age: 20, policyTermYears: 25, single: 40900, limitedByPpt: { 5: 10100, 10: 6100, 15: 4850 } },
      { age: 30, policyTermYears: 25, single: 53550, limitedByPpt: { 5: 13150, 10: 7900, 15: 6200 } },
      { age: 40, policyTermYears: 25, single: 103450, limitedByPpt: { 5: 25100, 10: 14900, 15: 11650 } },
    ],
  },
};

type Plan877Input = LicCalculatorInput;

export function evaluateEligibility(input: Plan877Input): EligibilityResult {
  return engine.evaluateEligibility(PLAN_877_RULES, input);
}

export function calculatePremium(input: Plan877Input): PremiumCalculationResult {
  return engine.calculatePremium(PLAN_877_RULES, input, SOURCE_VERSION);
}

export function calculateBenefits(input: Plan877Input): BenefitCalculationResult {
  return engine.calculateBenefits(PLAN_877_RULES, input, SOURCE_VERSION);
}
