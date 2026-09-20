// Verified rule implementation for LIC's Jeevan Labh (Plan 736,
// UIN 512N304V03). Follows the same pattern as plan733.ts.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document):
//   - LIC_Jeevan_labh_Sales_Brochure_Eng.pdf (doc ref LIC/P1/2024-25/18/
//     Eng/SB) — the ONLY source for every rule below. Section numbers/
//     pages cited inline refer to this brochure. No separate policy
//     document was supplied for this task, so nothing here depends on
//     one — see docs/lic-plan736-verification.md for the full audit,
//     including everything deliberately left unimplemented.
//
// Every figure here is either copied verbatim from a specific brochure
// section or computed from such figures using a formula the brochure
// itself states. Nothing is estimated. No bonus rate is included because
// none is published.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";

export const PLAN_736_UIN = "512N304V03";

const SOURCE_VERSION =
  "LIC's Jeevan Labh Sales Brochure (doc ref LIC/P1/2024-25/18/Eng/SB), UIN 512N304V03";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export const PLAN_736_BONUS_DISCLAIMER =
  "Future bonus is not guaranteed and is not included in this calculation.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

// Policy Term -> required Premium Paying Term. Jeevan Labh only offers
// these three fixed pairs — a policy term outside this set (or a PPT
// that doesn't match its paired term) is never valid, regardless of age
// or sum assured (brochure §1(a), p.2).
const TERM_PPT_PAIRS: Record<number, number> = { 16: 10, 21: 15, 25: 16 };

// Maximum entry age depends on the chosen policy term (brochure §1(c), p.2).
const MAX_ENTRY_AGE_BY_TERM: Record<number, number> = { 16: 59, 21: 54, 25: 50 };

// ---- Phase 1: verified rules (brochure §1, pages 2-3; §2, pages 3-4) ----
export const PLAN_736_RULES = {
  minEntryAge: 8, // "Minimum Age at entry ... [8] years (completed)"
  maxMaturityAge: 75, // "Maximum Maturity Age ... [75] years (nearer birthday)"
  minBasicSumAssured: 200000, // "Minimum Basic Sum Assured ... Rs. 2,00,000"
  maxBasicSumAssured: null as number | null, // "No Limit"
  termPptPairs: TERM_PPT_PAIRS,
  maxEntryAgeByTerm: MAX_ENTRY_AGE_BY_TERM,
  sumAssuredIncrement: {
    lowerBandMaxInclusive: 450000, // "From Rs. 2,00,000 to Rs. 4,50,000"
    lowerBandMultiple: 10000, // "Rs. 10,000"
    upperBandMultiple: 25000, // "Above Rs. 4,50,000" -> "Rs. 25,000"
  },
  // Death Benefit (§2.A, page 3): "Sum Assured on Death" is the higher of
  // Basic Sum Assured or 7x annualised premium, plus vested bonuses.
  // Never less than 105% of total premiums paid to date of death — that
  // floor needs premium-paid history and is not modeled here (see
  // docs/lic-plan736-verification.md).
  deathBenefit: {
    annualizedPremiumMultiple: 7,
  },
  // Maturity Benefit (§2.B, page 4): Sum Assured on Maturity = Basic Sum
  // Assured (plus vested bonuses, handled separately below).
  maturityBenefit: {
    sumAssuredOnMaturityEqualsBasicSA: true,
  },
  // Participation in Profits (§2.C, page 4): Simple Reversionary Bonus
  // and Final Additional Bonus are declared by LIC — no rate is
  // published in this brochure, so none is modeled here.
  bonusTypes: ["Simple Reversionary Bonus", "Final Additional Bonus"] as const,
  // Sample Illustrative Premium (§6, page 9): exact published annual
  // premiums for Basic Sum Assured Rs. 2,00,000, standard lives, yearly
  // mode, exclusive of GST — a small set of discrete published points,
  // NOT a general rate table. The (age 30, term 25) row is independently
  // cross-checked against the Benefit Illustration in §17 (page 17),
  // which states the identical Rs. 10,025 instalment premium.
  sampleIllustrativePremium: {
    basicSumAssured: 200000,
    premiumFrequency: "yearly" as const,
    rows: [
      { age: 20, policyTermYears: 16, premiumPaymentTermYears: 10, annualPremium: 17718 },
      { age: 20, policyTermYears: 21, premiumPaymentTermYears: 15, annualPremium: 11623 },
      { age: 20, policyTermYears: 25, premiumPaymentTermYears: 16, annualPremium: 9908 },
      { age: 30, policyTermYears: 16, premiumPaymentTermYears: 10, annualPremium: 17767 },
      { age: 30, policyTermYears: 21, premiumPaymentTermYears: 15, annualPremium: 11701 },
      { age: 30, policyTermYears: 25, premiumPaymentTermYears: 16, annualPremium: 10025 },
      { age: 40, policyTermYears: 16, premiumPaymentTermYears: 10, annualPremium: 18012 },
      { age: 40, policyTermYears: 21, premiumPaymentTermYears: 15, annualPremium: 12054 },
      { age: 40, policyTermYears: 25, premiumPaymentTermYears: 16, annualPremium: 10476 },
      { age: 50, policyTermYears: 16, premiumPaymentTermYears: 10, annualPremium: 18855 },
      { age: 50, policyTermYears: 21, premiumPaymentTermYears: 15, annualPremium: 13083 },
      { age: 50, policyTermYears: 25, premiumPaymentTermYears: 16, annualPremium: 11682 },
    ],
  },
  // Riders (§3.I, pages 4-6) — identity only, no rider premium/benefit
  // formulas are implemented here.
  riders: [
    { name: "LIC's Accidental Death and Disability Benefit Rider", uin: "512B209V02" },
    { name: "LIC's Accident Benefit Rider", uin: "512B203V03" },
    { name: "LIC's New Term Assurance Rider", uin: "512B210V02" },
    { name: "LIC's Premium Waiver Benefit Rider", uin: "512B204V04" },
  ],
  // Liquidity (§10-11, pages 11-14): structural facts only — both loan
  // and surrender are documented as available once the stated tenure
  // condition (>= 1 full year's premium paid) is met. Amounts require
  // Surrender Value (premiums-paid history + GSV/SSV factor tables) and
  // are deliberately not computed here.
  liquidity: {
    surrenderAvailableAfterFullYearsPremiumsPaid: 1,
    loanAvailableAfterFullYearsPremiumsPaid: 1,
  },
} as const;

