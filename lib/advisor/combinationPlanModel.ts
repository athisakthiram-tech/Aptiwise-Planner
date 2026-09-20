// Phase 4 — THE canonical planning path for the live 4-screen advisor
// flow: PlanningRequest -> combinationEngine.planCombinations() ->
// AdvisorStructureView[] (this module's own output) -> Screens 2/3/4.
//
// This is the ONE adapter between the Phase 2/3/3B planning brain
// (candidate analysis, confidence objects, reason codes, provenance
// trees, source quality, raw cash-flow events — all real, all needed
// internally) and a simple, customer/advisor-facing shape that never
// leaks any of that. Screens 2/3/4 must import ONLY from this module
// (plus formatting/i18n helpers) — never from combinationEngine/*,
// planIntelligence/* or benefitProjection.ts directly.
//
// A SEPARATE function here (buildStrategyResultForSnapshot) adapts one
// selected AnalyzedStructure into the pre-existing StrategyResult shape
// so createCustomerPlan()/CustomerPlanPreview/WhatsApp/PDF are reused
// completely unchanged (see lib/customerPlan/createCustomerPlan.ts) —
// never a second proposal system.

import { GoalType, RiskComfort } from "@/types";
import { InsuranceCategory, ValueStatus } from "@/types/insurance";
import { ComparisonValue, RiskLevel } from "@/lib/comparison/protectionAdjustedComparison";
import { StrategyComponent, StrategyComponentRole, StrategyResult } from "@/lib/planning/strategyTypes";
import { planCombinations } from "@/lib/planning/combinationEngine/planner";
import { AnalyzedStructure, PlanningRequest, PlanningResult, RiskPreference, StructureComponent as EngineComponent } from "@/lib/planning/combinationEngine/types";
import { getPlanIntelligenceProfile } from "@/lib/planning/planIntelligence/planProfiles";
import { DataConfidence, ExtendedProductRole } from "@/lib/planning/planIntelligence/types";
import { sipFutureValue } from "@/lib/calculations/sip";
import { componentCashFlowEvents } from "@/lib/planning/combinationEngine/structureSimulator";

// ---- Screen 1 -> PlanningRequest ----

// Screen 1's own goal picker adds "Other" and "Regular Income" — display
// options with no dedicated GoalType of their own. Mapped purely for
// candidate search; every screen still shows the customer's literal
// choice via its own i18n key, never silently relabels the choice.
export type AdvisorGoalOption = GoalType | "other" | "regular_income";

export function toEngineGoalType(option: AdvisorGoalOption): GoalType {
  if (option === "other") return "wealth";
  if (option === "regular_income") return "retirement";
  return option;
}

// The customer's own literal goal choice, for display — never the
// engine-mapped GoalType (which collapses "Other"/"Regular Income" into
// "wealth"/"retirement" purely for candidate search).
export function goalOptionI18nKey(option: AdvisorGoalOption): string {
  return `advisor.goal.${option}`;
}

function toRiskPreference(riskComfort: RiskComfort | null): RiskPreference | null {
  switch (riskComfort) {
    case "low":
      return "conservative";
    case "medium":
      return "balanced";
    case "high":
      return "growth";
    default:
      return null;
  }
}

export interface AdvisorCustomerInputLike {
  profession: string;
  age: number | null;
  goalOption: AdvisorGoalOption;
  targetGoalAmount: number | null;
  yearsToGoal: number | null;
  monthlyBudget: number | null;
  riskComfort: RiskComfort | null;
}

// Returns null when Screen 1's required fields aren't all filled — the
// caller (Screen 1's own `canSubmit` check) already prevents reaching
// this with incomplete input, but this function never assumes that and
// never fabricates a request from partial data.
export function buildPlanningRequest(input: AdvisorCustomerInputLike): PlanningRequest | null {
  if (input.age == null || input.age <= 0) return null;
  if (input.targetGoalAmount == null || input.targetGoalAmount <= 0) return null;
  if (input.yearsToGoal == null || input.yearsToGoal <= 0) return null;
  if (input.monthlyBudget == null || input.monthlyBudget <= 0) return null;

  return {
    age: input.age,
    profession: input.profession.trim() ? input.profession.trim() : null,
    goal: toEngineGoalType(input.goalOption),
    goalAmount: input.targetGoalAmount,
    yearsToGoal: input.yearsToGoal,
    monthlyCapacity: input.monthlyBudget,
    riskPreference: toRiskPreference(input.riskComfort),
  };
}

