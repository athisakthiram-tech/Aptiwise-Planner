// Verified rule implementation for LIC's Protection Plus (Plan 886, UIN
// 512L361V01). A Non-Par, UNIT-LINKED (market-linked), Life, Individual
// Savings plan — same paramount guardrail as Plans 867/873/749: the
// maturity/vesting benefit is the Unit Fund Value, which depends entirely
// on NAV performance and is NEVER projected here (`calculateBenefits`
// never sets `maturityBenefit`).
//
// Unlike those three, this product has NO Guaranteed Additions feature at
// all — the brochure's own numbered sections go straight from "Benefits
// payable under an inforce policy" to "Optional benefits" with nothing in
// between; this is a structural absence, not a documentation gap, so no
// `guaranteedAdditionsCumulative` field is ever populated.
//
// Also unlike 873/749 (a discrete choice between 2 named multiples), the
// Basic Sum Assured Multiple here is a customer-chosen value within a
// published [minimum, maximum] band that itself depends on age, Premium
// Paying Term and an Annualized-Premium threshold — closer in shape to a
// continuous range than a discrete option. The maximum-multiple table is
// only fully published for Annualized Premium >= ₹60,000; below that
// threshold only the PPT-15 column is published, so the upper-bound check
// is honestly left unenforced for any other PPT below the threshold
// (never guessed at) — see docs/lic-plan886-verification.md.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Protection_plus_Sales_brochure_English_05122025.pdf —
// full 40-page document read in its entirety (the tail from p.30 onward
// is boilerplate: grievance/Section 45/rebates, consistent with every
// other brochure in this codebase). Identity confirmed on page 2: "LIC's
// Protection Plus (UIN: 512L361V01)". Only source used.

import { CostStructureResult, EligibilityReason, EligibilityResult, LiquidityResult } from "@/types/insurance";

export const PLAN_886_UIN = "512L361V01";

const SOURCE_VERSION = "LIC's Protection Plus Sales Brochure, UIN 512L361V01";
const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export type Plan886PremiumMode = "yearly" | "half_yearly" | "quarterly" | "monthly";
export type Plan886Ppt = 5 | 7 | 10 | 15;

const FREQUENCY_PER_YEAR: Record<Plan886PremiumMode, number> = {
  yearly: 1,
  half_yearly: 2,
  quarterly: 4,
  monthly: 12,
};

// §2.i, p.3: allowed Policy Term(s) for each Premium Paying Term.
const ALLOWED_TERMS_BY_PPT: Record<Plan886Ppt, number[]> = {
  5: [10, 15, 20, 25],
  7: [10, 15, 20, 25],
  10: [10, 15, 20, 25],
  15: [15, 20, 25],
};

// §2.ii, p.3: minimum installment premium, by PPT band and mode.
const MIN_PREMIUM_BY_PPT_AND_MODE: Record<"5_7_10" | "15", Record<Plan886PremiumMode, number>> = {
  "5_7_10": { monthly: 5000, quarterly: 15000, half_yearly: 30000, yearly: 60000 },
  "15": { monthly: 3000, quarterly: 9000, half_yearly: 18000, yearly: 36000 },
};

// §2.v, p.4: maximum entry age depends on PPT.
const MAX_ENTRY_AGE_BY_PPT: Record<Plan886Ppt, number> = { 5: 50, 7: 65, 10: 65, 15: 65 };

// §2.vi, p.4: maximum maturity age depends on Policy Term.
const MAX_MATURITY_AGE_BY_TERM: Record<number, number> = { 10: 75, 15: 80, 20: 85, 25: 90 };

type AgeBand = "18-30" | "31-40" | "41-45" | "46-50" | "51-55" | "56-65";

function ageBand(age: number): AgeBand | undefined {
  if (age >= 18 && age <= 30) return "18-30";
  if (age >= 31 && age <= 40) return "31-40";
  if (age >= 41 && age <= 45) return "41-45";
  if (age >= 46 && age <= 50) return "46-50";
  if (age >= 51 && age <= 55) return "51-55";
  if (age >= 56 && age <= 65) return "56-65";
  return undefined;
}

// §2.viii(a), p.4: Maximum Basic Sum Assured Multiple for Annualized
// Premium >= ₹60,000, by age band and PPT. `null` = "NA" in the brochure.
const MAX_BSA_MULTIPLE_HIGH_PREMIUM: Record<AgeBand, Record<Plan886Ppt, number | null>> = {
  "18-30": { 5: 20, 7: 22, 10: 22, 15: 40 },
  "31-40": { 5: 12, 7: 12, 10: 12, 15: 25 },
  "41-45": { 5: 12, 7: 12, 10: 12, 15: 20 },
  "46-50": { 5: 8, 7: 8, 10: 8, 15: 10 },
  "51-55": { 5: null, 7: 7, 10: 7, 15: 10 },
  "56-65": { 5: null, 7: 7, 10: 7, 15: 7 },
};

