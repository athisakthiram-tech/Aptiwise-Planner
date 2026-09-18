// Verified rule implementation for LIC's Index Plus (Plan 873, UIN
// 512L354V01). A Non-Par, UNIT-LINKED (market-linked) Life, Individual
// Savings plan — structurally close to Plan 867 (New Pension Plus): same
// non-negotiable guardrail that the Unit Fund Value is NAV-dependent and
// is NEVER projected here (`calculateBenefits` never sets
// `maturityBenefit`). Unlike 867, this product DOES have a genuine Basic
// Sum Assured — the customer chooses a multiple (7x or 10x Annualized
// Premium, subject to age) rather than an absolute figure, so it is always
// directly computable from the premium the customer already chose, no
// rate table lookup needed.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC__Index_Plus_Sales_Brochure_141025.pdf — full 36-page
// document read in its entirety (the tail from p.25 onward is
// boilerplate: grievance/Section 45/rebates, consistent with every other
// brochure in this codebase). Identity confirmed on page 2: "LIC's Index
// Plus (UIN: 512L354V01)". Only source used. See
// docs/lic-plan873-verification.md.

import { CostStructureResult, EligibilityReason, EligibilityResult, LiquidityResult } from "@/types/insurance";

export const PLAN_873_UIN = "512L354V01";

const SOURCE_VERSION = "LIC's Index Plus Sales Brochure, UIN 512L354V01";
const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export type Plan873PremiumMode = "yearly" | "half_yearly" | "quarterly" | "monthly";
export type Plan873BsaMultiple = 7 | 10;

const FREQUENCY_PER_YEAR: Record<Plan873PremiumMode, number> = {
  yearly: 1,
  half_yearly: 2,
  quarterly: 4,
  monthly: 12,
};

export const PLAN_873_RULES = {
  maxEntryAgeFor10x: 50, // §1.v, p.3
  maxEntryAgeFor7x: 60, // §1.v, p.3
  minPremiumByMode: {
    yearly: 30000,
    half_yearly: 15000,
    quarterly: 7500,
    monthly: 2500,
  } as Record<Plan873PremiumMode, number>,
  minMaturityAge: 18, // §1.ix, p.4
  maxMaturityAgeFor7x: 85, // §1.x, p.4
  maxMaturityAgeFor10x: 75, // §1.x, p.4
  maxPolicyTermYears: 25, // §1.vi, p.3
  // §1.vi, p.3: policy term band depends on whether Annualized Premium is
  // below or at/above ₹48,000.
  annualizedPremiumBandThreshold: 48000,
  minPolicyTermYearsBelowThreshold: 15,
  minPolicyTermYearsAtOrAboveThreshold: 10,
  // §3, p.5-6: Guaranteed Additions as a % of one Annualized Premium,
  // credited once at the END of each specified policy year (not a
  // continuously-accruing band) — depends on the same ₹48,000 threshold.
  guaranteedAdditionScheduleBelowThreshold: [
    { policyYear: 6, percent: 3 },
    { policyYear: 10, percent: 6 },
    { policyYear: 15, percent: 12 },
    { policyYear: 20, percent: 15 },
    { policyYear: 25, percent: 18 },
  ] as const,
  guaranteedAdditionScheduleAtOrAboveThreshold: [
    { policyYear: 6, percent: 5 },
    { policyYear: 10, percent: 10 },
    { policyYear: 15, percent: 20 },
    { policyYear: 20, percent: 25 },
    { policyYear: 25, percent: 30 },
  ] as const,
  assuredDeathBenefitPercentOfPremiums: 105, // §2.A, p.4-5
  fundManagementChargePercent: 1.35, // §9.D, p.15-16, both available funds
  // §9.B, p.14: rate of Mortality Charge per annum per ₹1000 Sum at Risk,
  // for a healthy life — an exact-lookup-only table (5 published points;
  // every other age stays unavailable rather than interpolated).
  mortalityChargePerThousandByAge: { 25: 1.26, 35: 1.62, 45: 3.48, 50: 5.99, 60: 15.07 } as Record<number, number>,
} as const;

export interface Plan873Input {
  age: number;
  policyTermYears?: number;
  premiumMode?: Plan873PremiumMode;
  annualPremium?: number; // the customer's chosen INSTALLMENT premium (per the mode above)
  bsaMultiple?: Plan873BsaMultiple;
}

export function annualizedPremium(installmentPremium: number, mode: Plan873PremiumMode): number {
  return installmentPremium * FREQUENCY_PER_YEAR[mode];
}

function guaranteedAdditionSchedule(annualized: number) {
  return annualized >= PLAN_873_RULES.annualizedPremiumBandThreshold
    ? PLAN_873_RULES.guaranteedAdditionScheduleAtOrAboveThreshold
    : PLAN_873_RULES.guaranteedAdditionScheduleBelowThreshold;
}

// Fully deterministic — no NAV or investment-return assumption anywhere.
export function cumulativeGuaranteedAdditions(annualized: number, policyTermYears: number): number {
  const schedule = guaranteedAdditionSchedule(annualized);
  let total = 0;
  for (const row of schedule) {
    if (row.policyYear <= policyTermYears) total += (row.percent / 100) * annualized;
  }
  return Math.round(total);
}