// ---- DataConfidence -> the simple "is this estimated" the UI needs ----
// (Section: "Estimated Premium Display" — never expose the 5-tier
// DataConfidence/estimationConfidence/sourceQuality vocabulary itself.)
function isEstimatedStatus(status: DataConfidence): boolean {
  return status === "ESTIMATED";
}

// ---- Plain-language role vocabulary (Screen 2/3 "short role") ----
export type AdvisorProductRoleLabel = "goalCorpus" | "marketLinkedGrowth" | "scheduledBenefits" | "regularIncome" | "longTermIncome" | "protection";

function roleLabelFor(role: ExtendedProductRole): AdvisorProductRoleLabel {
  switch (role) {
    case "MARKET_LINKED_ACCUMULATION":
      return "marketLinkedGrowth";
    case "SCHEDULED_LIQUIDITY":
      return "scheduledBenefits";
    case "INCOME_GENERATION":
      return "regularIncome";
    case "RETIREMENT":
      return "longTermIncome";
    case "PROTECTION_ONLY":
      return "protection";
    default:
      return "goalCorpus"; // GOAL_ACCUMULATION, LONG_TERM_PROTECTION_SAVINGS, LEGACY, CAPITAL_STABILITY
  }
}

export function roleLabelI18nKey(role: AdvisorProductRoleLabel): string {
  return `advisor.role2.${role}`;
}

// ---- Per-component view ----
export interface AdvisorUlipIllustration {
  lowerValue: number | null;
  higherValue: number | null;
  lowerRatePct: number;
  higherRatePct: number;
  fmcPercent: number;
}

export interface AdvisorComponentView {
  planNumber: string;
  uin: string;
  productName: string;
  roleLabel: AdvisorProductRoleLabel;
  monthlyPremium: number;
  premiumIsEstimated: boolean;
  premiumPayingTermYears: number | null;
  policyTermYears: number | null;
  marketLinked: boolean;
  // Traditional products only — the per-component guaranteed vs
  // participating-estimate split (never merged into one number). Null
  // for a market-linked component (it has no BSA-based guaranteed leg).
  guaranteedAtGoal: number | null;
  participatingEstimateAtGoal: number | null;
  // Market-linked products only.
  ulipIllustration: AdvisorUlipIllustration | null;
  protectionDescription: string | null;
  hasLifeProtection: boolean;
}

const ULIP_FUND_MANAGEMENT_CHARGE_PCT = 1.35; // matches structureSimulator.ts's own constant — see that module's comment for why all 4 of this catalogue's active ULIPs share this rate

function buildUlipIllustration(component: EngineComponent, yearsToGoal: number): AdvisorUlipIllustration | null {
  const rates = component.ulipOfficialIllustrationRatesPct;
  const premium = component.monthlyAllocation.value;
  if (!rates || rates.length === 0 || premium == null) return null;
  const ppt = component.premiumPayingTermYears ?? component.policyTermYears ?? yearsToGoal;
  const lowerRatePct = Math.min(...rates);
  const higherRatePct = Math.max(...rates);
  const netLower = Math.max(0, lowerRatePct - ULIP_FUND_MANAGEMENT_CHARGE_PCT);
  const netHigher = Math.max(0, higherRatePct - ULIP_FUND_MANAGEMENT_CHARGE_PCT);
  return {
    lowerValue: sipFutureValue(premium, netLower, ppt),
    higherValue: sipFutureValue(premium, netHigher, ppt),
    lowerRatePct,
    higherRatePct,
    fmcPercent: ULIP_FUND_MANAGEMENT_CHARGE_PCT,
  };
}

// Guaranteed vs participating-estimate for THIS component, classified
// the SAME way structureAnalysis.ts's own classify() does at the
// structure level (VERIFIED/DERIVED -> guaranteed, ESTIMATED ->
// participating estimate) — deliberately NOT Phase 1's analyzeReturn
// (whose guaranteed/non-guaranteed split is VERIFIED-only, a stricter
// convention built for a different purpose). Using a different split
// here than the structure-level total would show a component card and
// the goal-analysis summary silently disagreeing on the same rupee.
function traditionalComponentBreakdown(component: EngineComponent, age: number, yearsToGoal: number): { guaranteedAtGoal: number | null; participatingEstimateAtGoal: number | null } {
  const events = componentCashFlowEvents(component, yearsToGoal, age).filter((e) => e.kind !== "PREMIUM_OUTFLOW");
  const guaranteed = events.filter((e) => e.amount.provenance.status === "VERIFIED" || e.amount.provenance.status === "DERIVED");
  const participating = events.filter((e) => e.amount.provenance.status === "ESTIMATED");
  const sum = (list: typeof events) => (list.some((e) => e.amount.value == null) ? null : list.reduce((s, e) => s + (e.amount.value as number), 0));
  return { guaranteedAtGoal: sum(guaranteed), participatingEstimateAtGoal: sum(participating) };
}