type Plan736Input = LicCalculatorInput & { product: InsuranceProduct };

function isValidSumAssuredIncrement(sumAssured: number): boolean {
  const { lowerBandMaxInclusive, lowerBandMultiple, upperBandMultiple } =
    PLAN_736_RULES.sumAssuredIncrement;
  const multiple = sumAssured <= lowerBandMaxInclusive ? lowerBandMultiple : upperBandMultiple;
  return sumAssured % multiple === 0;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan736Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_736_RULES.minEntryAge) {
    eligible = false;
    reasons.push(
      `Age ${input.age} is below the minimum entry age of ${PLAN_736_RULES.minEntryAge}.`
    );
    reasonCodes.push({
      code: "age_below_min",
      params: { min: PLAN_736_RULES.minEntryAge, actual: input.age },
    });
  }

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else {
    const term = input.policyTermYears;
    const requiredPpt = PLAN_736_RULES.termPptPairs[term];

    if (requiredPpt == null) {
      eligible = false;
      reasons.push(
        `Policy term ${term} is not offered — only 16, 21 or 25 years are available.`
      );
      reasonCodes.push({ code: "invalid_term_ppt_combination", params: { term } });
    } else {
      const maxEntryAge = PLAN_736_RULES.maxEntryAgeByTerm[term];
      if (input.age > maxEntryAge) {
        eligible = false;
        reasons.push(
          `Age ${input.age} is above the maximum entry age of ${maxEntryAge} for a ${term}-year term.`
        );
        reasonCodes.push({
          code: "age_above_max_for_term",
          params: { max: maxEntryAge, actual: input.age, term },
        });
      }

      const maturityAge = input.age + term;
      if (maturityAge > PLAN_736_RULES.maxMaturityAge) {
        eligible = false;
        reasons.push(
          `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ` +
            `${PLAN_736_RULES.maxMaturityAge}.`
        );
        reasonCodes.push({
          code: "maturity_age_exceeded",
          params: { max: PLAN_736_RULES.maxMaturityAge, actual: maturityAge },
        });
      }

      if (
        input.premiumPaymentTermYears != null &&
        input.premiumPaymentTermYears !== requiredPpt
      ) {
        eligible = false;
        reasons.push(
          `A ${term}-year policy term requires a Premium Paying Term of ${requiredPpt} years.`
        );
        reasonCodes.push({
          code: "invalid_term_ppt_combination",
          params: { term, requiredPpt, actual: input.premiumPaymentTermYears },
        });
      }
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_736_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_736_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_736_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (!isValidSumAssuredIncrement(input.sumAssured)) {
    eligible = false;
    reasons.push("Basic Sum Assured is not a valid increment for its range.");
    reasonCodes.push({ code: "sum_assured_invalid_increment" });
  }

  // A definite pass/fail is only reported once nothing relevant is
  // missing; otherwise the honest answer is "not yet determinable".
  if (eligible === true && missingInputs.length > 0) {
    eligible = null;
  }

  reasons.push(UNDERWRITING_DISCLAIMER);

  return { eligible, reasons, reasonCodes, missingInputs, sourceVersion: SOURCE_VERSION };
}

// ---- Phase 4: premium engine safety ----
// The brochure publishes only a small set of exact sample premiums (see
// PLAN_736_RULES.sampleIllustrativePremium). Only an exact match against
// one of those published points is ever returned; nothing is estimated,
// interpolated, scaled or generalised — including the documented mode
// and High Sum Assured rebates, which would require a complete base-rate
// table this brochure doesn't publish (see docs/lic-plan736-verification.md).
//
// Premium & Product Calculation Foundation V2: Jeevan Labh only offers
// ONE valid Premium Paying Term per Policy Term (TERM_PPT_PAIRS above,
// enforced by evaluateEligibility). This lookup used to key only on
// (age, policyTermYears), silently ignoring premiumPaymentTermYears —
// so a caller requesting an internally-inconsistent PPT for the chosen
// term (one evaluateEligibility would reject) still got back a premium
// as if that combination were valid. If a PPT is explicitly supplied, it
// must match the term's own required PPT or the result is honestly
// unavailable.
export function calculatePremium(input: Plan736Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const requiredPpt = PLAN_736_RULES.termPptPairs[input.policyTermYears!];
  if (input.premiumPaymentTermYears != null && input.premiumPaymentTermYears !== requiredPpt) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const sample = PLAN_736_RULES.sampleIllustrativePremium;
  const frequency = input.premiumFrequency ?? "yearly";
  const match =
    frequency === sample.premiumFrequency && input.sumAssured === sample.basicSumAssured
      ? sample.rows.find(
          (row) => row.age === input.age && row.policyTermYears === input.policyTermYears
        )
      : undefined;

  if (!match) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  return {
    available: true,
    premium: match.annualPremium,
    premiumFrequency: "yearly",
    sumAssured: input.sumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}

// ---- Phase 3: benefit engine ----
// The guaranteed maturity component (Sum Assured on Maturity = Basic Sum
// Assured) is always computable once a Basic Sum Assured is given. The
// death benefit formula ("higher of BSA or 7x annualised premium") is
// itself guaranteed/contractual — not an assumption — so it is computed
// exactly whenever an exact verified premium is available from
// calculatePremium(). When no exact premium is available, only the
// guaranteed BSA floor (Sum Assured on Death can never be less than
// BSA) is reported, never the complete figure. Bonuses are never
// included (see PLAN_736_BONUS_DISCLAIMER) because no rate is published.
export function calculateBenefits(input: Plan736Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = {
    maturitySumAssured: basicSumAssured,
  };

  let deathBenefit: number | undefined;
  const premiumLookup = calculatePremium(input);
  if (premiumLookup.available && premiumLookup.premium != null) {
    const sumAssuredOnDeath = Math.max(
      basicSumAssured,
      PLAN_736_RULES.deathBenefit.annualizedPremiumMultiple * premiumLookup.premium
    );
    guaranteedBenefits.sumAssuredOnDeath = sumAssuredOnDeath;
    deathBenefit = sumAssuredOnDeath;
  } else {
    // "Sum Assured on Death" is contractually never less than the Basic
    // Sum Assured — record that guaranteed floor without claiming it is
    // the complete figure (the 7x-premium side of the comparison is
    // unknown without a verified premium).
    guaranteedBenefits.sumAssuredOnDeathMinimum = basicSumAssured;
  }

  return {
    available: true,
    guaranteedBenefits,
    // Bonuses are never guaranteed at the point of sale — see
    // PLAN_736_BONUS_DISCLAIMER. No non-guaranteed illustration is
    // fabricated here.
    nonGuaranteedIllustrations: undefined,
    deathBenefit,
    maturityBenefit: guaranteedBenefits.maturitySumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}
