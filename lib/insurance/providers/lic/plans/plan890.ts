// Verified rule implementation for LIC's New Bima Jyoti (Plan 890, UIN
// 512N395V01). A Non-Par Limited Premium plan with a fully guaranteed,
// premium-based Guaranteed Addition accruing for the FULL Policy Term
// (like plan881.ts/plan889.ts) — a fixed offset (Term - 5) sets the
// Premium Paying Term.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): New_Bima_Jyoti_Sales_Brochure_English.pdf — the ONLY source
// for every rule below. See docs/lic-plan890-verification.md.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { accrueGuaranteedAdditionOnPremium, isValidSumAssuredIncrement } from "./shared";

export const PLAN_890_UIN = "512N395V01";

const SOURCE_VERSION = "LIC's New Bima Jyoti Sales Brochure, UIN 512N395V01";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

// Incentive for High Basic Sum Assured (§10.I) — deterministic from BSA +
// Premium Paying Term alone, so (unlike the online-sale incentive, which
// needs unverifiable business-relationship context) it is safe to add to
// the base Guaranteed Addition rate. The brochure buckets PPT into
// "10 to 14" and "15" (not per-individual-PPT-value). Values are
// published as PERCENTAGES; converted here to per-thousand (x10) so they
// add directly to guaranteedAdditionBaseRatePerThousand. Bands are named
// "X to less than Y", so the upper bound of each band is EXCLUSIVE.
const HIGH_BSA_INCENTIVE_BANDS: {
  maxExclusive: number | null;
  ratePpt10to14: number;
  ratePpt15: number;
}[] = [
  { maxExclusive: 300000, ratePpt10to14: 0, ratePpt15: 0 },
  { maxExclusive: 500000, ratePpt10to14: 5.0, ratePpt15: 7.5 },
  { maxExclusive: 1000000, ratePpt10to14: 8.5, ratePpt15: 11.0 },
  { maxExclusive: null, ratePpt10to14: 10.0, ratePpt15: 12.5 },
];

