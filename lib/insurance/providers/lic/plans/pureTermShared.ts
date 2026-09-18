// Shared computation engine for LIC's "pure risk" Level/Increasing Sum
// Assured term plans (Digi Term/876, Yuva Term/875, New Tech-Term/954).
// All three share the exact same rule SHAPE — Level (Option I) or
// Increasing (Option II) Sum Assured, Regular/Limited/Single premium
// modes, the same Death Benefit formula, no maturity benefit, no
// surrender value except Unexpired Risk Premium Value (recorded, not
// computed) — but each has its own eligibility bands, term-cap tables and
// premium/rebate figures, so this module takes all of that as data
// (`PureTermRules`) rather than hard-coding one product's numbers. Each
// plan file (plan876.ts/plan875.ts/plan954.ts) is a thin data file that
// calls into this shared engine, mirroring the shared.ts helper pattern
// already used by the endowment plans.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { SumAssuredBand, isValidSumAssuredIncrement } from "./shared";

export type TermDeathBenefitOption = "I" | "II"; // Level / Increasing Sum Assured
export type TermPremiumMode = "regular" | "limited" | "single";

// A band of (age range x BSA-below-this-exclusive-bound) -> max Policy
// Term, used only for Option II (Increasing Sum Assured) — Option I's max
// term is always `levelMaxPolicyTermYears` (subject to max maturity age).
export interface TermCapBand {
  minAge: number;
  maxAge: number;
  bsaMaxExclusive: number | null;
  maxPolicyTermYears: number;
}

export interface PureTermSamplePremiumRow {
  age: number;
  policyTermYears: number;
  regular: number;
  // Brochures publish TWO Limited Premium columns (a 10-year and a
  // 15-year Premium Paying Term), not one — both are exact lookups.
  limitedByPpt: Record<number, number>;
  single: number;
}

export interface PureTermRules {
  minEntryAge: number;
  maxEntryAge: number;
  minMaturityAge?: number;
  maxMaturityAge: number;
  minPolicyTermYears: number;
  // A given Policy Term may only support certain Limited Premium Paying
  // Terms (e.g. Digi Term's fixed 10/15-year options, or New Tech-Term's
  // Term-5/Term-10 offsets) — expressed as a function so both shapes fit.
  limitedPptOptionsForTerm(policyTermYears: number): number[];
  minBasicSumAssured: number;
  sumAssuredBands: SumAssuredBand[];
  levelMaxPolicyTermYears: number;
  increasingMaxTermBandsRegularLimited: TermCapBand[];
  increasingMaxTermBandsSingle: TermCapBand[];
  // Jeevan Raksha (894) and Saral Jeevan Bima (859) have NO Increasing Sum
  // Assured choice at all — their Absolute Amount is always flat Basic
  // Sum Assured. Defaults to true (every other plan in this family offers
  // both options) so existing plan files don't need updating.
  hasIncreasingOption?: boolean;
  deathBenefit: {
    regularLimitedAnnualizedPremiumMultiple: number; // 7 (Saral Jeevan Bima uses 10)
    singlePremiumMultiple: number; // 1.25
  };
  sampleIllustrativePremium: {
    basicSumAssured: number;
    levelRows: readonly PureTermSamplePremiumRow[];
    increasingRows: readonly PureTermSamplePremiumRow[];
  };
}

type PureTermInput = LicCalculatorInput;

function readOption(rules: PureTermRules, input: PureTermInput): TermDeathBenefitOption | undefined {
  // Plans with no Increasing Sum Assured choice always behave as Option I
  // — never let a caller-supplied Option II leak through for them.
  if (rules.hasIncreasingOption === false) return "I";
  const option = input.productSpecificInputs?.deathBenefitOption;
  return option === "I" || option === "II" ? option : undefined;
}

function premiumMode(input: PureTermInput): TermPremiumMode {
  if (input.premiumFrequency === "single") return "single";
  if (input.premiumPaymentTermYears != null && input.policyTermYears != null) {
    return input.premiumPaymentTermYears === input.policyTermYears ? "regular" : "limited";
  }
  return "regular";
}

