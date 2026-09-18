// Verified rule implementation for LIC's New Jeevan Shanti (Plan 758, UIN
// 512N338V08). A Non-Par, Non-Linked, Single Premium, Individual, Savings,
// DEFERRED Annuity plan — the only one of the four annuity products in
// this codebase where annuity payments start after a chosen deferment
// period rather than immediately. Reuses the shared annuity engine
// (lib/insurance/providers/lic/plans/annuityShared.ts) for the common
// eligibility/benefit/liquidity shape, with one extra bespoke layer: the
// deferment period and the resulting vesting-age bound, which the shared
// module has no field for (every other annuity product here is
// immediate).
//
// Death Benefit (§3, p.3-4): "Higher of [Purchase Price + Accrued
// Additional Benefit on Death − Total annuity paid till date] OR 105% of
// Purchase Price". The Accrued Additional Benefit needs the monthly-mode
// annuity rate per unit Purchase Price for the customer's exact age/
// option/deferment period — a rate this codebase only has ONE (yearly-
// mode) sample point for, so it can never be honestly computed for
// arbitrary inputs. Only the unconditional 105%-of-Purchase-Price floor is
// reported (same "known floor, unverified upside" convention as Plan
// 867's Assured Death Benefit) — never the full "higher of" formula.
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): Lic_NEW_Jeevan_Shanti__2025__Eng_Singal_page_21.08.2025.pdf —
// full 20-page document read in its entirety. Identity confirmed on page
// 2: "LIC's New Jeevan Shanti (UIN:512N338V08)". Only source used. See
// docs/lic-plan758-verification.md.

import {
  AnnuityInput,
  AnnuityRules,
  calculateAnnuityBenefits,
  evaluateAnnuityEligibility,
  evaluateAnnuityLiquidity,
} from "@/lib/insurance/providers/lic/plans/annuityShared";
import { CostStructureResult, EligibilityReason, EligibilityResult } from "@/types/insurance";

export const PLAN_758_UIN = "512N338V08";

const SOURCE_VERSION = "LIC's New Jeevan Shanti Sales Brochure, UIN 512N338V08";
const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

export const MIN_DEFERMENT_PERIOD_YEARS = 1; // §4, p.4
export const MAX_DEFERMENT_PERIOD_YEARS = 5; // §4, p.4 — subject to Maximum Vesting Age
export const MIN_VESTING_AGE = 31; // §4, p.4
export const MAX_VESTING_AGE = 80; // §4, p.4

export const PLAN_758_RULES: AnnuityRules = {
  minEntryAge: 30, // §4, p.4
  maxEntryAge: 79, // §4, p.4
  minPurchasePriceForAge: () => 150000, // §4, p.4: flat ₹1,50,000, subject to minimum annuity
  options: [
    // §3, p.3: both options share the identical Death Benefit rule —
    // higher of (unverifiable Accrued-Benefit formula) or 105% of
    // Purchase Price. Loan/Surrender (§11/§12, p.11-12) both apply
    // generally, not restricted to either option.
    {
      code: "1", // Option 1: Deferred annuity for Single life
      deathBenefitType: "full_purchase_price",
      deathBenefitPercentOfPurchasePrice: 105,
      allowsSurrender: true,
      allowsLoan: true,
    },
    {
      code: "2", // Option 2: Deferred annuity for Joint life
      isJointLife: true,
      deathBenefitType: "full_purchase_price",
      deathBenefitPercentOfPurchasePrice: 105,
      allowsSurrender: true,
      allowsLoan: true,
    },
  ],
  // §8, p.7: Purchase Price ₹10 lakh; Age 45; Deferment Period 5 years;
  // Secondary Annuitant age 35 (Option 2 only); Yearly mode.
  sampleIllustrations: [
    {
      purchasePrice: 1000000,
      age: 45,
      secondaryAge: 35,
      defermentPeriodYears: 5,
      mode: "yearly",
      amounts: { "1": 86100, "2": 82800 },
    },
  ],
};

export interface Plan758Input extends AnnuityInput {
  defermentPeriodYears?: number;
}

export function evaluateEligibility(input: Plan758Input): EligibilityResult {
  const base = evaluateAnnuityEligibility(PLAN_758_RULES, input, SOURCE_VERSION, UNDERWRITING_DISCLAIMER);
  const reasonCodes: EligibilityReason[] = [...(base.reasonCodes ?? [])];
  const missingInputs = [...base.missingInputs];
  let eligible = base.eligible;

  if (input.defermentPeriodYears == null) {
    if (!missingInputs.includes("defermentPeriodYears")) missingInputs.push("defermentPeriodYears");
  } else {
    if (
      input.defermentPeriodYears < MIN_DEFERMENT_PERIOD_YEARS ||
      input.defermentPeriodYears > MAX_DEFERMENT_PERIOD_YEARS
    ) {
      eligible = false;
      reasonCodes.push({
        code: "term_out_of_range",
        params: {
          min: MIN_DEFERMENT_PERIOD_YEARS,
          max: MAX_DEFERMENT_PERIOD_YEARS,
          actual: input.defermentPeriodYears,
        },
      });
    }

    const vestingAge = input.age + input.defermentPeriodYears;
    if (vestingAge > MAX_VESTING_AGE) {
      eligible = false;
      reasonCodes.push({ code: "maturity_age_too_high", params: { max: MAX_VESTING_AGE, actual: vestingAge } });
    } else if (vestingAge < MIN_VESTING_AGE) {
      eligible = false;
      reasonCodes.push({ code: "maturity_age_too_low", params: { min: MIN_VESTING_AGE, actual: vestingAge } });
    }
  }

  if (eligible === true && missingInputs.length > 0) eligible = null;

  return { ...base, eligible, reasonCodes, missingInputs };
}

export function calculateBenefits(input: Plan758Input) {
  return calculateAnnuityBenefits(PLAN_758_RULES, input, SOURCE_VERSION);
}

export function evaluateLiquidity(sourceId: string, input: Plan758Input) {
  return evaluateAnnuityLiquidity(PLAN_758_RULES, input, sourceId);
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
