// Verified rule implementation for LIC's Saral Pension (Plan 862, UIN
// 512N342V05). A Non-Par, Non-Linked, Single Premium, Individual,
// IMMEDIATE Annuity plan — one of IRDAI's "Saral" (standardised) products,
// so its terms are identical across every life insurer that offers it.
// Built on the shared annuity engine
// (lib/insurance/providers/lic/plans/annuityShared.ts) — see that file's
// header comment for the shared conventions.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): LIC_Saral_Pension_Sales_Brochure_4_inch_x_9_inch_Eng_1_1.pdf
// — full 10-page document read in its entirety. Identity confirmed on
// page 2: "LIC's Saral Pension (UIN: 512N342V05)... Plan No.: 862". Only
// source used. See docs/lic-plan862-verification.md.

import {
  AnnuityInput,
  AnnuityRules,
  calculateAnnuityBenefits,
  evaluateAnnuityEligibility,
  evaluateAnnuityLiquidity,
} from "@/lib/insurance/providers/lic/plans/annuityShared";
import { CostStructureResult } from "@/types/insurance";

export const PLAN_862_UIN = "512N342V05";

const SOURCE_VERSION = "LIC's Saral Pension Sales Brochure, UIN 512N342V05";
const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export const PLAN_862_RULES: AnnuityRules = {
  minEntryAge: 40, // §4.i, p.3
  maxEntryAge: 80, // §4.ii, p.3
  // §4.iv, p.3: "Minimum Purchase Price shall depend on the Minimum
  // Annuity... Option chosen and age of the Annuitant" — no flat figure is
  // published; deriving one would need the full annuity-rate table this
  // codebase doesn't have. Left unenforced rather than guessed at.
  options: [
    // §9/§8, p.4-5: Loan and Surrender are both structurally available
    // under both options (this plan only has two, both Return-of-
    // Purchase-Price), but Surrender is further gated on a critical-
    // illness diagnosis — see surrenderConditionReasonCode below, which
    // keeps that dimension honestly "conditional" rather than a flat yes.
    { code: "I", deathBenefitType: "full_purchase_price", allowsSurrender: true, allowsLoan: true },
    {
      code: "II",
      isJointLife: true,
      deathBenefitType: "full_purchase_price",
      allowsSurrender: true,
      allowsLoan: true,
    },
  ],
  // §7, p.4: Purchase Price ₹10,00,000; Age 60 (spouse 55); Yearly mode.
  sampleIllustrations: [
    {
      purchasePrice: 1000000,
      age: 60,
      secondaryAge: 55,
      mode: "yearly",
      amounts: { I: 62300, II: 61600 },
    },
  ],
  // §8, p.4: "if the annuitant or spouse or any of the children... is
  // diagnosed as suffering from any of the specified critical illnesses".
  surrenderConditionReasonCode: "surrender_requires_critical_illness",
};

export function evaluateEligibility(input: AnnuityInput) {
  return evaluateAnnuityEligibility(PLAN_862_RULES, input, SOURCE_VERSION, UNDERWRITING_DISCLAIMER);
}

export function calculateBenefits(input: AnnuityInput) {
  return calculateAnnuityBenefits(PLAN_862_RULES, input, SOURCE_VERSION);
}

export function evaluateLiquidity(sourceId: string, input: AnnuityInput) {
  return evaluateAnnuityLiquidity(PLAN_862_RULES, input, sourceId);
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