function maxTermForIncreasing(
  bands: readonly TermCapBand[],
  age: number,
  basicSumAssured: number
): number | undefined {
  const band = bands.find(
    (b) =>
      age >= b.minAge &&
      age <= b.maxAge &&
      (b.bsaMaxExclusive == null || basicSumAssured < b.bsaMaxExclusive)
  );
  return band?.maxPolicyTermYears;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(rules: PureTermRules, input: PureTermInput): EligibilityResult {
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

  const mode = premiumMode(input);
  const option = readOption(rules, input);

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else {
    if (input.policyTermYears < rules.minPolicyTermYears) {
      eligible = false;
      reasons.push(`Policy term ${input.policyTermYears} years is below the minimum of ${rules.minPolicyTermYears} years.`);
      reasonCodes.push({
        code: "term_out_of_range",
        params: { min: rules.minPolicyTermYears, max: 40, actual: input.policyTermYears },
      });
    }

    if (mode === "limited") {
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

    if (option != null) {
      const maxTerm =
        option === "I"
          ? rules.levelMaxPolicyTermYears
          : maxTermForIncreasing(
              mode === "single" ? rules.increasingMaxTermBandsSingle : rules.increasingMaxTermBandsRegularLimited,
              input.age,
              input.sumAssured ?? 0
            );
      if (maxTerm == null) {
        eligible = false;
        reasons.push("No maximum Policy Term is published for this age/Basic Sum Assured combination under Option II.");
        reasonCodes.push({ code: "term_out_of_range", params: { actual: input.policyTermYears } });
      } else if (input.policyTermYears > maxTerm) {
        eligible = false;
        reasons.push(
          `Policy term ${input.policyTermYears} years exceeds the maximum of ${maxTerm} years for this age/Basic Sum Assured/Option combination.`
        );
        reasonCodes.push({
          code: "term_out_of_range",
          params: { min: rules.minPolicyTermYears, max: maxTerm, actual: input.policyTermYears },
        });
      }
    }

    const maturityAge = input.age + input.policyTermYears;
    if (maturityAge > rules.maxMaturityAge) {
      eligible = false;
      reasons.push(`Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${rules.maxMaturityAge}.`);
      reasonCodes.push({ code: "maturity_age_too_high", params: { max: rules.maxMaturityAge, actual: maturityAge } });
    } else if (rules.minMaturityAge != null && maturityAge < rules.minMaturityAge) {
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

  if (eligible === true && missingInputs.length > 0) {
    eligible = null;
  }

  reasons.push(disclaimer);
  return { eligible, reasons, reasonCodes, missingInputs };
}

// ---- Phase 4: premium engine safety ----
// Only an exact sample-table match is ever returned.
export function calculatePremium(
  rules: PureTermRules,
  input: PureTermInput,
  sourceVersion: string
): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  const option = readOption(rules, input);
  if (option == null) missingInputs.push("productSpecificInputs.deathBenefitOption");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = rules.sampleIllustrativePremium;
  if (input.sumAssured !== sample.basicSumAssured) {
    return { available: false, missingInputs: ["Exact premium calculation requires verified LIC premium rate data."] };
  }

  const rows = option === "I" ? sample.levelRows : sample.increasingRows;
  const row = rows.find((r) => r.age === input.age && r.policyTermYears === input.policyTermYears);
  if (!row) {
    return { available: false, missingInputs: ["Exact premium calculation requires verified LIC premium rate data."] };
  }

  const mode = premiumMode(input);
  if (mode === "single") {
    return { available: true, premium: row.single, premiumFrequency: "single", sumAssured: input.sumAssured, missingInputs: [], sourceVersion };
  }
  if (mode === "regular") {
    return { available: true, premium: row.regular, premiumFrequency: "yearly", sumAssured: input.sumAssured, missingInputs: [], sourceVersion };
  }
  // limited
  const limitedPremium =
    input.premiumPaymentTermYears != null ? row.limitedByPpt[input.premiumPaymentTermYears] : undefined;
  if (limitedPremium == null) {
    return { available: false, missingInputs: ["Exact premium calculation requires verified LIC premium rate data."] };
  }
  return { available: true, premium: limitedPremium, premiumFrequency: "yearly", sumAssured: input.sumAssured, missingInputs: [], sourceVersion };
}

// ---- Phase 3: benefit engine ----
// No maturity benefit is ever payable — this is a pure risk plan. The
// "Absolute amount assured to be paid on death" for Option II
// (Increasing Sum Assured) is fully computable from Basic Sum Assured and
// policy year alone; this engine reports its value at inception (policy
// year 1, where it always equals Basic Sum Assured for BOTH options) and
// its final, capped value (2x BSA from policy year 16 onward) as two
// clearly-labelled figures, rather than guessing which policy year the
// customer cares about.
export function calculateBenefits(
  rules: PureTermRules,
  input: PureTermInput,
  sourceVersion: string
): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = {};
  const option = readOption(rules, input);
  const mode = premiumMode(input);

  if (option === "I") {
    guaranteedBenefits.absoluteAmountAssuredAtInception = basicSumAssured;
  } else if (option === "II") {
    guaranteedBenefits.absoluteAmountAssuredAtInception = basicSumAssured;
    guaranteedBenefits.absoluteAmountAssuredFromPolicyYear16 = basicSumAssured * 2;
  }

  const absoluteAmount = guaranteedBenefits.absoluteAmountAssuredAtInception;
  let deathBenefit: number | undefined;

  if (absoluteAmount != null) {
    const premiumLookup = calculatePremium(rules, input, sourceVersion);
    if (mode === "single") {
      deathBenefit = premiumLookup.available && premiumLookup.premium != null
        ? Math.max(rules.deathBenefit.singlePremiumMultiple * premiumLookup.premium, absoluteAmount)
        : absoluteAmount;
    } else {
      deathBenefit = premiumLookup.available && premiumLookup.premium != null
        ? Math.max(rules.deathBenefit.regularLimitedAnnualizedPremiumMultiple * premiumLookup.premium, absoluteAmount)
        : absoluteAmount;
    }
    guaranteedBenefits.sumAssuredOnDeath = deathBenefit;
  }

  return {
    available: true,
    guaranteedBenefits,
    nonGuaranteedIllustrations: undefined,
    deathBenefit,
    maturityBenefit: undefined, // pure risk plan — no maturity benefit is ever payable
    missingInputs: [],
    sourceVersion,
  };
}
