// Verified rule implementation for LIC's New Jeevan Sathi - Single
// Premium (Plan 888, UIN 512N393V01). A Non-Par JOINT LIFE plan (like
// plan889.ts) covering a married individual and spouse in one policy,
// but as a Single Premium plan: its Guaranteed Addition is BSA-based
// (like plan774.ts), not premium-based, and its Sum-Assured-on-Death
// formula uses a PRE-REBATE "Tabular Single Premium" that this engine
// reconstructs exactly from the published High-Sum-Assured rebate table
// (never fabricated — see the rule audit in
// docs/lic-plan888-verification.md for the cross-check against both of
// the brochure's own Benefit Illustrations).
//
// This engine models both lives as the SAME age, for the same reason as
// plan889.ts: the shared LicCalculationContext this codebase uses for
// every LIC product carries only a single `age` field, matching the
// brochure's own Sample Illustrative Premium tables and Benefit
// Illustrations ("for standard lives considering the same age for both
// lives").
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_New_Jeevan_Sathi_Single_Premium_Sales_Brochure.pdf —
// the ONLY source for every rule below.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { isValidSumAssuredIncrement } from "./shared";

export const PLAN_888_UIN = "512N393V01";

const SOURCE_VERSION = "LIC's New Jeevan Sathi - Single Premium Sales Brochure, UIN 512N393V01";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval. Both lives are assumed to be the same age.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

export type Plan888DeathBenefitOption = "I" | "II";

// High Sum Assured Rebate on premium (§6.a) — a REDUCTION applied to the
// Tabular Single Premium to arrive at the quoted (actual) premium. Given
// only the actual premium, this engine reconstructs the Tabular Single
// Premium by adding this rebate back — needed because the Sum-Assured-
// on-Death formula (§3.A) is defined on the Tabular premium, not the
// quoted one. Cross-checked exactly against both of the brochure's own
// Benefit Illustrations (Option I: rebate 29/1000 at BSA Rs.10L/term 20
// reconciles the illustration's SAD of 10,52,188 exactly; Option II:
// rebate 26/1000 at BSA Rs.10L/term 15 reconciles 1,78,82,500 exactly)
// — see docs/lic-plan888-verification.md. Bands are named "X to less
// than Y", so the upper bound of each band is EXCLUSIVE.
const HIGH_BSA_REBATE_BANDS: { maxExclusive: number | null; rateByTerm: Record<number, number> }[] = [
  { maxExclusive: 500000, rateByTerm: { 10: 0, 15: 0, 20: 0, 25: 0 } },
  { maxExclusive: 1000000, rateByTerm: { 10: 11, 15: 13, 20: 15, 25: 16 } },
  { maxExclusive: 1500000, rateByTerm: { 10: 21, 15: 26, 20: 29, 25: 32 } },
  { maxExclusive: null, rateByTerm: { 10: 25, 15: 30, 20: 33, 25: 35 } },
];

