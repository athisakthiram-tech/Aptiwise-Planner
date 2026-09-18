// Verified rule implementation for LIC's Digi Credit Life (Plan 878, UIN
// 512N358V01). A Non-Par, Online-only decreasing (credit life) term
// plan — same eligibility/term structure as Yuva Credit Life (877), with
// its own premium figures. Uses the shared credit-life engine
// (creditLifeShared.ts) — see docs/lic-plan878-verification.md.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Digi_Credit_Sales_Brochure_4_inch_x_9_inch_Eng.pdf — the
// ONLY source for every rule below.

import { BenefitCalculationResult, EligibilityResult, LicCalculatorInput, PremiumCalculationResult } from "@/types/insurance";
import * as engine from "./creditLifeShared";
import { CreditLifeRules } from "./creditLifeShared";

export const PLAN_878_UIN = "512N358V01";

const SOURCE_VERSION = "LIC's Digi Credit Life Sales Brochure, UIN 512N358V01";

export const PLAN_878_RULES: CreditLifeRules = {
  minEntryAge: 18,
  maxEntryAge: 45,
  minMaturityAge: 23,
  maxMaturityAge: 75,
  minPolicyTermYears: 5,
  maxPolicyTermYears: 30,
  limitedPptOptionsForTerm(policyTermYears) {
    const options: number[] = [];
    if (policyTermYears >= 10) options.push(5);
    if (policyTermYears >= 15) options.push(10);
    if (policyTermYears >= 25) options.push(15);
    return options;
  },
  minBasicSumAssured: 5000000,
  sumAssuredBands: [
    { maxInclusive: 7500000, multiple: 100000 },
    { maxInclusive: 15000000, multiple: 2500000 },
    { maxInclusive: 40000000, multiple: 5000000 },
    { maxInclusive: null, multiple: 10000000 },
  ],
  // Sample Illustrative Premium (§7, p.4): Male, Non-Smoker, Policy Term
  // 25 years, BSA Rs.50,00,000, interest rate 8%.
  sampleIllustrativePremium: {
    basicSumAssured: 5000000,
    interestRate: 8,
    rows: [
      { age: 20, policyTermYears: 25, single: 34550, limitedByPpt: { 5: 8050, 10: 4800, 15: 3800 } },
      { age: 30, policyTermYears: 25, single: 45500, limitedByPpt: { 5: 10500, 10: 6250, 15: 4900 } },
      { age: 40, policyTermYears: 25, single: 88750, limitedByPpt: { 5: 20300, 10: 11900, 15: 9250 } },
    ],
  },
};

type Plan878Input = LicCalculatorInput;

export function evaluateEligibility(input: Plan878Input): EligibilityResult {
  return engine.evaluateEligibility(PLAN_878_RULES, input);
}

export function calculatePremium(input: Plan878Input): PremiumCalculationResult {
  return engine.calculatePremium(PLAN_878_RULES, input, SOURCE_VERSION);
}

export function calculateBenefits(input: Plan878Input): BenefitCalculationResult {
  return engine.calculateBenefits(PLAN_878_RULES, input, SOURCE_VERSION);
}
