// Calculation boundaries for future work. Deliberately unimplemented:
// no premium, benefit, or protection-requirement number may be invented
// before verified LIC data/rules are integrated.

import { InsuranceProduct } from "@/types/insurance";

export interface ProtectionNeedsResult {
  status: "not_assessed";
  requirement: null;
}

// Placeholder used by the UI today. Replace with a real
// ProtectionNeedsCalculator implementation once a needs-analysis
// methodology is defined — do not approximate with a fixed multiple
// (e.g. "10x salary") in the meantime.
export function getProtectionRequirementPlaceholder(): ProtectionNeedsResult {
  return { status: "not_assessed", requirement: null };
}

export interface ProtectionNeedsCalculator {
  assess(input: { age: number; existingLifeCover: number }): ProtectionNeedsResult;
}

// Future pipeline this unlocks (not implemented yet):
//   age + budget + years -> eligible configurations (LicEligibilityEngine)
//   -> verified premium (LicPremiumCalculator)
//   -> verified life cover
//   -> guaranteed benefit (LicBenefitCalculator)
//   -> non-guaranteed illustration (LicBenefitCalculator)

export interface LicEligibilityEngine {
  checkEligibility(input: {
    age: number;
    product: InsuranceProduct;
    yearsToGoal: number;
  }): unknown;
}

export interface LicPremiumCalculator {
  calculatePremium(input: {
    age: number;
    product: InsuranceProduct;
    sumAssured: number;
    policyTermYears: number;
  }): unknown;
}

export interface LicBenefitCalculator {
  calculateGuaranteedBenefit(input: { product: InsuranceProduct }): unknown;
  calculateNonGuaranteedIllustration(input: { product: InsuranceProduct }): unknown;
}
