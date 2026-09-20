// Goal Orchestrator (V2): the GOAL comes first. This module generates up
// to 3 GoalStructures — feasible, non-ranked combinations of registered
// LIC product components that work toward a stated goal within the
// customer's stated monthly capacity and horizon — never a single
// hardcoded "answer" product. See this repository's task history for
// the full product framing; this file only implements it.
//
// Architecture (never duplicated elsewhere):
//   CustomerFinancialProfile + ProtectionNeed + FundingContext
//     -> eligible, REGISTERED, goal-funding-role products
//        (lib/planning/productEligibility.ts + productRoles.ts)
//     -> budget-fitted components (budgetSolver.ts, calling the SAME
//        registered engines strategyGenerator.ts already calls)
//     -> cash-flow timeline (cashFlowTimeline.ts)
//     -> combined into a StrategyResult via strategyGenerator.ts's own
//        exported assembleStrategy() — never a second aggregation
//        implementation.
//
// No LIC formula is reimplemented here. No product is preferred for
// being well-known. A pure-protection product never occupies a
// goal-funding slot (productRoles.ts's isGoalFundingRole gate).

import { GoalType } from "@/types";
import { InsuranceCategory, LicCalculationContext } from "@/types/insurance";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { ProductEligibilityAssessment, listEligibleProducts } from "@/lib/planning/productEligibility";
import { assembleStrategy, buildComponent, buildIllustrativeInvestmentComponent } from "@/lib/planning/strategyGenerator";
import { StrategyComponent, StrategyComponentRole, StrategyReasonCode } from "@/lib/planning/strategyTypes";
import { ILLUSTRATION_RATES_PCT } from "@/lib/calculations/sip";
import { GoalResource } from "@/lib/planning/goalNeeds";
import { combineNumeric } from "@/lib/planning/statusUtils";
import { deriveProductRoles, isGoalFundingRole, ProductRole } from "@/lib/planning/goalOrchestrator/productRoles";
import { buildCashFlowTimeline, CashFlowPhase } from "@/lib/planning/goalOrchestrator/cashFlowTimeline";
import { solveBudgetFit } from "@/lib/planning/goalOrchestrator/budgetSolver";
import { FundingContext, GoalOrchestratorInput, GoalOrchestratorReasonCode, GoalStructure, UNKNOWN_FUNDING_CONTEXT } from "@/lib/planning/goalOrchestrator/types";

const GOAL_FUNDING_CATEGORIES: InsuranceCategory[] = ["savings_endowment", "whole_life", "money_back_child", "market_linked_ulip"];

// A small, fixed set of common limited-pay tenures to probe — never a
// per-product special case. Prefers the LONGEST tenure that still
// leaves a meaningful number of post-PPT years, so the illustration
// stays close to "pay for most of the term" rather than an arbitrarily
// short pay period.
const LIMITED_PAY_CANDIDATES_YEARS = [15, 10, 7, 5];
const MIN_POST_PPT_YEARS = 3;

function pickLimitedPayTermYears(horizonYears: number): number | null {
  const valid = LIMITED_PAY_CANDIDATES_YEARS.filter(
    (ppt) => ppt < horizonYears && horizonYears - ppt >= MIN_POST_PPT_YEARS
  );
  if (valid.length === 0) return null;
  return Math.max(...valid);
}

function roleForCategory(category: InsuranceCategory): StrategyComponentRole {
  if (category === "market_linked_ulip") return "market_linked_savings";
  if (category === "pension") return "retirement_income";
  return "traditional_savings";
}

function riskReasonCodes(riskComfort: CustomerFinancialProfile["riskComfort"]): StrategyReasonCode[] {
  if (riskComfort === "low") return ["MARKET_RISK_NOT_PREFERRED"];
  if (riskComfort === "medium" || riskComfort === "high") return ["MARKET_RISK_ACCEPTED"];
  return [];
}

interface BuiltComponent {
  component: StrategyComponent;
  role: ProductRole;
  monthlyPremiumForTimeline: number | null; // null = genuinely unknown, excluded from timeline math
  premiumPayingTermYears: number | null;
  maturesAtHorizon: boolean;
}

