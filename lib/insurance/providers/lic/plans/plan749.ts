// Verified rule implementation for LIC's Nivesh Plus (Plan 849, UIN
// 512L317V02 — this file/module and its exported PLAN_749_* symbols
// keep their historical "749" naming from before Phase 4 corrected the
// registered plan number; see catalogue.ts's own comment). A Non-Par,
// UNIT-LINKED (market-linked), Single Premium,
// Life, Individual Savings plan — closely related in shape to Plan 873
// (Index Plus): same non-negotiable guardrail that the Unit Fund Value is
// NAV-dependent and is NEVER projected here (`calculateBenefits` never
// sets `maturityBenefit`), and a Basic Sum Assured that's a multiple of
// premium the customer chooses, always directly computable, no rate-table
// lookup needed. Kept as its own file rather than sharing code with
// plan873.ts — the two differ enough (Single Premium only vs. all 4
// modes; different multiples, age bands and term tables; no 105%-of-
// premiums floor in this product's death benefit formula) that a shared
// abstraction would cost more than it saves for just two products.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Nivesh_Plus__Sales_Brochure_Eng.pdf — full 27-page
// document read in its entirety (the tail from p.22 onward is
// boilerplate: grievance/Section 45/rebates, consistent with every other
// brochure in this codebase). Identity confirmed on page 2: "LIC's
// Nivesh Plus (UIN:512L317V02)". Only source used. See
// docs/lic-plan749-verification.md.

import { CostStructureResult, EligibilityReason, EligibilityResult, LiquidityResult } from "@/types/insurance";

export const PLAN_749_UIN = "512L317V02";

const SOURCE_VERSION = "LIC's Nivesh Plus Sales Brochure, UIN 512L317V02";
const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export type Plan749BsaOption = 1 | 2; // Option 1: 1.25x Single Premium; Option 2: 10x Single Premium

export const PLAN_749_RULES = {
  bsaMultiple: { 1: 1.25, 2: 10 } as Record<Plan749BsaOption, number>,
  maxEntryAge: { 1: 70, 2: 35 } as Record<Plan749BsaOption, number>, // §1.c, p.3
  minMaturityAge: 18, // §1.d, p.3
  maxMaturityAge: { 1: 85, 2: 50 } as Record<Plan749BsaOption, number>, // §1.e, p.3
  minPremium: 125000, // §1.h, p.3
  premiumMultiple: 5000, // p.3
  // §1.f, p.3: Option 1 has one flat term range regardless of age; Option
  // 2's range narrows by age band (its own max entry age is only 35).
  policyTermRangeForOption(option: Plan749BsaOption, age: number): { min: number; max: number } | undefined {
    if (option === 1) return { min: 10, max: 25 };
    if (age <= 25) return { min: 10, max: 25 };
    if (age <= 30) return { min: 10, max: 20 };
    if (age <= 35) return { min: 10, max: 10 };
    return undefined; // above Option 2's own max entry age of 35
  },
  // §3, p.4-5: Guaranteed Additions as a % of Single Premium, credited
  // once at the end of each specified policy year — one flat schedule,
  // no premium-band branching (unlike Plan 873).
  guaranteedAdditionSchedule: [
    { policyYear: 6, percent: 3 },
    { policyYear: 10, percent: 4 },
    { policyYear: 15, percent: 5 },
    { policyYear: 20, percent: 6 },
    { policyYear: 25, percent: 7 },
  ] as const,
  fundManagementChargePercent: 1.35, // §7.D, p.14
  // §7.B, p.13-14: rate of Mortality Charge per annum per ₹1000 Sum at
  // Risk, for a healthy life — an exact-lookup-only table (only 4
  // published points here, unlike Plan 873's 5; every other age stays
  // unavailable rather than interpolated).
  mortalityChargePerThousandByAge: { 25: 1.26, 35: 1.62, 45: 3.48, 50: 5.99 } as Record<number, number>,
} as const;

export interface Plan749Input {
  age: number;
  policyTermYears?: number;
  singlePremium?: number;
  bsaOption?: Plan749BsaOption;
}

// Fully deterministic — no NAV or investment-return assumption anywhere.
export function cumulativeGuaranteedAdditions(singlePremium: number, policyTermYears: number): number {
  let total = 0;
  for (const row of PLAN_749_RULES.guaranteedAdditionSchedule) {
    if (row.policyYear <= policyTermYears) total += (row.percent / 100) * singlePremium;
  }
  return Math.round(total);
}

