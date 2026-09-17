// Verified rule implementation for LIC's New Jeevan Sathi - Limited
// Premium (Plan 889, UIN 512N394V01). A Non-Par JOINT LIFE plan covering
// a married individual and spouse in one policy, with a fully guaranteed,
// premium-based Guaranteed Addition (accruing for the full Policy Term,
// like plan881.ts) and 3 death-benefit tiers (first death / second death
// / simultaneous death).
//
// This engine models both lives as the SAME age, because the generic
// LicCalculationContext this codebase shares across every LIC product
// carries only a single `age` field — exactly the same simplification the
// brochure's own sample premium tables and Benefit Illustrations use
// ("for standard lives considering the same age for both lives"). This is
// a documented modelling limitation, not an invented data value.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC's New Jeevan Sathi - Limited Premium Sales Brochure
// (14-April-2026) — the ONLY source for every rule below. See
// docs/lic-plan889-verification.md.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { accrueGuaranteedAdditionOnPremium, isValidSumAssuredIncrement } from "./shared";

export const PLAN_889_UIN = "512N394V01";

const SOURCE_VERSION = "LIC's New Jeevan Sathi - Limited Premium Sales Brochure, UIN 512N394V01";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval. Both lives are assumed to be the same age.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

export type Plan889DeathBenefitOption = "I" | "II";

// Valid (PremiumPayingTerm, PolicyTerm) combinations and their max entry
// age by chosen Death Benefit Option (brochure §2, page 3).
const VALID_PPT_TERM_COMBOS: {
  ppt: number;
  term: number;
  maxEntryAgeOptionI: number;
  maxEntryAgeOptionII: number;
}[] = [
  { ppt: 5, term: 10, maxEntryAgeOptionI: 45, maxEntryAgeOptionII: 40 },
  { ppt: 5, term: 15, maxEntryAgeOptionI: 45, maxEntryAgeOptionII: 40 },
  { ppt: 5, term: 20, maxEntryAgeOptionI: 45, maxEntryAgeOptionII: 35 },
  { ppt: 10, term: 15, maxEntryAgeOptionI: 50, maxEntryAgeOptionII: 40 },
  { ppt: 10, term: 20, maxEntryAgeOptionI: 50, maxEntryAgeOptionII: 35 },
  { ppt: 10, term: 25, maxEntryAgeOptionI: 50, maxEntryAgeOptionII: 35 },
  { ppt: 15, term: 20, maxEntryAgeOptionI: 50, maxEntryAgeOptionII: 40 },
  { ppt: 15, term: 25, maxEntryAgeOptionI: 50, maxEntryAgeOptionII: 35 },
];

// Incentive for High Basic Sum Assured (§9.a) — deterministic from BSA +
// Policy Term alone, so (unlike the online-sale/existing-policyholder
// incentives, which need unverifiable business-relationship context) it
// is safe to add to the base Guaranteed Addition rate. Columns are Policy
// Term 10/15/20/25 (cross-checked exactly against the brochure's own two
// Benefit Illustrations — see docs/lic-plan889-verification.md). The
// brochure publishes these as PERCENTAGES (e.g. "0.80%"); values here are
// already converted to per-thousand (x10) so they add directly to
// guaranteedAdditionBaseRatePerThousand below without a unit mismatch.
// Bands are named "X to less than Y" in the brochure, so the upper bound
// of each band is EXCLUSIVE — a BSA of exactly Y belongs to the next
// band, never this one.
const HIGH_BSA_INCENTIVE_BANDS: { maxExclusive: number | null; ratesByTerm: Record<number, number> }[] = [
  { maxExclusive: 500000, ratesByTerm: { 10: 0, 15: 0, 20: 0, 25: 0 } },
  { maxExclusive: 1000000, ratesByTerm: { 10: 1.5, 15: 1.5, 20: 2.0, 25: 4.0 } },
  { maxExclusive: 1500000, ratesByTerm: { 10: 3.0, 15: 3.0, 20: 4.5, 25: 8.0 } },
  { maxExclusive: null, ratesByTerm: { 10: 3.5, 15: 3.5, 20: 5.5, 25: 10.0 } },
];

