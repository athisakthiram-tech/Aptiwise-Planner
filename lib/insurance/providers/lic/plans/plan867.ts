// Verified rule implementation for LIC's New Pension Plus (Plan 867, UIN
// 512L347V01). A Non-Par, UNIT-LINKED (market-linked) pension savings
// plan — structurally unlike every other plan in this codebase:
//
//  - There is NO Basic Sum Assured at all ("Not Applicable" per the
//    brochure's own eligibility table). The customer instead chooses a
//    premium amount directly; there is no premium rate TABLE to look up,
//    so `calculatePremium` is deliberately not implemented (capability:
//    "not_applicable", not "unavailable" — this dimension genuinely does
//    not exist for this product, it is a direct customer input).
//  - The maturity/vesting benefit is the Unit Fund Value, which depends
//    on the NAV performance of the customer's chosen fund. This is
//    FUNDAMENTALLY UNKNOWABLE in advance — the brochure itself states
//    "the value of units may increase or decrease... LIC... does not in
//    any way indicate the quality of the contract, its future prospects
//    or returns." This engine NEVER computes, projects, or assumes any
//    investment return, and `calculateBenefits` NEVER sets
//    `maturityBenefit` — this is the single most important guardrail in
//    this file.
//  - What IS fully guaranteed and computable without any market
//    assumption: the Guaranteed Additions (a fixed % of premium added to
//    the Unit Fund at specified policy years — reported separately as
//    the guaranteed top-up component, never combined with an invented
//    "total fund value"), and the Assured Death Benefit floor (105% of
//    premiums received) at inception.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LICs_New_Pension_Plus_Eng_Brochure_171025.pdf (pages 1-38 of
// 48 read; the unread tail is boilerplate — QROPS/grievance/tax/
// nomination sections, consistent with every other brochure in this
// codebase) — the ONLY source for every rule below. See
// docs/lic-plan867-verification.md.

import { CostStructureResult, EligibilityReason, EligibilityResult, LiquidityResult } from "@/types/insurance";

export const PLAN_867_UIN = "512L347V01";

const SOURCE_VERSION = "LIC's New Pension Plus Sales Brochure, UIN 512L347V01";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export type Plan867PremiumMode = "single" | "yearly" | "half_yearly" | "quarterly" | "monthly";

// ---- Phase 1: verified rules (brochure §5, p.12-13; §3, p.6) ----
export const PLAN_867_RULES = {
  minEntryAge: 25,
  maxEntryAge: 75,
  minVestingAge: 35,
  maxVestingAge: 85,
  minPolicyTermYears: 10,
  maxPolicyTermYears: 42,
  minPremiumByMode: {
    single: 100000,
    yearly: 30000,
    half_yearly: 16000,
    quarterly: 9000,
    monthly: 3000,
  } as Record<Plan867PremiumMode, number>,
  // Guaranteed Additions (§3, p.6): a fixed % of Annual/Single Premium,
  // added to the Unit Fund at the end of the 6th, 10th, and EVERY policy
  // year from the 11th onward (provided all due premiums have been paid
  // and the policy is in-force) — fully guaranteed and computable from
  // premium + term alone, with no market/NAV dependency whatsoever.
  guaranteedAdditionSingleYearRates: {
    6: { annual: 5.0, single: 4.0 },
    10: { annual: 10.0, single: 5.0 },
  } as Record<number, { annual: number; single: number }>,
  guaranteedAdditionBands: [
    { maxPolicyYear: 15, annual: 4.0, single: 1.25 },
    { maxPolicyYear: 20, annual: 5.5, single: 1.5 },
    { maxPolicyYear: 25, annual: 7.0, single: 2.0 },
    { maxPolicyYear: 30, annual: 8.75, single: 2.5 },
    { maxPolicyYear: 35, annual: 10.75, single: 3.0 },
    { maxPolicyYear: 40, annual: 13.0, single: 3.75 },
    { maxPolicyYear: 42, annual: 15.5, single: 4.5 },
  ] as const,
  // Assured Death Benefit (§2.A.i, p.3-4): 105% of Total Premiums
  // received up to the date of death — this engine reports it only "at
  // inception" (one premium paid), since tracking premiums paid to date
  // needs elapsed-time state this engine's single-call context can't
  // carry.
  assuredDeathBenefitPercentOfPremiums: 105,
  // Charges (§9, p.20-22): the only two that are FLAT, unconditional
  // rates with no policy-year/premium-band dependency.
  fundManagementChargePercent: 1.35, // same for all 4 available funds
  mortalityChargePercent: 0, // "Nil" — confirmed explicitly
  riders: [] as const,
} as const;