// §2.viii(b), p.4: for Annualized Premium < ₹60,000, ONLY the PPT-15
// column is published — every other PPT stays unenforced below this
// threshold rather than guessed at.
const MAX_BSA_MULTIPLE_LOW_PREMIUM_PPT15: Record<AgeBand, number> = {
  "18-30": 30,
  "31-40": 20,
  "41-45": 15,
  "46-50": 10,
  "51-55": 7,
  "56-65": 7,
};

export const PLAN_886_RULES = {
  minEntryAge: 18, // §2.iv, p.4
  annualizedPremiumThreshold: 60000,
  fundManagementChargePercent: 1.35, // §9.D, p.19
  // §9.B, p.17-18: rate of Mortality Charge per annum per ₹1000 Sum at
  // Risk, for a healthy life — an exact-lookup-only table (this
  // product's own published rates, distinct from Plans 873/749's tables).
  mortalityChargePerThousandByAge: { 25: 1.17, 35: 1.5, 45: 3.22, 50: 5.55, 60: 13.95 } as Record<number, number>,
};

export function minBsaMultiple(age: number): number {
  return age >= 50 ? 5 : 7; // §2.vii, p.4
}

export function maxBsaMultiple(age: number, ppt: Plan886Ppt, annualizedPremium: number): number | undefined {
  const band = ageBand(age);
  if (!band) return undefined;
  if (annualizedPremium >= PLAN_886_RULES.annualizedPremiumThreshold) {
    return MAX_BSA_MULTIPLE_HIGH_PREMIUM[band][ppt] ?? undefined;
  }
  return ppt === 15 ? MAX_BSA_MULTIPLE_LOW_PREMIUM_PPT15[band] : undefined;
}

export function annualizedPremium(installmentPremium: number, mode: Plan886PremiumMode): number {
  return installmentPremium * FREQUENCY_PER_YEAR[mode];
}

export interface Plan886Input {
  age: number;
  policyTermYears?: number;
  premiumPayingTermYears?: Plan886Ppt;
  premiumMode?: Plan886PremiumMode;
  annualPremium?: number; // the customer's chosen INSTALLMENT premium (per the mode above)
  bsaMultiple?: number;
}

export function evaluateEligibility(input: Plan886Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_886_RULES.minEntryAge) {
    eligible = false;
    reasonCodes.push({
      code: "age_out_of_range",
      params: { min: PLAN_886_RULES.minEntryAge, max: 65, actual: input.age },
    });
  }

  if (input.premiumPayingTermYears == null) {
    missingInputs.push("premiumPayingTermYears");
  } else {
    const ppt = input.premiumPayingTermYears;
    const maxEntryAge = MAX_ENTRY_AGE_BY_PPT[ppt];
    if (input.age > maxEntryAge) {
      eligible = false;
      reasonCodes.push({ code: "age_out_of_range", params: { min: PLAN_886_RULES.minEntryAge, max: maxEntryAge, actual: input.age } });
    }

    if (input.policyTermYears == null) {
      missingInputs.push("policyTermYears");
    } else if (!ALLOWED_TERMS_BY_PPT[ppt].includes(input.policyTermYears)) {
      eligible = false;
      reasonCodes.push({
        code: "term_out_of_range",
        params: {
          min: ALLOWED_TERMS_BY_PPT[ppt][0],
          max: ALLOWED_TERMS_BY_PPT[ppt][ALLOWED_TERMS_BY_PPT[ppt].length - 1],
          actual: input.policyTermYears,
        },
      });
    } else {
      const maxMaturityAge = MAX_MATURITY_AGE_BY_TERM[input.policyTermYears];
      const maturityAge = input.age + input.policyTermYears;
      if (maturityAge > maxMaturityAge) {
        eligible = false;
        reasonCodes.push({ code: "maturity_age_too_high", params: { max: maxMaturityAge, actual: maturityAge } });
      }
    }

    if (input.annualPremium == null) {
      missingInputs.push("annualPremium");
    } else {
      const mode = input.premiumMode ?? "yearly";
      const band = ppt === 15 ? "15" : "5_7_10";
      const minPremium = MIN_PREMIUM_BY_PPT_AND_MODE[band][mode];
      if (input.annualPremium < minPremium) {
        eligible = false;
        reasonCodes.push({ code: "sum_assured_below_min", params: { min: minPremium, actual: input.annualPremium } });
      }

      if (input.bsaMultiple == null) {
        missingInputs.push("bsaMultiple");
      } else {
        const minMultiple = minBsaMultiple(input.age);
        if (input.bsaMultiple < minMultiple) {
          eligible = false;
          reasonCodes.push({
            code: "sum_assured_invalid_increment",
            params: { min: minMultiple, actual: input.bsaMultiple },
          });
        }
        const annualized = annualizedPremium(input.annualPremium, mode);
        const maxMultiple = maxBsaMultiple(input.age, ppt, annualized);
        if (maxMultiple != null && input.bsaMultiple > maxMultiple) {
          eligible = false;
          reasonCodes.push({
            code: "sum_assured_invalid_increment",
            params: { min: maxMultiple, actual: input.bsaMultiple },
          });
        }
      }
    }
  }

  if (eligible === true && missingInputs.length > 0) eligible = null;
  reasons.push(UNDERWRITING_DISCLAIMER);
  return { eligible, reasons, reasonCodes, missingInputs, sourceVersion: SOURCE_VERSION };
}