// ---- Phase 1: verified rules (brochure §2, page 3; §3-4, pages 4-6) ----
export const PLAN_889_RULES = {
  minEntryAge: 18, // "18 years (completed) under both Options I & II"
  minMaturityAge: 28,
  maxMaturityAgeByOption: { I: 75, II: 60 } as const,
  validPptTermCombos: VALID_PPT_TERM_COMBOS,
  minBasicSumAssured: 300000,
  sumAssuredMultiple: 10000,
  // Sum Assured on Death options (§3.A, page 4) — chosen once at
  // inception and never altered.
  deathBenefitOptions: { I: { multiple: 7 }, II: { multiple: 10.5 } } as const,
  // Guaranteed Addition (§4, page 6): a fixed, GUARANTEED base rate,
  // accruing for the full Policy Term (continuing to accrue even after
  // the Premium Paying Term ends, on the premium already paid) — this is
  // a Non-Par product ("guaranteed and fixed irrespective of actual
  // experience").
  guaranteedAdditionBaseRatePerThousand: 70,
  // Sample Illustrative Premium (§19, page 22): exact published annual
  // premiums for BSA Rs.3,00,000, by age and the 3 sampled (PPT, Term)
  // combinations, split by chosen Option.
  sampleIllustrativePremium: {
    basicSumAssured: 300000,
    optionI: {
      rows: [
        { age: 20, ppt: 5, term: 15, premium: 68505 },
        { age: 20, ppt: 10, term: 20, premium: 33045 },
        { age: 20, ppt: 15, term: 25, premium: 20715 },
        { age: 35, ppt: 5, term: 15, premium: 75705 },
        { age: 35, ppt: 10, term: 20, premium: 37035 },
        { age: 35, ppt: 15, term: 25, premium: 25095 },
        { age: 45, ppt: 5, term: 15, premium: 112470 },
        { age: 45, ppt: 10, term: 20, premium: 50265 },
        { age: 45, ppt: 15, term: 25, premium: 35055 },
      ],
    },
    optionII: {
      rows: [
        { age: 20, ppt: 5, term: 15, premium: 71670 },
        { age: 20, ppt: 10, term: 20, premium: 33510 },
        { age: 20, ppt: 15, term: 25, premium: 20715 },
        { age: 25, ppt: 5, term: 15, premium: 72825 },
        { age: 25, ppt: 10, term: 20, premium: 34140 },
        { age: 25, ppt: 15, term: 25, premium: 21330 },
        { age: 35, ppt: 5, term: 15, premium: 84135 },
        { age: 35, ppt: 10, term: 20, premium: 39525 },
        { age: 35, ppt: 15, term: 25, premium: 25095 },
      ],
    },
  },
  riders: [
    { name: "LIC's Accident Benefit Rider", uin: "512B203V03" },
    { name: "LIC's New Term Assurance Rider", uin: "512B210V02" },
    { name: "LIC's Critical Illness Health Rider", uin: "512B227V01" },
  ],
} as const;

type Plan889Input = LicCalculatorInput & { product: InsuranceProduct };

function readOption(input: Plan889Input): Plan889DeathBenefitOption | undefined {
  const option = input.productSpecificInputs?.deathBenefitOption;
  return option === "I" || option === "II" ? option : undefined;
}

function findCombo(ppt: number, term: number) {
  return VALID_PPT_TERM_COMBOS.find((c) => c.ppt === ppt && c.term === term);
}