// Builds one product-backed component, budget-fitted where the engine
// supports it. `allowUnpricedPremium` covers products (like every
// registered ULIP) whose premium is the customer's OWN direct choice,
// not something the engine solves — mirrors strategyGenerator.ts's
// existing `capabilities.premium === "not_applicable"` handling exactly.
function buildProductComponent(params: {
  assessment: ProductEligibilityAssessment;
  baseContext: LicCalculationContext;
  policyTermYears: number;
  premiumPayingTermYears?: number;
  goalAmountSeed: number;
  monthlyCapacity: number;
  reasonCodes: StrategyReasonCode[];
}): BuiltComponent {
  const { assessment } = params;
  const role = roleForCategory(assessment.product.category);
  const productRoles = deriveProductRoles(assessment.product);

  if (assessment.capabilities.premium === "not_applicable") {
    // A direct customer-chosen contribution (every registered ULIP
    // today) — the "Planning Premium" IS the allocated capacity itself,
    // never solved for, exactly like strategyGenerator.ts's market-
    // linked family already treats it.
    const context: LicCalculationContext = { ...params.baseContext, policyTermYears: params.policyTermYears };
    const component = buildComponent(assessment, role, context, params.reasonCodes);
    return {
      component: { ...component, configuration: { basicSumAssured: null, policyTermYears: params.policyTermYears, premiumPayingTermYears: null } },
      role: productRoles[0] ?? "MARKET_LINKED_ACCUMULATION",
      monthlyPremiumForTimeline: params.monthlyCapacity,
      premiumPayingTermYears: null,
      maturesAtHorizon: false, // NAV-dependent — never projected as a horizon maturity value (Section 17)
    };
  }

  const solved = solveBudgetFit({
    assessment,
    role,
    baseContext: params.baseContext,
    policyTermYears: params.policyTermYears,
    premiumPayingTermYears: params.premiumPayingTermYears,
    initialBsaCandidate: params.goalAmountSeed,
    maxMonthlyBudget: params.monthlyCapacity,
    reasonCodes: params.reasonCodes,
  });

  const componentWithConfig: StrategyComponent = {
    ...solved.component,
    configuration: {
      basicSumAssured: solved.basicSumAssured,
      policyTermYears: solved.policyTermYears,
      premiumPayingTermYears: solved.premiumPayingTermYears,
    },
  };

  return {
    component: componentWithConfig,
    role: productRoles.find(isGoalFundingRole) ?? "GOAL_ACCUMULATION",
    monthlyPremiumForTimeline: solved.fits ? (solved.component.monthlyPremium.value as number) : null,
    premiumPayingTermYears: solved.premiumPayingTermYears,
    maturesAtHorizon: true, // policyTermYears is always the goal horizon in this generator (see callers)
  };
}

// A component's maturity value only counts toward the structure's
// combined goal contribution when BOTH (a) it genuinely matures at the
// goal horizon (never mixing an earlier cash flow into this figure —
// Section 16) AND (b) its own Planning Premium is genuinely known to
// fit the budget. Section 9's engine can happily report a "verified"
// maturity value for a Basic Sum Assured whose PREMIUM it could not
// confirm (e.g. a single-premium product asked for in a monthly-premium
// context) — showing that maturity value as part of a "you can afford
// this" goal-coverage figure would be exactly the fabricated confidence
// this whole engine exists to avoid, so an unaffordable/unverified
// component's maturity value is excluded from the combined figure even
// though it is still shown, honestly, on the component itself.
function combinedGoalResource(built: BuiltComponent[]): GoalResource | null {
  const maturityValues = built
    .filter((b) => b.maturesAtHorizon && b.monthlyPremiumForTimeline != null)
    .map((b) => b.component.maturityBenefit);
  const combined = combineNumeric(maturityValues);
  return combined.value != null ? { amount: combined.value, status: combined.status } : null;
}

