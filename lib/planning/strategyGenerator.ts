// Strategy / combination engine: generates FEASIBLE PLANNING STRUCTURES
// from a customer's financial profile, protection need, goal need and the
// set of ACTIVE, REGISTERED LIC product engines — never a "best plan",
// never a ranked or scored list, never a claimed-optimal budget split.
// See strategyTypes.ts for why StrategyResult has no score/rank field.
//
// Every candidate product comes from lib/planning/productEligibility.ts,
// which only ever surfaces products with a registered LicProductEngine —
// a catalogue-only product (no engine) structurally cannot reach this
// file. Every premium/benefit figure comes from calling that product's
// OWN engine with an honestly-built context; nothing here re-derives or
// duplicates an LIC formula.
//
// Product selection within a family never ranks or scores candidates:
// each family generates one StrategyResult PER eligible primary product
// (so the caller/advisor sees every feasible option, not one arbitrarily
// chosen "winner"). Where a family needs a second, supporting product
// (e.g. "additional term protection" alongside a traditional plan), this
// module picks the FIRST eligible match in catalogue order — a
// deterministic tie-break, not a quality judgement — and says so
// explicitly in that strategy's `assumptions`.

import { GoalType } from "@/types";
import { InsuranceCategory, LicCalculationContext, PremiumFrequency, ValueStatus } from "@/types/insurance";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { GoalNeedResult, GoalResource, calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { ProductEligibilityAssessment, listEligibleProducts } from "@/lib/planning/productEligibility";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { GoalCoverage } from "@/lib/calculations/goalCoverage";
import { ILLUSTRATION_RATES_PCT, sipFutureValue } from "@/lib/calculations/sip";
import { ComparisonValue } from "@/lib/comparison/protectionAdjustedComparison";
import { combineNumeric, weakestStatus } from "@/lib/planning/statusUtils";
import {
  StrategyComponent,
  StrategyComponentRole,
  StrategyFamily,
  StrategyReasonCode,
  StrategyResult,
} from "@/lib/planning/strategyTypes";

const TERM_CATEGORIES: InsuranceCategory[] = ["term_protection"];
const TRADITIONAL_CATEGORIES: InsuranceCategory[] = ["savings_endowment", "whole_life", "money_back_child"];
const MARKET_LINKED_CATEGORIES: InsuranceCategory[] = ["market_linked_ulip"];
const RETIREMENT_CATEGORIES: InsuranceCategory[] = ["pension"];

function buildBaseContext(
  profile: CustomerFinancialProfile,
  overrides: Partial<LicCalculationContext>
): LicCalculationContext {
  return {
    age: profile.age ?? undefined,
    policyTermYears: profile.yearsToGoal ?? undefined,
    // Deliberately NOT defaulted from profile.yearsToGoal: for some
    // registered products (e.g. Plan 886) this field is a constrained,
    // product-specific enum (a Premium Paying Term of 5/7/10/15 years),
    // not an arbitrary number of years — passing an arbitrary value
    // through would either misrepresent a genuine customer choice or,
    // worse, crash a product's own typed lookup table. Left undefined
    // here, every engine's own convention already treats a missing PPT
    // as "regular pay" or reports it as a missing input — never a crash.
    premiumMode: "yearly",
    ...overrides,
  };
}

// A protection gap of exactly 0 (a real, calculated "no gap needed") is
// not a meaningful Basic Sum Assured to request eligibility for — every
// registered term/traditional product enforces its own minimum BSA, so
// passing 0 through would make every one of them report `eligible:
// false` and vanish from consideration entirely. Treating a non-positive
// or unknown gap as "leave it unspecified" instead keeps the product's
// eligibility honestly `null` ("needs more information") rather than a
// fabricated rejection.
function positiveGapOrUndefined(gap: number | null): number | undefined {
  return gap != null && gap > 0 ? gap : undefined;
}

function pickFirstEligible(
  assessments: ProductEligibilityAssessment[]
): ProductEligibilityAssessment | undefined {
  return assessments.find((a) => a.eligible !== false);
}

// PremiumCalculationResult.premium is always the figure for whichever
// premiumFrequency the engine reports — an annual figure for "yearly",
// a lump sum for "single". A single-premium lump sum is never forced
// into a fabricated "monthly equivalent".
function annualToMonthly(premium: number, frequency: PremiumFrequency | undefined): number | null {
  switch (frequency) {
    case "yearly":
      return Math.round(premium / 12);
    case "half_yearly":
      return Math.round(premium / 6);
    case "quarterly":
      return Math.round(premium / 3);
    case "monthly":
      return premium;
    default:
      return null; // "single" (lump sum) or unknown — never a fabricated monthly figure
  }
}

function buildComponent(
  assessment: ProductEligibilityAssessment,
  role: StrategyComponentRole,
  context: LicCalculationContext,
  reasonCodes: StrategyReasonCode[]
): StrategyComponent {
  const engine = getLicProductEngine(assessment.product.planNumber, assessment.product.uin);
  const premiumResult = engine?.calculatePremium?.(context);
  const benefitsResult = engine?.calculateBenefits?.(context);

  let monthlyPremium: ComparisonValue<number>;
  if (assessment.capabilities.premium === "not_applicable") {
    monthlyPremium = { value: null, status: "not_applicable", noteCode: "premium_is_a_direct_customer_choice" };
  } else if (premiumResult?.available && premiumResult.premium != null) {
    const monthly = annualToMonthly(premiumResult.premium, premiumResult.premiumFrequency);
    monthlyPremium =
      monthly != null
        ? { value: monthly, status: "verified", source: assessment.product.id }
        : { value: null, status: "verified", source: assessment.product.id, noteCode: "single_premium_lump_sum_not_monthly" };
  } else {
    monthlyPremium = { value: null, status: "unavailable", noteCode: "premium_requires_exact_published_rate_match" };
  }

  const deathBenefit: ComparisonValue<number> =
    benefitsResult?.available && benefitsResult.deathBenefit != null
      ? { value: benefitsResult.deathBenefit, status: "verified", source: assessment.product.id }
      : { value: null, status: "unavailable", noteCode: "requires_additional_verified_inputs" };

  const maturityBenefit: ComparisonValue<number> =
    benefitsResult?.available && benefitsResult.maturityBenefit != null
      ? { value: benefitsResult.maturityBenefit, status: "verified", source: assessment.product.id }
      : { value: null, status: "unavailable", noteCode: "requires_additional_verified_inputs" };

  const finalReasonCodes: StrategyReasonCode[] = Array.from(
    new Set([
      ...reasonCodes,
      assessment.eligible === true ? "PRODUCT_ELIGIBLE" : "PRODUCT_NEEDS_MORE_INFO",
      monthlyPremium.status === "verified" ? "PREMIUM_VERIFIED" : "PREMIUM_UNAVAILABLE",
    ])
  );

  return {
    role,
    product: {
      planNumber: assessment.product.planNumber,
      uin: assessment.product.uin,
      productName: assessment.product.productName,
      category: assessment.product.category,
    },
    eligible: assessment.eligible,
    monthlyPremium,
    deathBenefit,
    maturityBenefit,
    reasonCodes: finalReasonCodes,
  };
}

// The illustrative-investment "component" is never an LIC product — it
// reuses the existing tested SIP maths (lib/calculations/sip.ts) and is
// always labeled `illustrative`, never `verified`.
function buildIllustrativeInvestmentComponent(
  monthlyAmount: number,
  years: number,
  ratePct: number,
  reasonCodes: StrategyReasonCode[]
): StrategyComponent {
  const projected = sipFutureValue(monthlyAmount, ratePct, years);
  return {
    role: "illustrative_investment",
    product: null,
    eligible: null,
    monthlyPremium: {
      value: monthlyAmount,
      status: "illustrative",
      noteCode: "illustration_only_not_guaranteed_returns",
    },
    deathBenefit: { value: null, status: "not_applicable", noteCode: "no_built_in_life_protection" },
    maturityBenefit: {
      value: projected,
      status: "illustrative",
      noteCode: "illustration_only_not_guaranteed_returns",
    },
    reasonCodes,
  };
}

function needStatusToValueStatus(status: ProtectionNeedResult["status"]): ValueStatus {
  if (status === "calculated") return "verified";
  if (status === "partial") return "partial";
  return "unavailable";
}

function protectionCoverageComparison(
  protectionNeed: ProtectionNeedResult,
  componentDeathBenefits: ComparisonValue<number>[]
): { coverage: ComparisonValue<number>; gap: ComparisonValue<number> } {
  const existing: ComparisonValue<number> =
    protectionNeed.existingProtection != null
      ? { value: protectionNeed.existingProtection, status: "verified" }
      : { value: null, status: "unavailable" };

  const coverage = combineNumeric([existing, ...componentDeathBenefits]);
  const addedProtection = combineNumeric(componentDeathBenefits);

  let gap: ComparisonValue<number>;
  if (protectionNeed.protectionGap == null) {
    gap = { value: null, status: needStatusToValueStatus(protectionNeed.status) };
  } else if (addedProtection.value == null) {
    // No protection component contributed a known amount — the
    // previously-calculated need's own gap stands unchanged.
    gap = { value: protectionNeed.protectionGap, status: needStatusToValueStatus(protectionNeed.status) };
  } else {
    gap = {
      value: Math.max(0, protectionNeed.protectionGap - addedProtection.value),
      status: weakestStatus([needStatusToValueStatus(protectionNeed.status), addedProtection.status]),
    };
  }

  return { coverage, gap };
}

function goalCoverageComparison(
  profile: CustomerFinancialProfile,
  projected: GoalResource | null
): { coverage: ComparisonValue<GoalCoverage>; gap: ComparisonValue<number> } {
  const result = calculateGoalNeed({
    targetGoal: profile.targetGoalAmount,
    currentResources: profile.existingInvestments,
    projectedResources: projected,
  });

  if (result.status === "unavailable") {
    return { coverage: { value: null, status: "unavailable" }, gap: { value: null, status: "unavailable" } };
  }

  const coverageValue: GoalCoverage = {
    coveragePercent: result.goalCoveragePercent as number,
    remainingGap: result.remainingGoalGap as number,
    surplus: result.surplus as number,
  };

  return {
    coverage: { value: coverageValue, status: result.confidence },
    gap: { value: result.remainingGoalGap, status: result.confidence },
  };
}

function assembleStrategy(params: {
  id: string;
  family: StrategyFamily;
  components: StrategyComponent[];
  profile: CustomerFinancialProfile;
  protectionNeed: ProtectionNeedResult;
  goalResource: GoalResource | null;
  monthlyBudgetVerifiedUsed: number | null;
  marketLinked: boolean;
  assumptions: string[];
  warnings: string[];
  extraReasonCodes: StrategyReasonCode[];
}): StrategyResult {
  const {
    id,
    family,
    components,
    profile,
    protectionNeed,
    goalResource,
    monthlyBudgetVerifiedUsed,
    marketLinked,
    assumptions,
    warnings,
    extraReasonCodes,
  } = params;

  const { coverage: protectionCoverage, gap: protectionGap } = protectionCoverageComparison(
    protectionNeed,
    components.map((c) => c.deathBenefit)
  );
  const { coverage: goalCoverage, gap: goalGap } = goalCoverageComparison(profile, goalResource);

  const monthlyBudgetUsageStatus: ValueStatus = monthlyBudgetVerifiedUsed != null ? "verified" : "unavailable";
  const remainingBudget =
    monthlyBudgetVerifiedUsed != null && profile.monthlyBudget != null
      ? Math.max(0, profile.monthlyBudget - monthlyBudgetVerifiedUsed)
      : null;

  const guarantees = combineNumeric(components.map((c) => c.deathBenefit));
  const reasonCodes = Array.from(new Set([...components.flatMap((c) => c.reasonCodes), ...extraReasonCodes]));
  const confidence = weakestStatus([monthlyBudgetUsageStatus, protectionGap.status, goalGap.status]);

  return {
    id,
    family,
    components,
    monthlyBudgetAvailable: profile.monthlyBudget,
    monthlyBudgetVerifiedUsed,
    monthlyBudgetUsageStatus,
    remainingBudget,
    protectionCoverage,
    protectionGap,
    goalCoverage,
    goalGap,
    marketExposure: marketLinked
      ? { value: "market_linked", status: "verified" }
      : { value: "not_market_linked", status: "verified" },
    liquidity: { value: null, status: "conditional", noteCode: "policy_specific" },
    guarantees,
    costs: { value: null, status: "unavailable", noteCode: "not_calculated_yet" },
    taxTreatment: { value: null, status: "conditional", noteCode: "depends_on_policy_rules" },
    assumptions,
    warnings,
    reasonCodes,
    confidence,
  };
}

// ---- Family A: Protection + Investment ----
function generateProtectionInvestmentStrategies(
  profile: CustomerFinancialProfile,
  protectionNeed: ProtectionNeedResult,
  ratePct: number
): StrategyResult[] {
  const { monthlyBudget, yearsToGoal } = profile;
  if (monthlyBudget == null || yearsToGoal == null) return [];

  const context = buildBaseContext(profile, { basicSumAssured: positiveGapOrUndefined(protectionNeed.protectionGap) });
  const termProducts = listEligibleProducts(context, { categories: TERM_CATEGORIES });

  return termProducts.map((assessment) => {
    const gapReason: StrategyReasonCode =
      protectionNeed.protectionGap != null && protectionNeed.protectionGap > 0
        ? "PROTECTION_GAP_PRESENT"
        : "NO_PROTECTION_GAP";
    const termComponent = buildComponent(assessment, "term_protection", context, [gapReason]);

    const termMonthly = termComponent.monthlyPremium.status === "verified" ? termComponent.monthlyPremium.value : null;
    const assumptions: string[] = [];
    const investmentMonthly = termMonthly != null ? Math.max(0, monthlyBudget - termMonthly) : monthlyBudget;
    if (termMonthly == null) {
      assumptions.push("illustrative_investment_uses_full_monthly_budget_because_protection_premium_is_unavailable");
    }

    const investmentReasonCodes: StrategyReasonCode[] =
      profile.riskComfort === "low"
        ? ["MARKET_RISK_NOT_PREFERRED"]
        : profile.riskComfort === "medium" || profile.riskComfort === "high"
          ? ["MARKET_RISK_ACCEPTED"]
          : [];
    const investmentComponent = buildIllustrativeInvestmentComponent(
      investmentMonthly,
      yearsToGoal,
      ratePct,
      investmentReasonCodes
    );

    return assembleStrategy({
      id: `protection_investment-${assessment.product.planNumber}`,
      family: "protection_investment",
      components: [termComponent, investmentComponent],
      profile,
      protectionNeed,
      goalResource: { amount: investmentComponent.maturityBenefit.value as number, status: "illustrative" },
      monthlyBudgetVerifiedUsed: termMonthly,
      marketLinked: true,
      assumptions,
      warnings: ["illustration_only_not_guaranteed_returns"],
      extraReasonCodes: [],
    });
  });
}

// ---- Family B: Traditional Insurance + Protection ----
function generateTraditionalProtectionStrategies(
  profile: CustomerFinancialProfile,
  protectionNeed: ProtectionNeedResult,
  goalNeed: GoalNeedResult
): StrategyResult[] {
  const goalType = profile.goalType;
  if (goalType == null || profile.targetGoalAmount == null) return [];

  const traditionalContext = buildBaseContext(profile, {
    basicSumAssured: goalNeed.remainingGoalGap ?? profile.targetGoalAmount,
  });
  const traditionalProducts = listEligibleProducts(traditionalContext, { categories: TRADITIONAL_CATEGORIES }).filter(
    (a) => a.product.goalTags.includes(goalType as GoalType)
  );

  const termContext = buildBaseContext(profile, { basicSumAssured: positiveGapOrUndefined(protectionNeed.protectionGap) });
  const termCandidate = pickFirstEligible(listEligibleProducts(termContext, { categories: TERM_CATEGORIES }));

  return traditionalProducts.map((assessment) => {
    const goalReason: StrategyReasonCode =
      goalNeed.remainingGoalGap != null && goalNeed.remainingGoalGap > 0 ? "GOAL_FUNDING_REQUIRED" : "GOAL_ALREADY_COVERED";
    const traditionalComponent = buildComponent(assessment, "traditional_savings", traditionalContext, [goalReason]);

    const components: StrategyComponent[] = [traditionalComponent];
    const assumptions: string[] = [];
    let termMonthly: number | null = null;
    let hasAdditionalTerm = false;

    if (protectionNeed.protectionGap != null && protectionNeed.protectionGap > 0 && termCandidate) {
      const traditionalDeathBenefit = traditionalComponent.deathBenefit.value ?? 0;
      const additionalGap = Math.max(0, protectionNeed.protectionGap - traditionalDeathBenefit);
      if (additionalGap > 0) {
        const additionalTermContext = buildBaseContext(profile, { basicSumAssured: additionalGap });
        const termComponent = buildComponent(termCandidate, "term_protection", additionalTermContext, [
          "ADDITIONAL_PROTECTION_REQUIRED",
        ]);
        components.push(termComponent);
        hasAdditionalTerm = true;
        termMonthly = termComponent.monthlyPremium.status === "verified" ? termComponent.monthlyPremium.value : null;
        assumptions.push("additional_term_component_uses_first_eligible_registered_term_product_not_a_ranked_choice");
      }
    }

    const traditionalMonthly =
      traditionalComponent.monthlyPremium.status === "verified" ? traditionalComponent.monthlyPremium.value : null;
    const monthlyBudgetVerifiedUsed =
      traditionalMonthly != null && (!hasAdditionalTerm || termMonthly != null)
        ? traditionalMonthly + (termMonthly ?? 0)
        : null;

    const maturity = traditionalComponent.maturityBenefit;

    return assembleStrategy({
      id: `traditional_protection-${assessment.product.planNumber}`,
      family: "traditional_protection",
      components,
      profile,
      protectionNeed,
      goalResource: maturity.value != null ? { amount: maturity.value, status: maturity.status } : null,
      monthlyBudgetVerifiedUsed,
      marketLinked: false,
      assumptions,
      warnings: [],
      extraReasonCodes: [],
    });
  });
}

// ---- Family C: Market-Linked Insurance ----
function generateMarketLinkedStrategies(
  profile: CustomerFinancialProfile,
  protectionNeed: ProtectionNeedResult
): StrategyResult[] {
  const context = buildBaseContext(profile, {});
  const ulipProducts = listEligibleProducts(context, { categories: MARKET_LINKED_CATEGORIES });

  const termContext = buildBaseContext(profile, { basicSumAssured: positiveGapOrUndefined(protectionNeed.protectionGap) });
  const termCandidate = pickFirstEligible(listEligibleProducts(termContext, { categories: TERM_CATEGORIES }));

  return ulipProducts.map((assessment) => {
    const ulipComponent = buildComponent(assessment, "market_linked_savings", context, []);

    const components: StrategyComponent[] = [ulipComponent];
    const assumptions: string[] = [
      "market_linked_premium_is_a_direct_customer_choice_not_derived_from_goal_or_budget",
    ];

    if (protectionNeed.protectionGap != null && protectionNeed.protectionGap > 0 && termCandidate) {
      const additionalTermContext = buildBaseContext(profile, { basicSumAssured: protectionNeed.protectionGap });
      const termComponent = buildComponent(termCandidate, "term_protection", additionalTermContext, [
        "ADDITIONAL_PROTECTION_REQUIRED",
      ]);
      components.push(termComponent);
      assumptions.push("additional_term_component_uses_first_eligible_registered_term_product_not_a_ranked_choice");
    }

    const extraReasonCodes: StrategyReasonCode[] = [];
    if (profile.riskComfort === "low") extraReasonCodes.push("MARKET_RISK_NOT_PREFERRED");
    else if (profile.riskComfort === "medium" || profile.riskComfort === "high")
      extraReasonCodes.push("MARKET_RISK_ACCEPTED");

    return assembleStrategy({
      id: `market_linked-${assessment.product.planNumber}`,
      family: "market_linked_insurance",
      components,
      profile,
      protectionNeed,
      // A ULIP's maturity/vesting Unit Fund Value is NAV-dependent and is
      // never projected anywhere in this codebase — goal coverage here
      // rests only on the customer's own existing resources.
      goalResource: null,
      // Premium is a direct customer choice for every registered ULIP —
      // never derivable from goal/budget alone.
      monthlyBudgetVerifiedUsed: null,
      marketLinked: true,
      assumptions,
      warnings: ["market_linked_maturity_value_never_projected_nav_dependent"],
      extraReasonCodes,
    });
  });
}

// ---- Family D: Traditional Insurance Structure ----
function generateTraditionalStructureStrategies(
  profile: CustomerFinancialProfile,
  goalNeed: GoalNeedResult
): StrategyResult[] {
  const goalType = profile.goalType;
  if (goalType == null || profile.targetGoalAmount == null) return [];

  const context = buildBaseContext(profile, { basicSumAssured: goalNeed.remainingGoalGap ?? profile.targetGoalAmount });
  const traditionalProducts = listEligibleProducts(context, { categories: TRADITIONAL_CATEGORIES }).filter((a) =>
    a.product.goalTags.includes(goalType as GoalType)
  );

  return traditionalProducts.map((assessment) => {
    const goalReason: StrategyReasonCode =
      goalNeed.remainingGoalGap != null && goalNeed.remainingGoalGap > 0 ? "GOAL_FUNDING_REQUIRED" : "GOAL_ALREADY_COVERED";
    const component = buildComponent(assessment, "traditional_savings", context, [goalReason]);

    const monthly = component.monthlyPremium.status === "verified" ? component.monthlyPremium.value : null;
    const maturity = component.maturityBenefit;

    return assembleStrategy({
      id: `traditional_structure-${assessment.product.planNumber}`,
      family: "traditional_structure",
      components: [component],
      profile,
      protectionNeed: NO_PROTECTION_NEED_FOR_GOAL_ONLY_STRUCTURES,
      goalResource: maturity.value != null ? { amount: maturity.value, status: maturity.status } : null,
      monthlyBudgetVerifiedUsed: monthly,
      marketLinked: false,
      assumptions: [],
      warnings: [],
      extraReasonCodes: [],
    });
  });
}

// ---- Family E: Retirement Structure ----
function generateRetirementStrategies(
  profile: CustomerFinancialProfile
): StrategyResult[] {
  if (profile.goalType !== "retirement") return [];

  const context = buildBaseContext(profile, {});
  const pensionProducts = listEligibleProducts(context, { categories: RETIREMENT_CATEGORIES });

  return pensionProducts.map((assessment) => {
    const component = buildComponent(assessment, "retirement_income", context, ["RETIREMENT_GOAL"]);
    const monthly = component.monthlyPremium.status === "verified" ? component.monthlyPremium.value : null;

    return assembleStrategy({
      id: `retirement_structure-${assessment.product.planNumber}`,
      family: "retirement_structure",
      components: [component],
      profile,
      protectionNeed: NO_PROTECTION_NEED_FOR_GOAL_ONLY_STRUCTURES,
      // Annuity/Purchase Price is a direct customer choice — never
      // derivable from a retirement corpus goal amount alone.
      goalResource: null,
      monthlyBudgetVerifiedUsed: monthly,
      marketLinked: assessment.product.marketLinked,
      assumptions: ["retirement_income_amount_is_a_direct_customer_choice_not_derived_from_goal"],
      warnings: [],
      extraReasonCodes: [],
    });
  });
}

// Families D and E are goal/retirement-funding-only structures — they
// deliberately don't reduce or report against the customer's protection
// need (that is Family A/B/C's job). Using this constant instead of the
// caller's real ProtectionNeedResult keeps their protectionCoverage/
// protectionGap fields honestly `unavailable` rather than misleadingly
// suggesting these structures address protection at all.
const NO_PROTECTION_NEED_FOR_GOAL_ONLY_STRUCTURES: ProtectionNeedResult = {
  requiredProtection: null,
  existingProtection: null,
  protectionGap: null,
  methodology: "liabilities_plus_family_support_plus_goal_obligations",
  components: { outstandingLiabilities: null, futureFamilySupport: null, goalObligations: null },
  assumptions: [],
  missingInputs: [],
  status: "unavailable",
};

export interface StrategyGenerationInput {
  profile: CustomerFinancialProfile;
  protectionNeed: ProtectionNeedResult;
  goalNeed: GoalNeedResult;
  illustrativeRatesPct?: readonly number[];
}

// The single entry point: generates every feasible structure this stage
// supports. Order is stable (family A through E) but carries no ranking
// meaning whatsoever — see this file's header comment.
export function generateStrategies(input: StrategyGenerationInput): StrategyResult[] {
  const { profile, protectionNeed, goalNeed } = input;
  const rates = input.illustrativeRatesPct ?? ILLUSTRATION_RATES_PCT;
  const representativeRatePct = rates[Math.min(1, rates.length - 1)];

  return [
    ...generateProtectionInvestmentStrategies(profile, protectionNeed, representativeRatePct),
    ...generateTraditionalProtectionStrategies(profile, protectionNeed, goalNeed),
    ...generateMarketLinkedStrategies(profile, protectionNeed),
    ...generateTraditionalStructureStrategies(profile, goalNeed),
    ...generateRetirementStrategies(profile),
  ];
}