// ---- Phase 1: verified rules (brochure §2, page 3; §3-4, pages 4-6) ----
export const PLAN_890_RULES = {
  minEntryAge: 0, // "30 days (completed)"
  maxEntryAge: 60, // "60 years (nearer birthday)"
  minMaturityAge: 18,
  maxMaturityAge: 75,
  minPolicyTermYears: 15,
  maxPolicyTermYears: 20,
  // Premium Paying Term = Policy Term - 5 years — derived, never chosen
  // independently.
  premiumPayingTermOffsetFromPolicyTerm: 5,
  minBasicSumAssured: 125000,
  sumAssuredBands: [
    { maxInclusive: 275000, multiple: 5000 },
    { maxInclusive: null, multiple: 25000 },
  ],
  // Death Benefit (§3.A, page 4): higher of 125% BSA or 7x annualised
  // premium. The 125%-BSA side needs no premium at all, so it is always a
  // computable guaranteed floor.
  deathBenefit: { basicSumAssuredMultiple: 1.25, annualizedPremiumMultiple: 7 },
  // Guaranteed Addition (§4, page 5): a fixed, GUARANTEED base rate,
  // accruing for the full Policy Term (continuing to accrue even after
  // the Premium Paying Term ends, on the premium already paid) — cross-
  // checked exactly against the brochure's own Sample Benefit
  // Illustration (age 35, PPT 15, term 20, BSA Rs.10,00,000, premium
  // 84,700 -> GA year 1 = 6,140.75 at an effective rate of 7.25%).
  guaranteedAdditionBaseRatePerThousand: 60,
  // Sample Illustrative Premium (§8, page 13): exact published annual
  // premiums for BSA Rs.10,00,000, by age and Policy Term (PPT).
  sampleIllustrativePremium: {
    basicSumAssured: 1000000,
    rows: [
      { age: 20, policyTermYears: 15, premiumPaymentTermYears: 10, premium: 122300 },
      { age: 20, policyTermYears: 18, premiumPaymentTermYears: 13, premium: 93200 },
      { age: 20, policyTermYears: 20, premiumPaymentTermYears: 15, premium: 82550 },
      { age: 30, policyTermYears: 15, premiumPaymentTermYears: 10, premium: 122850 },
      { age: 30, policyTermYears: 18, premiumPaymentTermYears: 13, premium: 93900 },
      { age: 30, policyTermYears: 20, premiumPaymentTermYears: 15, premium: 83400 },
      { age: 40, policyTermYears: 15, premiumPaymentTermYears: 10, premium: 125600 },
      { age: 40, policyTermYears: 18, premiumPaymentTermYears: 13, premium: 97200 },
      { age: 40, policyTermYears: 20, premiumPaymentTermYears: 15, premium: 87150 },
      { age: 50, policyTermYears: 15, premiumPaymentTermYears: 10, premium: 134300 },
      { age: 50, policyTermYears: 18, premiumPaymentTermYears: 13, premium: 106650 },
      { age: 50, policyTermYears: 20, premiumPaymentTermYears: 15, premium: 97500 },
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

type Plan890Input = LicCalculatorInput & { product: InsuranceProduct };

export function derivedPremiumPayingTermYears(policyTermYears: number): number {
  return policyTermYears - PLAN_890_RULES.premiumPayingTermOffsetFromPolicyTerm;
}

function highBsaIncentiveRatePerThousand(basicSumAssured: number, premiumPaymentTermYears: number): number {
  const band =
    HIGH_BSA_INCENTIVE_BANDS.find((b) => b.maxExclusive != null && basicSumAssured < b.maxExclusive) ??
    HIGH_BSA_INCENTIVE_BANDS[HIGH_BSA_INCENTIVE_BANDS.length - 1];
  return premiumPaymentTermYears >= 15 ? band.ratePpt15 : band.ratePpt10to14;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan890Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_890_RULES.minEntryAge || input.age > PLAN_890_RULES.maxEntryAge) {
    eligible = false;
    reasons.push(
      `Age ${input.age} is outside the eligible entry range of ${PLAN_890_RULES.minEntryAge}-${PLAN_890_RULES.maxEntryAge}.`
    );
    reasonCodes.push({
      code: "age_out_of_range",
      params: { min: PLAN_890_RULES.minEntryAge, max: PLAN_890_RULES.maxEntryAge, actual: input.age },
    });
  }

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else {
    if (
      input.policyTermYears < PLAN_890_RULES.minPolicyTermYears ||
      input.policyTermYears > PLAN_890_RULES.maxPolicyTermYears
    ) {
      eligible = false;
      reasons.push(
        `Policy term ${input.policyTermYears} years is outside the allowed range of ${PLAN_890_RULES.minPolicyTermYears}-${PLAN_890_RULES.maxPolicyTermYears} years.`
      );
      reasonCodes.push({
        code: "term_out_of_range",
        params: {
          min: PLAN_890_RULES.minPolicyTermYears,
          max: PLAN_890_RULES.maxPolicyTermYears,
          actual: input.policyTermYears,
        },
      });
    }

    const maturityAge = input.age + input.policyTermYears;
    if (maturityAge > PLAN_890_RULES.maxMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${PLAN_890_RULES.maxMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_high",
        params: { max: PLAN_890_RULES.maxMaturityAge, actual: maturityAge },
      });
    } else if (maturityAge < PLAN_890_RULES.minMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would be below the minimum maturity age of ${PLAN_890_RULES.minMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_low",
        params: { min: PLAN_890_RULES.minMaturityAge, actual: maturityAge },
      });
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_890_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_890_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_890_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (!isValidSumAssuredIncrement(input.sumAssured, [...PLAN_890_RULES.sumAssuredBands])) {
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
// The brochure publishes exact premiums for BSA Rs.10,00,000, 4 ages x 3
// policy terms. Only an exact match is ever returned.
export function calculatePremium(input: Plan890Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_890_RULES.sampleIllustrativePremium;
  if (input.sumAssured !== sample.basicSumAssured) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const row = sample.rows.find(
    (r) => r.age === input.age && r.policyTermYears === input.policyTermYears
  );
  if (!row) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  return {
    available: true,
    premium: row.premium,
    premiumFrequency: "yearly",
    sumAssured: input.sumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}

// ---- Phase 3: benefit engine ----
export function calculateBenefits(input: Plan890Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const policyTermYears = input.policyTermYears as number;
  const premiumPaymentTermYears = derivedPremiumPayingTermYears(policyTermYears);
  const guaranteedBenefits: Record<string, number> = { maturitySumAssured: basicSumAssured };
  let maturityBenefit = basicSumAssured;

  const premiumLookup = calculatePremium(input);
  if (premiumLookup.available && premiumLookup.premium != null) {
    const rate =
      PLAN_890_RULES.guaranteedAdditionBaseRatePerThousand +
      highBsaIncentiveRatePerThousand(basicSumAssured, premiumPaymentTermYears);
    const gaAtMaturity = accrueGuaranteedAdditionOnPremium(
      premiumLookup.premium,
      rate,
      policyTermYears,
      premiumPaymentTermYears
    );
    guaranteedBenefits.guaranteedAdditionAtMaturity = gaAtMaturity;
    maturityBenefit = basicSumAssured + gaAtMaturity;
  }

  // Death Benefit: 125% of BSA needs no premium at all, so it is always a
  // computable guaranteed floor; the 7x-premium side only ever raises it
  // when an exact premium is verified.
  const guaranteedFloor = Math.round(PLAN_890_RULES.deathBenefit.basicSumAssuredMultiple * basicSumAssured);
  let deathBenefit = guaranteedFloor;
  if (premiumLookup.available && premiumLookup.premium != null) {
    deathBenefit = Math.max(
      guaranteedFloor,
      PLAN_890_RULES.deathBenefit.annualizedPremiumMultiple * premiumLookup.premium
    );
  }
  guaranteedBenefits.sumAssuredOnDeath = deathBenefit;

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
