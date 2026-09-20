// Verified rule implementation for LIC's Bima Shree (Plan 748, UIN
// 512N316V03). A Par, High-Net-worth plan with a genuinely HYBRID benefit
// structure: a fully guaranteed, BSA-based Guaranteed Addition (like
// plan774.ts) PLUS a separate discretionary Loyalty Addition (undisclosed
// rate, participating — never fabricated, exactly like plan733.ts/
// plan736.ts's Simple Reversionary Bonus). Policy Term is chosen from a
// discrete set; Premium Paying Term is always Term - 4.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Bima_Shree_Sales_Brochure (UIN 512N316V03) — the ONLY
// source for every rule below. See docs/lic-plan748-verification.md.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { isValidSumAssuredIncrement } from "./shared";

export const PLAN_748_UIN = "512N316V03";

const SOURCE_VERSION = "LIC's Bima Shree Sales Brochure, UIN 512N316V03";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

// ---- Phase 1: verified rules (brochure §1, page 2; §2-4, pages 3-5) ----
export const PLAN_748_RULES = {
  minEntryAge: 8, // "8 years (completed)"
  policyTermOptions: [14, 16, 18, 20, 24, 28] as const,
  // Premium Paying Term is always Policy Term - 4 years.
  premiumPayingTermOffsetFromPolicyTerm: 4,
  maxEntryAgeByPolicyTerm: { 14: 55, 16: 53, 18: 51, 20: 49, 24: 45, 28: 41 } as const,
  maxMaturityAge: 69, // "69 years (nearer birthday)" — same for every term
  minBasicSumAssured: 1000000,
  sumAssuredMultiple: 50000,
  // Death Benefit (§2.A, page 3): higher of 125% BSA or 7x annualised
  // premium. The 125%-BSA side needs no premium at all, so it is always a
  // computable guaranteed floor.
  deathBenefit: { basicSumAssuredMultiple: 1.25, annualizedPremiumMultiple: 7 },
  // Guaranteed Addition (§4, page 5): a fixed, GUARANTEED rate per
  // Rs.1,000 Basic Sum Assured — computable from BSA + PPT alone, with no
  // premium dependency (unlike Plan 889/770/881's premium-based GA).
  guaranteedAdditionRatePerThousandFirstFiveYears: 50,
  guaranteedAdditionRatePerThousandFromYearSix: 55,
  // Loyalty Addition (§3, page 4): discretionary, participating, rate
  // never published — recorded only, never fabricated.
  // Survival Benefit (§2.B, page 4) and Maturity Benefit (§2.C, page 4) —
  // 2 fixed-date payments + a maturity %, always summing to 100% of BSA.
  benefitScheduleByPolicyTerm: {
    14: { survivalPercentEach: 30, survivalYears: [10, 12] as const, maturityPercent: 40 },
    16: { survivalPercentEach: 35, survivalYears: [12, 14] as const, maturityPercent: 30 },
    18: { survivalPercentEach: 40, survivalYears: [14, 16] as const, maturityPercent: 20 },
    20: { survivalPercentEach: 45, survivalYears: [16, 18] as const, maturityPercent: 10 },
    24: { survivalPercentEach: 45, survivalYears: [20, 22] as const, maturityPercent: 10 },
    28: { survivalPercentEach: 45, survivalYears: [24, 26] as const, maturityPercent: 10 },
  } as const,
  // Sample Illustrative Premium (§8, page 11): exact published annual
  // premiums for BSA Rs.10,00,000, by age and Policy Term (blank cells in
  // the brochure — e.g. age 50 with a 20/24/28-year term — are not
  // published and are simply absent from this table, never guessed).
  sampleIllustrativePremium: {
    basicSumAssured: 1000000,
    rows: [
      { age: 20, policyTermYears: 14, premium: 108780 },
      { age: 20, policyTermYears: 16, premium: 91483 },
      { age: 20, policyTermYears: 18, premium: 78890 },
      { age: 20, policyTermYears: 20, premium: 70168 },
      { age: 20, policyTermYears: 24, premium: 55125 },
      { age: 20, policyTermYears: 28, premium: 44982 },
      { age: 30, policyTermYears: 14, premium: 109270 },
      { age: 30, policyTermYears: 16, premium: 92071 },
      { age: 30, policyTermYears: 18, premium: 79576 },
      { age: 30, policyTermYears: 20, premium: 71050 },
      { age: 30, policyTermYears: 24, premium: 56301 },
      { age: 30, policyTermYears: 28, premium: 46501 },
      { age: 40, policyTermYears: 14, premium: 111622 },
      { age: 40, policyTermYears: 16, premium: 94717 },
      { age: 40, policyTermYears: 18, premium: 82516 },
      { age: 40, policyTermYears: 20, premium: 74382 },
      { age: 40, policyTermYears: 24, premium: 60172 },
      { age: 40, policyTermYears: 28, premium: 51009 },
      { age: 50, policyTermYears: 14, premium: 118580 },
      { age: 50, policyTermYears: 16, premium: 101969 },
      { age: 50, policyTermYears: 18, premium: 90111 },
    ],
  },
  riders: [
    { name: "LIC's Accidental Death and Disability Benefit Rider", uin: "512B209V02" },
    { name: "LIC's Accident Benefit Rider", uin: "512B203V03" },
    { name: "LIC's New Term Assurance Rider", uin: "512B210V02" },
    { name: "LIC's Premium Waiver Benefit Rider", uin: "512B204V04" },
  ],
} as const;

type Plan748Input = LicCalculatorInput & { product: InsuranceProduct };
type PolicyTermOption = (typeof PLAN_748_RULES.policyTermOptions)[number];