// NEVER sets `maturityBenefit` — the Unit Fund Value depends on NAV
// performance and can never be projected. This product has NO Guaranteed
// Additions at all (a structural absence, not a gap) — only the Basic Sum
// Assured floor is reported, always known directly from the customer's
// own chosen multiple and premium, no rate-table lookup needed.
export function calculateBenefits(input: Plan886Input) {
  const missingInputs: string[] = [];
  if (input.annualPremium == null) missingInputs.push("annualPremium");
  if (input.bsaMultiple == null) missingInputs.push("bsaMultiple");
  if (missingInputs.length > 0) {
    return { available: false as const, missingInputs };
  }

  const installment = input.annualPremium as number;
  const mode = input.premiumMode ?? "yearly";
  const annualized = annualizedPremium(installment, mode);
  const basicSumAssured = Math.round((input.bsaMultiple as number) * annualized);
  const guaranteedBenefits: Record<string, number> = { basicSumAssured };

  // Assured floor at inception only — "Total Base Premiums paid" is just
  // the first installment paid so far, same convention as Plans 867/873.
  const premiumFloor = Math.round(1.05 * installment);
  const deathBenefit = Math.max(basicSumAssured, premiumFloor);
  guaranteedBenefits.deathBenefitAtInception = deathBenefit;

  return {
    available: true as const,
    guaranteedBenefits,
    nonGuaranteedIllustrations: undefined,
    deathBenefit,
    // Unit Fund Value at maturity is NAV-dependent — never projected.
    maturityBenefit: undefined,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}

// Only Fund Management Charge (flat, unconditional) and Mortality Charge
// (an exact-lookup-only table for a healthy life at 5 published ages) are
// reported. Premium Allocation / Policy Administration / Discontinuance /
// Switching / Partial Withdrawal / Miscellaneous Charges are all real and
// published but conditional on policy year, premium band and/or channel
// in ways a single EngineResult<number> can't honestly represent.
export function calculateCosts(sourceId: string, age?: number): CostStructureResult {
  const mortalityRate = age != null ? PLAN_886_RULES.mortalityChargePerThousandByAge[age] : undefined;
  return {
    expenseRatio: { status: "unavailable", value: null, sourceIds: [] },
    fundManagementCharge: {
      status: "verified",
      value: PLAN_886_RULES.fundManagementChargePercent,
      sourceIds: [sourceId],
    },
    mortalityCharge:
      mortalityRate != null
        ? { status: "verified", value: mortalityRate, sourceIds: [sourceId] }
        : { status: "unavailable", value: null, sourceIds: [] },
    adminCharge: { status: "unavailable", value: null, sourceIds: [] },
    exitLoad: { status: "unavailable", value: null, sourceIds: [] },
  };
}

// No loan is ever available (verified, unconditional — §17, p.29). The
// Unit Fund is locked for the first 5 policy years and only available
// after — this engine has no "years elapsed" input, so "conditional" is
// the accurate status, same as Plans 867/873/749.
export function evaluateLiquidity(sourceId: string): LiquidityResult {
  return {
    surrenderAvailable: { status: "conditional", value: null, sourceIds: [sourceId] },
    loanAvailable: { status: "verified", value: false, sourceIds: [sourceId] },
  };
}
