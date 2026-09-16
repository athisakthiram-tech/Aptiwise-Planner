// Verified rule implementation for LIC's Nav Jeevan Shree (Plan 912,
// UIN 512N387V02). Non-Par plan — like plan774.ts, its maturity benefit
// uses a fixed, GUARANTEED "Guaranteed Addition" rate rather than an
// undisclosed participating bonus, and the customer chooses one of 2
// Sum-Assured-on-Death options at inception.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Nav_Jeevan_Shree_Sales_Brochure_Eng_912_151025.pdf —
// the ONLY source for every rule below. See
// docs/lic-plan912-verification.md.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { isValidSumAssuredIncrement } from "./shared";

export const PLAN_912_UIN = "512N387V02";

const SOURCE_VERSION = "LIC's Nav Jeevan Shree Sales Brochure, UIN 512N387V02";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

export type Plan912DeathBenefitOption = "I" | "II";

// Maximum entry age and valid policy-term range both depend on the
// chosen Premium Paying Term (brochure §2, page 3).
const MAX_ENTRY_AGE_BY_PPT: Record<number, number> = { 6: 60, 8: 60, 10: 60, 12: 59, 15: 57 };
const TERM_RANGE_BY_PPT: Record<number, { min: number; max: number }> = {
  6: { min: 10, max: 20 },
  8: { min: 15, max: 20 },
  10: { min: 15, max: 20 },
  12: { min: 16, max: 20 },
  15: { min: 18, max: 20 },
};

// ---- Phase 1: verified rules (brochure §2, page 3; §3, pages 4-6) ----
export const PLAN_912_RULES = {
  minEntryAge: 0, // "30 days (completed)"
  minMaturityAge: 18,
  maxMaturityAge: 75,
  pptOptions: [6, 8, 10, 12, 15] as const,
  maxEntryAgeByPpt: MAX_ENTRY_AGE_BY_PPT,
  termRangeByPpt: TERM_RANGE_BY_PPT,
  minBasicSumAssured: 500000,
  sumAssuredMultiple: 10000,
  // Sum Assured on Death options (§3.A, page 4) — chosen once at
  // inception and never altered. Both are "higher of a multiple of
  // Tabular Annual Premium (x modal adjustment factor) or Basic Sum
  // Assured". This engine only supports annual-mode exact premium
  // lookups, so the modal adjustment factor is always 1.0 here.
  deathBenefitOptions: {
    I: { multiple: 7 },
    II: { multiple: 10 },
  } as const,
  // Guaranteed Addition (§3.C, page 5): a fixed, GUARANTEED base rate —
  // this is a Non-Par product ("guaranteed and fixed irrespective of
  // actual experience"). Only the base rate (before any incentive for
  // high Basic Sum Assured / online sale / existing policyholder) is
  // modeled — see docs/lic-plan912-verification.md.
  guaranteedAdditionRateByPolicyTerm: [
    { maxPolicyTermYears: 13, ratePercentOfTabularAnnualPremium: 8.5 },
    { maxPolicyTermYears: 17, ratePercentOfTabularAnnualPremium: 9.0 },
    { maxPolicyTermYears: 20, ratePercentOfTabularAnnualPremium: 9.5 },
  ] as const,
  // 105%-of-premiums-paid floor is stated for both Options — needs
  // premium-paid history, not modeled here.
  // Sample Illustrative Premium (§7, page 12): exact published annual
  // premiums for Basic Sum Assured Rs.5,00,000, standard lives aged 35.
  sampleIllustrativePremium: {
    basicSumAssured: 500000,
    age: 35,
    rows: [
      { premiumPaymentTermYears: 6, policyTermYears: 10, optionI: 101350, optionII: 103025 },
      { premiumPaymentTermYears: 6, policyTermYears: 15, optionI: 93425, optionII: 96625 },
      { premiumPaymentTermYears: 6, policyTermYears: 20, optionI: 76750, optionII: 81150 },
      { premiumPaymentTermYears: 8, policyTermYears: 15, optionI: 70925, optionII: 72700 },
      { premiumPaymentTermYears: 8, policyTermYears: 20, optionI: 60350, optionII: 61850 },
      { premiumPaymentTermYears: 10, policyTermYears: 15, optionI: 62825, optionII: 63775 },
      { premiumPaymentTermYears: 10, policyTermYears: 20, optionI: 55600, optionII: 56325 },
      { premiumPaymentTermYears: 12, policyTermYears: 20, optionI: 48075, optionII: 48075 },
      { premiumPaymentTermYears: 15, policyTermYears: 20, optionI: 41875, optionII: 41875 },
    ],
  },
  riders: [
    { name: "LIC's Accidental Death and Disability Benefit Rider", uin: "512B209V02" },
    { name: "LIC's Accident Benefit Rider", uin: "512B203V03" },
    { name: "LIC's New Term Assurance Rider", uin: "512B210V02" },
    { name: "LIC's Premium Waiver Benefit Rider", uin: "512B204V04" },
  ],
} as const;

type Plan912Input = LicCalculatorInput & { product: InsuranceProduct };

function readOption(input: Plan912Input): Plan912DeathBenefitOption | undefined {
  const option = input.productSpecificInputs?.deathBenefitOption;
  return option === "I" || option === "II" ? option : undefined;
}