export function evaluateEligibility(input: Plan873Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.bsaMultiple == null) {
    missingInputs.push("bsaMultiple");
  } else {
    const maxEntryAge =
      input.bsaMultiple === 10 ? PLAN_873_RULES.maxEntryAgeFor10x : PLAN_873_RULES.maxEntryAgeFor7x;
    if (input.age > maxEntryAge) {
      eligible = false;
      reasons.push(`Age ${input.age} exceeds the maximum entry age of ${maxEntryAge} for ${input.bsaMultiple}x BSA.`);
      reasonCodes.push({ code: "age_out_of_range", params: { min: 0, max: maxEntryAge, actual: input.age } });
    }
  }

  if (input.annualPremium == null) {
    missingInputs.push("annualPremium");
  } else {
    const mode = input.premiumMode ?? "yearly";
    const minPremium = PLAN_873_RULES.minPremiumByMode[mode];
    if (input.annualPremium < minPremium) {
      eligible = false;
      reasons.push(`Premium of ${input.annualPremium} is below the minimum of ${minPremium} for ${mode} mode.`);
      reasonCodes.push({ code: "sum_assured_below_min", params: { min: minPremium, actual: input.annualPremium } });
    }

    if (input.policyTermYears == null) {
      missingInputs.push("policyTermYears");
    } else {
      const annualized = annualizedPremium(input.annualPremium, mode);
      const minTerm =
        annualized >= PLAN_873_RULES.annualizedPremiumBandThreshold
          ? PLAN_873_RULES.minPolicyTermYearsAtOrAboveThreshold
          : PLAN_873_RULES.minPolicyTermYearsBelowThreshold;
      if (input.policyTermYears < minTerm || input.policyTermYears > PLAN_873_RULES.maxPolicyTermYears) {
        eligible = false;
        reasons.push(
          `Policy term ${input.policyTermYears} years is outside the allowed range of ${minTerm}-${PLAN_873_RULES.maxPolicyTermYears} years.`
        );
        reasonCodes.push({
          code: "term_out_of_range",
          params: { min: minTerm, max: PLAN_873_RULES.maxPolicyTermYears, actual: input.policyTermYears },
        });
      }

      if (input.bsaMultiple != null) {
        const maxMaturityAge =
          input.bsaMultiple === 10 ? PLAN_873_RULES.maxMaturityAgeFor10x : PLAN_873_RULES.maxMaturityAgeFor7x;
        const maturityAge = input.age + input.policyTermYears;
        if (maturityAge > maxMaturityAge) {
          eligible = false;
          reasonCodes.push({ code: "maturity_age_too_high", params: { max: maxMaturityAge, actual: maturityAge } });
        } else if (maturityAge < PLAN_873_RULES.minMaturityAge) {
          eligible = false;
          reasonCodes.push({
            code: "maturity_age_too_low",
            params: { min: PLAN_873_RULES.minMaturityAge, actual: maturityAge },
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
// performance and can never be projected. Only the two genuinely
// guaranteed, market-independent components are reported: the Basic Sum
// Assured floor (the customer's own direct choice, no lookup needed) and
// the cumulative Guaranteed Additions.
export function calculateBenefits(input: Plan873Input) {
  const missingInputs: string[] = [];
  if (input.annualPremium == null) missingInputs.push("annualPremium");
  if (input.bsaMultiple == null) missingInputs.push("bsaMultiple");
  if (missingInputs.length > 0) {
    return { available: false as const, missingInputs };
  }

  const installment = input.annualPremium as number;
  const mode = input.premiumMode ?? "yearly";
  const annualized = annualizedPremium(installment, mode);
  const bsaMultiple = input.bsaMultiple as Plan873BsaMultiple;
  const basicSumAssured = Math.round(bsaMultiple * annualized);
  const guaranteedBenefits: Record<string, number> = { basicSumAssured };

  // Assured floor at inception only — "Total Premiums received" is just
  // the first installment paid so far, same convention as Plan 867.
  const premiumFloor = Math.round((PLAN_873_RULES.assuredDeathBenefitPercentOfPremiums / 100) * installment);
  const deathBenefit = Math.max(basicSumAssured, premiumFloor);
  guaranteedBenefits.deathBenefitAtInception = deathBenefit;

  if (input.policyTermYears != null) {
    guaranteedBenefits.guaranteedAdditionsCumulative = cumulativeGuaranteedAdditions(
      annualized,
      input.policyTermYears
    );
  }

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
  const mortalityRate = age != null ? PLAN_873_RULES.mortalityChargePerThousandByAge[age] : undefined;
  return {
    expenseRatio: { status: "unavailable", value: null, sourceIds: [] },
    fundManagementCharge: {
      status: "verified",
      value: PLAN_873_RULES.fundManagementChargePercent,
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

// No loan is ever available (verified, unconditional — §18, p.24). The
// Unit Fund is locked for the first 5 policy years and only available
// after — this engine has no "years elapsed" input, so "conditional" is
// the accurate status, same as Plan 867.
export function evaluateLiquidity(sourceId: string): LiquidityResult {
  return {
    surrenderAvailable: { status: "conditional", value: null, sourceIds: [sourceId] },
    loanAvailable: { status: "verified", value: false, sourceIds: [sourceId] },
  };
}
