// Verified rule implementation for LIC's Smart Pension (Plan 879, UIN
// 512N386V01). A Non-Par, Non-Linked, Individual, Savings, IMMEDIATE
// Annuity plan with the widest option set of the four annuity products in
// this codebase (22 options). Built on the shared annuity engine
// (lib/insurance/providers/lic/plans/annuityShared.ts) — see that file's
// header comment for the shared conventions.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): Smart_Pension_Individual_Sales_Brochure_Eng.pdf — full
// 36-page document read in its entirety (the tail from p.21 onward is
// boilerplate: grievance/Section 45/rebates, consistent with every other
// brochure in this codebase). Identity confirmed on page 2: "LIC's Smart
// Pension (UIN: 512N386V01)". Only source used. See
// docs/lic-plan879-verification.md.

import {
  AnnuityInput,
  AnnuityRules,
  calculateAnnuityBenefits,
  evaluateAnnuityEligibility,
  evaluateAnnuityLiquidity,
} from "@/lib/insurance/providers/lic/plans/annuityShared";
import { CostStructureResult } from "@/types/insurance";

export const PLAN_879_UIN = "512N386V01";

const SOURCE_VERSION = "LIC's Smart Pension Sales Brochure, UIN 512N386V01";
const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export const PLAN_879_RULES: AnnuityRules = {
  minEntryAge: 18, // §3.f, p.4-5 — same minimum for every option
  maxEntryAge: 85, // §3.f, p.5 — the general ceiling; three options publish a different one below
  minPurchasePriceForAge: () => 100000, // §3.a, p.4: flat ₹1,00,000, no age band
  options: [
    { code: "A", deathBenefitType: "none" }, // "nothing shall be payable" (§4.a, p.6)
    { code: "B1", deathBenefitType: "guaranteed_period", guaranteedPeriodYears: 5 },
    { code: "B2", deathBenefitType: "guaranteed_period", guaranteedPeriodYears: 10 },
    { code: "B3", deathBenefitType: "guaranteed_period", guaranteedPeriodYears: 15 },
    { code: "B4", deathBenefitType: "guaranteed_period", guaranteedPeriodYears: 20 },
    { code: "C1", deathBenefitType: "none" }, // increasing 3% p.a., "nothing shall be payable" on death
    { code: "C2", deathBenefitType: "none" }, // increasing 6% p.a., same
    // Option D: Death Benefit = Balance of Purchase Price (PP less
    // annuities already paid). At inception (nothing paid yet) that
    // equals the full Purchase Price — same "at inception" convention as
    // Plan 867's Assured Death Benefit. Surrender allowed, Loan NOT (§10
    // lists D; §11 does not).
    { code: "D", deathBenefitType: "full_purchase_price", allowsSurrender: true, allowsLoan: false },
    // Options E1-E5: an early-return-of-PP percentage becomes payable on
    // survival to a milestone age, after which the on-death benefit is
    // reduced by whatever's already been paid — genuinely state-dependent
    // (needs "how much early return has already been paid" tracking this
    // engine's single-call context can't carry), so death benefit is left
    // "not_computed". Both Surrender and Loan ARE allowed (§10, §11).
    {
      code: "E1",
      deathBenefitType: "not_computed",
      allowsSurrender: true,
      allowsLoan: true,
      maxEntryAgeOverride: 65,
    },
    {
      code: "E2",
      deathBenefitType: "not_computed",
      allowsSurrender: true,
      allowsLoan: true,
      maxEntryAgeOverride: 65,
    },
    {
      code: "E3",
      deathBenefitType: "not_computed",
      allowsSurrender: true,
      allowsLoan: true,
      maxEntryAgeOverride: 70,
    },
    {
      code: "E4",
      deathBenefitType: "not_computed",
      allowsSurrender: true,
      allowsLoan: true,
      maxEntryAgeOverride: 70,
    },
    {
      code: "E5",
      deathBenefitType: "not_computed",
      allowsSurrender: true,
      allowsLoan: true,
      maxEntryAgeOverride: 70,
    },
    {
      code: "F",
      deathBenefitType: "full_purchase_price",
      allowsSurrender: true,
      allowsLoan: true,
      maxEntryAgeOverride: 100,
    },
    { code: "G1", isJointLife: true, deathBenefitType: "not_computed" },
    { code: "G2", isJointLife: true, deathBenefitType: "not_computed" },
    { code: "H1", isJointLife: true, deathBenefitType: "not_computed" },
    { code: "H2", isJointLife: true, deathBenefitType: "not_computed" },
    { code: "I1", isJointLife: true, deathBenefitType: "not_computed" },
    { code: "I2", isJointLife: true, deathBenefitType: "not_computed" },
    { code: "J", isJointLife: true, deathBenefitType: "full_purchase_price", allowsSurrender: true, allowsLoan: true },
  ],
  // §12, p.25-26: Purchase Price ₹10,00,000; Age 60 (secondary 55); Yearly
  // mode; Agents/intermediary channel, new customer.
  sampleIllustrations: [
    {
      purchasePrice: 1000000,
      age: 60,
      secondaryAge: 55,
      mode: "yearly",
      amounts: {
        A: 85000,
        B1: 84500,
        B2: 83200,
        B3: 81400,
        B4: 79200,
        C1: 66200,
        C2: 54800,
        D: 81700,
        E1: 57900,
        E2: 51000,
        E3: 61400,
        E4: 57900,
        E5: 60900,
        F: 64900,
        G1: 78900,
        G2: 74000,
        H1: 60200,
        H2: 49400,
        I1: 55600,
        I2: 45100,
        J: 64300,
      },
    },
  ],
};

export function evaluateEligibility(input: AnnuityInput) {
  return evaluateAnnuityEligibility(PLAN_879_RULES, input, SOURCE_VERSION, UNDERWRITING_DISCLAIMER);
}

export function calculateBenefits(input: AnnuityInput) {
  return calculateAnnuityBenefits(PLAN_879_RULES, input, SOURCE_VERSION);
}

export function evaluateLiquidity(sourceId: string, input: AnnuityInput) {
  return evaluateAnnuityLiquidity(PLAN_879_RULES, input, sourceId);
}

export function calculateCosts(): CostStructureResult {
  return {
    expenseRatio: { status: "not_applicable", value: null, sourceIds: [] },
    fundManagementCharge: { status: "not_applicable", value: null, sourceIds: [] },
    mortalityCharge: { status: "not_applicable", value: null, sourceIds: [] },
    adminCharge: { status: "not_applicable", value: null, sourceIds: [] },
    exitLoad: { status: "not_applicable", value: null, sourceIds: [] },
  };
}
