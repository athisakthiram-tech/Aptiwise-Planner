// Verified rule implementation for LIC's Bima Platinum (Plan 770, UIN
// 512N397V01). A Non-Par, Limited Premium income-benefit plan: after the
// Premium Paying Term ends, it pays a Regular Income Benefit every year
// and a one-time Booster Income Benefit, on top of a fully guaranteed,
// premium-based Guaranteed Addition (accruing only during the Premium
// Paying Term, like plan912.ts) added to the maturity Sum Assured.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Bima_platinum_Sales_brochure.pdf — the ONLY source for
// every rule below. See docs/lic-plan770-verification.md.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { accrueGuaranteedAdditionOnPremium, isValidSumAssuredIncrement } from "./shared";

export const PLAN_770_UIN = "512N397V01";

const SOURCE_VERSION = "LIC's Bima Platinum Sales Brochure, UIN 512N397V01";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

// Entry age (min/max) and Policy Term (min/max) both depend on the
// chosen Premium Paying Term (brochure §2, page 3).
const ENTRY_AGE_BY_PPT: Record<number, { min: number; max: number }> = {
  7: { min: 11, max: 55 },
  10: { min: 8, max: 55 },
  12: { min: 6, max: 53 },
  15: { min: 3, max: 50 },
  18: { min: 0, max: 47 },
};
const POLICY_TERM_RANGE_BY_PPT: Record<number, { min: number; max: number }> = {
  7: { min: 17, max: 40 },
  10: { min: 20, max: 40 },
  12: { min: 22, max: 40 },
  15: { min: 25, max: 40 },
  18: { min: 28, max: 40 },
};
// Booster Income Benefit's specified policy anniversary depends on PPT
// (brochure §3.B.ii, page 6).
const BOOSTER_INCOME_BENEFIT_ANNIVERSARY_BY_PPT: Record<number, number> = {
  7: 12,
  10: 15,
  12: 17,
  15: 20,
  18: 23,
};
// Incentive for High Basic Sum Assured (§10.I) — deterministic from BSA +
// PPT alone, so (unlike the online-sale/existing-policyholder incentives,
// which need unverifiable business-relationship context) it is safe to
// add to the base Guaranteed Addition rate. Bands are named "X to less
// than Y" in the brochure, so the upper bound of each band is EXCLUSIVE —
// a BSA of exactly Y belongs to the next band, never this one.
const HIGH_BSA_INCENTIVE_BANDS: {
  maxExclusive: number | null;
  ratePerThousandByPpt: Record<number, number>;
}[] = [
  {
    maxExclusive: 500000,
    ratePerThousandByPpt: { 7: 0, 10: 0, 12: 0, 15: 0, 18: 0 },
  },
  {
    maxExclusive: 700000,
    ratePerThousandByPpt: { 7: 3, 10: 4, 12: 5, 15: 6, 18: 7 },
  },
  {
    maxExclusive: 1000000,
    ratePerThousandByPpt: { 7: 6, 10: 7, 12: 8, 15: 10, 18: 12 },
  },
  {
    maxExclusive: null,
    ratePerThousandByPpt: { 7: 8, 10: 9, 12: 10, 15: 12, 18: 15 },
  },
];

