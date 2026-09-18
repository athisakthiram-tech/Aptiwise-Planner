// Shared computation engine for LIC's decreasing Credit Life term plans
// (Yuva Credit Life/877, Digi Credit Life/878). Both plans reduce the Sum
// Assured on Death every policy year, following a "Risk Cover Schedule"
// the Policyholder chooses one of 7 published interest rates for
// (6/7/8/9/10/11/12%), computed "on an equated yearly repayment basis" —
// i.e. a standard loan amortisation schedule.
//
// This is a well-defined, universally standard financial formula (not an
// LIC-specific undisclosed rate): the outstanding balance of a loan of
// principal P over N years at rate r, after k years of equal annual
// repayments, is P x [(1+r)^N - (1+r)^k] / [(1+r)^N - 1]. Both brochures
// publish exactly one full worked Risk Cover Schedule (BSA normalised to
// 1,000, interest rate 8%, Policy Term 25 years) as a cross-check; this
// engine's closed-form computation reproduces that published schedule
// EXACTLY (see tests/lic-plan877.test.ts) before being trusted for any
// other (rate, term) combination the customer might choose from the same
// published, discrete rate list.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { SumAssuredBand, isValidSumAssuredIncrement } from "./shared";

export const CREDIT_LIFE_INTEREST_RATES = [6, 7, 8, 9, 10, 11, 12] as const;
export type CreditLifeInterestRate = (typeof CREDIT_LIFE_INTEREST_RATES)[number];

export interface CreditLifeSamplePremiumRow {
  age: number;
  policyTermYears: number;
  single: number;
  limitedByPpt: Record<number, number>;
}

export interface CreditLifeRules {
  minEntryAge: number;
  maxEntryAge: number;
  minMaturityAge: number;
  maxMaturityAge: number;
  minPolicyTermYears: number;
  maxPolicyTermYears: number;
  limitedPptOptionsForTerm(policyTermYears: number): number[];
  minBasicSumAssured: number;
  sumAssuredBands: SumAssuredBand[];
  // Sample Illustrative Premium published for a single interest rate
  // (the rate the sample itself was computed at) — an exact lookup only,
  // never re-derived for a different rate.
  sampleIllustrativePremium: {
    basicSumAssured: number;
    interestRate: CreditLifeInterestRate;
    rows: readonly CreditLifeSamplePremiumRow[];
  };
}

type CreditLifeInput = LicCalculatorInput;

function readInterestRate(input: CreditLifeInput): CreditLifeInterestRate | undefined {
  const rate = input.productSpecificInputs?.interestRate;
  return typeof rate === "number" && (CREDIT_LIFE_INTEREST_RATES as readonly number[]).includes(rate)
    ? (rate as CreditLifeInterestRate)
    : undefined;
}

// Outstanding-balance ratio (of original principal) at the START of
// policy year `policyYear` (1-indexed; policy year 1 = 100%, i.e. before
// any repayment), for an N-year loan at annual rate `ratePercent`.
export function outstandingBalanceRatio(
  ratePercent: number,
  policyTermYears: number,
  policyYear: number
): number {
  const r = ratePercent / 100;
  const growthN = Math.pow(1 + r, policyTermYears);
  const growthK = Math.pow(1 + r, policyYear - 1);
  return (growthN - growthK) / (growthN - 1);
}

