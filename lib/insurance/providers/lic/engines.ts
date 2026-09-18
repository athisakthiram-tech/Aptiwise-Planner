// Registers existing per-plan engines under the generic LicProductEngine
// contract (types/insurance.ts). This is an ADAPTER layer only: it never
// changes plan733.ts's formulas, numerical behaviour, or its existing
// (still directly used) engineRegistry.ts entry — see
// lib/insurance/engineRegistry.ts, which the existing UI keeps consuming
// unchanged. Adding a second product here means adding one more entry to
// LIC_PRODUCT_ENGINES, not a new bespoke calculator file.

import {
  BenefitCalculationResult,
  CostStructureResult,
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
import * as plan890 from "@/lib/insurance/providers/lic/plans/plan890";
import * as plan888 from "@/lib/insurance/providers/lic/plans/plan888";
import * as plan876 from "@/lib/insurance/providers/lic/plans/plan876";
import * as plan875 from "@/lib/insurance/providers/lic/plans/plan875";
import * as plan954 from "@/lib/insurance/providers/lic/plans/plan954";
import * as plan877 from "@/lib/insurance/providers/lic/plans/plan877";
import * as plan878 from "@/lib/insurance/providers/lic/plans/plan878";
import * as plan887 from "@/lib/insurance/providers/lic/plans/plan887";
import * as plan894 from "@/lib/insurance/providers/lic/plans/plan894";
import * as plan859 from "@/lib/insurance/providers/lic/plans/plan859";
import * as plan955 from "@/lib/insurance/providers/lic/plans/plan955";
import * as plan867 from "@/lib/insurance/providers/lic/plans/plan867";
import { pureRiskLiquidity } from "@/lib/insurance/providers/lic/plans/shared";
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

const PLAN_890_PRODUCT = requireProduct("890", plan890.PLAN_890_UIN);
const PLAN_890_SOURCE_ID = "lic-plan890-sales-brochure-current";
const PLAN_890_ENGINE = buildStandardEngine(
  "890",
  plan890.PLAN_890_UIN,
  PLAN_890_PRODUCT,
  plan890,
  STANDARD_CAPABILITIES,
  PLAN_890_SOURCE_ID
);

const PLAN_888_PRODUCT = requireProduct("888", plan888.PLAN_888_UIN);
const PLAN_888_SOURCE_ID = "lic-plan888-sales-brochure-current";
const PLAN_888_ENGINE = buildStandardEngine(
  "888",
  plan888.PLAN_888_UIN,
  PLAN_888_PRODUCT,
  plan888,
  STANDARD_CAPABILITIES,
  PLAN_888_SOURCE_ID
);

// ---- Stage 4G: pure risk term plans (876, 875, 954, 877, 878) ----
// These 5 plans still fit buildStandardEngine's generic
// age/BSA/term/PPT/productSpecificInputs mapping, but their liquidity
// facts genuinely differ from every endowment plan above (no loan is
// EVER available, and surrender/Unexpired Risk Premium Value depends on
// the chosen premium mode) — see pureRiskLiquidity in shared.ts. So
// buildStandardEngine is called without a liquiditySourceId here, and
// evaluateLiquidity is assigned afterwards instead of using the
// (inapplicable) "always true/true" default.
function withPureRiskLiquidity(engine: LicProductEngine, sourceId: string): LicProductEngine {
  engine.evaluateLiquidity = (context) => pureRiskLiquidity(context, sourceId);
  return engine;
}

const PLAN_876_PRODUCT = requireProduct("876", plan876.PLAN_876_UIN);
const PLAN_876_ENGINE = withPureRiskLiquidity(
  buildStandardEngine("876", plan876.PLAN_876_UIN, PLAN_876_PRODUCT, plan876, STANDARD_CAPABILITIES),
  "lic-plan876-sales-brochure-current"
);

const PLAN_875_PRODUCT = requireProduct("875", plan875.PLAN_875_UIN);
const PLAN_875_ENGINE = withPureRiskLiquidity(
  buildStandardEngine("875", plan875.PLAN_875_UIN, PLAN_875_PRODUCT, plan875, STANDARD_CAPABILITIES),
  "lic-plan875-sales-brochure-current"
);

const PLAN_954_PRODUCT = requireProduct("954", plan954.PLAN_954_UIN);
const PLAN_954_ENGINE = withPureRiskLiquidity(
  buildStandardEngine("954", plan954.PLAN_954_UIN, PLAN_954_PRODUCT, plan954, STANDARD_CAPABILITIES),
  "lic-plan954-sales-brochure-current"
);

const PLAN_877_PRODUCT = requireProduct("877", plan877.PLAN_877_UIN);
const PLAN_877_ENGINE = withPureRiskLiquidity(
  buildStandardEngine("877", plan877.PLAN_877_UIN, PLAN_877_PRODUCT, plan877, STANDARD_CAPABILITIES),
  "lic-plan877-sales-brochure-current"
);

const PLAN_878_PRODUCT = requireProduct("878", plan878.PLAN_878_UIN);
const PLAN_878_ENGINE = withPureRiskLiquidity(
  buildStandardEngine("878", plan878.PLAN_878_UIN, PLAN_878_PRODUCT, plan878, STANDARD_CAPABILITIES),
  "lic-plan878-sales-brochure-current"
);

const PLAN_887_PRODUCT = requireProduct("887", plan887.PLAN_887_UIN);
const PLAN_887_ENGINE = withPureRiskLiquidity(
  buildStandardEngine("887", plan887.PLAN_887_UIN, PLAN_887_PRODUCT, plan887, STANDARD_CAPABILITIES),
  "lic-plan887-sales-brochure-current"
);

const PLAN_894_PRODUCT = requireProduct("894", plan894.PLAN_894_UIN);
const PLAN_894_ENGINE = withPureRiskLiquidity(
  buildStandardEngine("894", plan894.PLAN_894_UIN, PLAN_894_PRODUCT, plan894, STANDARD_CAPABILITIES),
  "lic-plan894-sales-brochure-current"
);

const PLAN_859_PRODUCT = requireProduct("859", plan859.PLAN_859_UIN);
const PLAN_859_ENGINE = withPureRiskLiquidity(
  buildStandardEngine("859", plan859.PLAN_859_UIN, PLAN_859_PRODUCT, plan859, STANDARD_CAPABILITIES),
  "lic-plan859-sales-brochure-current"
);

const PLAN_955_PRODUCT = requireProduct("955", plan955.PLAN_955_UIN);
const PLAN_955_ENGINE = withPureRiskLiquidity(
  buildStandardEngine("955", plan955.PLAN_955_UIN, PLAN_955_PRODUCT, plan955, STANDARD_CAPABILITIES),
  "lic-plan955-sales-brochure-current"
);

// ---- Plan 867 (New Pension Plus) — bespoke adapter, like Plan 733/736 ----
// Unlike every other plan in this file, this product has no Basic Sum
// Assured at all (premium is a direct customer input, not derived from
// one) and its maturity/vesting value is NAV-dependent and can never be
// projected — buildStandardEngine's BSA-driven mapping genuinely doesn't
// fit this product's shape, so it gets its own small adapter instead.
const PLAN_867_SOURCE_ID = "lic-plan867-sales-brochure-current";

function plan867Input(context: LicCalculationContext): plan867.Plan867Input {
  return {
    age: context.age ?? -1,
    policyTermYears: context.policyTermYears,
    premiumMode: context.premiumMode as plan867.Plan867PremiumMode | undefined,
    annualPremium: context.annualPremium,
  };
}

function plan867EvaluateEligibility(context: LicCalculationContext): EligibilityResult {
  if (context.age == null) {
    return { eligible: null, reasons: [], reasonCodes: [], missingInputs: ["age"] };
  }
  return plan867.evaluateEligibility(plan867Input(context));
}

function plan867CalculateBenefits(context: LicCalculationContext): BenefitCalculationResult {
  return plan867.calculateBenefits(plan867Input(context));
}

function plan867CalculateCosts(_context: LicCalculationContext): CostStructureResult {
  return plan867.calculateCosts(PLAN_867_SOURCE_ID);
}

function plan867EvaluateLiquidity(_context: LicCalculationContext): LiquidityResult {
  return plan867.evaluateLiquidity(PLAN_867_SOURCE_ID);
}

requireProduct("867", plan867.PLAN_867_UIN); // validates the catalogue entry exists; throws otherwise

const PLAN_867_ENGINE: LicProductEngine = {
  provider: "LIC",
  planNumber: "867",
  uin: plan867.PLAN_867_UIN,
  // Declared honestly from what plan867.ts actually verifies:
  //  - eligibility: every documented rule is fully evaluated -> verified
  //  - premium: there is no rate table — premium is a direct customer
  //    input, not a calculated output -> not_applicable
  //  - benefits: the Guaranteed Additions and Assured Death Benefit
  //    floor are fully computable; the Unit Fund Value (maturity/
  //    vesting benefit) is NAV-dependent and never projected -> partial
  //  - familyProtection: surfaced via calculateBenefits().deathBenefit,
  //    same partial availability -> partial
  //  - tax: no rate published -> unavailable
  //  - costs: Fund Management Charge and Mortality Charge are flat,
  //    verified rates; Policy Administration/Discontinuance Charges are
  //    real but conditional on policy year and premium band, and are
  //    not represented as a single number -> partial
  //  - liquidity: no loan is ever available (verified); surrender/
  //    withdrawal availability depends on elapsed policy years this
  //    engine doesn't track -> partial
  capabilities: {
    eligibility: "verified",
    premium: "not_applicable",
    benefits: "partial",
    familyProtection: "partial",
    tax: "unavailable",
    costs: "partial",
    liquidity: "partial",
  },
  evaluateEligibility: plan867EvaluateEligibility,
  calculateBenefits: plan867CalculateBenefits,
  calculateCosts: plan867CalculateCosts,
  evaluateLiquidity: plan867EvaluateLiquidity,
};

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
  PLAN_890_ENGINE,
  PLAN_888_ENGINE,
  PLAN_876_ENGINE,
  PLAN_875_ENGINE,
  PLAN_954_ENGINE,
  PLAN_877_ENGINE,
  PLAN_878_ENGINE,
  PLAN_887_ENGINE,
  PLAN_894_ENGINE,
  PLAN_859_ENGINE,
  PLAN_955_ENGINE,
  PLAN_867_ENGINE,
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