// ---- Phase 1: verified rules (brochure §2, page 3; §3-4, pages 4-6) ----
export const PLAN_770_RULES = {
  minMaturityAge: 28,
  maxMaturityAge: 75,
  pptOptions: [7, 10, 12, 15, 18] as const,
  entryAgeByPpt: ENTRY_AGE_BY_PPT,
  policyTermRangeByPpt: POLICY_TERM_RANGE_BY_PPT,
  minBasicSumAssured: 300000,
  sumAssuredMultiple: 10000,
  // Death Benefit (§3.A, page 4): higher of 11x annualised premium or
  // Basic Sum Assured.
  deathBenefit: { basicSumAssuredMultiple: 1, annualizedPremiumMultiple: 11 },
  // Guaranteed Addition (§4, page 6): a fixed, GUARANTEED base rate,
  // accruing only during the Premium Paying Term — "no further accrual of
  // Guaranteed Additions after Premium Paying Term".
  guaranteedAdditionBaseRatePerThousand: 70,
  // Income Benefit (§3.B, page 5) — both fully guaranteed and computable
  // from Basic Sum Assured alone, with no premium dependency.
  regularIncomeBenefitPercentOfBsa: 10,
  boosterIncomeBenefitPercentOfBsa: 70,
  boosterIncomeBenefitAnniversaryByPpt: BOOSTER_INCOME_BENEFIT_ANNIVERSARY_BY_PPT,
  // Sample Illustrative Premium (§8, page 15): exact published annual
  // premiums for BSA Rs.3,00,000, Policy Term 30 years, by age and chosen
  // Premium Paying Term.
  sampleIllustrativePremium: {
    basicSumAssured: 300000,
    policyTermYears: 30,
    rows: [
      { age: 15, ppt7: 81810, ppt10: 54735, ppt12: 43020, ppt15: 32145, ppt18: 24990 },
      { age: 25, ppt7: 83145, ppt10: 55275, ppt12: 43290, ppt15: 32220, ppt18: 25005 },
      { age: 35, ppt7: 87495, ppt10: 57015, ppt12: 44160, ppt15: 32445, ppt18: 25005 },
      { age: 45, ppt7: 100365, ppt10: 62025, ppt12: 46770, ppt15: 33465, ppt18: 25425 },
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

type Plan770Input = LicCalculatorInput & { product: InsuranceProduct };

function highBsaIncentiveRatePerThousand(basicSumAssured: number, ppt: number): number {
  const band =
    HIGH_BSA_INCENTIVE_BANDS.find((b) => b.maxExclusive != null && basicSumAssured < b.maxExclusive) ??
    HIGH_BSA_INCENTIVE_BANDS[HIGH_BSA_INCENTIVE_BANDS.length - 1];
  return band.ratePerThousandByPpt[ppt] ?? 0;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan770Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.premiumPaymentTermYears == null) {
    missingInputs.push("premiumPaymentTermYears");
  } else {
    const ppt = input.premiumPaymentTermYears;
    const entryAge = PLAN_770_RULES.entryAgeByPpt[ppt];
    const termRange = PLAN_770_RULES.policyTermRangeByPpt[ppt];

    if (entryAge == null || termRange == null) {
      eligible = false;
      reasons.push("Premium Paying Term is not offered — choose 7, 10, 12, 15 or 18 years.");
      reasonCodes.push({ code: "invalid_premium_paying_term", params: { actual: ppt } });
    } else {
      if (input.age < entryAge.min || input.age > entryAge.max) {
        eligible = false;
        reasons.push(
          `Age ${input.age} is outside the eligible entry range of ${entryAge.min}-${entryAge.max} for a ${ppt}-year Premium Paying Term.`
        );
        reasonCodes.push({
          code: "age_out_of_range",
          params: { min: entryAge.min, max: entryAge.max, actual: input.age },
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
        if (maturityAge > PLAN_770_RULES.maxMaturityAge) {
          eligible = false;
          reasons.push(
            `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${PLAN_770_RULES.maxMaturityAge}.`
          );
          reasonCodes.push({
            code: "maturity_age_too_high",
            params: { max: PLAN_770_RULES.maxMaturityAge, actual: maturityAge },
          });
        } else if (maturityAge < PLAN_770_RULES.minMaturityAge) {
          eligible = false;
          reasons.push(
            `Age at maturity (${maturityAge}) would be below the minimum maturity age of ${PLAN_770_RULES.minMaturityAge}.`
          );
          reasonCodes.push({
            code: "maturity_age_too_low",
            params: { min: PLAN_770_RULES.minMaturityAge, actual: maturityAge },
          });
        }
      }
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_770_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_770_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_770_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (
    !isValidSumAssuredIncrement(input.sumAssured, [
      { maxInclusive: null, multiple: PLAN_770_RULES.sumAssuredMultiple },
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
// The brochure publishes exact premiums for BSA Rs.3,00,000, Policy Term
// 30 years, 4 ages x 5 PPTs. Only an exact match is ever returned.
export function calculatePremium(input: Plan770Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.premiumPaymentTermYears == null) missingInputs.push("premiumPaymentTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_770_RULES.sampleIllustrativePremium;
  if (input.policyTermYears !== sample.policyTermYears || input.sumAssured !== sample.basicSumAssured) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const row = sample.rows.find((r) => r.age === input.age);
  if (!row) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const premiumByPpt: Record<number, number> = {
    7: row.ppt7,
    10: row.ppt10,
    12: row.ppt12,
    15: row.ppt15,
    18: row.ppt18,
  };
  const premium = premiumByPpt[input.premiumPaymentTermYears as number];
  if (premium == null) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

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
export function calculateBenefits(input: Plan770Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = { maturitySumAssured: basicSumAssured };
  let maturityBenefit = basicSumAssured;

  // Regular/Booster Income Benefit are fully guaranteed and computable
  // from Basic Sum Assured alone.
  guaranteedBenefits.regularIncomeBenefitAnnual = Math.round(
    (PLAN_770_RULES.regularIncomeBenefitPercentOfBsa / 100) * basicSumAssured
  );
  if (input.premiumPaymentTermYears != null) {
    const anniversary = PLAN_770_RULES.boosterIncomeBenefitAnniversaryByPpt[input.premiumPaymentTermYears];
    if (anniversary != null) {
      guaranteedBenefits.boosterIncomeBenefit = Math.round(
        (PLAN_770_RULES.boosterIncomeBenefitPercentOfBsa / 100) * basicSumAssured
      );
    }
  }

  const premiumLookup = calculatePremium(input);
  if (
    input.premiumPaymentTermYears != null &&
    premiumLookup.available &&
    premiumLookup.premium != null
  ) {
    const rate =
      PLAN_770_RULES.guaranteedAdditionBaseRatePerThousand +
      highBsaIncentiveRatePerThousand(basicSumAssured, input.premiumPaymentTermYears);
    const gaAtEndOfPpt = accrueGuaranteedAdditionOnPremium(
      premiumLookup.premium,
      rate,
      input.premiumPaymentTermYears,
      input.premiumPaymentTermYears
    );
    guaranteedBenefits.guaranteedAdditionAtMaturity = gaAtEndOfPpt;
    maturityBenefit = basicSumAssured + gaAtEndOfPpt;

    const deathBenefit = Math.max(
      basicSumAssured,
      PLAN_770_RULES.deathBenefit.annualizedPremiumMultiple * premiumLookup.premium
    );
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

  guaranteedBenefits.sumAssuredOnDeathMinimum = basicSumAssured;

  return {
    available: true,
    guaranteedBenefits,
    nonGuaranteedIllustrations: undefined,
    deathBenefit: undefined,
    maturityBenefit,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}
