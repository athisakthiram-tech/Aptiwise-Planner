// Registers existing per-plan engines under the generic LicProductEngine
// contract (types/insurance.ts). This is an ADAPTER layer only: it never
// changes plan733.ts's formulas, numerical behaviour, or its existing
// (still directly used) engineRegistry.ts entry — see
// lib/insurance/engineRegistry.ts, which the existing UI keeps consuming
// unchanged. Adding a second product here means adding one more entry to
// LIC_PRODUCT_ENGINES, not a new bespoke calculator file.

import {
  BenefitCalculationResult,
  EligibilityResult,
  LicCalculationContext,
  LicProductEngine,
  PremiumCalculationResult,
} from "@/types/insurance";
import * as plan733 from "@/lib/insurance/providers/lic/plans/plan733";
import { getLicProductByIdentity } from "@/lib/insurance/providers/lic/catalogue";

const PLAN_733_PRODUCT = getLicProductByIdentity("733", plan733.PLAN_733_UIN);
if (!PLAN_733_PRODUCT) {
  throw new Error("LIC catalogue is missing Plan 733 — engine registration is inconsistent.");
}

function plan733EvaluateEligibility(context: LicCalculationContext): EligibilityResult {
  if (context.age == null) {
    return { eligible: null, reasons: [], reasonCodes: [], missingInputs: ["age"] };
  }
  return plan733.evaluateEligibility({
    age: context.age,
    gender: context.gender,
    sumAssured: context.basicSumAssured,
    policyTermYears: context.policyTermYears,
    premiumPaymentTermYears: context.premiumPayingTermYears,
    premiumFrequency: context.premiumMode,
    product: PLAN_733_PRODUCT!,
  });
}

function plan733CalculatePremium(context: LicCalculationContext): PremiumCalculationResult {
  if (context.age == null) {
    return { available: false, missingInputs: ["age"] };
  }
  return plan733.calculatePremium({
    age: context.age,
    gender: context.gender,
    sumAssured: context.basicSumAssured,
    policyTermYears: context.policyTermYears,
    premiumPaymentTermYears: context.premiumPayingTermYears,
    premiumFrequency: context.premiumMode,
    product: PLAN_733_PRODUCT!,
  });
}

function plan733CalculateBenefits(context: LicCalculationContext): BenefitCalculationResult {
  // plan733.calculateBenefits never reads `age` — only sumAssured — so a
  // missing age must not block a benefits-only calculation.
  return plan733.calculateBenefits({
    age: context.age ?? 0,
    gender: context.gender,
    sumAssured: context.basicSumAssured,
    policyTermYears: context.policyTermYears,
    premiumPaymentTermYears: context.premiumPayingTermYears,
    premiumFrequency: context.premiumMode,
    product: PLAN_733_PRODUCT!,
  });
}

const PLAN_733_ENGINE: LicProductEngine = {
  provider: "LIC",
  planNumber: "733",
  uin: plan733.PLAN_733_UIN,
  // Declared honestly from what plan733.ts actually verifies (see that
  // file's comments) — never exaggerated:
  //  - eligibility: every rule is fully evaluated from the brochure -> verified
  //  - premium: only exact sample-table matches are ever returned -> partial
  //  - benefits: only guaranteed, BSA-anchored components; death benefit
  //    and any bonus are never computed -> partial
  //  - familyProtection/tax/costs/liquidity: not computed at all -> unavailable
  capabilities: {
    eligibility: "verified",
    premium: "partial",
    benefits: "partial",
    familyProtection: "unavailable",
    tax: "unavailable",
    costs: "unavailable",
    liquidity: "unavailable",
  },
  evaluateEligibility: plan733EvaluateEligibility,
  calculatePremium: plan733CalculatePremium,
  calculateBenefits: plan733CalculateBenefits,
};

export const LIC_PRODUCT_ENGINES: LicProductEngine[] = [PLAN_733_ENGINE];

function key(planNumber: string, uin: string): string {
  return `${planNumber}::${uin}`;
}

const ENGINE_REGISTRY = new Map<string, LicProductEngine>(
  LIC_PRODUCT_ENGINES.map((engine) => [key(engine.planNumber, engine.uin), engine])
);

// Exact planNumber+UIN lookup only — same version-safety rule as
// getLicProductByIdentity. A wrong/stale UIN returns undefined, never the
// same-numbered product's engine.
export function getLicProductEngine(planNumber: string, uin: string): LicProductEngine | undefined {
  return ENGINE_REGISTRY.get(key(planNumber, uin));
}