function combinedMonthlyBudgetVerifiedUsed(built: BuiltComponent[]): number | null {
  if (built.some((b) => b.monthlyPremiumForTimeline == null)) return null;
  return built.reduce((sum, b) => sum + (b.monthlyPremiumForTimeline as number), 0);
}

function toGoalStructure(params: {
  id: string;
  profile: CustomerFinancialProfile;
  protectionNeed: ProtectionNeedResult;
  funding: FundingContext;
  built: BuiltComponent[];
  marketLinked: boolean;
  assumptions: string[];
  warnings: string[];
  horizonYears: number;
  monthlyCapacity: number;
  reasonCodes: GoalOrchestratorReasonCode[];
}): GoalStructure {
  const { built } = params;
  const components = built.map((b) => b.component);

  const strategyResult = assembleStrategy({
    id: params.id,
    // Reuses the existing "traditional_structure"/"market_linked_insurance"
    // family vocabulary so this StrategyResult is indistinguishable, to
    // every existing downstream consumer (CustomerPlan, proposal export),
    // from one strategyGenerator.ts itself produced — no new family value,
    // no new CustomerPlan schema needed to carry it.
    family: params.marketLinked ? "market_linked_insurance" : "traditional_structure",
    components,
    profile: params.profile,
    protectionNeed: params.protectionNeed,
    goalResource: combinedGoalResource(built),
    monthlyBudgetVerifiedUsed: combinedMonthlyBudgetVerifiedUsed(built),
    marketLinked: params.marketLinked,
    assumptions: params.assumptions,
    warnings: params.warnings,
    extraReasonCodes: [],
  });

  const timeline: CashFlowPhase[] = buildCashFlowTimeline({
    horizonYears: params.horizonYears,
    monthlyCapacity: params.monthlyCapacity,
    components: built
      .filter((b) => b.monthlyPremiumForTimeline != null)
      .map((b) => ({ monthlyPremium: b.monthlyPremiumForTimeline as number, premiumPayingTermYears: b.premiumPayingTermYears })),
  });

  return {
    id: params.id,
    strategyResult,
    componentRoles: built.map((b) => b.role),
    funding: params.funding,
    timeline,
    reasonCodes: params.reasonCodes,
  };
}