export function sumAssuredOnDeathAtPolicyYear(
  basicSumAssured: number,
  ratePercent: number,
  policyTermYears: number,
  policyYear: number
): number {
  return Math.round(basicSumAssured * outstandingBalanceRatio(ratePercent, policyTermYears, policyYear) * 100) / 100;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(rules: CreditLifeRules, input: CreditLifeInput): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;
  const disclaimer = "Product-level eligibility does not constitute LIC underwriting approval.";

  if (input.age < rules.minEntryAge || input.age > rules.maxEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is outside the eligible entry range of ${rules.minEntryAge}-${rules.maxEntryAge}.`);
    reasonCodes.push({
      code: "age_out_of_range",
      params: { min: rules.minEntryAge, max: rules.maxEntryAge, actual: input.age },
    });
  }

  const isSingle = input.premiumFrequency === "single";

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else {
    if (input.policyTermYears < rules.minPolicyTermYears || input.policyTermYears > rules.maxPolicyTermYears) {
      eligible = false;
      reasons.push(
        `Policy term ${input.policyTermYears} years is outside the allowed range of ${rules.minPolicyTermYears}-${rules.maxPolicyTermYears} years.`
      );
      reasonCodes.push({
        code: "term_out_of_range",
        params: { min: rules.minPolicyTermYears, max: rules.maxPolicyTermYears, actual: input.policyTermYears },
      });
    }

    if (!isSingle) {
      const validPpts = rules.limitedPptOptionsForTerm(input.policyTermYears);
      if (input.premiumPaymentTermYears == null || !validPpts.includes(input.premiumPaymentTermYears)) {
        eligible = false;
        reasons.push("This Premium Paying Term is not offered for the chosen Policy Term.");
        reasonCodes.push({
          code: "invalid_premium_paying_term",
          params: { actual: input.premiumPaymentTermYears ?? -1 },
        });
      }
    }

    const maturityAge = input.age + input.policyTermYears;
    if (maturityAge > rules.maxMaturityAge) {
      eligible = false;
      reasons.push(`Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${rules.maxMaturityAge}.`);
      reasonCodes.push({ code: "maturity_age_too_high", params: { max: rules.maxMaturityAge, actual: maturityAge } });
    } else if (maturityAge < rules.minMaturityAge) {
      eligible = false;
      reasons.push(`Age at maturity (${maturityAge}) would be below the minimum maturity age of ${rules.minMaturityAge}.`);
      reasonCodes.push({ code: "maturity_age_too_low", params: { min: rules.minMaturityAge, actual: maturityAge } });
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < rules.minBasicSumAssured) {
    eligible = false;
    reasons.push(`Basic Sum Assured of ${input.sumAssured} is below the minimum of ${rules.minBasicSumAssured}.`);
    reasonCodes.push({ code: "sum_assured_below_min", params: { min: rules.minBasicSumAssured, actual: input.sumAssured } });
  } else if (!isValidSumAssuredIncrement(input.sumAssured, [...rules.sumAssuredBands])) {
    eligible = false;
    reasons.push("Basic Sum Assured is not a valid increment for its range.");
    reasonCodes.push({ code: "sum_assured_invalid_increment" });
  }

  if (readInterestRate(input) == null) {
    missingInputs.push("productSpecificInputs.interestRate");
  }

  if (eligible === true && missingInputs.length > 0) {
    eligible = null;
  }

  reasons.push(disclaimer);
  return { eligible, reasons, reasonCodes, missingInputs };
}

// ---- Phase 4: premium engine safety ----
// The brochure publishes exact premiums only at the ONE interest rate its
// own sample is computed at; a different chosen rate has no published
// premium and is reported unavailable, never re-derived.
export function calculatePremium(
  rules: CreditLifeRules,
  input: CreditLifeInput,
  sourceVersion: string
): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  const interestRate = readInterestRate(input);
  if (interestRate == null) missingInputs.push("productSpecificInputs.interestRate");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = rules.sampleIllustrativePremium;
  if (interestRate !== sample.interestRate || input.sumAssured !== sample.basicSumAssured) {
    return { available: false, missingInputs: ["Exact premium calculation requires verified LIC premium rate data."] };
  }

  const row = sample.rows.find((r) => r.age === input.age && r.policyTermYears === input.policyTermYears);
  if (!row) {
    return { available: false, missingInputs: ["Exact premium calculation requires verified LIC premium rate data."] };
  }

  const isSingle = input.premiumFrequency === "single";
  if (isSingle) {
    return { available: true, premium: row.single, premiumFrequency: "single", sumAssured: input.sumAssured, missingInputs: [], sourceVersion };
  }
  const limitedPremium =
    input.premiumPaymentTermYears != null ? row.limitedByPpt[input.premiumPaymentTermYears] : undefined;
  if (limitedPremium == null) {
    return { available: false, missingInputs: ["Exact premium calculation requires verified LIC premium rate data."] };
  }
  return { available: true, premium: limitedPremium, premiumFrequency: "yearly", sumAssured: input.sumAssured, missingInputs: [], sourceVersion };
}

// ---- Phase 3: benefit engine ----
// No maturity benefit is ever payable. Sum Assured on Death always equals
// Basic Sum Assured "at the inception" of the policy (policy year 1) —
// this needs no interest-rate choice at all. When an interest rate is
// also chosen, the fully-declining Risk Cover Schedule value at the end
// of the Policy Term (its lowest point) is additionally reported, using
// the verified closed-form amortisation formula.
export function calculateBenefits(
  rules: CreditLifeRules,
  input: CreditLifeInput,
  sourceVersion: string
): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = { sumAssuredOnDeathAtInception: basicSumAssured };

  const interestRate = readInterestRate(input);
  if (interestRate != null && input.policyTermYears != null) {
    guaranteedBenefits.sumAssuredOnDeathAtFinalPolicyYear = sumAssuredOnDeathAtPolicyYear(
      basicSumAssured,
      interestRate,
      input.policyTermYears,
      input.policyTermYears
    );
  }

  return {
    available: true,
    guaranteedBenefits,
    nonGuaranteedIllustrations: undefined,
    deathBenefit: basicSumAssured,
    maturityBenefit: undefined, // pure risk plan — no maturity benefit is ever payable
    missingInputs: [],
    sourceVersion,
  };
}
