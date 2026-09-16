// Verified rule implementation for LIC's New Endowment Plan (Plan 714,
// UIN 512N277V03). Follows the plan733.ts/plan736.ts pattern.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LICs_NEW_ENDOWMENT_PLAN_714.pdf — the ONLY source for every
// rule below. See docs/lic-plan714-verification.md for the full audit.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { findExactPremiumRow, isValidSumAssuredIncrement } from "./shared";

export const PLAN_714_UIN = "512N277V03";

const SOURCE_VERSION = "LIC's New Endowment Plan Sales Brochure, UIN 512N277V03";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export const PLAN_714_BONUS_DISCLAIMER =
  "Future bonus is not guaranteed and is not included in this calculation.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

// ---- Phase 1: verified rules (brochure §1, pages 2-3; §2, page 3) ----
export const PLAN_714_RULES = {
  minEntryAge: 8,
  maxEntryAge: 50,
  minMaturityAge: 20,
  maxMaturityAge: 75,
  minPolicyTermYears: 12,
  maxPolicyTermYears: 35,
  minBasicSumAssured: 200000,
  sumAssuredBands: [
    { maxInclusive: 450000, multiple: 5000 },
    { maxInclusive: 900000, multiple: 50000 },
    { maxInclusive: null, multiple: 100000 },
  ],
  // Death Benefit (§2.A, page 3): higher of Basic Sum Assured or 7x
  // annualised premium. Never less than 105% of total premiums paid to
  // date of death — that floor needs premium-paid history and is not
  // modeled here (see docs/lic-plan714-verification.md).
  deathBenefit: { annualizedPremiumMultiple: 7 },
  bonusTypes: ["Simple Reversionary Bonus", "Final Additional Bonus"] as const,
  // Regular-premium product paid over the full policy term — the
  // brochure offers no separate limited-pay option, so Premium Paying
  // Term always equals Policy Term.
  premiumPayingTermEqualsPolicyTerm: true,
  // Sample Illustrative Premium (§6, page 11): exact published annual
  // premiums for Basic Sum Assured Rs. 2 lakh, standard lives, yearly mode.
  sampleIllustrativePremium: {
    basicSumAssured: 200000,
    premiumFrequency: "yearly" as const,
    rows: [
      { age: 20, policyTermYears: 15, annualPremium: 14543 },
      { age: 20, policyTermYears: 25, annualPremium: 8369 },
      { age: 20, policyTermYears: 35, annualPremium: 5949 },
      { age: 30, policyTermYears: 15, annualPremium: 14592 },
      { age: 30, policyTermYears: 25, annualPremium: 8497 },
      { age: 30, policyTermYears: 35, annualPremium: 6213 },
      { age: 40, policyTermYears: 15, annualPremium: 14847 },
      { age: 40, policyTermYears: 25, annualPremium: 8987 },
      { age: 40, policyTermYears: 35, annualPremium: 6958 },
    ],
  },
  riders: [
    { name: "LIC's Accidental Death and Disability Benefit Rider", uin: "512B209V02" },
    { name: "LIC's Accident Benefit Rider", uin: "512B203V03" },
    { name: "LIC's New Term Assurance Rider", uin: "512B210V02" },
    { name: "LIC's Premium Waiver Benefit Rider", uin: "512B204V04" },
    { name: "LIC's Critical Illness Health Rider", uin: "512B227V01" },
  ],
} as const;

type Plan714Input = LicCalculatorInput & { product: InsuranceProduct };

export function evaluateEligibility(input: Plan714Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_714_RULES.minEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is below the minimum entry age of ${PLAN_714_RULES.minEntryAge}.`);
    reasonCodes.push({
      code: "age_below_min",
      params: { min: PLAN_714_RULES.minEntryAge, actual: input.age },
    });
  } else if (input.age > PLAN_714_RULES.maxEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is above the maximum entry age of ${PLAN_714_RULES.maxEntryAge}.`);
    reasonCodes.push({
      code: "age_above_max",
      params: { max: PLAN_714_RULES.maxEntryAge, actual: input.age },
    });
  }

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else {
    if (
      input.policyTermYears < PLAN_714_RULES.minPolicyTermYears ||
      input.policyTermYears > PLAN_714_RULES.maxPolicyTermYears
    ) {
      eligible = false;
      reasons.push(
        `Policy term ${input.policyTermYears} years is outside the allowed range of ` +
          `${PLAN_714_RULES.minPolicyTermYears}-${PLAN_714_RULES.maxPolicyTermYears} years.`
      );
      reasonCodes.push({
        code: "term_out_of_range",
        params: {
          min: PLAN_714_RULES.minPolicyTermYears,
          max: PLAN_714_RULES.maxPolicyTermYears,
          actual: input.policyTermYears,
        },
      });
    }

    const maturityAge = input.age + input.policyTermYears;
    if (maturityAge > PLAN_714_RULES.maxMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${PLAN_714_RULES.maxMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_high",
        params: { max: PLAN_714_RULES.maxMaturityAge, actual: maturityAge },
      });
    } else if (maturityAge < PLAN_714_RULES.minMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would be below the minimum maturity age of ${PLAN_714_RULES.minMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_low",
        params: { min: PLAN_714_RULES.minMaturityAge, actual: maturityAge },
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
  } else if (input.sumAssured < PLAN_714_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_714_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_714_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (!isValidSumAssuredIncrement(input.sumAssured, [...PLAN_714_RULES.sumAssuredBands])) {
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

export function calculatePremium(input: Plan714Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_714_RULES.sampleIllustrativePremium;
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

export function calculateBenefits(input: Plan714Input): BenefitCalculationResult {
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
      basicSumAssured,
      PLAN_714_RULES.deathBenefit.annualizedPremiumMultiple * premiumLookup.premium
    );
    guaranteedBenefits.sumAssuredOnDeath = sumAssuredOnDeath;
    deathBenefit = sumAssuredOnDeath;
  } else {
    guaranteedBenefits.sumAssuredOnDeathMinimum = basicSumAssured;
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