export interface Plan867Input {
  age: number;
  policyTermYears?: number;
  premiumMode?: Plan867PremiumMode;
  annualPremium?: number; // the customer's chosen premium (per the mode above)
}

function guaranteedAdditionRateForYear(policyYear: number): { annual: number; single: number } {
  const singleYear = PLAN_867_RULES.guaranteedAdditionSingleYearRates[policyYear];
  if (singleYear) return singleYear;
  if (policyYear < 11) return { annual: 0, single: 0 };
  const band = PLAN_867_RULES.guaranteedAdditionBands.find((b) => policyYear <= b.maxPolicyYear);
  return band ? { annual: band.annual, single: band.single } : { annual: 0, single: 0 };
}

// Cumulative Guaranteed Additions added to the Unit Fund by the end of
// `policyTermYears`, for a premium of `premium` paid every due year
// (yearly-equivalent) or once (single). Fully deterministic — no NAV or
// investment-return assumption anywhere in this formula.
export function cumulativeGuaranteedAdditions(
  premium: number,
  isSingle: boolean,
  policyTermYears: number
): number {
  let total = 0;
  for (let year = 6; year <= policyTermYears; year++) {
    const rates = guaranteedAdditionRateForYear(year);
    const rate = isSingle ? rates.single : rates.annual;
    if (rate > 0) total += (rate / 100) * premium;
  }
  return Math.round(total);
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan867Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.age < PLAN_867_RULES.minEntryAge || input.age > PLAN_867_RULES.maxEntryAge) {
    eligible = false;
    reasons.push(
      `Age ${input.age} is outside the eligible entry range of ${PLAN_867_RULES.minEntryAge}-${PLAN_867_RULES.maxEntryAge}.`
    );
    reasonCodes.push({
      code: "age_out_of_range",
      params: { min: PLAN_867_RULES.minEntryAge, max: PLAN_867_RULES.maxEntryAge, actual: input.age },
    });
  }

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else {
    if (
      input.policyTermYears < PLAN_867_RULES.minPolicyTermYears ||
      input.policyTermYears > PLAN_867_RULES.maxPolicyTermYears
    ) {
      eligible = false;
      reasons.push(
        `Policy term ${input.policyTermYears} years is outside the allowed range of ${PLAN_867_RULES.minPolicyTermYears}-${PLAN_867_RULES.maxPolicyTermYears} years.`
      );
      reasonCodes.push({
        code: "term_out_of_range",
        params: {
          min: PLAN_867_RULES.minPolicyTermYears,
          max: PLAN_867_RULES.maxPolicyTermYears,
          actual: input.policyTermYears,
        },
      });
    }

    const vestingAge = input.age + input.policyTermYears;
    if (vestingAge > PLAN_867_RULES.maxVestingAge) {
      eligible = false;
      reasons.push(`Vesting age (${vestingAge}) would exceed the maximum vesting age of ${PLAN_867_RULES.maxVestingAge}.`);
      reasonCodes.push({
        code: "maturity_age_too_high",
        params: { max: PLAN_867_RULES.maxVestingAge, actual: vestingAge },
      });
    } else if (vestingAge < PLAN_867_RULES.minVestingAge) {
      eligible = false;
      reasons.push(`Vesting age (${vestingAge}) would be below the minimum vesting age of ${PLAN_867_RULES.minVestingAge}.`);
      reasonCodes.push({
        code: "maturity_age_too_low",
        params: { min: PLAN_867_RULES.minVestingAge, actual: vestingAge },
      });
    }
  }

  if (input.annualPremium == null) {
    missingInputs.push("annualPremium");
  } else {
    const mode = input.premiumMode ?? "yearly";
    const minPremium = PLAN_867_RULES.minPremiumByMode[mode];
    if (input.annualPremium < minPremium) {
      eligible = false;
      reasons.push(`Premium of ${input.annualPremium} is below the minimum of ${minPremium} for ${mode} mode.`);
      reasonCodes.push({
        code: "sum_assured_below_min",
        params: { min: minPremium, actual: input.annualPremium },
      });
    }
  }

  if (eligible === true && missingInputs.length > 0) {
    eligible = null;
  }

  reasons.push(UNDERWRITING_DISCLAIMER);
  return { eligible, reasons, reasonCodes, missingInputs, sourceVersion: SOURCE_VERSION };
}