function gaRateForTerm(policyTermYears: number): number | undefined {
  return PLAN_912_RULES.guaranteedAdditionRateByPolicyTerm.find(
    (band) => policyTermYears <= band.maxPolicyTermYears
  )?.ratePercentOfTabularAnnualPremium;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan912Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_912_RULES.minEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is below the minimum entry age of ${PLAN_912_RULES.minEntryAge}.`);
    reasonCodes.push({
      code: "age_below_min",
      params: { min: PLAN_912_RULES.minEntryAge, actual: input.age },
    });
  }

  if (input.premiumPaymentTermYears == null) {
    missingInputs.push("premiumPaymentTermYears");
  } else {
    const ppt = input.premiumPaymentTermYears;
    const maxEntryAge = PLAN_912_RULES.maxEntryAgeByPpt[ppt];
    const termRange = PLAN_912_RULES.termRangeByPpt[ppt];

    if (maxEntryAge == null || termRange == null) {
      eligible = false;
      reasons.push(`Premium Paying Term ${ppt} is not offered — choose 6, 8, 10, 12 or 15 years.`);
      reasonCodes.push({ code: "invalid_premium_paying_term", params: { actual: ppt } });
    } else {
      if (input.age > maxEntryAge) {
        eligible = false;
        reasons.push(`Age ${input.age} is above the maximum entry age of ${maxEntryAge} for a ${ppt}-year Premium Paying Term.`);
        reasonCodes.push({
          code: "age_above_max_for_ppt",
          params: { max: maxEntryAge, actual: input.age, ppt },
        });
      }

      if (input.policyTermYears == null) {
        missingInputs.push("policyTermYears");
      } else {
        if (input.policyTermYears < termRange.min || input.policyTermYears > termRange.max) {
          eligible = false;
          reasons.push(
            `Policy term ${input.policyTermYears} years is outside the allowed range of ${termRange.min}-${termRange.max} years for a ${ppt}-year Premium Paying Term.`
          );
          reasonCodes.push({
            code: "term_out_of_range_for_ppt",
            params: { min: termRange.min, max: termRange.max, actual: input.policyTermYears, ppt },
          });
        }

        const maturityAge = input.age + input.policyTermYears;
        if (maturityAge > PLAN_912_RULES.maxMaturityAge) {
          eligible = false;
          reasons.push(
            `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${PLAN_912_RULES.maxMaturityAge}.`
          );
          reasonCodes.push({
            code: "maturity_age_too_high",
            params: { max: PLAN_912_RULES.maxMaturityAge, actual: maturityAge },
          });
        } else if (maturityAge < PLAN_912_RULES.minMaturityAge) {
          eligible = false;
          reasons.push(
            `Age at maturity (${maturityAge}) would be below the minimum maturity age of ${PLAN_912_RULES.minMaturityAge}.`
          );
          reasonCodes.push({
            code: "maturity_age_too_low",
            params: { min: PLAN_912_RULES.minMaturityAge, actual: maturityAge },
          });
        }
      }
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_912_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_912_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_912_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (
    !isValidSumAssuredIncrement(input.sumAssured, [
      { maxInclusive: null, multiple: PLAN_912_RULES.sumAssuredMultiple },
    ])
  ) {
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
// The brochure publishes a small set of exact points (BSA Rs.5,00,000,
// age 35) for specific PPT/term combinations, split by chosen Option.
// Only an exact match is ever returned.
export function calculatePremium(input: Plan912Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.premiumPaymentTermYears == null) missingInputs.push("premiumPaymentTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  const option = readOption(input);
  if (option == null) missingInputs.push("productSpecificInputs.deathBenefitOption");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_912_RULES.sampleIllustrativePremium;
  const frequency = input.premiumFrequency ?? "yearly";
  const match =
    frequency === "yearly" && input.age === sample.age && input.sumAssured === sample.basicSumAssured
      ? sample.rows.find(
          (row) =>
            row.premiumPaymentTermYears === input.premiumPaymentTermYears &&
            row.policyTermYears === input.policyTermYears
        )
      : undefined;

  if (!match) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  return {
    available: true,
    premium: option === "I" ? match.optionI : match.optionII,
    premiumFrequency: "yearly",
    sumAssured: input.sumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}

// ---- Phase 3: benefit engine ----
export function calculateBenefits(input: Plan912Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = { maturitySumAssured: basicSumAssured };
  let maturityBenefit = basicSumAssured;

  const premiumLookup = calculatePremium(input);

  // Guaranteed Addition is a fixed, guaranteed rate applied to the
  // Tabular Annual Premium — unlike Amritbaal's BSA-based rate, this one
  // does need a verified premium.
  if (input.policyTermYears != null && premiumLookup.available && premiumLookup.premium != null) {
    const ratePercent = gaRateForTerm(input.policyTermYears);
    if (ratePercent != null) {
      const gaPerYear = (ratePercent / 100) * premiumLookup.premium;
      const gaAtMaturity = Math.round(gaPerYear * input.policyTermYears);
      guaranteedBenefits.guaranteedAdditionAtMaturity = gaAtMaturity;
      maturityBenefit = basicSumAssured + gaAtMaturity;
    }
  }

  let deathBenefit: number | undefined;
  const option = readOption(input);
  if (option != null) {
    if (premiumLookup.available && premiumLookup.premium != null) {
      const multiple = PLAN_912_RULES.deathBenefitOptions[option].multiple;
      const sumAssuredOnDeath = Math.max(basicSumAssured, multiple * premiumLookup.premium);
      guaranteedBenefits.sumAssuredOnDeath = sumAssuredOnDeath;
      deathBenefit = sumAssuredOnDeath;
    } else {
      guaranteedBenefits.sumAssuredOnDeathMinimum = basicSumAssured;
    }
  }

  return {
    available: true,
    guaranteedBenefits,
    nonGuaranteedIllustrations: undefined,
    deathBenefit,
    maturityBenefit,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}