export function generateGoalStructures(input: GoalOrchestratorInput): GoalStructure[] {
  const { profile, protectionNeed } = input;
  const { goalType, targetGoalAmount, monthlyBudget, yearsToGoal, age } = profile;

  // The orchestrator needs a goal, an amount, a horizon and a monthly
  // capacity to construct anything at all — missing any of these stays
  // an empty result, never a guessed default (Section 26).
  if (
    goalType == null ||
    targetGoalAmount == null ||
    targetGoalAmount <= 0 ||
    monthlyBudget == null ||
    monthlyBudget <= 0 ||
    yearsToGoal == null ||
    yearsToGoal <= 0
  ) {
    return [];
  }

  const funding = input.funding ?? UNKNOWN_FUNDING_CONTEXT;
  const rates = input.illustrativeRatesPct ?? ILLUSTRATION_RATES_PCT;
  const representativeRatePct = rates[Math.min(1, rates.length - 1)];

  const categories = [...GOAL_FUNDING_CATEGORIES];
  if (goalType === "retirement") categories.push("pension");

  // Section 2: eligibility is evaluated against the FUNDING PERSON's own
  // age (CustomerFinancialProfile.age) — the goal's beneficiary never
  // enters an eligibility check, because none of this codebase's
  // registered engines take a beneficiary age at all.
  const baseContext: LicCalculationContext = { age: age ?? undefined, premiumMode: "yearly" };
  const eligibilityContext: LicCalculationContext = { ...baseContext, policyTermYears: yearsToGoal };

  const candidates = listEligibleProducts(eligibilityContext, { categories }).filter(
    (a) => a.product.goalTags.includes(goalType as GoalType) && deriveProductRoles(a.product).some(isGoalFundingRole)
  );

  if (candidates.length === 0) return [];

  const traditionalCandidates = candidates.filter((a) => a.product.category !== "market_linked_ulip" && a.product.category !== "pension");
  const marketLinkedCandidates = candidates.filter((a) => a.product.category === "market_linked_ulip");
  const retirementCandidates = candidates.filter((a) => a.product.category === "pension");

  const primaryPool = goalType === "retirement" && retirementCandidates.length > 0 ? retirementCandidates : traditionalCandidates;
  const pool = primaryPool.length > 0 ? primaryPool : candidates;

  const structures: GoalStructure[] = [];
  const goalReason: StrategyReasonCode = "GOAL_FUNDING_REQUIRED";

  // ---- Structure A: single, full-pay component using the full capacity ----
  //
  // Candidates are tried in the SAME deterministic catalogue order
  // listEligibleProducts already returns — never reordered by fame or
  // popularity. This only prefers a candidate whose Planning Premium the
  // solver could actually confirm within budget over one it honestly
  // could not (e.g. a single-premium-only product asked for in a
  // monthly-premium context) — it is a defensibility filter, not a
  // quality ranking. If NOTHING fits, the first candidate is still shown
  // with an honest "Requires verification", exactly like the existing
  // Strategy Generator already does elsewhere in this codebase.
  let primary = pool[0];
  let structureABuilt = buildProductComponent({
    assessment: primary,
    baseContext,
    policyTermYears: yearsToGoal,
    goalAmountSeed: targetGoalAmount,
    monthlyCapacity: monthlyBudget,
    reasonCodes: [goalReason],
  });
  if (structureABuilt.monthlyPremiumForTimeline == null) {
    for (const candidate of pool.slice(1)) {
      const attempt = buildProductComponent({
        assessment: candidate,
        baseContext,
        policyTermYears: yearsToGoal,
        goalAmountSeed: targetGoalAmount,
        monthlyCapacity: monthlyBudget,
        reasonCodes: [goalReason],
      });
      if (attempt.monthlyPremiumForTimeline != null) {
        primary = candidate;
        structureABuilt = attempt;
        break;
      }
    }
  }
  const structureAReasons: GoalOrchestratorReasonCode[] = structureABuilt.monthlyPremiumForTimeline != null
    ? ["SINGLE_COMPONENT_SUFFICIENT"]
    : ["PRIMARY_PREMIUM_REQUIRES_VERIFICATION"];
  structures.push(
    toGoalStructure({
      id: `goal_structure_a-${primary.product.planNumber}`,
      profile,
      protectionNeed,
      funding,
      built: [structureABuilt],
      marketLinked: primary.product.category === "market_linked_ulip",
      assumptions: [],
      warnings: [],
      horizonYears: yearsToGoal,
      monthlyCapacity: monthlyBudget,
      reasonCodes: structureAReasons,
    })
  );

  // ---- Structure B: limited-pay primary + post-PPT second component ----
  const limitedPayYears = pickLimitedPayTermYears(yearsToGoal);
  if (limitedPayYears != null) {
    const primaryLimited = buildProductComponent({
      assessment: primary,
      baseContext,
      policyTermYears: yearsToGoal,
      premiumPayingTermYears: limitedPayYears,
      goalAmountSeed: targetGoalAmount,
      monthlyCapacity: monthlyBudget,
      reasonCodes: [goalReason],
    });

    const remainingYears = yearsToGoal - limitedPayYears;
    const freedCapacity =
      primaryLimited.monthlyPremiumForTimeline != null
        ? Math.max(0, monthlyBudget - primaryLimited.monthlyPremiumForTimeline)
        : monthlyBudget;

    let secondBuilt: BuiltComponent | null = null;
    let secondReason: GoalOrchestratorReasonCode = "SECOND_COMPONENT_USES_POST_PPT_CAPACITY";

    if (freedCapacity > 0 && remainingYears > 0) {
      const secondCandidatePool = [
        ...traditionalCandidates.filter((c) => c.product.planNumber !== primary.product.planNumber || c.product.uin !== primary.product.uin),
        ...marketLinkedCandidates,
      ];
      const secondEligibilityContext: LicCalculationContext = { age: age ?? undefined, premiumMode: "yearly", policyTermYears: remainingYears };
      const reEligible = secondCandidatePool.filter((c) => {
        const engine = listEligibleProducts(secondEligibilityContext, { categories: [c.product.category] });
        return engine.some((e) => e.product.planNumber === c.product.planNumber && e.product.uin === c.product.uin);
      });

      const secondCandidate = reEligible[0];
      if (secondCandidate) {
        const attempt = buildProductComponent({
          assessment: secondCandidate,
          baseContext,
          policyTermYears: remainingYears,
          goalAmountSeed: Math.max(0, targetGoalAmount),
          monthlyCapacity: freedCapacity,
          reasonCodes: [goalReason],
        });
        if (attempt.monthlyPremiumForTimeline != null) {
          secondBuilt = attempt;
        }
      }

      // Fallback: an illustrative, continued savings component for the
      // freed post-PPT capacity — explicitly permitted (Section 9/14) as
      // one of the legitimate uses of freed capacity when no second
      // registered product resolves within it.
      if (!secondBuilt && remainingYears > 0) {
        const illustrative = buildIllustrativeInvestmentComponent(
          freedCapacity,
          remainingYears,
          representativeRatePct,
          riskReasonCodes(profile.riskComfort)
        );
        secondBuilt = {
          component: illustrative,
          // Not a real product, so it has no catalogue category — the
          // SIP illustration carries genuine market risk (it is never
          // "verified"/guaranteed), which is the same character as
          // MARKET_LINKED_ACCUMULATION, so that role is reused here
          // rather than adding a role value for a non-product component.
          role: "MARKET_LINKED_ACCUMULATION",
          monthlyPremiumForTimeline: freedCapacity,
          premiumPayingTermYears: null,
          // Starts right after the primary's PPT completes and runs for
          // exactly the remaining years, so it genuinely completes AT
          // the goal horizon — the timing check in combinedGoalResource
          // is real, not assumed.
          maturesAtHorizon: true,
        };
        secondReason = "SECOND_COMPONENT_USES_POST_PPT_CAPACITY";
      }
    }

    if (secondBuilt) {
      structures.push(
        toGoalStructure({
          id: `goal_structure_b-${primary.product.planNumber}`,
          profile,
          protectionNeed,
          funding,
          built: [primaryLimited, secondBuilt],
          marketLinked: secondBuilt.component.role === "market_linked_savings",
          assumptions: [
            "goal_structure_b_second_component_illustrates_post_ppt_capacity_reuse_not_a_guaranteed_future_commitment",
          ],
          warnings: secondBuilt.component.monthlyPremium.status === "illustrative" ? ["illustration_only_not_guaranteed_returns"] : [],
          horizonYears: yearsToGoal,
          monthlyCapacity: monthlyBudget,
          reasonCodes: [secondReason],
        })
      );
    }
  }

  // ---- Structure C: market-linked alternative (single component) ----
  if (structures.length < 3) {
    const mlCandidate = marketLinkedCandidates.find(
      (c) => c.product.planNumber !== primary.product.planNumber || c.product.uin !== primary.product.uin
    );
    if (mlCandidate) {
      const built = buildProductComponent({
        assessment: mlCandidate,
        baseContext,
        policyTermYears: yearsToGoal,
        goalAmountSeed: targetGoalAmount,
        monthlyCapacity: monthlyBudget,
        reasonCodes: [...riskReasonCodes(profile.riskComfort)],
      });
      structures.push(
        toGoalStructure({
          id: `goal_structure_c-${mlCandidate.product.planNumber}`,
          profile,
          protectionNeed,
          funding,
          built: [built],
          marketLinked: true,
          assumptions: ["market_linked_premium_is_a_direct_customer_choice_not_derived_from_goal_or_budget"],
          warnings: ["market_linked_maturity_value_never_projected_nav_dependent"],
          horizonYears: yearsToGoal,
          monthlyCapacity: monthlyBudget,
          reasonCodes: ["MARKET_LINKED_ALTERNATIVE_STRUCTURE"],
        })
      );
    }
  }

  return structures.slice(0, 3);
}