function highBsaIncentiveRatePerThousand(basicSumAssured: number, policyTermYears: number): number {
  const band =
    HIGH_BSA_INCENTIVE_BANDS.find((b) => b.maxExclusive != null && basicSumAssured < b.maxExclusive) ??
    HIGH_BSA_INCENTIVE_BANDS[HIGH_BSA_INCENTIVE_BANDS.length - 1];
  return band.ratesByTerm[policyTermYears] ?? 0;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan889Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_889_RULES.minEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is below the minimum entry age of ${PLAN_889_RULES.minEntryAge}.`);
    reasonCodes.push({ code: "age_below_min", params: { min: PLAN_889_RULES.minEntryAge, actual: input.age } });
  }

  const option = readOption(input);

  if (input.premiumPaymentTermYears == null) {
    missingInputs.push("premiumPaymentTermYears");
  }
  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  }

  if (input.premiumPaymentTermYears != null && input.policyTermYears != null) {
    const combo = findCombo(input.premiumPaymentTermYears, input.policyTermYears);
    if (!combo) {
      eligible = false;
      reasons.push(
        `A ${input.premiumPaymentTermYears}-year Premium Paying Term with a ${input.policyTermYears}-year Policy Term is not offered.`
      );
      reasonCodes.push({ code: "term_out_of_range", params: { actual: input.policyTermYears } });
    } else if (option != null) {
      const maxEntryAge = option === "I" ? combo.maxEntryAgeOptionI : combo.maxEntryAgeOptionII;
      if (input.age > maxEntryAge) {
        eligible = false;
        reasons.push(
          `Age ${input.age} is above the maximum entry age of ${maxEntryAge} for this Premium Paying Term/Policy Term/Option combination.`
        );
        reasonCodes.push({
          code: "age_above_max_for_ppt",
          params: { max: maxEntryAge, actual: input.age, ppt: input.premiumPaymentTermYears },
        });
      }

      const maturityAge = input.age + input.policyTermYears;
      const maxMaturityAge = PLAN_889_RULES.maxMaturityAgeByOption[option];
      if (maturityAge > maxMaturityAge) {
        eligible = false;
        reasons.push(
          `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${maxMaturityAge} for Option ${option}.`
        );
        reasonCodes.push({
          code: "maturity_age_too_high",
          params: { max: maxMaturityAge, actual: maturityAge },
        });
      } else if (maturityAge < PLAN_889_RULES.minMaturityAge) {
        eligible = false;
        reasons.push(
          `Age at maturity (${maturityAge}) would be below the minimum maturity age of ${PLAN_889_RULES.minMaturityAge}.`
        );
        reasonCodes.push({
          code: "maturity_age_too_low",
          params: { min: PLAN_889_RULES.minMaturityAge, actual: maturityAge },
        });
      }
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_889_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_889_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_889_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (
    !isValidSumAssuredIncrement(input.sumAssured, [
      { maxInclusive: null, multiple: PLAN_889_RULES.sumAssuredMultiple },
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
// The brochure publishes exact premiums for BSA Rs.3,00,000, 3 ages x 3
// sampled (PPT, Term) combinations, split by chosen Option. Only an exact
// match is ever returned.
export function calculatePremium(input: Plan889Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.premiumPaymentTermYears == null) missingInputs.push("premiumPaymentTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  const option = readOption(input);
  if (option == null) missingInputs.push("productSpecificInputs.deathBenefitOption");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_889_RULES.sampleIllustrativePremium;
  if (input.sumAssured !== sample.basicSumAssured) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const rows = option === "I" ? sample.optionI.rows : sample.optionII.rows;
  const row = rows.find(
    (r) => r.age === input.age && r.ppt === input.premiumPaymentTermYears && r.term === input.policyTermYears
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
// Family protection is genuinely 3-tiered for a joint-life plan
// (first death / second death / simultaneous death). `deathBenefit`
// reports the first-death figure as the headline value; the other tiers
// are reported via `guaranteedBenefits` since BenefitCalculationResult
// only carries one numeric `deathBenefit` field.
export function calculateBenefits(input: Plan889Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = { maturitySumAssured: basicSumAssured };
  let maturityBenefit = basicSumAssured;

  const premiumLookup = calculatePremium(input);
  if (
    input.policyTermYears != null &&
    input.premiumPaymentTermYears != null &&
    premiumLookup.available &&
    premiumLookup.premium != null
  ) {
    const rate =
      PLAN_889_RULES.guaranteedAdditionBaseRatePerThousand +
      highBsaIncentiveRatePerThousand(basicSumAssured, input.policyTermYears);
    const gaAtMaturity = accrueGuaranteedAdditionOnPremium(
      premiumLookup.premium,
      rate,
      input.policyTermYears,
      input.premiumPaymentTermYears
    );
    guaranteedBenefits.guaranteedAdditionAtMaturity = gaAtMaturity;
    maturityBenefit = basicSumAssured + gaAtMaturity;
  }

  // `sumAssuredOnDeath` drives the returned `deathBenefit` and stays
  // undefined unless an exact premium is verified — Basic Sum Assured
  // here is only ONE side of a "higher of BSA or a multiple of premium"
  // comparison, not a scaled, always-guaranteed figure, so (matching the
  // convention used by plan774.ts/plan912.ts) it is never reported as if
  // verified. The second/simultaneous-death minimums below still use the
  // BSA floor, since a "not less than" statement is always true.
  let sumAssuredOnDeath: number | undefined;
  const option = readOption(input);
  if (option != null) {
    if (premiumLookup.available && premiumLookup.premium != null) {
      sumAssuredOnDeath = Math.max(
        basicSumAssured,
        PLAN_889_RULES.deathBenefitOptions[option].multiple * premiumLookup.premium
      );
      // First death: Sum Assured on Death only, policy continues for the
      // survivor (future premiums waived).
      guaranteedBenefits.sumAssuredOnDeath = sumAssuredOnDeath;
    } else {
      guaranteedBenefits.sumAssuredOnDeathMinimum = basicSumAssured;
    }
    const firstDeathFloor = sumAssuredOnDeath ?? basicSumAssured;
    // Second death: Sum Assured on Death plus accrued Guaranteed
    // Additions at that point — since the timing of the second death
    // (and thus how much Guaranteed Addition has accrued) is unknown in
    // advance, only the guaranteed minimum (before any Guaranteed
    // Addition) is reported here.
    guaranteedBenefits.sumAssuredOnSecondDeathMinimum = firstDeathFloor;
    // Simultaneous death: sum of the first-death and second-death
    // benefits above.
    guaranteedBenefits.sumAssuredOnSimultaneousDeathMinimum = firstDeathFloor * 2;
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
