// Protection-adjusted goal comparison: for the SAME goal, horizon and
// available money, show the trade-offs between different ways of working
// toward it. This is a comparison FOUNDATION, not a recommendation
// engine — it never ranks structures, never declares a winner, and never
// invents a premium, bonus, cover amount, tax treatment or charge that
// isn't backed by a verified source or an explicitly-labeled illustrative
// scenario.
//
// unknown values are always null (never 0) — see ComparisonValue.

import {
  BenefitCalculationResult,
  InsuranceProduct,
  ValueStatus,
} from "@/types/insurance";

// Re-exported so existing importers of ValueStatus from this module keep
// working unchanged — the type now lives in types/insurance.ts so the
// engine/capability layer can share the exact same vocabulary instead of
// introducing a second, incompatible one.
export type { ValueStatus };
import { GoalCoverage, calculateGoalCoverage } from "@/lib/calculations/goalCoverage";
import { sipFutureValue } from "@/lib/calculations/sip";

export type ComparisonStructureType =
  | "traditional_insurance"
  | "market_linked_insurance"
  | "generic_investment_scenario"
  | "index_fund_scenario"
  | "midcap_fund_scenario"
  | "protection_plus_investment";

// T defaults to `null` for dimensions that are purely status/notes (tax,
// costs, liquidity) rather than a single number.
export interface ComparisonValue<T = null> {
  value: T | null;
  status: ValueStatus;
  source?: string;
  noteCode?: string;
}

export type RiskLevel = "not_market_linked" | "market_linked" | "higher_volatility";

export interface ProtectionAdjustedComparison {
  structureType: ComparisonStructureType;
  titleKey: string;

  goal: {
    targetAmount: number;
    horizonYears: number;
    projectedValue: ComparisonValue<number>;
    coverage: ComparisonValue<GoalCoverage>;
  };

  protection: {
    hasBuiltInLifeProtection: boolean;
    familyProtectionAmount: ComparisonValue<number>;
  };

  tax: {
    premiumGst: ComparisonValue;
    premiumTaxBenefit: ComparisonValue;
    maturityTaxTreatment: ComparisonValue;
  };

  costs: {
    expenseRatio: ComparisonValue<number>;
    fundManagementCharge: ComparisonValue<number>;
    exitLoad: ComparisonValue<number>;
    otherCharges: ComparisonValue;
  };

  risk: {
    marketLinked: boolean;
    riskLevel: ComparisonValue<RiskLevel>;
  };

  liquidity: ComparisonValue;

  guarantees: {
    guaranteedValue: ComparisonValue<number>;
    nonGuaranteedValue: ComparisonValue<number>;
  };
}

// ---- Plan 733 adapter (Section 5) ----
// Maps ALREADY-COMPUTED, verified Plan 733 engine output into the
// comparison model. Never calls/duplicates Plan 733's formulas itself —
// only consumes its output — and never modifies plan733.ts.
export interface Plan733ComparisonInput {
  targetAmount: number;
  horizonYears: number;
  product: InsuranceProduct;
  benefits?: BenefitCalculationResult;
}

