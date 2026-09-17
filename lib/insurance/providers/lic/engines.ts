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
  InsuranceProduct,
  LicCalculationContext,
  LicCalculatorInput,
  LicProductEngine,
  LiquidityResult,
  PremiumCalculationResult,
  ProductCapabilities,
} from "@/types/insurance";
import * as plan733 from "@/lib/insurance/providers/lic/plans/plan733";
import * as plan736 from "@/lib/insurance/providers/lic/plans/plan736";
import * as plan717 from "@/lib/insurance/providers/lic/plans/plan717";
import * as plan714 from "@/lib/insurance/providers/lic/plans/plan714";
import * as plan715 from "@/lib/insurance/providers/lic/plans/plan715";
import * as plan774 from "@/lib/insurance/providers/lic/plans/plan774";
import * as plan912 from "@/lib/insurance/providers/lic/plans/plan912";
import * as plan734 from "@/lib/insurance/providers/lic/plans/plan734";
import * as plan881 from "@/lib/insurance/providers/lic/plans/plan881";
import * as plan748 from "@/lib/insurance/providers/lic/plans/plan748";
import * as plan770 from "@/lib/insurance/providers/lic/plans/plan770";
import * as plan889 from "@/lib/insurance/providers/lic/plans/plan889";
import { getLicProductByIdentity } from "@/lib/insurance/providers/lic/catalogue";

const PLAN_733_PRODUCT = getLicProductByIdentity("733", plan733.PLAN_733_UIN);
if (!PLAN_733_PRODUCT) {
  throw new Error("LIC catalogue is missing Plan 733 — engine registration is inconsistent.");
}

