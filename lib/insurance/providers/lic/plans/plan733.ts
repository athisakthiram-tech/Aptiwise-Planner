// Architecture slot for LIC's Jeevan Lakshya (Plan 733, UIN 512N297V03).
//
// This intentionally does NOT calculate eligibility, premium, or benefits.
// It exists so the app can wire a real UI/engine pipeline for one plan
// before any verified LIC rules are integrated. Every function below must
// keep returning "unavailable" results until verified rules replace them —
// do not approximate with guessed formulas in the meantime.

import {
  BenefitCalculationResult,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";

export const PLAN_733_UIN = "512N297V03";

export const PLAN_733_NOT_INTEGRATED_REASON =
  "Verified Plan 733 rules not integrated yet.";

type Plan733Input = LicCalculatorInput & { product: InsuranceProduct };

export function evaluateEligibility(_input: Plan733Input): EligibilityResult {
  return {
    eligible: null,
    reasons: [PLAN_733_NOT_INTEGRATED_REASON],
    missingInputs: [],
  };
}

export function calculatePremium(_input: Plan733Input): PremiumCalculationResult {
  return {
    available: false,
    missingInputs: [PLAN_733_NOT_INTEGRATED_REASON],
  };
}

export function calculateBenefits(_input: Plan733Input): BenefitCalculationResult {
  return {
    available: false,
    missingInputs: [PLAN_733_NOT_INTEGRATED_REASON],
  };
}