export function buildPlan733Comparison(input: Plan733ComparisonInput): ProtectionAdjustedComparison {
  const guaranteedMaturity =
    input.benefits?.available && input.benefits.maturityBenefit != null
      ? input.benefits.maturityBenefit
      : null;

  const projectedValue: ComparisonValue<number> =
    guaranteedMaturity != null
      ? {
          value: guaranteedMaturity,
          status: "verified",
          source: input.product.id,
          noteCode: "guaranteed_value_only",
        }
      : { value: null, status: "unavailable", noteCode: "requires_sum_assured" };

  const coverage: ComparisonValue<GoalCoverage> =
    guaranteedMaturity != null
      ? { value: calculateGoalCoverage(input.targetAmount, guaranteedMaturity), status: "verified" }
      : { value: null, status: "unavailable" };

  // plan733.ts deliberately never collapses the real "Sum Assured on
  // Death" into a single number — it depends on a premium comparison
  // that is usually unavailable — so family protection stays
  // unavailable here rather than showing a partial figure as complete.
  const familyProtectionAmount: ComparisonValue<number> =
    input.benefits?.deathBenefit != null
      ? { value: input.benefits.deathBenefit, status: "verified", source: input.product.id }
      : { value: null, status: "unavailable", noteCode: "requires_additional_verified_inputs" };

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
      hasBuiltInLifeProtection: true,
      familyProtectionAmount,
    },
    tax: {
      premiumGst: { value: null, status: "conditional", noteCode: "depends_on_policy_rules" },
      premiumTaxBenefit: { value: null, status: "conditional", noteCode: "depends_on_policy_rules" },
      maturityTaxTreatment: { value: null, status: "conditional", noteCode: "depends_on_policy_rules" },
    },
    costs: {
      expenseRatio: { value: null, status: "not_applicable", noteCode: "not_a_mutual_fund" },
      fundManagementCharge: { value: null, status: "not_applicable", noteCode: "not_a_mutual_fund" },
      exitLoad: { value: null, status: "unavailable", noteCode: "requires_verified_source" },
      otherCharges: { value: null, status: "unavailable", noteCode: "requires_verified_source" },
    },
    risk: {
      marketLinked: false,
      riskLevel: { value: "not_market_linked", status: "verified" },
    },
    liquidity: { value: null, status: "conditional", noteCode: "policy_specific" },
    guarantees: {
      guaranteedValue: projectedValue,
      nonGuaranteedValue: { value: null, status: "unavailable", noteCode: "bonus_not_verified" },
    },
  };
}

// ---- Illustrative investment scenario adapter (Section 6) ----
// Reuses the existing tested SIP maths — NOT a real mutual fund. Every
// figure is explicitly "illustrative", never "expected"/"likely".
export interface InvestmentScenarioComparisonInput {
  targetAmount: number;
  monthlyAmount: number;
  years: number;
  annualRatePct: number;
}

export function buildInvestmentScenarioComparison(
  input: InvestmentScenarioComparisonInput
): ProtectionAdjustedComparison {
  const projectedAmount = sipFutureValue(input.monthlyAmount, input.annualRatePct, input.years);

  const projectedValue: ComparisonValue<number> = {
    value: projectedAmount,
    status: "illustrative",
    noteCode: "illustrative_market_scenario",
  };

  const coverage: ComparisonValue<GoalCoverage> = {
    value: calculateGoalCoverage(input.targetAmount, projectedAmount),
    status: "illustrative",
  };

  return {
    structureType: "generic_investment_scenario",
    titleKey: "comparison.structure.investmentScenario",
    goal: {
      targetAmount: input.targetAmount,
      horizonYears: input.years,
      projectedValue,
      coverage,
    },
    protection: {
      hasBuiltInLifeProtection: false,
      familyProtectionAmount: {
        value: null,
        status: "not_applicable",
        noteCode: "no_built_in_life_protection",
      },
    },
    tax: {
      premiumGst: { value: null, status: "not_applicable", noteCode: "not_an_insurance_premium" },
      premiumTaxBenefit: { value: null, status: "unavailable", noteCode: "not_calculated_yet" },
      maturityTaxTreatment: { value: null, status: "unavailable", noteCode: "not_calculated_yet" },
    },
    costs: {
      // Never assumed to be zero — genuinely not calculated at this stage.
      expenseRatio: { value: null, status: "unavailable", noteCode: "not_calculated_yet" },
      fundManagementCharge: { value: null, status: "unavailable", noteCode: "not_calculated_yet" },
      exitLoad: { value: null, status: "unavailable", noteCode: "not_calculated_yet" },
      otherCharges: { value: null, status: "unavailable", noteCode: "not_calculated_yet" },
    },
    risk: {
      marketLinked: true,
      riskLevel: { value: "market_linked", status: "verified" },
    },
    liquidity: { value: null, status: "unavailable", noteCode: "not_calculated_yet" },
    guarantees: {
      guaranteedValue: { value: null, status: "not_applicable", noteCode: "no_guaranteed_component" },
      nonGuaranteedValue: projectedValue,
    },
  };
}
