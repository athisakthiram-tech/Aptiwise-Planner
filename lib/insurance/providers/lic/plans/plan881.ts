// Verified rule implementation for LIC's Bima Lakshmi (Plan 881, UIN
// 512N389V01). A Non-Par, women-only Limited Premium savings plan with a
// fixed 25-year Policy Term, a fully guaranteed Guaranteed Addition (like
// plan774.ts/plan912.ts), and 3 Survival Benefit Options the customer
// chooses once at inception.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Bima_Lakshmi_Sales_Brochure_Eng.pdf — the ONLY source
// for every rule below. See docs/lic-plan881-verification.md.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { accrueGuaranteedAdditionOnPremium, isValidSumAssuredIncrement } from "./shared";

export const PLAN_881_UIN = "512N389V01";

const SOURCE_VERSION = "LIC's Bima Lakshmi Sales Brochure, UIN 512N389V01";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

export type Plan881SurvivalBenefitOption = "A" | "B" | "C";

// Incentive for High Basic Sum Assured (§9.I) — deterministic from BSA +
// PPT alone, so (unlike the online-sale/existing-policyholder incentives,
// which need unverifiable business-relationship context) it is safe to
// add to the base Guaranteed Addition rate. Bands are named "X to less
// than Y" in the brochure, so the upper bound of each band is EXCLUSIVE —
// a BSA of exactly Y belongs to the next band, never this one.
const HIGH_BSA_INCENTIVE_BANDS: { maxExclusive: number | null; ratePerThousand7to9: number; ratePerThousand10to15: number }[] = [
  { maxExclusive: 500000, ratePerThousand7to9: 0, ratePerThousand10to15: 0 },
  { maxExclusive: 1000000, ratePerThousand7to9: 2.5, ratePerThousand10to15: 3.0 },
  { maxExclusive: 1500000, ratePerThousand7to9: 3.5, ratePerThousand10to15: 4.0 },
  { maxExclusive: 2500000, ratePerThousand7to9: 4.0, ratePerThousand10to15: 4.5 },
  { maxExclusive: null, ratePerThousand7to9: 4.5, ratePerThousand10to15: 5.0 },
];

// ---- Phase 1: verified rules (brochure §2, page 3; §3, pages 3-5) ----
export const PLAN_881_RULES = {
  minEntryAge: 18,
  maxEntryAge: 50,
  fixedPolicyTermYears: 25,
  minPremiumPayingTermYears: 7,
  maxPremiumPayingTermYears: 15,
  minBasicSumAssured: 200000,
  sumAssuredMultiple: 10000,
  // Death Benefit (§3.A, page 3): higher of BSA or (10 x Tabular Annual
  // Premium x modal factor). This engine only supports annual-mode exact
  // premium lookups, so the modal adjustment factor is always 1.0 here.
  deathBenefit: { basicSumAssuredMultiple: 1, tabularAnnualPremiumMultiple: 10 },
  // Guaranteed Addition (§3.D, page 5): a fixed, GUARANTEED base rate,
  // accruing for the full 25-year Policy Term (continuing to accrue even
  // after the Premium Paying Term ends, on the premium already paid) —
  // this is a Non-Par product ("guaranteed and fixed irrespective of
  // actual experience").
  guaranteedAdditionBaseRatePerThousand: 70,
  // Survival Benefit (§3.C, page 4) — chosen once at the proposal stage,
  // never altered later.
  survivalBenefitOptionA: { percentOfBsaAtEndOfPpt: 50 },
  survivalBenefitOptionBYears: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] as const,
  survivalBenefitOptionBPercent: 7.5,
  survivalBenefitOptionCYears: [4, 8, 12, 16, 20, 24] as const,
  survivalBenefitOptionCPercent: 15,
  // Sample Illustrative Premium (§7, page 12): exact published annual
  // premiums for BSA Rs.2,00,000, age 35, by chosen Premium Paying Term
  // and Survival Benefit Option.
  sampleIllustrativePremium: {
    basicSumAssured: 200000,
    age: 35,
    rows: [
      { premiumPaymentTermYears: 7, optionA: 47840, optionB: 56700, optionC: 54470 },
      { premiumPaymentTermYears: 8, optionA: 40990, optionB: 50190, optionC: 48230 },
      { premiumPaymentTermYears: 9, optionA: 35880, optionB: 45350, optionC: 43580 },
      { premiumPaymentTermYears: 10, optionA: 34480, optionB: 44940, optionC: 43190 },
      { premiumPaymentTermYears: 11, optionA: 30890, optionB: 41470, optionC: 39860 },
      { premiumPaymentTermYears: 12, optionA: 27990, optionB: 38660, optionC: 37160 },
      { premiumPaymentTermYears: 13, optionA: 25600, optionB: 36340, optionC: 34940 },
      { premiumPaymentTermYears: 14, optionA: 23590, optionB: 34390, optionC: 33060 },
      { premiumPaymentTermYears: 15, optionA: 22590, optionB: 33780, optionC: 32480 },
    ],
  },
  riders: [
    { name: "LIC's Accidental Death and Disability Benefit Rider", uin: "512B209V02" },
    { name: "LIC's Accident Benefit Rider", uin: "512B203V03" },
    { name: "LIC's New Term Assurance Rider", uin: "512B210V02" },
    { name: "LIC's Female Critical Illness Benefit Rider", uin: "512B226V01" },
  ],
} as const;

type Plan881Input = LicCalculatorInput & { product: InsuranceProduct };

function readOption(input: Plan881Input): Plan881SurvivalBenefitOption | undefined {
  const option = input.productSpecificInputs?.survivalBenefitOption;
  return option === "A" || option === "B" || option === "C" ? option : undefined;
}