// ---- Phase 1: verified rules (brochure §2, page 3; §3-4, pages 4-5) ----
export const PLAN_888_RULES = {
  minEntryAge: 18, // "18 years (completed) for both lives"
  maxEntryAgeByOption: { I: 60, II: 35 } as const,
  minMaturityAge: 28,
  maxMaturityAgeByOption: { I: 75, II: 50 } as const,
  policyTermOptionsByOption: { I: [10, 15, 20, 25], II: [10, 15] } as const,
  minBasicSumAssured: 300000,
  sumAssuredMultiple: 25000,
  // Sum Assured on Death options (§3.A, page 4) — chosen once at
  // inception and never altered. Option I has a Basic-Sum-Assured floor;
  // Option II is a flat multiple with NO floor stated in the brochure —
  // never assumed.
  deathBenefitOptions: {
    I: { multiple: 1.25, hasBsaFloor: true },
    II: { multiple: 10, hasBsaFloor: false },
  } as const,
  // Guaranteed Addition (§4, page 5): a fixed, GUARANTEED rate per
  // Rs.1,000 Basic Sum Assured — computable from BSA + term alone, with
  // no premium dependency (like plan774.ts). Cross-checked exactly
  // against both Benefit Illustrations (BSA Rs.10,00,000 -> Rs.70,000/
  // year accrual).
  guaranteedAddition: { ratePerThousandBasicSumAssuredPerYear: 70 },
  highBsaRebateBands: HIGH_BSA_REBATE_BANDS,
  // Sample Illustrative Premium (§14, page 14): exact published Single
  // Premiums for BSA Rs.3,00,000, split by chosen Option.
  sampleIllustrativePremium: {
    basicSumAssured: 300000,
    optionI: {
      rows: [
        { age: 20, policyTermYears: 10, premium: 297195 },
        { age: 20, policyTermYears: 15, premium: 269940 },
        { age: 20, policyTermYears: 20, premium: 238635 },
        { age: 20, policyTermYears: 25, premium: 208740 },
        { age: 35, policyTermYears: 10, premium: 302340 },
        { age: 35, policyTermYears: 15, premium: 279180 },
        { age: 35, policyTermYears: 20, premium: 252525 },
        { age: 35, policyTermYears: 25, premium: 227115 },
        { age: 50, policyTermYears: 10, premium: 346560 },
        { age: 50, policyTermYears: 15, premium: 345495 },
        { age: 50, policyTermYears: 20, premium: 336510 },
        { age: 50, policyTermYears: 25, premium: 323940 },
      ],
    },
    optionII: {
      rows: [
        { age: 20, policyTermYears: 10, premium: 356850 },
        { age: 20, policyTermYears: 15, premium: 348930 },
        { age: 25, policyTermYears: 10, premium: 361095 },
        { age: 25, policyTermYears: 15, premium: 362790 },
        { age: 35, policyTermYears: 10, premium: 427620 },
        { age: 35, policyTermYears: 15, premium: 536475 },
      ],
    },
  },
  riders: [
    { name: "LIC's Accidental Death and Disability Benefit Rider", uin: "512B209V02" },
    { name: "LIC's New Term Assurance Rider", uin: "512B210V02" },
  ],
} as const;

type Plan888Input = LicCalculatorInput & { product: InsuranceProduct };

function readOption(input: Plan888Input): Plan888DeathBenefitOption | undefined {
  const option = input.productSpecificInputs?.deathBenefitOption;
  return option === "I" || option === "II" ? option : undefined;
}