function isValidPolicyTerm(term: number): term is PolicyTermOption {
  return (PLAN_748_RULES.policyTermOptions as readonly number[]).includes(term);
}

function derivedPremiumPayingTermYears(policyTermYears: number): number {
  return policyTermYears - PLAN_748_RULES.premiumPayingTermOffsetFromPolicyTerm;
}

function guaranteedAdditionAtEndOfPpt(basicSumAssured: number, premiumPayingTermYears: number): number {
  const firstFiveYears = Math.min(5, premiumPayingTermYears);
  const remainingYears = Math.max(0, premiumPayingTermYears - 5);
  const total =
    (basicSumAssured / 1000) *
    (firstFiveYears * PLAN_748_RULES.guaranteedAdditionRatePerThousandFirstFiveYears +
      remainingYears * PLAN_748_RULES.guaranteedAdditionRatePerThousandFromYearSix);
  return Math.round(total);
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan748Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_748_RULES.minEntryAge) {
    eligible = false;
    reasons.push(`Age ${input.age} is below the minimum entry age of ${PLAN_748_RULES.minEntryAge}.`);
    reasonCodes.push({
      code: "age_below_min",
      params: { min: PLAN_748_RULES.minEntryAge, actual: input.age },
    });
  }

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else if (!isValidPolicyTerm(input.policyTermYears)) {
    eligible = false;
    reasons.push("Policy term must be one of 14, 16, 18, 20, 24 or 28 years.");
    reasonCodes.push({ code: "term_out_of_range", params: { actual: input.policyTermYears } });
  } else {
    const maxEntryAge = PLAN_748_RULES.maxEntryAgeByPolicyTerm[input.policyTermYears];
    if (input.age > maxEntryAge) {
      eligible = false;
      reasons.push(
        `Age ${input.age} is above the maximum entry age of ${maxEntryAge} for a ${input.policyTermYears}-year Policy Term.`
      );
      reasonCodes.push({
        code: "age_above_max_for_ppt",
        params: { max: maxEntryAge, actual: input.age, ppt: input.policyTermYears },
      });
    }

    const maturityAge = input.age + input.policyTermYears;
    if (maturityAge > PLAN_748_RULES.maxMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${PLAN_748_RULES.maxMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_high",
        params: { max: PLAN_748_RULES.maxMaturityAge, actual: maturityAge },
      });
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_748_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_748_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_748_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (
    !isValidSumAssuredIncrement(input.sumAssured, [
      { maxInclusive: null, multiple: PLAN_748_RULES.sumAssuredMultiple },
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
// The brochure publishes exact premiums for 4 ages x up to 6 terms (BSA
// Rs.10,00,000). Only an exact match is ever returned.
//
// Premium & Product Calculation Foundation V2: Premium Paying Term is
// always Policy Term - 4 (derived, never an independent customer
// choice — see premiumPayingTermOffsetFromPolicyTerm above). If a caller
// nonetheless supplies a premiumPaymentTermYears that contradicts that
// relationship for the chosen term, the request is internally
// inconsistent and must not silently resolve to that term's premium.
export function calculatePremium(input: Plan748Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  if (
    input.premiumPaymentTermYears != null &&
    input.premiumPaymentTermYears !==
      input.policyTermYears! - PLAN_748_RULES.premiumPayingTermOffsetFromPolicyTerm
  ) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  const sample = PLAN_748_RULES.sampleIllustrativePremium;
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
export function calculateBenefits(input: Plan748Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const policyTermYears = input.policyTermYears as number;
  const guaranteedBenefits: Record<string, number> = {};

  if (isValidPolicyTerm(policyTermYears)) {
    const schedule = PLAN_748_RULES.benefitScheduleByPolicyTerm[policyTermYears];
    guaranteedBenefits.survivalBenefitPerInstallment = Math.round(
      (schedule.survivalPercentEach / 100) * basicSumAssured
    );

    const ppt = derivedPremiumPayingTermYears(policyTermYears);
    const gaAtEndOfPpt = guaranteedAdditionAtEndOfPpt(basicSumAssured, ppt);
    guaranteedBenefits.guaranteedAdditionAtMaturity = gaAtEndOfPpt;

    const maturitySumAssured = Math.round((schedule.maturityPercent / 100) * basicSumAssured);
    guaranteedBenefits.maturitySumAssured = maturitySumAssured;
    const maturityBenefit = maturitySumAssured + gaAtEndOfPpt;

    // Death Benefit: 125% of BSA needs no premium at all, so it is always
    // a computable guaranteed floor; the 7x-premium side only ever raises
    // it when an exact premium is verified. Guaranteed Addition accrued to
    // date also always adds in (the brochure adds it from the first
    // policy year, even within the first 5 years).
    const guaranteedFloor = Math.round(
      PLAN_748_RULES.deathBenefit.basicSumAssuredMultiple * basicSumAssured
    );
    let sumAssuredOnDeath = guaranteedFloor;
    const premiumLookup = calculatePremium(input);
    if (premiumLookup.available && premiumLookup.premium != null) {
      sumAssuredOnDeath = Math.max(
        guaranteedFloor,
        PLAN_748_RULES.deathBenefit.annualizedPremiumMultiple * premiumLookup.premium
      );
    }
    guaranteedBenefits.sumAssuredOnDeath = sumAssuredOnDeath;
    const deathBenefit = sumAssuredOnDeath + gaAtEndOfPpt;

    return {
      available: true,
      guaranteedBenefits,
      // Par product — Loyalty Addition is discretionary/undisclosed;
      // never fabricated here.
      nonGuaranteedIllustrations: undefined,
      deathBenefit,
      maturityBenefit,
      missingInputs: [],
      sourceVersion: SOURCE_VERSION,
    };
  }

  return { available: false, missingInputs: ["policyTermYears"] };
}
