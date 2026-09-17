// Verified rule implementation for LIC's Jeevan Tarun (Plan 734, UIN
// 512N299V03). A Par child plan — like plan733.ts/plan736.ts, its
// maturity benefit is guaranteed BSA plus an undisclosed participating
// bonus (never fabricated), but its Premium Paying Term and Policy Term
// are not chosen by the customer at all: both are DERIVED from entry age
// (PPT = 20 - age, Policy Term = 25 - age), and the customer instead
// chooses one of 4 Survival Benefit Options.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): Lic_Jeevan_Tarun_2024 Sales Brochure (UIN 512N299V03) — the
// ONLY source for every rule below. See docs/lic-plan734-verification.md.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { isValidSumAssuredIncrement } from "./shared";

export const PLAN_734_UIN = "512N299V03";

const SOURCE_VERSION = "LIC's Jeevan Tarun Sales Brochure, UIN 512N299V03";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

export type Plan734SurvivalBenefitOption = "1" | "2" | "3" | "4";

// ---- Phase 1: verified rules (brochure §1, page 2; §2, pages 2-4) ----
export const PLAN_734_RULES = {
  minEntryAge: 0, // "30 days (completed)"
  maxEntryAge: 12, // "12 years (last birthday)"
  fixedMaturityAge: 25, // Min = Max = "25 years (last birthday)"
  // Premium Paying Term = [20 - Age at entry] years; Policy Term = [25 -
  // Age at entry] years — both derived, never chosen independently.
  premiumPayingTermBaseAge: 20,
  policyTermBaseAge: 25,
  minBasicSumAssured: 200000,
  sumAssuredBands: [
    { maxInclusive: 450000, multiple: 5000 },
    { maxInclusive: 900000, multiple: 50000 },
    { maxInclusive: null, multiple: 100000 },
  ],
  // Death Benefit (§2.A, page 3): higher of 7x annualised premium or 125%
  // of Basic Sum Assured. Unlike the premium-dependent side, the 125%-BSA
  // side needs no premium at all, so it is always a computable guaranteed
  // floor — never "unavailable" purely for lack of a premium match.
  deathBenefit: { basicSumAssuredMultiple: 1.25, annualizedPremiumMultiple: 7 },
  // Survival Benefit (§2.B, page 3) — a fixed % of BSA payable on each of
  // 5 policy anniversaries (ages 20-24), chosen once at the proposal
  // stage and never altered later.
  survivalBenefitAnnualPercentByOption: { "1": 0, "2": 5, "3": 10, "4": 15 } as const,
  survivalBenefitAges: [20, 21, 22, 23, 24] as const,
  // Maturity Benefit (§2.C, page 4) — the complement of the survival
  // benefits already paid; the two together always total 100% of BSA.
  maturityBenefitPercentByOption: { "1": 100, "2": 75, "3": 50, "4": 25 } as const,
  // Sample Illustrative Premium (§6, page 7): exact published annual
  // premiums for Basic Sum Assured Rs.2,00,000, indexed by age only
  // (Premium Paying Term/Policy Term are implied by age).
  sampleIllustrativePremium: {
    basicSumAssured: 200000,
    rows: [
      { age: 0, option1: 9114, option2: 9310, option3: 9516, option4: 9722 },
      { age: 4, option1: 11505, option2: 11809, option3: 12113, option4: 12407 },
      { age: 8, option1: 15464, option2: 15925, option3: 16386, option4: 16846 },
      { age: 12, option1: 22854, option2: 23628, option3: 24392, option4: 25166 },
    ],
  },
  riders: [{ name: "LIC's Premium Waiver Benefit Rider", uin: "512B204V04" }],
} as const;

type Plan734Input = LicCalculatorInput & { product: InsuranceProduct };

export function derivedPremiumPayingTermYears(age: number): number {
  return PLAN_734_RULES.premiumPayingTermBaseAge - age;
}

export function derivedPolicyTermYears(age: number): number {
  return PLAN_734_RULES.policyTermBaseAge - age;
}

function readOption(input: Plan734Input): Plan734SurvivalBenefitOption | undefined {
  const option = input.productSpecificInputs?.survivalBenefitOption;
  return option === "1" || option === "2" || option === "3" || option === "4" ? option : undefined;
}

// ---- Phase 2: eligibility engine ----
// Premium Paying Term and Policy Term are entirely derived from age, so
// this engine never reads input.policyTermYears/premiumPaymentTermYears —
// there is nothing for a customer to choose there.
export function evaluateEligibility(input: Plan734Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_734_RULES.minEntryAge || input.age > PLAN_734_RULES.maxEntryAge) {
    eligible = false;
    reasons.push(
      `Age ${input.age} is outside the eligible entry range of ${PLAN_734_RULES.minEntryAge}-${PLAN_734_RULES.maxEntryAge}.`
    );
    reasonCodes.push({
      code: "age_out_of_range",
      params: { min: PLAN_734_RULES.minEntryAge, max: PLAN_734_RULES.maxEntryAge, actual: input.age },
    });
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_734_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_734_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_734_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (!isValidSumAssuredIncrement(input.sumAssured, [...PLAN_734_RULES.sumAssuredBands])) {
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
// The brochure publishes exact premiums for exactly 4 ages (BSA
// Rs.2,00,000), split by chosen Survival Benefit Option. Only an exact
// match is ever returned — Policy Term/PPT are implied by age, so no
// separate term match is needed.
export function calculatePremium(input: Plan734Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  const option = readOption(input);
  if (option == null) missingInputs.push("productSpecificInputs.survivalBenefitOption");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_734_RULES.sampleIllustrativePremium;
  if (input.sumAssured !== sample.basicSumAssured) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const row = sample.rows.find((r) => r.age === input.age);
  if (!row) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const premium =
    option === "1" ? row.option1 : option === "2" ? row.option2 : option === "3" ? row.option3 : row.option4;

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
export function calculateBenefits(input: Plan734Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = {};

  const option = readOption(input);
  if (option != null) {
    const survivalPercent = PLAN_734_RULES.survivalBenefitAnnualPercentByOption[option];
    const maturityPercent = PLAN_734_RULES.maturityBenefitPercentByOption[option];
    if (survivalPercent > 0) {
      guaranteedBenefits.survivalBenefitPerInstallment = Math.round(
        (survivalPercent / 100) * basicSumAssured
      );
    }
    guaranteedBenefits.maturitySumAssured = Math.round((maturityPercent / 100) * basicSumAssured);
  }

  // Death Benefit: 125% of BSA needs no premium at all, so it is always a
  // computable guaranteed floor; the 7x-premium side only ever raises it
  // when an exact premium is verified.
  const guaranteedFloor = Math.round(PLAN_734_RULES.deathBenefit.basicSumAssuredMultiple * basicSumAssured);
  let deathBenefit = guaranteedFloor;
  const premiumLookup = calculatePremium(input);
  if (premiumLookup.available && premiumLookup.premium != null) {
    deathBenefit = Math.max(
      guaranteedFloor,
      PLAN_734_RULES.deathBenefit.annualizedPremiumMultiple * premiumLookup.premium
    );
  }
  guaranteedBenefits.sumAssuredOnDeath = deathBenefit;

  return {
    available: true,
    guaranteedBenefits,
    // Par product — Simple Reversionary Bonus/Final Additional Bonus are
    // participating and undisclosed; never fabricated here.
    nonGuaranteedIllustrations: undefined,
    deathBenefit,
    maturityBenefit: guaranteedBenefits.maturitySumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}
