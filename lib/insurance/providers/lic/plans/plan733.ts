// Verified rule implementation for LIC's Jeevan Lakshya (Plan 733,
// UIN 512N297V03). Reference implementation for future LIC plan engines.
//
// SOURCE OF TRUTH (supplied directly by the user as official LIC documents):
//   - LIC_Jeevan_Lakshya_Sales_Brochure_Eng_06112025.pdf — PRIMARY source
//     for every rule below, per the user's instruction to treat the latest
//     sales brochure as authoritative for current product rules. Section
//     numbers/pages cited inline refer to this brochure.
//   - Policy_Document_LICs_Jeevan_Lakshya_CC.pdf — supplied as supporting
//     contractual documentation, but could NOT be parsed in this
//     environment (no PDF text-extraction tool available and no network
//     access to install one), so nothing below is sourced from it. This
//     module relies solely on the sales brochure.
//
// Every figure here is either copied verbatim from a specific brochure
// section or computed from such figures. Nothing is estimated, and no
// bonus rate or general premium formula is included because the brochure
// does not publish one — see calculatePremium() and the bonus handling in
// calculateBenefits() below.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";

export const PLAN_733_UIN = "512N297V03";

const SOURCE_VERSION =
  "LIC's Jeevan Lakshya Sales Brochure (UIN 512N297V03), file dated 06/11/2025";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export const PLAN_733_BONUS_DISCLAIMER =
  "Future bonus is not guaranteed and is not included in this calculation.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

// ---- Phase 1: verified rules (brochure Section 1, pages 2-3) ----
export const PLAN_733_RULES = {
  minEntryAge: 18, // "Minimum Age at entry ... 18 years (Last birthday)"
  maxEntryAge: 50, // "Maximum Age at entry ... 50 years (nearer birthday)"
  minMaturityAge: 31, // "Minimum Maturity Age ... 31 years (nearer birthday)"
  maxMaturityAge: 65, // "Maximum Maturity Age ... 65 years (nearer birthday)"
  minPolicyTermYears: 13, // "Minimum Policy Term ... 13 years"
  maxPolicyTermYears: 25, // "Maximum Policy Term ... 25 years"
  premiumPayingTermOffsetYears: 3, // "Premium Paying Term ... (Policy Term -3) years"
  minBasicSumAssured: 200000, // "Minimum Basic Sum Assured ... Rs. 2,00,000"
  maxBasicSumAssured: null as number | null, // "No Limit, subject to underwriting decision"
  sumAssuredIncrement: {
    lowerBandMaxInclusive: 400000, // "From Rs. 2,00,000 to Rs. 4,00,000"
    lowerBandMultiple: 10000, // "Rs. 10,000"
    upperBandMultiple: 50000, // "Above Rs. 4,00,000" -> "Rs. 50,000"
  },
  // Death Benefit (Section 2.A, page 3-4): "Sum Assured on Death" is the
  // higher of 7x annualised premium, or [110% Basic SA at maturity + 10%
  // Basic SA/year income from the anniversary after death to the one
  // before maturity]. Overall death benefit is never less than 105% of
  // total premiums paid to date of death.
  deathBenefit: {
    annualizedPremiumMultiple: 7,
    maturityComponentPctOfBasicSA: 110,
    annualIncomeBenefitPctOfBasicSA: 10,
    minDeathBenefitPctOfPremiumsPaid: 105,
  },
  // Maturity Benefit (Section 2.B, page 4): Sum Assured on Maturity =
  // Basic Sum Assured (plus vested bonuses, handled separately below).
  maturityBenefit: {
    sumAssuredOnMaturityEqualsBasicSA: true,
  },
  // Participation in Profits (Section 2.C, page 4): Simple Reversionary
  // Bonus and Final Additional Bonus are declared annually/on claim by
  // LIC — no rate is published in this brochure, so none is modeled here.
  bonusTypes: ["Simple Reversionary Bonus", "Final Additional Bonus"] as const,
  // Sample Illustrative Premium (Section 6, page 10): exact published
  // annual premiums for Basic Sum Assured Rs. 2,00,000, standard lives,
  // yearly mode, exclusive of GST. This is a small set of discrete
  // published points, NOT a general rate table — it cannot be used to
  // compute premiums for any other age/term/sum-assured combination.
  sampleIllustrativePremium: {
    basicSumAssured: 200000,
    premiumFrequency: "yearly" as const,
    rows: [
      { age: 20, policyTermYears: 13, premiumPaymentTermYears: 10, annualPremium: 20217 },
      { age: 20, policyTermYears: 15, premiumPaymentTermYears: 12, annualPremium: 16670 },
      { age: 20, policyTermYears: 20, premiumPaymentTermYears: 17, annualPremium: 11711 },
      { age: 20, policyTermYears: 25, premiumPaymentTermYears: 22, annualPremium: 9006 },
      { age: 30, policyTermYears: 13, premiumPaymentTermYears: 10, annualPremium: 20286 },
      { age: 30, policyTermYears: 15, premiumPaymentTermYears: 12, annualPremium: 16758 },
      { age: 30, policyTermYears: 20, premiumPaymentTermYears: 17, annualPremium: 11858 },
      { age: 30, policyTermYears: 25, premiumPaymentTermYears: 22, annualPremium: 9222 },
      { age: 40, policyTermYears: 13, premiumPaymentTermYears: 10, annualPremium: 20678 },
      { age: 40, policyTermYears: 15, premiumPaymentTermYears: 12, annualPremium: 17209 },
      { age: 40, policyTermYears: 20, premiumPaymentTermYears: 17, annualPremium: 12495 },
      { age: 40, policyTermYears: 25, premiumPaymentTermYears: 22, annualPremium: 10074 },
      { age: 50, policyTermYears: 13, premiumPaymentTermYears: 10, annualPremium: 22030 },
      { age: 50, policyTermYears: 15, premiumPaymentTermYears: 12, annualPremium: 18698 },
      // Age 50 / term 20 and age 50 / term 25 are blank in the brochure
      // table (policy term would breach the maturity-age limit) — omitted
      // rather than guessed.
    ],
  },
  // Riders (Section 3.I, pages 5-6) — identity only, no rider premium/
  // benefit formulas are implemented here.
  riders: [
    { name: "LIC's Accidental Death and Disability Benefit Rider", uin: "512B209V02" },
    { name: "LIC's Accident Benefit Rider", uin: "512B203V03" },
    { name: "LIC's New Term Assurance Rider", uin: "512B210V02" },
  ],
} as const;