export function evaluateEligibility(input: Plan749Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  if (input.bsaOption == null) {
    missingInputs.push("bsaOption");
  } else {
    const maxEntryAge = PLAN_749_RULES.maxEntryAge[input.bsaOption];
    if (input.age > maxEntryAge) {
      eligible = false;
      reasons.push(`Age ${input.age} exceeds the maximum entry age of ${maxEntryAge} for Option ${input.bsaOption}.`);
      reasonCodes.push({ code: "age_out_of_range", params: { min: 0, max: maxEntryAge, actual: input.age } });
    }
  }

  if (input.singlePremium == null) {
    missingInputs.push("singlePremium");
  } else if (input.singlePremium < PLAN_749_RULES.minPremium) {
    eligible = false;
    reasons.push(`Single Premium of ${input.singlePremium} is below the minimum of ${PLAN_749_RULES.minPremium}.`);
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_749_RULES.minPremium, actual: input.singlePremium },
    });
  }

  if (input.bsaOption != null) {
    if (input.policyTermYears == null) {
      missingInputs.push("policyTermYears");
    } else {
      const range = PLAN_749_RULES.policyTermRangeForOption(input.bsaOption, input.age);
      if (!range || input.policyTermYears < range.min || input.policyTermYears > range.max) {
        eligible = false;
        reasons.push(
          range
            ? `Policy term ${input.policyTermYears} years is outside the allowed range of ${range.min}-${range.max} years for this age/option.`
            : `No policy term is available for age ${input.age} under Option ${input.bsaOption}.`
        );
        reasonCodes.push({
          code: "term_out_of_range",
          params: { min: range?.min ?? 0, max: range?.max ?? 0, actual: input.policyTermYears },
        });
      } else {
        const maxMaturityAge = PLAN_749_RULES.maxMaturityAge[input.bsaOption];
        const maturityAge = input.age + input.policyTermYears;
        if (maturityAge > maxMaturityAge) {
          eligible = false;
          reasonCodes.push({ code: "maturity_age_too_high", params: { max: maxMaturityAge, actual: maturityAge } });
        } else if (maturityAge < PLAN_749_RULES.minMaturityAge) {
          eligible = false;
          reasonCodes.push({
            code: "maturity_age_too_low",
            params: { min: PLAN_749_RULES.minMaturityAge, actual: maturityAge },
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
// Assured (the customer's own direct choice, no lookup needed) and the
// cumulative Guaranteed Additions. Unlike Plan 873, this product's own
// Death Benefit formula has no 105%-of-premiums floor at all — it is
// simply the higher of Basic Sum Assured or Unit Fund Value, so the
// guaranteed floor reported here IS just the Basic Sum Assured.
export function calculateBenefits(input: Plan749Input) {
  const missingInputs: string[] = [];
  if (input.singlePremium == null) missingInputs.push("singlePremium");
  if (input.bsaOption == null) missingInputs.push("bsaOption");
  if (missingInputs.length > 0) {
    return { available: false as const, missingInputs };
  }

  const singlePremium = input.singlePremium as number;
  const bsaOption = input.bsaOption as Plan749BsaOption;
  const basicSumAssured = Math.round(PLAN_749_RULES.bsaMultiple[bsaOption] * singlePremium);
  const guaranteedBenefits: Record<string, number> = { basicSumAssured };

  if (input.policyTermYears != null) {
    guaranteedBenefits.guaranteedAdditionsCumulative = cumulativeGuaranteedAdditions(
      singlePremium,
      input.policyTermYears
    );
  }

  return {
    available: true as const,
    guaranteedBenefits,
    nonGuaranteedIllustrations: undefined,
    deathBenefit: basicSumAssured,
    // Unit Fund Value at maturity is NAV-dependent — never projected.
    maturityBenefit: undefined,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}

// Only Fund Management Charge (flat, unconditional) and Mortality Charge
// (an exact-lookup-only table for a healthy life at 4 published ages) are
// reported. Premium Allocation / Discontinuance / Switching / Partial
// Withdrawal / Miscellaneous Charges are all real and published but
// conditional on policy year and/or premium band and/or channel in ways a
// single EngineResult<number> can't honestly represent.
export function calculateCosts(sourceId: string, age?: number): CostStructureResult {
  const mortalityRate = age != null ? PLAN_749_RULES.mortalityChargePerThousandByAge[age] : undefined;
  return {
    expenseRatio: { status: "unavailable", value: null, sourceIds: [] },
    fundManagementCharge: {
      status: "verified",
      value: PLAN_749_RULES.fundManagementChargePercent,
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

// No loan is ever available (verified, unconditional — §14, p.19). The
// Unit Fund is locked for the first 5 policy years and only available
// after — this engine has no "years elapsed" input, so "conditional" is
// the accurate status, same as Plans 867/873.
export function evaluateLiquidity(sourceId: string): LiquidityResult {
  return {
    surrenderAvailable: { status: "conditional", value: null, sourceIds: [sourceId] },
    loanAvailable: { status: "verified", value: false, sourceIds: [sourceId] },
  };
}
