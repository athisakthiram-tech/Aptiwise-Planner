// Verified rule implementation for LIC's New Jeevan Anand (Plan 715,
// UIN 512N279V03). Follows the plan733.ts/plan736.ts pattern.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LICs_New_Jeevan_Anand_Sales_Brochure_Eng_141025.pdf — the
// ONLY source for every rule below. See
// docs/lic-plan715-verification.md for the full audit, including the
// post-maturity "whole life" death benefit this module deliberately
// does not compute (see that doc for why).

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { findExactPremiumRow, isValidSumAssuredIncrement } from "./shared";

export const PLAN_715_UIN = "512N279V03";

const SOURCE_VERSION = "LIC's New Jeevan Anand Sales Brochure, UIN 512N279V03";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export const PLAN_715_BONUS_DISCLAIMER =
  "Future bonus is not guaranteed and is not included in this calculation.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

// ---- Phase 1: verified rules (brochure §1, page 2; §2, page 3) ----
export const PLAN_715_RULES = {
  minEntryAge: 18,
  maxEntryAge: 50,
  // No minimum maturity age is stated in the brochure for this plan
  // (unlike Plan 714) — only a maximum.
  maxMaturityAge: 75,
  minPolicyTermYears: 15,
  maxPolicyTermYears: 35,
  minBasicSumAssured: 200000,
  sumAssuredBands: [
    { maxInclusive: 450000, multiple: 5000 },
    { maxInclusive: 900000, multiple: 50000 },
    { maxInclusive: null, multiple: 100000 },
  ],
  // Death Benefit during the policy term (§2.A, page 3): higher of 125%
  // of Basic Sum Assured or 7x annualised premium. Never less than 105%
  // of total premiums paid to date of death — needs premium-paid history,
  // not modeled here. The brochure also describes a death benefit AFTER
  // the stipulated Date of Maturity (flat Basic Sum Assured, "protection
  // throughout your lifetime") — this module only models the in-term
  // benefit; see docs/lic-plan715-verification.md.
  deathBenefit: { basicSumAssuredMultiple: 1.25, annualizedPremiumMultiple: 7 },
  bonusTypes: ["Simple Reversionary Bonus", "Final Additional Bonus"] as const,
  premiumPayingTermEqualsPolicyTerm: true,
  // Sample Illustrative Premium (§6, page 9): exact published annual
  // premiums for Basic Sum Assured Rs. 2 lakh, standard lives, yearly mode.
  sampleIllustrativePremium: {
    basicSumAssured: 200000,
    premiumFrequency: "yearly" as const,
    rows: [
      { age: 20, policyTermYears: 15, annualPremium: 16229 },
      { age: 20, policyTermYears: 25, annualPremium: 9339 },
      { age: 20, policyTermYears: 35, annualPremium: 6517 },
      { age: 30, policyTermYears: 15, annualPremium: 16885 },
      { age: 30, policyTermYears: 25, annualPremium: 9810 },
      { age: 30, policyTermYears: 35, annualPremium: 6968 },
      { age: 40, policyTermYears: 15, annualPremium: 18012 },
      { age: 40, policyTermYears: 25, annualPremium: 10711 },
      { age: 40, policyTermYears: 35, annualPremium: 7918 },
      { age: 50, policyTermYears: 15, annualPremium: 19914 },
      { age: 50, policyTermYears: 25, annualPremium: 12397 },
      // Age 50 / term 35 is blank in the brochure table — omitted.
    ],
  },
  riders: [
    { name: "LIC's Accidental Death and Disability Benefit Rider", uin: "512B209V02" },
    { name: "LIC's Accident Benefit Rider", uin: "512B203V03" },
    { name: "LIC's New Term Assurance Rider", uin: "512B210V02" },
    { name: "LIC's Critical Illness Health Rider", uin: "512B227V01" },
  ],
} as const;

type Plan715Input = LicCalculatorInput & { product: InsuranceProduct };