type Plan733Input = LicCalculatorInput & { product: InsuranceProduct };

function isValidSumAssuredIncrement(sumAssured: number): boolean {
  const { lowerBandMaxInclusive, lowerBandMultiple, upperBandMultiple } =
    PLAN_733_RULES.sumAssuredIncrement;
  const multiple = sumAssured <= lowerBandMaxInclusive ? lowerBandMultiple : upperBandMultiple;
  return sumAssured % multiple === 0;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan733Input): EligibilityResult {
  const reasons: string[] = [];
  // Stable, parameterized codes so the UI can translate these instead of
  // displaying the English `reasons` sentences to the customer.
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_733_RULES.minEntryAge) {
    eligible = false;
    reasons.push(
      `Age ${input.age} is below the minimum entry age of ${PLAN_733_RULES.minEntryAge}.`
    );
    reasonCodes.push({
      code: "age_below_min",
      params: { min: PLAN_733_RULES.minEntryAge, actual: input.age },
    });
  } else if (input.age > PLAN_733_RULES.maxEntryAge) {
    eligible = false;
    reasons.push(
      `Age ${input.age} is above the maximum entry age of ${PLAN_733_RULES.maxEntryAge}.`
    );
    reasonCodes.push({
      code: "age_above_max",
      params: { max: PLAN_733_RULES.maxEntryAge, actual: input.age },
    });
  }

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else {
    if (
      input.policyTermYears < PLAN_733_RULES.minPolicyTermYears ||
      input.policyTermYears > PLAN_733_RULES.maxPolicyTermYears
    ) {
      eligible = false;
      reasons.push(
        `Policy term ${input.policyTermYears} years is outside the allowed range of ` +
          `${PLAN_733_RULES.minPolicyTermYears}-${PLAN_733_RULES.maxPolicyTermYears} years.`
      );
      reasonCodes.push({
        code: "term_out_of_range",
        params: {
          min: PLAN_733_RULES.minPolicyTermYears,
          max: PLAN_733_RULES.maxPolicyTermYears,
          actual: input.policyTermYears,
        },
      });
    }

    const maturityAge = input.age + input.policyTermYears;
    if (maturityAge > PLAN_733_RULES.maxMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ` +
          `${PLAN_733_RULES.maxMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_high",
        params: { max: PLAN_733_RULES.maxMaturityAge, actual: maturityAge },
      });
    } else if (maturityAge < PLAN_733_RULES.minMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would be below the minimum maturity age of ` +
          `${PLAN_733_RULES.minMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_low",
        params: { min: PLAN_733_RULES.minMaturityAge, actual: maturityAge },
      });
    }

    if (
      input.premiumPaymentTermYears != null &&
      input.premiumPaymentTermYears !==
        input.policyTermYears - PLAN_733_RULES.premiumPayingTermOffsetYears
    ) {
      eligible = false;
      reasons.push(
        `Premium Paying Term must equal Policy Term minus ${PLAN_733_RULES.premiumPayingTermOffsetYears} years.`
      );
      reasonCodes.push({
        code: "ppt_mismatch",
        params: { offset: PLAN_733_RULES.premiumPayingTermOffsetYears },
      });
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_733_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_733_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_733_RULES.minBasicSumAssured, actual: input.sumAssured },
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
// PLAN_733_RULES.sampleIllustrativePremium). Only an exact match against
// one of those published points is ever returned; nothing is estimated,
// interpolated, or generalised.
//
// Premium & Product Calculation Foundation V2: Premium Paying Term is
// entirely DERIVED from Policy Term (PPT = Term - 3, see
// premiumPayingTermOffsetYears above and evaluateEligibility's own
// check). A caller-supplied PPT that contradicts that relationship is an
// internally inconsistent request — the sample table's own recorded PPT
// per row already reflects the correct one, but this lookup used to key
// only on (age, policyTermYears), silently ignoring premiumPaymentTermYears
// entirely. That let an invalid PPT slip through and get back a premium
// as if it had been validated. If a PPT is explicitly supplied, it must
// match the term-derived value or the result is honestly unavailable.
export function calculatePremium(input: Plan733Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  if (
    input.premiumPaymentTermYears != null &&
    input.premiumPaymentTermYears !==
      input.policyTermYears! - PLAN_733_RULES.premiumPayingTermOffsetYears
  ) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const sample = PLAN_733_RULES.sampleIllustrativePremium;
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
// Only guaranteed, Basic-Sum-Assured-anchored components are computed.
// The "Sum Assured on Death" is officially the HIGHER of 7x annualised
// premium or the BSA-anchored components below — since an exact premium
// is rarely available, this never collapses that comparison into a
// single deathBenefit number; it reports the verified BSA-based
// components instead. Bonuses are never included (see
// PLAN_733_BONUS_DISCLAIMER) because no rate is published.
export function calculateBenefits(input: Plan733Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const { deathBenefit } = PLAN_733_RULES;

  const guaranteedBenefits: Record<string, number> = {
    maturitySumAssured: basicSumAssured,
    deathBenefitMaturityComponent: Math.round(
      (deathBenefit.maturityComponentPctOfBasicSA * basicSumAssured) / 100
    ),
    deathBenefitAnnualIncomePerYear: Math.round(
      (deathBenefit.annualIncomeBenefitPctOfBasicSA * basicSumAssured) / 100
    ),
  };

  return {
    available: true,
    guaranteedBenefits,
    // Bonuses are never guaranteed at the point of sale — see
    // PLAN_733_BONUS_DISCLAIMER. No non-guaranteed illustration is
    // fabricated here.
    nonGuaranteedIllustrations: undefined,
    // deathBenefit is intentionally left undefined: the policy's actual
    // "Sum Assured on Death" is the higher of this BSA-anchored figure or
    // 7x annualised premium, which requires a verified premium to compare.
    deathBenefit: undefined,
    maturityBenefit: guaranteedBenefits.maturitySumAssured,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}