function buildComponentView(component: EngineComponent, structure: AnalyzedStructure, age: number, yearsToGoal: number): AdvisorComponentView | null {
  if (component.monthlyAllocation.value == null) return null; // defensive — the engine never produces this, but a broken card must never render (Phase 4's own rule)
  const profile = getPlanIntelligenceProfile(component.planNumber, component.uin);
  if (!profile) return null; // never a fake/unknown product on screen

  const breakdown = component.marketLinked ? { guaranteedAtGoal: null, participatingEstimateAtGoal: null } : traditionalComponentBreakdown(component, age, yearsToGoal);
  const ulipIllustration = component.marketLinked ? buildUlipIllustration(component, yearsToGoal) : null;
  // A market-linked component this repository has no verified official
  // illustration rate for cannot produce a meaningful card (no
  // guaranteed leg either) — same "never render a broken option" rule
  // as an unknown product or a missing premium.
  if (component.marketLinked && ulipIllustration == null) return null;

  return {
    planNumber: component.planNumber,
    uin: component.uin,
    productName: profile.identity.productName.replace(/^LIC's /, ""),
    roleLabel: roleLabelFor(component.role),
    monthlyPremium: component.monthlyAllocation.value,
    premiumIsEstimated: isEstimatedStatus(component.monthlyAllocation.provenance.status),
    premiumPayingTermYears: component.premiumPayingTermYears,
    policyTermYears: component.policyTermYears,
    marketLinked: component.marketLinked,
    guaranteedAtGoal: breakdown.guaranteedAtGoal,
    participatingEstimateAtGoal: breakdown.participatingEstimateAtGoal,
    ulipIllustration,
    protectionDescription: profile.protectionModel.hasLifeProtection ? profile.protectionModel.description : null,
    hasLifeProtection: profile.protectionModel.hasLifeProtection,
  };
}

// ---- Timeline (Screen 3's compact visual) ----
export interface AdvisorTimelinePhase {
  fromAge: number;
  toAge: number;
  fromYear: number;
  toYear: number;
  allocatedMonthly: number;
  freeMonthly: number;
}

function buildTimeline(structure: AnalyzedStructure, age: number): AdvisorTimelinePhase[] {
  return structure.structure.timeline.map((phase) => ({
    fromAge: age + phase.fromYear,
    toAge: age + phase.toYear,
    fromYear: phase.fromYear,
    toYear: phase.toYear,
    allocatedMonthly: phase.allocatedMonthly,
    freeMonthly: phase.freeMonthly,
  }));
}

// ---- Goal analysis (Screen 3's "Goal Analysis" section) ----
export interface AdvisorGoalAnalysisView {
  goalAmount: number;
  guaranteedAtGoal: number | null;
  participatingEstimateAtGoal: number | null;
  illustrativeAtGoal: number | null;
  totalAtGoal: number | null;
  // True only when EVERY rupee counted in totalAtGoal is guaranteed —
  // gates whether a gap/surplus may ever be called "guaranteed" rather
  // than "estimated" (Phase 4's own explicit rule).
  totalAtGoalFullyGuaranteed: boolean;
  coveragePercent: number | null;
  gapOrSurplus: { kind: "GAP" | "SURPLUS" | "UNKNOWN"; amount: number | null };
  // Recurring income continuing PAST the goal year — kept structurally
  // separate, never folded into totalAtGoal (Phase 4's "do not mix
  // post-goal value" rule). Null/0 for every structure this engine can
  // currently reach (Umang/Utsav aren't reachable yet — see
  // docs/lic-financial-knowledge-v2.md) but the field always exists so a
  // future income-capable structure renders correctly with no UI change.
  incomeAfterGoal: number | null;
}

function buildGoalAnalysisView(structure: AnalyzedStructure): AdvisorGoalAnalysisView {
  const ga = structure.goalAnalysis;
  const fullyGuaranteed = (ga.nonGuaranteedPortion.value ?? 0) === 0 && (ga.marketLinkedIllustrativePortion.value ?? 0) === 0 && ga.goalYearValue.value != null;

  return {
    goalAmount: ga.goalAmount,
    guaranteedAtGoal: ga.guaranteedPortion.value,
    participatingEstimateAtGoal: ga.nonGuaranteedPortion.value,
    illustrativeAtGoal: ga.marketLinkedIllustrativePortion.value,
    totalAtGoal: ga.goalYearValue.value,
    totalAtGoalFullyGuaranteed: fullyGuaranteed,
    coveragePercent: ga.goalCoveragePercent.value,
    gapOrSurplus: { kind: ga.gapOrSurplus.kind, amount: ga.gapOrSurplus.amount.value },
    incomeAfterGoal: ga.incomeReceivedAfterGoal.value,
  };
}

// ---- Neutral, factual characteristic (never "best"/"winner") ----
function buildCharacteristicI18nKey(structure: AnalyzedStructure): string | null {
  const codes = structure.reasonCodes;
  if (codes.includes("COMBINES_GUARANTEED_AND_MARKET_LINKED")) return "advisor.characteristic.mixedTraditionalAndMarketLinked";
  if (codes.includes("COMBINES_TWO_GUARANTEED_COMPONENTS")) return "advisor.characteristic.moreContractualBenefits";
  if (codes.includes("PROVIDES_RECURRING_INCOME")) return "advisor.characteristic.longTermIncomeOriented";
  if (structure.structure.components.every((c) => c.marketLinked)) return "advisor.characteristic.higherMarketLinkedExposure";
  if (structure.structure.components.length === 1) return "advisor.characteristic.singleProductStructure";
  return null;
}

// ---- The structure view Screens 2/3/4 actually consume ----
export interface AdvisorStructureView {
  id: string;
  letter: string;
  components: AdvisorComponentView[];
  monthlyTotal: number;
  allocations: { amount: number; percent: number }[];
  characteristicI18nKey: string | null;
  goalAnalysis: AdvisorGoalAnalysisView;
  timeline: AdvisorTimelinePhase[];
  yearsToGoal: number;
  // Kept ONLY for buildStrategyResultForSnapshot's own use (Screen 4's
  // "Create Plan" action) — Screens 2/3 must never read this field.
  raw: AnalyzedStructure;
}

const STRUCTURE_LETTERS = ["A", "B", "C"];
const MAX_STRUCTURES = 3;

// THE single call site every screen's data ultimately traces back to.
export function planAdvisorStructures(request: PlanningRequest): AdvisorStructureView[] {
  const result: PlanningResult = planCombinations(request);
  const views: AdvisorStructureView[] = [];

  // The engine itself already caps at 3 (selectDiverseStructures) — this
  // is a defensive second cap, never a place that invents a 4th option.
  for (const structure of result.finalStructures.slice(0, MAX_STRUCTURES)) {
    const componentViews = structure.structure.components.map((c) => buildComponentView(c, structure, request.age, request.yearsToGoal)).filter((c): c is AdvisorComponentView => c != null);
    // Phase 4's own rule: never render a normal option with an unknown
    // product or a missing premium — if any component came back broken,
    // skip the WHOLE structure rather than show a partial/misleading card.
    if (componentViews.length !== structure.structure.components.length || componentViews.length === 0) continue;

    const monthlyTotal = componentViews.reduce((sum, c) => sum + c.monthlyPremium, 0);
    const allocations = componentViews.map((c) => ({
      amount: c.monthlyPremium,
      percent: monthlyTotal > 0 ? Math.round((c.monthlyPremium / monthlyTotal) * 100) : 0,
    }));

    views.push({
      id: structure.structure.id,
      letter: STRUCTURE_LETTERS[views.length] ?? String(views.length + 1),
      components: componentViews,
      monthlyTotal,
      allocations,
      characteristicI18nKey: buildCharacteristicI18nKey(structure),
      goalAnalysis: buildGoalAnalysisView(structure),
      timeline: buildTimeline(structure, request.age),
      yearsToGoal: request.yearsToGoal,
      raw: structure,
    });
  }

  return views;
}

// ---- Screen 4 "Create Plan" -> StrategyResult (for createCustomerPlan reuse) ----

function toValueStatus(status: DataConfidence): ValueStatus {
  switch (status) {
    case "VERIFIED":
    case "DERIVED":
      return "verified";
    case "ESTIMATED":
      return "partial";
    case "HISTORICAL":
    case "ILLUSTRATIVE":
      return "illustrative";
  }
}

function toStrategyComponentRole(role: ExtendedProductRole): StrategyComponentRole {
  switch (role) {
    case "MARKET_LINKED_ACCUMULATION":
      return "market_linked_savings";
    case "RETIREMENT":
    case "INCOME_GENERATION":
      return "retirement_income";
    case "PROTECTION_ONLY":
      return "term_protection";
    default:
      return "traditional_savings";
  }
}

function comparisonValue<T>(value: T | null, status: ValueStatus, source?: string): ComparisonValue<T> {
  return { value, status, source };
}

function toStrategyComponent(component: EngineComponent, structure: AnalyzedStructure): StrategyComponent {
  const profile = getPlanIntelligenceProfile(component.planNumber, component.uin);
  const perComponent = structure.goalAnalysis.perComponentReturn.find((r) => r.planNumber === component.planNumber && r.uin === component.uin);
  const totalValue = perComponent?.returnAnalysis.totalValueReceived;

  return {
    role: toStrategyComponentRole(component.role),
    product: profile
      ? { planNumber: component.planNumber, uin: component.uin, productName: profile.identity.productName, category: profile.identity.category as InsuranceCategory }
      : null,
    eligible: true,
    monthlyPremium: comparisonValue(component.monthlyAllocation.value, toValueStatus(component.monthlyAllocation.provenance.status), `lic-${component.planNumber}`),
    // Not quantified by the combination engine (Phase 2/3 describe
    // protection qualitatively per plan intelligence, never a number for
    // an arbitrary Basic Sum Assured) — honestly unavailable, never
    // fabricated, matching this codebase's existing convention.
    deathBenefit: comparisonValue<number>(null, "unavailable", undefined),
    maturityBenefit: totalValue ? comparisonValue(totalValue.value, toValueStatus(totalValue.provenance.status), `lic-${component.planNumber}`) : comparisonValue<number>(null, "unavailable"),
    reasonCodes: ["PRODUCT_ELIGIBLE"],
    configuration: { basicSumAssured: component.basicSumAssured, policyTermYears: component.policyTermYears, premiumPayingTermYears: component.premiumPayingTermYears },
  };
}

// Adapts ONE selected AnalyzedStructure into the pre-existing
// StrategyResult shape so createCustomerPlan()/CustomerPlanPreview/
// WhatsApp/PDF are reused completely unchanged. This is the ONLY reason
// this shape exists on the new path — Screens 2/3 never see it.
export function buildStrategyResultForSnapshot(structure: AnalyzedStructure, monthlyCapacity: number): StrategyResult {
  const components = structure.structure.components.map((c) => toStrategyComponent(c, structure));
  const ga = structure.goalAnalysis;
  const anyMarketLinked = structure.structure.components.some((c) => c.marketLinked);
  const monthlyUsed = structure.monthlyBudgetUsed.value;

  return {
    id: structure.structure.id,
    family: anyMarketLinked ? "market_linked_insurance" : "traditional_structure",
    components,
    monthlyBudgetAvailable: monthlyCapacity,
    monthlyBudgetVerifiedUsed: monthlyUsed,
    monthlyBudgetUsageStatus: toValueStatus(structure.monthlyBudgetUsed.provenance.status),
    remainingBudget: monthlyUsed != null ? Math.max(0, monthlyCapacity - monthlyUsed) : null,
    // Life protection isn't quantified by this engine (see
    // toStrategyComponent's own comment) — honestly unavailable.
    protectionCoverage: comparisonValue<number>(null, "unavailable"),
    protectionGap: comparisonValue<number>(null, "unavailable"),
    goalCoverage: comparisonValue(
      ga.goalYearValue.value != null ? { coveragePercent: ga.goalCoveragePercent.value ?? 0, remainingGap: ga.gapOrSurplus.kind === "GAP" ? (ga.gapOrSurplus.amount.value ?? 0) : 0, surplus: ga.gapOrSurplus.kind === "SURPLUS" ? (ga.gapOrSurplus.amount.value ?? 0) : 0 } : null,
      toValueStatus(ga.goalYearValue.provenance.status)
    ),
    goalGap: comparisonValue(ga.gapOrSurplus.kind === "GAP" ? ga.gapOrSurplus.amount.value : 0, toValueStatus(ga.gapOrSurplus.amount.provenance.status)),
    marketExposure: comparisonValue<RiskLevel>(anyMarketLinked ? "market_linked" : "not_market_linked", "verified"),
    liquidity: comparisonValue<null>(null, "conditional", undefined),
    guarantees: comparisonValue(ga.guaranteedPortion.value, toValueStatus(ga.guaranteedPortion.provenance.status)),
    costs: comparisonValue<null>(null, "unavailable"),
    taxTreatment: comparisonValue<null>(null, "conditional"),
    assumptions: ["combination_engine_phase2_phase3_phase3b_planning_brain"],
    warnings: [],
    reasonCodes: ["PRODUCT_ELIGIBLE"],
    confidence: toValueStatus(structure.dataConfidence),
  };
}
