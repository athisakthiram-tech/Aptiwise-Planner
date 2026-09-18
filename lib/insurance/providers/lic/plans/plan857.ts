// Verified rule implementation for LIC's Jeevan Akshay-VII (Plan 857, UIN
// 512N337V07). A Non-Par, Non-Linked, Individual, Savings, IMMEDIATE
// Annuity plan built on top of the shared annuity engine
// (lib/insurance/providers/lic/plans/annuityShared.ts) — see that file's
// header comment for the shared conventions (exact-lookup-only annuity
// amounts, death-benefit classification per option, never a maturity
// benefit).
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Jeevan_Akshay_VII_Sales_Brochure_4_inch_x_9_inch_Eng__20082025.pdf
// — full 20-page document read in its entirety (the tail from p.15 onward
// is boilerplate: grievance/Section 45/rebates, consistent with every
// other brochure in this codebase). Identity confirmed on page 2: "LIC's
// Jeevan Akshay-VII (UIN: 512N337V07)". Only source used. See
// docs/lic-plan857-verification.md.

import {
  AnnuityInput,
  AnnuityRules,
  calculateAnnuityBenefits,
  evaluateAnnuityEligibility,
  evaluateAnnuityLiquidity,
} from "@/lib/insurance/providers/lic/plans/annuityShared";
import { CostStructureResult } from "@/types/insurance";

export const PLAN_857_UIN = "512N337V07";

const SOURCE_VERSION = "LIC's Jeevan Akshay-VII Sales Brochure, UIN 512N337V07";
const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

// §4, p.5: age-banded minimum Purchase Price — ₹10,00,000 for ages 25-29,
// ₹1,00,000 (subject to minimum annuity) from age 30 onward.
function minPurchasePriceForAge(age: number): number {
  return age < 30 ? 1000000 : 100000;
}

export const PLAN_857_RULES: AnnuityRules = {
  minEntryAge: 25, // §4.ii, p.5
  maxEntryAge: 85, // §4.iii, p.5 (Option F alone extends to 100 — not modeled, see verification doc)
  minPurchasePriceForAge,
  options: [
    { code: "A", deathBenefitType: "none" }, // §2.a, p.3: "nothing shall be payable"
    { code: "B", deathBenefitType: "guaranteed_period", guaranteedPeriodYears: 5 },
    { code: "C", deathBenefitType: "guaranteed_period", guaranteedPeriodYears: 10 },
    { code: "D", deathBenefitType: "guaranteed_period", guaranteedPeriodYears: 15 },
    { code: "E", deathBenefitType: "guaranteed_period", guaranteedPeriodYears: 20 },
    // §12/13, p.13-14: Loan and Surrender are both allowed ONLY under
    // Option F and Option J — every other option, neither is available.
    { code: "F", deathBenefitType: "full_purchase_price", allowsSurrender: true, allowsLoan: true },
    { code: "G", deathBenefitType: "none" }, // §2.a Option G row: "nothing shall be payable"
    { code: "H", isJointLife: true, deathBenefitType: "not_computed" },
    { code: "I", isJointLife: true, deathBenefitType: "not_computed" },
    {
      code: "J",
      isJointLife: true,
      deathBenefitType: "full_purchase_price",
      allowsSurrender: true,
      allowsLoan: true,
    },
  ],
  // §8, p.9: Purchase Price ₹10,00,000; Age 60 (secondary 55); Yearly mode.
  sampleIllustrations: [
    {
      purchasePrice: 1000000,
      age: 60,
      secondaryAge: 55,
      mode: "yearly",
      amounts: {
        A: 86100,
        B: 85500,
        C: 84000,
        D: 81800,
        E: 79200,
        F: 64000,
        G: 68700,
        H: 79600,
        I: 74000,
        J: 63300,
      },
    },
  ],
};

export function evaluateEligibility(input: AnnuityInput) {
  return evaluateAnnuityEligibility(PLAN_857_RULES, input, SOURCE_VERSION, UNDERWRITING_DISCLAIMER);
}

export function calculateBenefits(input: AnnuityInput) {
  return calculateAnnuityBenefits(PLAN_857_RULES, input, SOURCE_VERSION);
}

export function evaluateLiquidity(sourceId: string, input: AnnuityInput) {
  return evaluateAnnuityLiquidity(PLAN_857_RULES, input, sourceId);
}

// Annuity plans carry no unit fund and no published charge structure —
// this dimension genuinely doesn't exist for this product family, unlike
// a value that exists but couldn't be verified.
export function calculateCosts(): CostStructureResult {
  return {
    expenseRatio: { status: "not_applicable", value: null, sourceIds: [] },
    fundManagementCharge: { status: "not_applicable", value: null, sourceIds: [] },
    mortalityCharge: { status: "not_applicable", value: null, sourceIds: [] },
    adminCharge: { status: "not_applicable", value: null, sourceIds: [] },
    exitLoad: { status: "not_applicable", value: null, sourceIds: [] },
  };
}