// ---- Phase 3: benefit engine ----
// NEVER sets `maturityBenefit` — the vesting Unit Fund Value depends on
// NAV performance and can never be projected. Only the two genuinely
// guaranteed, market-independent components are reported.
export function calculateBenefits(input: Plan867Input) {
  const missingInputs: string[] = [];
  if (input.annualPremium == null) missingInputs.push("annualPremium");
  if (missingInputs.length > 0) {
    return { available: false as const, missingInputs };
  }

  const premium = input.annualPremium as number;
  const isSingle = input.premiumMode === "single";
  const guaranteedBenefits: Record<string, number> = {};

  // Assured Death Benefit at inception — the guaranteed floor before any
  // Unit Fund Value (which could be higher OR lower and is never assumed
  // here). "Total Premiums received" at inception is just one payment.
  guaranteedBenefits.assuredDeathBenefitAtInception = Math.round(
    (PLAN_867_RULES.assuredDeathBenefitPercentOfPremiums / 100) * premium
  );

  if (input.policyTermYears != null) {
    guaranteedBenefits.guaranteedAdditionsCumulative = cumulativeGuaranteedAdditions(
      premium,
      isSingle,
      input.policyTermYears
    );
  }

  return {
    available: true as const,
    guaranteedBenefits,
    nonGuaranteedIllustrations: undefined,
    deathBenefit: guaranteedBenefits.assuredDeathBenefitAtInception,
    // Deliberately never set: Unit Fund Value at vesting is NAV-dependent
    // and can never be projected without inventing a return assumption.
    maturityBenefit: undefined,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}

// ---- Phase 6: cost structure ----
// Only the two flat, unconditional rates are reported. Policy
// Administration Charge and Discontinuance Charge are real, published,
// but genuinely conditional on policy year and premium band — a single
// EngineResult<number> per field can't honestly represent them without
// picking an arbitrary example, so they stay unavailable rather than
// risk reporting a wrong number as if it universally applied.
export function calculateCosts(sourceId: string): CostStructureResult {
  return {
    expenseRatio: { status: "unavailable", value: null, sourceIds: [] },
    fundManagementCharge: {
      status: "verified",
      value: PLAN_867_RULES.fundManagementChargePercent,
      sourceIds: [sourceId],
    },
    mortalityCharge: {
      status: "verified",
      value: PLAN_867_RULES.mortalityChargePercent,
      sourceIds: [sourceId],
    },
    adminCharge: { status: "unavailable", value: null, sourceIds: [] },
    exitLoad: { status: "unavailable", value: null, sourceIds: [] },
  };
}

// ---- Phase 7: liquidity ----
// No loan is ever available (verified, unconditional). Surrender/
// withdrawal is locked for the first 5 years and only available after —
// this engine has no "years elapsed since inception" input, so it cannot
// honestly report a flat true/false; "conditional" is the accurate status.
export function evaluateLiquidity(sourceId: string): LiquidityResult {
  return {
    surrenderAvailable: { status: "conditional", value: null, sourceIds: [sourceId] },
    loanAvailable: { status: "verified", value: false, sourceIds: [sourceId] },
  };
}
