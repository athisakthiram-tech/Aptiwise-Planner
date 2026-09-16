// Generic comparison adapter: maps the output of ANY registered
// LicProductEngine into ProtectionAdjustedComparison, so a new product
// engine does not require a new bespoke adapter. Product-specific
// adapters (e.g. buildPlan733Comparison) remain available for cases that
// genuinely need it and are untouched by this file.
//
// Because EngineResult and ComparisonValue now share one ValueStatus
// vocabulary (types/insurance.ts), mapping between them is a direct
// passthrough — there is no confidence-upgrading translation table.

import {
  EngineResult,
  InsuranceProduct,
  LicCalculationContext,
  LiquidityResult,
  ValueStatus,
} from "@/types/insurance";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { calculateGoalCoverage, GoalCoverage } from "@/lib/calculations/goalCoverage";
import { ComparisonValue, ProtectionAdjustedComparison } from "@/lib/comparison/protectionAdjustedComparison";

export interface LicProductComparisonInput {
  targetAmount: number;
  horizonYears: number;
  product: InsuranceProduct;
  context: LicCalculationContext;
}

function toComparisonValue<T>(result: EngineResult<T>): ComparisonValue<T> {
  return { value: result.value, status: result.status, source: result.sourceIds[0] };
}

// Tax/other-charge fields in ProtectionAdjustedComparison are
// status/note-only (ComparisonValue<null>) — the raw string/number never
// crosses into the comparison model for those dimensions today.
function toStatusOnlyComparisonValue(result: EngineResult<unknown>): ComparisonValue {
  return { value: null, status: result.status };
}

// Never upgrades: the combined liquidity picture can only be as good as
// its weakest verified dimension.
const STATUS_WEAKNESS_ORDER: ValueStatus[] = [
  "unavailable",
  "conditional",
  "partial",
  "illustrative",
  "not_applicable",
  "verified",
];

function weakestStatus(statuses: ValueStatus[]): ValueStatus {
  return statuses.reduce((weakest, current) =>
    STATUS_WEAKNESS_ORDER.indexOf(current) < STATUS_WEAKNESS_ORDER.indexOf(weakest) ? current : weakest
  );
}

function toLiquidityComparisonValue(result: LiquidityResult): ComparisonValue {
  return { value: null, status: weakestStatus([result.surrenderAvailable.status, result.loanAvailable.status]) };
}

export function buildLicProductComparison(input: LicProductComparisonInput): ProtectionAdjustedComparison {
  const engine = getLicProductEngine(input.product.planNumber, input.product.uin);

  const benefits = engine?.calculateBenefits?.(input.context);
  const guaranteedMaturity =
    benefits?.available && benefits.maturityBenefit != null ? benefits.maturityBenefit : null;

  const projectedValue: ComparisonValue<number> =
    guaranteedMaturity != null
      ? { value: guaranteedMaturity, status: "verified", source: input.product.id, noteCode: "guaranteed_value_only" }
      : { value: null, status: "unavailable", noteCode: "requires_sum_assured" };

  const coverage: ComparisonValue<GoalCoverage> =
    guaranteedMaturity != null
      ? { value: calculateGoalCoverage(input.targetAmount, guaranteedMaturity), status: "verified" }
      : { value: null, status: "unavailable" };

  // Prefer an engine-reported death benefit (the standard
  // BenefitCalculationResult field every eligibility/benefit engine
  // already shares); fall back to a dedicated calculateFamilyProtection
  // method only if the plan's benefit engine doesn't cover it.
  const familyProtectionResult = engine?.calculateFamilyProtection?.(input.context);
  const familyProtectionAmount: ComparisonValue<number> =
    benefits?.deathBenefit != null
      ? { value: benefits.deathBenefit, status: "verified", source: input.product.id }
      : familyProtectionResult
        ? toComparisonValue(familyProtectionResult.amount)
        : { value: null, status: "unavailable", noteCode: "requires_additional_verified_inputs" };

  const taxResult = engine?.evaluateTaxTreatment?.(input.context);
  const costsResult = engine?.calculateCosts?.(input.context);
  const liquidityResult = engine?.evaluateLiquidity?.(input.context);

  const unavailable = <T = null,>(noteCode?: string): ComparisonValue<T> => ({
    value: null,
    status: "unavailable",
    noteCode,
  });
  const notApplicable = <T = null,>(noteCode?: string): ComparisonValue<T> => ({
    value: null,
    status: "not_applicable",
    noteCode,
  });

  return {
    structureType: "traditional_insurance",
    titleKey: "comparison.structure.traditionalInsurance",
    goal: {
      targetAmount: input.targetAmount,
      horizonYears: input.horizonYears,
      projectedValue,
      coverage,
    },
    protection: {
      hasBuiltInLifeProtection: input.product.protectionAvailable,
      familyProtectionAmount,
    },
    tax: {
      premiumGst: taxResult ? toStatusOnlyComparisonValue(taxResult.premiumGst) : { value: null, status: "conditional", noteCode: "depends_on_policy_rules" },
      premiumTaxBenefit: taxResult ? toStatusOnlyComparisonValue(taxResult.premiumDeduction) : { value: null, status: "conditional", noteCode: "depends_on_policy_rules" },
      maturityTaxTreatment: taxResult ? toStatusOnlyComparisonValue(taxResult.maturityTax) : { value: null, status: "conditional", noteCode: "depends_on_policy_rules" },
    },
    costs: {
      expenseRatio: costsResult
        ? toComparisonValue(costsResult.expenseRatio)
        : input.product.marketLinked
          ? unavailable("requires_verified_source")
          : notApplicable("not_a_mutual_fund"),
      fundManagementCharge: costsResult
        ? toComparisonValue(costsResult.fundManagementCharge)
        : input.product.marketLinked
          ? unavailable("requires_verified_source")
          : notApplicable("not_a_mutual_fund"),
      exitLoad: costsResult ? toComparisonValue(costsResult.exitLoad) : unavailable("requires_verified_source"),
      otherCharges: unavailable("requires_verified_source"),
    },
    risk: {
      marketLinked: input.product.marketLinked,
      riskLevel: {
        value: input.product.marketLinked ? "market_linked" : "not_market_linked",
        status: "verified",
      },
    },
    liquidity: liquidityResult ? toLiquidityComparisonValue(liquidityResult) : { value: null, status: "conditional", noteCode: "policy_specific" },
    guarantees: {
      guaranteedValue: projectedValue,
      // A Record<string, number> of non-guaranteed illustrations can't be
      // safely collapsed into one number without a documented convention
      // for "the" figure — stays unavailable rather than guessing which
      // key to surface, exactly like the Plan 733-specific adapter.
      nonGuaranteedValue: { value: null, status: "unavailable", noteCode: "bonus_not_verified" },
    },
  };
}
