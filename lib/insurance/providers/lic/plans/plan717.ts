// Verified rule implementation for LIC's Single Premium Endowment Plan
// (Plan 717, UIN 512N283V03). Follows the plan733.ts/plan736.ts pattern.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Single_Premium_Endowment_plan_Eng_141025.pdf — the ONLY
// source for every rule below. See docs/lic-plan717-verification.md for
// the full audit and everything deliberately left unimplemented.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { findExactPremiumRow, isValidSumAssuredIncrement } from "./shared";

export const PLAN_717_UIN = "512N283V03";

const SOURCE_VERSION = "LIC's Single Premium Endowment Plan Sales Brochure, UIN 512N283V03";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export const PLAN_717_BONUS_DISCLAIMER =
  "Future bonus is not guaranteed and is not included in this calculation.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

// ---- Phase 1: verified rules (brochure §1, page 2; §2, page 3) ----
export const PLAN_717_RULES = {
  // "30 days (completed)" — this engine models age in whole years, so the
  // minimum is represented as 0 rather than a fractional/day-based value.
  minEntryAge: 0,
  maxEntryAge: 65,
  minMaturityAge: 18, // "Minimum age at maturity ... 18 years (completed)"
  maxMaturityAge: 75,
  minPolicyTermYears: 10,
  maxPolicyTermYears: 25,
  minBasicSumAssured: 100000,
  sumAssuredBands: [
    { maxInclusive: 250000, multiple: 10000 },
    { maxInclusive: null, multiple: 25000 },
  ],
  // Death Benefit (§2.A, page 3): "Sum Assured on Death" is the higher of
  // Basic Sum Assured or a multiple of the Single Premium, where the
  // multiple depends on age at entry. No 105%-of-premiums-paid floor is
  // stated for this product in the brochure (unlike Plan 736/714/715).
  deathBenefit: {
    ageThreshold: 50,
    belowThresholdMultiple: 1.25,
    atOrAboveThresholdMultiple: 1.1,
  },
  bonusTypes: ["Simple Reversionary Bonus", "Final Additional Bonus"] as const,
  // Sample Illustrative Premium (§4, page 7): exact published single
  // premiums for Basic Sum Assured Rs. 1,00,000, standard lives.
  sampleIllustrativePremium: {
    basicSumAssured: 100000,
    premiumFrequency: "single" as const,
    rows: [
      { age: 10, policyTermYears: 10, singlePremium: 77910 },
      { age: 10, policyTermYears: 15, singlePremium: 66650 },
      { age: 10, policyTermYears: 25, singlePremium: 50005 },
      { age: 20, policyTermYears: 10, singlePremium: 77985 },
      { age: 20, policyTermYears: 15, singlePremium: 66775 },
      { age: 20, policyTermYears: 25, singlePremium: 50255 },
      { age: 30, policyTermYears: 10, singlePremium: 78010 },
      { age: 30, policyTermYears: 15, singlePremium: 66865 },
      { age: 30, policyTermYears: 25, singlePremium: 50695 },
      { age: 40, policyTermYears: 10, singlePremium: 78180 },
      { age: 40, policyTermYears: 15, singlePremium: 67335 },
      { age: 40, policyTermYears: 25, singlePremium: 52340 },
      { age: 50, policyTermYears: 10, singlePremium: 78800 },
      { age: 50, policyTermYears: 15, singlePremium: 68800 },
      { age: 50, policyTermYears: 25, singlePremium: 56160 },
      { age: 60, policyTermYears: 10, singlePremium: 79965 },
      { age: 60, policyTermYears: 15, singlePremium: 71405 },
      // Age 60 / term 25 is blank in the brochure table — omitted.
    ],
  },
  riders: [
    { name: "LIC's Accidental Death and Disability Benefit Rider", uin: "512B209V02" },
    { name: "LIC's New Term Assurance Rider", uin: "512B210V02" },
  ],
} as const;

type Plan717Input = LicCalculatorInput & { product: InsuranceProduct };

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan717Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_717_RULES.minEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is below the minimum entry age of ${PLAN_717_RULES.minEntryAge}.`);
    reasonCodes.push({
      code: "age_below_min",
      params: { min: PLAN_717_RULES.minEntryAge, actual: input.age },
    });
  } else if (input.age > PLAN_717_RULES.maxEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is above the maximum entry age of ${PLAN_717_RULES.maxEntryAge}.`);
    reasonCodes.push({
      code: "age_above_max",
      params: { max: PLAN_717_RULES.maxEntryAge, actual: input.age },
    });
  }

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else {
    if (
      input.policyTermYears < PLAN_717_RULES.minPolicyTermYears ||
      input.policyTermYears > PLAN_717_RULES.maxPolicyTermYears
    ) {
      eligible = false;
      reasons.push(
        `Policy term ${input.policyTermYears} years is outside the allowed range of ` +
          `${PLAN_717_RULES.minPolicyTermYears}-${PLAN_717_RULES.maxPolicyTermYears} years.`
      );
      reasonCodes.push({
        code: "term_out_of_range",
        params: {
          min: PLAN_717_RULES.minPolicyTermYears,
          max: PLAN_717_RULES.maxPolicyTermYears,
          actual: input.policyTermYears,
        },
      });
    }

    const maturityAge = input.age + input.policyTermYears;
    if (maturityAge > PLAN_717_RULES.maxMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${PLAN_717_RULES.maxMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_high",
        params: { max: PLAN_717_RULES.maxMaturityAge, actual: maturityAge },
      });
    } else if (maturityAge < PLAN_717_RULES.minMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would be below the minimum maturity age of ${PLAN_717_RULES.minMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_low",
        params: { min: PLAN_717_RULES.minMaturityAge, actual: maturityAge },
      });
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_717_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_717_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_717_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (!isValidSumAssuredIncrement(input.sumAssured, [...PLAN_717_RULES.sumAssuredBands])) {
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

// ---- Phase 4: premium engine safety ----
// This is a single-premium product — the brochure publishes only a small
// set of exact single-premium sample points. Only an exact match is ever
// returned; nothing is estimated, interpolated, scaled or extrapolated.
export function calculatePremium(input: Plan717Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_717_RULES.sampleIllustrativePremium;
  const frequency = input.premiumFrequency ?? "single";
  const match =
    frequency === sample.premiumFrequency && input.sumAssured === sample.basicSumAssured
      ? findExactPremiumRow(sample.rows, input.age, input.policyTermYears!)
      : undefined;

  if (!match) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  return {
    available: true,
    premium: match.singlePremium,
    premiumFrequency: "single",
    sumAssured: input.sumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}

// ---- Phase 3: benefit engine ----
export function calculateBenefits(input: Plan717Input): BenefitCalculationResult {
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
    const multiple =
      input.age < PLAN_717_RULES.deathBenefit.ageThreshold
        ? PLAN_717_RULES.deathBenefit.belowThresholdMultiple
        : PLAN_717_RULES.deathBenefit.atOrAboveThresholdMultiple;
    const sumAssuredOnDeath = Math.max(basicSumAssured, multiple * premiumLookup.premium);
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