function highBsaRebatePerThousand(basicSumAssured: number, policyTermYears: number): number {
  const band =
    HIGH_BSA_REBATE_BANDS.find((b) => b.maxExclusive != null && basicSumAssured < b.maxExclusive) ??
    HIGH_BSA_REBATE_BANDS[HIGH_BSA_REBATE_BANDS.length - 1];
  return band.rateByTerm[policyTermYears] ?? 0;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan888Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_888_RULES.minEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is below the minimum entry age of ${PLAN_888_RULES.minEntryAge}.`);
    reasonCodes.push({ code: "age_below_min", params: { min: PLAN_888_RULES.minEntryAge, actual: input.age } });
  }

  const option = readOption(input);

  if (option == null) {
    missingInputs.push("productSpecificInputs.deathBenefitOption");
  } else {
    const maxEntryAge = PLAN_888_RULES.maxEntryAgeByOption[option];
    if (input.age > maxEntryAge) {
      eligible = false;
      reasons.push(`Age ${input.age} is above Option ${option}'s maximum entry age of ${maxEntryAge}.`);
      reasonCodes.push({
        code: "age_above_max_for_ppt",
        params: { max: maxEntryAge, actual: input.age, ppt: 0 },
      });
    }

    if (input.policyTermYears == null) {
      missingInputs.push("policyTermYears");
    } else {
      const validTerms = PLAN_888_RULES.policyTermOptionsByOption[option] as readonly number[];
      if (!validTerms.includes(input.policyTermYears)) {
        eligible = false;
        reasons.push(`Policy term ${input.policyTermYears} years is not offered under Option ${option}.`);
        reasonCodes.push({ code: "term_out_of_range", params: { actual: input.policyTermYears } });
      }

      const maturityAge = input.age + input.policyTermYears;
      const maxMaturityAge = PLAN_888_RULES.maxMaturityAgeByOption[option];
      if (maturityAge > maxMaturityAge) {
        eligible = false;
        reasons.push(
          `Age at maturity (${maturityAge}) would exceed Option ${option}'s maximum maturity age of ${maxMaturityAge}.`
        );
        reasonCodes.push({
          code: "maturity_age_too_high",
          params: { max: maxMaturityAge, actual: maturityAge },
        });
      } else if (maturityAge < PLAN_888_RULES.minMaturityAge) {
        eligible = false;
        reasons.push(
          `Age at maturity (${maturityAge}) would be below the minimum maturity age of ${PLAN_888_RULES.minMaturityAge}.`
        );
        reasonCodes.push({
          code: "maturity_age_too_low",
          params: { min: PLAN_888_RULES.minMaturityAge, actual: maturityAge },
        });
      }
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_888_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_888_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_888_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (
    !isValidSumAssuredIncrement(input.sumAssured, [
      { maxInclusive: null, multiple: PLAN_888_RULES.sumAssuredMultiple },
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
// The brochure publishes exact Single Premiums for BSA Rs.3,00,000, 3
// ages x up to 4 terms, split by Option. Only an exact match is ever
// returned.
export function calculatePremium(input: Plan888Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  const option = readOption(input);
  if (option == null) missingInputs.push("productSpecificInputs.deathBenefitOption");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_888_RULES.sampleIllustrativePremium;
  if (input.sumAssured !== sample.basicSumAssured) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const rows = option === "I" ? sample.optionI.rows : sample.optionII.rows;
  const row = rows.find((r) => r.age === input.age && r.policyTermYears === input.policyTermYears);
  if (!row) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  return {
    available: true,
    premium: row.premium,
    premiumFrequency: "single",
    sumAssured: input.sumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}

// ---- Phase 3: benefit engine ----
export function calculateBenefits(input: Plan888Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = { maturitySumAssured: basicSumAssured };
  let maturityBenefit = basicSumAssured;

  // Guaranteed Addition is BSA-based, no premium needed.
  if (input.policyTermYears != null) {
    const gaPerYear =
      (PLAN_888_RULES.guaranteedAddition.ratePerThousandBasicSumAssuredPerYear / 1000) * basicSumAssured;
    const gaAtMaturity = Math.round(gaPerYear * input.policyTermYears);
    guaranteedBenefits.guaranteedAdditionAtMaturity = gaAtMaturity;
    maturityBenefit = basicSumAssured + gaAtMaturity;
  }

  // `sumAssuredOnDeath` drives the returned `deathBenefit` and stays
  // undefined unless an exact premium is verified — Option I's Basic Sum
  // Assured is only ONE side of a "higher of BSA or a multiple of
  // premium" comparison, not a scaled, always-guaranteed figure, so
  // (matching the convention used by plan774.ts/plan912.ts) it is never
  // reported as if verified.
  let sumAssuredOnDeath: number | undefined;
  const option = readOption(input);
  if (option != null) {
    const optionRule = PLAN_888_RULES.deathBenefitOptions[option];
    const premiumLookup = calculatePremium(input);
    if (premiumLookup.available && premiumLookup.premium != null && input.policyTermYears != null) {
      // The Sum-Assured-on-Death formula uses the PRE-rebate "Tabular
      // Single Premium"; reconstruct it from the published rebate table.
      const rebatePerThousand = highBsaRebatePerThousand(basicSumAssured, input.policyTermYears);
      const tabularSinglePremium = premiumLookup.premium + (rebatePerThousand / 1000) * basicSumAssured;
      const multipleOfPremium = Math.round(optionRule.multiple * tabularSinglePremium);
      sumAssuredOnDeath = optionRule.hasBsaFloor
        ? Math.max(basicSumAssured, multipleOfPremium)
        : multipleOfPremium;
      guaranteedBenefits.sumAssuredOnDeath = sumAssuredOnDeath;
    } else if (optionRule.hasBsaFloor) {
      guaranteedBenefits.sumAssuredOnDeathMinimum = basicSumAssured;
    }
    // Option II has no BSA floor — with no verified premium there is
    // nothing guaranteed to report, so neither field is set.
    const firstDeathFloor = sumAssuredOnDeath ?? (optionRule.hasBsaFloor ? basicSumAssured : undefined);
    if (firstDeathFloor != null) {
      guaranteedBenefits.sumAssuredOnSecondDeathMinimum = firstDeathFloor;
      guaranteedBenefits.sumAssuredOnSimultaneousDeathMinimum = firstDeathFloor * 2;
    }
  }

  return {
    available: true,
    guaranteedBenefits,
    nonGuaranteedIllustrations: undefined,
    deathBenefit: sumAssuredOnDeath,
    maturityBenefit,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}