export function evaluateEligibility(input: Plan715Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_715_RULES.minEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is below the minimum entry age of ${PLAN_715_RULES.minEntryAge}.`);
    reasonCodes.push({
      code: "age_below_min",
      params: { min: PLAN_715_RULES.minEntryAge, actual: input.age },
    });
  } else if (input.age > PLAN_715_RULES.maxEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is above the maximum entry age of ${PLAN_715_RULES.maxEntryAge}.`);
    reasonCodes.push({
      code: "age_above_max",
      params: { max: PLAN_715_RULES.maxEntryAge, actual: input.age },
    });
  }

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else {
    if (
      input.policyTermYears < PLAN_715_RULES.minPolicyTermYears ||
      input.policyTermYears > PLAN_715_RULES.maxPolicyTermYears
    ) {
      eligible = false;
      reasons.push(
        `Policy term ${input.policyTermYears} years is outside the allowed range of ` +
          `${PLAN_715_RULES.minPolicyTermYears}-${PLAN_715_RULES.maxPolicyTermYears} years.`
      );
      reasonCodes.push({
        code: "term_out_of_range",
        params: {
          min: PLAN_715_RULES.minPolicyTermYears,
          max: PLAN_715_RULES.maxPolicyTermYears,
          actual: input.policyTermYears,
        },
      });
    }

    const maturityAge = input.age + input.policyTermYears;
    if (maturityAge > PLAN_715_RULES.maxMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${PLAN_715_RULES.maxMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_high",
        params: { max: PLAN_715_RULES.maxMaturityAge, actual: maturityAge },
      });
    }

    if (
      input.premiumPaymentTermYears != null &&
      input.premiumPaymentTermYears !== input.policyTermYears
    ) {
      eligible = false;
      reasons.push("Premium Paying Term must equal Policy Term for this plan.");
      reasonCodes.push({
        code: "ppt_must_equal_term",
        params: { term: input.policyTermYears, actual: input.premiumPaymentTermYears },
      });
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_715_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_715_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_715_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (!isValidSumAssuredIncrement(input.sumAssured, [...PLAN_715_RULES.sumAssuredBands])) {
    eligible = false;
    reasons.push("Basic Sum Assured is not a valid increment for its range.");
    reasonCodes.push({ code: "sum_assured_invalid_increment" });
  }

  if (eligible === true && missingInputs.length > 0) {
    eligible = null;
  }

  reasons.push(UNDERWRITING_DISCLAIMER);
  return { eligible, reasons, reasonCodes, missingInputs, sourceVersion: SOURCE_VERSION };
}

export function calculatePremium(input: Plan715Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_715_RULES.sampleIllustrativePremium;
  const frequency = input.premiumFrequency ?? "yearly";
  const match =
    frequency === sample.premiumFrequency && input.sumAssured === sample.basicSumAssured
      ? findExactPremiumRow(sample.rows, input.age, input.policyTermYears!)
      : undefined;

  if (!match) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  return {
    available: true,
    premium: match.annualPremium,
    premiumFrequency: "yearly",
    sumAssured: input.sumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}

export function calculateBenefits(input: Plan715Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = { maturitySumAssured: basicSumAssured };

  let deathBenefit: number | undefined;
  const premiumLookup = calculatePremium(input);
  if (premiumLookup.available && premiumLookup.premium != null) {
    const sumAssuredOnDeath = Math.max(
      PLAN_715_RULES.deathBenefit.basicSumAssuredMultiple * basicSumAssured,
      PLAN_715_RULES.deathBenefit.annualizedPremiumMultiple * premiumLookup.premium
    );
    guaranteedBenefits.sumAssuredOnDeath = sumAssuredOnDeath;
    deathBenefit = sumAssuredOnDeath;
  } else {
    // The 125%-of-BSA side of the comparison is always computable and is
    // itself a guaranteed floor even without a verified premium.
    guaranteedBenefits.sumAssuredOnDeathMinimum =
      PLAN_715_RULES.deathBenefit.basicSumAssuredMultiple * basicSumAssured;
  }

  return {
    available: true,
    guaranteedBenefits,
    nonGuaranteedIllustrations: undefined,
    deathBenefit,
    maturityBenefit: guaranteedBenefits.maturitySumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}