const PLAN_736_PRODUCT = getLicProductByIdentity("736", plan736.PLAN_736_UIN);
if (!PLAN_736_PRODUCT) {
  throw new Error("LIC catalogue is missing Plan 736 — engine registration is inconsistent.");
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

function plan736EvaluateEligibility(context: LicCalculationContext): EligibilityResult {
  if (context.age == null) {
    return { eligible: null, reasons: [], reasonCodes: [], missingInputs: ["age"] };
  }
  return plan736.evaluateEligibility({
    age: context.age,
    gender: context.gender,
    sumAssured: context.basicSumAssured,
    policyTermYears: context.policyTermYears,
    premiumPaymentTermYears: context.premiumPayingTermYears,
    premiumFrequency: context.premiumMode,
    product: PLAN_736_PRODUCT!,
  });
}

function plan736CalculatePremium(context: LicCalculationContext): PremiumCalculationResult {
  if (context.age == null) {
    return { available: false, missingInputs: ["age"] };
  }
  return plan736.calculatePremium({
    age: context.age,
    gender: context.gender,
    sumAssured: context.basicSumAssured,
    policyTermYears: context.policyTermYears,
    premiumPaymentTermYears: context.premiumPayingTermYears,
    premiumFrequency: context.premiumMode,
    product: PLAN_736_PRODUCT!,
  });
}

function plan736CalculateBenefits(context: LicCalculationContext): BenefitCalculationResult {
  // Unlike Plan 733, Plan 736's death-benefit formula (higher of BSA or
  // 7x annualised premium) does depend on age indirectly, via the
  // internal premium lookup below. When age is missing, -1 is passed as
  // a sentinel that can never match a sample-table row, so the lookup
  // safely reports unavailable rather than guessing an age.
  return plan736.calculateBenefits({
    age: context.age ?? -1,
    gender: context.gender,
    sumAssured: context.basicSumAssured,
    policyTermYears: context.policyTermYears,
    premiumPaymentTermYears: context.premiumPayingTermYears,
    premiumFrequency: context.premiumMode,
    product: PLAN_736_PRODUCT!,
  });
}

const PLAN_736_SOURCE_ID = "lic-plan736-sales-brochure-current";

// Structural facts only (brochure §10-11) — both loan and surrender are
// documented as available once >= 1 full year's premium has been paid.
// Amounts require Surrender Value (premiums-paid history + GSV/SSV
// factor tables) and are deliberately not computed — see
// docs/lic-plan736-verification.md.
function plan736EvaluateLiquidity(_context: LicCalculationContext): LiquidityResult {
  return {
    surrenderAvailable: { status: "verified", value: true, sourceIds: [PLAN_736_SOURCE_ID] },
    loanAvailable: { status: "verified", value: true, sourceIds: [PLAN_736_SOURCE_ID] },
  };
}

const PLAN_736_ENGINE: LicProductEngine = {
  provider: "LIC",
  planNumber: "736",
  uin: plan736.PLAN_736_UIN,
  // Declared honestly from what plan736.ts actually verifies (see that
  // file's comments and docs/lic-plan736-verification.md):
  //  - eligibility: every rule (age/term-PPT pairing/sum assured) is
  //    fully evaluated from the brochure -> verified
  //  - premium: only exact sample-table matches are ever returned -> partial
  //  - benefits: guaranteed maturity always available; the guaranteed
  //    death-benefit formula is completed only when an exact premium is
  //    available, otherwise only its BSA floor is reported -> partial
  //  - familyProtection: surfaced via calculateBenefits().deathBenefit
  //    with the same partial availability, no separate method needed -> partial
  //  - tax/costs: no rate/charge is published in this brochure -> unavailable
  //  - liquidity: loan/surrender availability are documented structural
  //    facts (amounts are not) -> verified
  capabilities: {
    eligibility: "verified",
    premium: "partial",
    benefits: "partial",
    familyProtection: "partial",
    tax: "unavailable",
    costs: "unavailable",
    liquidity: "verified",
  },
  evaluateEligibility: plan736EvaluateEligibility,
  calculatePremium: plan736CalculatePremium,
  calculateBenefits: plan736CalculateBenefits,
  evaluateLiquidity: plan736EvaluateLiquidity,
};

// ---- Stage 4D: generic adapter factory for the 5 endowment plans below ----
// plan733.ts/plan736.ts keep their own hand-written adapters above,
// completely untouched, so their tested behaviour can never regress.
// Every new plan module shares the exact same adapter shape (map
// LicCalculationContext -> the plan's LicCalculatorInput, including
// productSpecificInputs passthrough for a per-product configuration
// choice like Amritbaal/Nav Jeevan Shree's death-benefit Option), so one
// factory replaces five near-identical hand-written adapters.
interface StandardPlanModule {
  evaluateEligibility: (input: LicCalculatorInput & { product: InsuranceProduct }) => EligibilityResult;
  calculatePremium: (input: LicCalculatorInput & { product: InsuranceProduct }) => PremiumCalculationResult;
  calculateBenefits: (input: LicCalculatorInput & { product: InsuranceProduct }) => BenefitCalculationResult;
}

function standardInput(
  context: LicCalculationContext,
  product: InsuranceProduct,
  age: number
): LicCalculatorInput & { product: InsuranceProduct } {
  return {
    age,
    gender: context.gender,
    sumAssured: context.basicSumAssured,
    policyTermYears: context.policyTermYears,
    premiumPaymentTermYears: context.premiumPayingTermYears,
    premiumFrequency: context.premiumMode,
    productSpecificInputs: context.productSpecificInputs,
    product,
  };
}

function buildStandardEngine(
  planNumber: string,
  uin: string,
  product: InsuranceProduct,
  plan: StandardPlanModule,
  capabilities: ProductCapabilities,
  liquiditySourceId?: string
): LicProductEngine {
  const engine: LicProductEngine = {
    provider: "LIC",
    planNumber,
    uin,
    capabilities,
    evaluateEligibility(context) {
      if (context.age == null) {
        return { eligible: null, reasons: [], reasonCodes: [], missingInputs: ["age"] };
      }
      return plan.evaluateEligibility(standardInput(context, product, context.age));
    },
    calculatePremium(context) {
      if (context.age == null) {
        return { available: false, missingInputs: ["age"] };
      }
      return plan.calculatePremium(standardInput(context, product, context.age));
    },
    calculateBenefits(context) {
      // None of these plans' calculateBenefits() use `age` for anything
      // but an internal premium lookup, which itself safely reports
      // unavailable for a sentinel age that can never match a published
      // sample row — same reasoning as Plan 736's adapter above.
      return plan.calculateBenefits(standardInput(context, product, context.age ?? -1));
    },
  };
  if (liquiditySourceId) {
    engine.evaluateLiquidity = () => ({
      surrenderAvailable: { status: "verified", value: true, sourceIds: [liquiditySourceId] },
      loanAvailable: { status: "verified", value: true, sourceIds: [liquiditySourceId] },
    });
  }
  return engine;
}

function requireProduct(planNumber: string, uin: string): InsuranceProduct {
  const product = getLicProductByIdentity(planNumber, uin);
  if (!product) {
    throw new Error(
      `LIC catalogue is missing Plan ${planNumber} — engine registration is inconsistent.`
    );
  }
  return product;
}

// Declared honestly per plan from what each module actually verifies
// (see each plan file's comments and docs/lic-plan<N>-verification.md):
//  - eligibility: every documented rule is fully evaluated -> verified
//  - premium: only exact sample-table matches are ever returned -> partial
//  - benefits: guaranteed maturity component always available (plus, for
//    the two Non-Par plans, a fully guaranteed Guaranteed Addition once a
//    premium is verified); death benefit completed only when an exact
//    premium is verified, otherwise only its guaranteed floor -> partial
//  - familyProtection: surfaced via calculateBenefits().deathBenefit,
//    same partial availability, no separate method needed -> partial
//  - tax/costs: no rate/charge is published in any of these brochures -> unavailable
//  - liquidity: loan/surrender availability are documented structural
//    facts (amounts are not) -> verified
const STANDARD_CAPABILITIES: ProductCapabilities = {
  eligibility: "verified",
  premium: "partial",
  benefits: "partial",
  familyProtection: "partial",
  tax: "unavailable",
  costs: "unavailable",
  liquidity: "verified",
};

const PLAN_717_PRODUCT = requireProduct("717", plan717.PLAN_717_UIN);
const PLAN_717_SOURCE_ID = "lic-plan717-sales-brochure-current";
const PLAN_717_ENGINE = buildStandardEngine(
  "717",
  plan717.PLAN_717_UIN,
  PLAN_717_PRODUCT,
  plan717,
  STANDARD_CAPABILITIES,
  PLAN_717_SOURCE_ID
);

const PLAN_714_PRODUCT = requireProduct("714", plan714.PLAN_714_UIN);
const PLAN_714_SOURCE_ID = "lic-plan714-sales-brochure-current";
const PLAN_714_ENGINE = buildStandardEngine(
  "714",
  plan714.PLAN_714_UIN,
  PLAN_714_PRODUCT,
  plan714,
  STANDARD_CAPABILITIES,
  PLAN_714_SOURCE_ID
);

const PLAN_715_PRODUCT = requireProduct("715", plan715.PLAN_715_UIN);
const PLAN_715_SOURCE_ID = "lic-plan715-sales-brochure-current";
const PLAN_715_ENGINE = buildStandardEngine(
  "715",
  plan715.PLAN_715_UIN,
  PLAN_715_PRODUCT,
  plan715,
  STANDARD_CAPABILITIES,
  PLAN_715_SOURCE_ID
);

const PLAN_774_PRODUCT = requireProduct("774", plan774.PLAN_774_UIN);
const PLAN_774_SOURCE_ID = "lic-plan774-sales-brochure-current";
const PLAN_774_ENGINE = buildStandardEngine(
  "774",
  plan774.PLAN_774_UIN,
  PLAN_774_PRODUCT,
  plan774,
  STANDARD_CAPABILITIES,
  PLAN_774_SOURCE_ID
);

const PLAN_912_PRODUCT = requireProduct("912", plan912.PLAN_912_UIN);
const PLAN_912_SOURCE_ID = "lic-plan912-sales-brochure-current";
const PLAN_912_ENGINE = buildStandardEngine(
  "912",
  plan912.PLAN_912_UIN,
  PLAN_912_PRODUCT,
  plan912,
  STANDARD_CAPABILITIES,
  PLAN_912_SOURCE_ID
);

// ---- Stage 4E: 5 more products via the same generic factory ----
// Plan 734's Premium Paying Term/Policy Term are derived from age (not
// chosen), Plan 748's Policy Term comes from a discrete set, Plan 889 is
// joint-life — but all 5 still fit the same
// age/BSA/term/PPT/productSpecificInputs shape the factory maps, so none
// of them need a bespoke adapter here (only bespoke UI configurators —
// see components/planner/LicProductDetailSheet.tsx).
const PLAN_734_PRODUCT = requireProduct("734", plan734.PLAN_734_UIN);
const PLAN_734_SOURCE_ID = "lic-plan734-sales-brochure-current";
const PLAN_734_ENGINE = buildStandardEngine(
  "734",
  plan734.PLAN_734_UIN,
  PLAN_734_PRODUCT,
  plan734,
  STANDARD_CAPABILITIES,
  PLAN_734_SOURCE_ID
);

const PLAN_881_PRODUCT = requireProduct("881", plan881.PLAN_881_UIN);
const PLAN_881_SOURCE_ID = "lic-plan881-sales-brochure-current";
const PLAN_881_ENGINE = buildStandardEngine(
  "881",
  plan881.PLAN_881_UIN,
  PLAN_881_PRODUCT,
  plan881,
  STANDARD_CAPABILITIES,
  PLAN_881_SOURCE_ID
);

const PLAN_748_PRODUCT = requireProduct("748", plan748.PLAN_748_UIN);
const PLAN_748_SOURCE_ID = "lic-plan748-sales-brochure-current";
const PLAN_748_ENGINE = buildStandardEngine(
  "748",
  plan748.PLAN_748_UIN,
  PLAN_748_PRODUCT,
  plan748,
  STANDARD_CAPABILITIES,
  PLAN_748_SOURCE_ID
);

const PLAN_770_PRODUCT = requireProduct("770", plan770.PLAN_770_UIN);
const PLAN_770_SOURCE_ID = "lic-plan770-sales-brochure-current";
const PLAN_770_ENGINE = buildStandardEngine(
  "770",
  plan770.PLAN_770_UIN,
  PLAN_770_PRODUCT,
  plan770,
  STANDARD_CAPABILITIES,
  PLAN_770_SOURCE_ID
);

const PLAN_889_PRODUCT = requireProduct("889", plan889.PLAN_889_UIN);
const PLAN_889_SOURCE_ID = "lic-plan889-sales-brochure-current";
const PLAN_889_ENGINE = buildStandardEngine(
  "889",
  plan889.PLAN_889_UIN,
  PLAN_889_PRODUCT,
  plan889,
  STANDARD_CAPABILITIES,
  PLAN_889_SOURCE_ID
);

export const LIC_PRODUCT_ENGINES: LicProductEngine[] = [
  PLAN_733_ENGINE,
  PLAN_736_ENGINE,
  PLAN_717_ENGINE,
  PLAN_714_ENGINE,
  PLAN_715_ENGINE,
  PLAN_774_ENGINE,
  PLAN_912_ENGINE,
  PLAN_734_ENGINE,
  PLAN_881_ENGINE,
  PLAN_748_ENGINE,
  PLAN_770_ENGINE,
  PLAN_889_ENGINE,
];

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