function highBsaIncentiveRatePerThousand(basicSumAssured: number, ppt: number): number {
  const band =
    HIGH_BSA_INCENTIVE_BANDS.find((b) => b.maxExclusive != null && basicSumAssured < b.maxExclusive) ??
    HIGH_BSA_INCENTIVE_BANDS[HIGH_BSA_INCENTIVE_BANDS.length - 1];
  return ppt <= 9 ? band.ratePerThousand7to9 : band.ratePerThousand10to15;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan881Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_881_RULES.minEntryAge || input.age > PLAN_881_RULES.maxEntryAge) {
    eligible = false;
    reasons.push(
      `Age ${input.age} is outside the eligible entry range of ${PLAN_881_RULES.minEntryAge}-${PLAN_881_RULES.maxEntryAge}.`
    );
    reasonCodes.push({
      code: "age_out_of_range",
      params: { min: PLAN_881_RULES.minEntryAge, max: PLAN_881_RULES.maxEntryAge, actual: input.age },
    });
  }

  if (input.policyTermYears != null && input.policyTermYears !== PLAN_881_RULES.fixedPolicyTermYears) {
    eligible = false;
    reasons.push(`Policy term must be exactly ${PLAN_881_RULES.fixedPolicyTermYears} years.`);
    reasonCodes.push({
      code: "term_out_of_range",
      params: {
        min: PLAN_881_RULES.fixedPolicyTermYears,
        max: PLAN_881_RULES.fixedPolicyTermYears,
        actual: input.policyTermYears,
      },
    });
  }

  if (input.premiumPaymentTermYears == null) {
    missingInputs.push("premiumPaymentTermYears");
  } else if (
    input.premiumPaymentTermYears < PLAN_881_RULES.minPremiumPayingTermYears ||
    input.premiumPaymentTermYears > PLAN_881_RULES.maxPremiumPayingTermYears
  ) {
    eligible = false;
    reasons.push(
      `Premium Paying Term ${input.premiumPaymentTermYears} years is outside the allowed range of ${PLAN_881_RULES.minPremiumPayingTermYears}-${PLAN_881_RULES.maxPremiumPayingTermYears} years.`
    );
    reasonCodes.push({
      code: "invalid_premium_paying_term",
      params: { actual: input.premiumPaymentTermYears },
    });
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_881_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_881_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_881_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (
    !isValidSumAssuredIncrement(input.sumAssured, [
      { maxInclusive: null, multiple: PLAN_881_RULES.sumAssuredMultiple },
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
// The brochure publishes exact premiums for one age (35) and BSA
// (Rs.2,00,000), by chosen Premium Paying Term and Survival Benefit
// Option. Only an exact match is ever returned.
export function calculatePremium(input: Plan881Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.premiumPaymentTermYears == null) missingInputs.push("premiumPaymentTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  const option = readOption(input);
  if (option == null) missingInputs.push("productSpecificInputs.survivalBenefitOption");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_881_RULES.sampleIllustrativePremium;
  if (input.age !== sample.age || input.sumAssured !== sample.basicSumAssured) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const row = sample.rows.find((r) => r.premiumPaymentTermYears === input.premiumPaymentTermYears);
  if (!row) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const premium = option === "A" ? row.optionA : option === "B" ? row.optionB : row.optionC;
  return {
    available: true,
    premium,
    premiumFrequency: "yearly",
    sumAssured: input.sumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}

// ---- Phase 3: benefit engine ----
export function calculateBenefits(input: Plan881Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = { maturitySumAssured: basicSumAssured };
  let maturityBenefit = basicSumAssured;

  const option = readOption(input);
  if (option === "A") {
    guaranteedBenefits.survivalBenefitAtEndOfPpt = Math.round(
      (PLAN_881_RULES.survivalBenefitOptionA.percentOfBsaAtEndOfPpt / 100) * basicSumAssured
    );
  } else if (option === "B") {
    guaranteedBenefits.survivalBenefitPerInstallment = Math.round(
      (PLAN_881_RULES.survivalBenefitOptionBPercent / 100) * basicSumAssured
    );
  } else if (option === "C") {
    guaranteedBenefits.survivalBenefitPerInstallment = Math.round(
      (PLAN_881_RULES.survivalBenefitOptionCPercent / 100) * basicSumAssured
    );
  }

  const premiumLookup = calculatePremium(input);
  if (
    input.premiumPaymentTermYears != null &&
    premiumLookup.available &&
    premiumLookup.premium != null
  ) {
    const rate =
      PLAN_881_RULES.guaranteedAdditionBaseRatePerThousand +
      highBsaIncentiveRatePerThousand(basicSumAssured, input.premiumPaymentTermYears);
    const gaAtMaturity = accrueGuaranteedAdditionOnPremium(
      premiumLookup.premium,
      rate,
      PLAN_881_RULES.fixedPolicyTermYears,
      input.premiumPaymentTermYears
    );
    guaranteedBenefits.guaranteedAdditionAtMaturity = gaAtMaturity;
    maturityBenefit = basicSumAssured + gaAtMaturity;
  }

  let deathBenefit: number | undefined;
  if (premiumLookup.available && premiumLookup.premium != null) {
    deathBenefit = Math.max(
      basicSumAssured,
      PLAN_881_RULES.deathBenefit.tabularAnnualPremiumMultiple * premiumLookup.premium
    );
    guaranteedBenefits.sumAssuredOnDeath = deathBenefit;
  } else {
    guaranteedBenefits.sumAssuredOnDeathMinimum = basicSumAssured;
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
