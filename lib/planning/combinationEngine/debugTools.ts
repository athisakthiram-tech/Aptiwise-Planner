// Phase 3B — Development-only diagnostics. NEVER imported by any UI
// component; exists purely to answer "why did/didn't this product show
// up" and "how exactly was this number computed" during development and
// testing (Section 21/22 of the Phase 3B task).

import { analyzeCustomer } from "@/lib/planning/combinationEngine/customerAnalyzer";
import { generateCandidateAnalyses } from "@/lib/planning/combinationEngine/candidateGenerator";
import { generateConfigurations } from "@/lib/planning/combinationEngine/configurationGenerator";
import { planCombinations } from "@/lib/planning/combinationEngine/planner";
import { componentCashFlowEvents } from "@/lib/planning/combinationEngine/structureSimulator";
import { analyzeStructureGoal } from "@/lib/planning/combinationEngine/structureAnalysis";
import { CandidateConfiguration, CandidateStructure, PlanningRequest, StructureComponent } from "@/lib/planning/combinationEngine/types";
import { projectBenefits, BenefitProjection } from "@/lib/planning/planIntelligence/benefitProjection";
import { CashFlowEvent, NeedTag } from "@/lib/planning/planIntelligence/types";

export interface PlanDebugReport {
  planNumber: string;
  uin: string;
  productName: string;
  active: boolean;
  hasRegisteredEngine: boolean;
  ageEligible: boolean | "UNKNOWN";
  horizonCompatible: boolean | "UNKNOWN";
  needFit: { need: NeedTag; fit: string; reasoning: string }[];
  needCompatible: boolean;
  marketRiskCompatible: boolean;
  premiumStructureCompatible: boolean;
  eliminated: boolean;
  eliminationReasons: string[];
  premiumCalculationReadiness: string;
  generatedConfigurations: CandidateConfiguration[];
  sampleBenefitProjection: BenefitProjection | null;
  sampleCashFlowEvents: CashFlowEvent[];
  appearsInFinalStructures: boolean;
  reasonSummary: string;
}

// Given a plan identity and the same PlanningRequest a real customer
// would submit, runs the REAL pipeline (never a special-cased shortcut)
// up to and including the final structure selection, and reports every
// intermediate decision so "why didn't Jeevan Umang appear?" has a
// concrete, traceable answer instead of a guess.
export function debugPlanForCustomer(planNumber: string, uin: string, request: PlanningRequest): PlanDebugReport {
  const customer = analyzeCustomer(request);
  const analyses = generateCandidateAnalyses(customer);
  const candidate = analyses.find((a) => a.profile.identity.planNumber === planNumber && a.profile.identity.uin === uin);
  if (!candidate) {
    throw new Error(`debugPlanForCustomer: no Phase 1 profile found for ${planNumber}/${uin}, or it was excluded by getEligiblePlanningProducts (e.g. active=false or age outside the plan's own published band)`);
  }

  const configurations = candidate.eliminated ? [] : generateConfigurations(candidate, customer);

  let sampleBenefitProjection: BenefitProjection | null = null;
  let sampleCashFlowEvents: CashFlowEvent[] = [];
  const sample = configurations[0];
  if (sample && sample.monthlyPremium.value != null) {
    const component: StructureComponent = {
      planNumber,
      uin,
      productName: candidate.profile.identity.productName,
      role: sample.role,
      monthlyAllocation: sample.monthlyPremium,
      policyTermYears: sample.policyTermYears,
      premiumPayingTermYears: sample.premiumPayingTermYears,
      basicSumAssured: sample.basicSumAssuredCandidate,
      benefitModel: candidate.profile.benefitModel,
      cashFlowPattern: candidate.profile.cashFlowPattern,
      marketLinked: candidate.profile.marketRisk === "MARKET_LINKED",
      ulipOfficialIllustrationRatesPct: candidate.profile.ulip?.officialIllustration?.ratesPct ?? null,
    };
    sampleCashFlowEvents = componentCashFlowEvents(component, request.yearsToGoal, request.age);
    if (sample.basicSumAssuredCandidate != null) {
      sampleBenefitProjection = projectBenefits({
        planNumber,
        uin,
        age: request.age,
        policyTermYears: sample.policyTermYears ?? request.yearsToGoal,
        premiumPayingTermYears: sample.premiumPayingTermYears,
        basicSumAssured: sample.basicSumAssuredCandidate,
      });
    }
  }

  const finalResult = planCombinations(request);
  const appearsInFinalStructures = finalResult.finalStructures.some((s) => s.structure.components.some((c) => c.planNumber === planNumber && c.uin === uin));

  let reasonSummary: string;
  if (candidate.eliminated) {
    reasonSummary = `Eliminated at Stage 3 (candidate analysis): ${candidate.eliminationReasons.join(", ")}`;
  } else if (configurations.length === 0) {
    reasonSummary = "Survived Stage 3 elimination, but Stage 4 (configuration generation) produced zero usable configurations — no defensible premium estimate exists for any probed PPT/BSA/allocation combination within the customer's monthly capacity.";
  } else if (!appearsInFinalStructures) {
    reasonSummary = "Survived elimination and generated at least one configuration, but was not selected into the final diverse structures — see planner.ts's selectDiverseStructures (a shape-diversity/dedup step, never a single score-and-sort).";
  } else {
    reasonSummary = "Appears in at least one of the final selected structures.";
  }

  return {
    planNumber,
    uin,
    productName: candidate.profile.identity.productName,
    active: candidate.profile.identity.active,
    hasRegisteredEngine: candidate.profile.identity.hasRegisteredEngine,
    ageEligible: candidate.ageEligible,
    horizonCompatible: candidate.horizonCompatible,
    needFit: candidate.relevantNeedFits,
    needCompatible: candidate.needCompatible,
    marketRiskCompatible: candidate.marketRiskCompatible,
    premiumStructureCompatible: candidate.premiumStructureCompatible,
    eliminated: candidate.eliminated,
    eliminationReasons: candidate.eliminationReasons,
    premiumCalculationReadiness: candidate.profile.premiumModel.calculationReadiness,
    generatedConfigurations: configurations,
    sampleBenefitProjection,
    sampleCashFlowEvents,
    appearsInFinalStructures,
    reasonSummary,
  };
}

export interface StructureDebugComponentReport {
  planNumber: string;
  uin: string;
  monthlyAllocation: number | null;
  cashFlowEvents: CashFlowEvent[];
}

export interface StructureDebugReport {
  components: StructureDebugComponentReport[];
  allEvents: CashFlowEvent[];
  goalYearEvents: CashFlowEvent[];
  goalYearValue: number | null;
  guaranteedContribution: number | null;
  nonGuaranteedContribution: number | null;
  illustrativeContribution: number | null;
  duplicateEventKeys: string[]; // non-empty => a real double-counting bug
  irrInputCashFlows: { yearFromStart: number; amount: number }[];
  irrPercent: number | null;
}

// Shows exactly how one structure's goal-year value/guaranteed split/IRR
// were computed, component by component — the tool to reach for when a
// number looks wrong and "which cash flow caused this" needs an answer.
export function debugStructure(structure: CandidateStructure, request: PlanningRequest): StructureDebugReport {
  const componentReports: StructureDebugComponentReport[] = structure.components.map((c) => ({
    planNumber: c.planNumber,
    uin: c.uin,
    monthlyAllocation: c.monthlyAllocation.value,
    cashFlowEvents: componentCashFlowEvents(c, request.yearsToGoal, request.age),
  }));

  const allEvents = componentReports.flatMap((c) => c.cashFlowEvents);
  const goalAnalysis = analyzeStructureGoal({ ...structure, events: allEvents }, request.goalAmount, request.yearsToGoal, request.age);
  const goalYearEvents = allEvents.filter((e) => e.kind !== "PREMIUM_OUTFLOW" && e.yearFromStart === request.yearsToGoal);

  const eventKeyCounts = new Map<string, number>();
  for (const e of allEvents) {
    const key = `${e.kind}@${e.yearFromStart}`;
    eventKeyCounts.set(key, (eventKeyCounts.get(key) ?? 0) + 1);
  }
  const duplicateEventKeys = [...eventKeyCounts.entries()].filter(([, count]) => count > 1).map(([key]) => key);

  const outflows = allEvents.filter((e) => e.kind === "PREMIUM_OUTFLOW");
  const inflows = allEvents.filter((e) => e.kind !== "PREMIUM_OUTFLOW" && e.amount.value != null);
  const irrInputCashFlows = [
    ...outflows.map((e) => ({ yearFromStart: e.yearFromStart, amount: -(e.amount.value ?? 0) })),
    ...inflows.map((e) => ({ yearFromStart: e.yearFromStart, amount: e.amount.value as number })),
  ];

  return {
    components: componentReports,
    allEvents,
    goalYearEvents,
    goalYearValue: goalAnalysis.goalYearValue.value,
    guaranteedContribution: goalAnalysis.guaranteedPortion.value,
    nonGuaranteedContribution: goalAnalysis.nonGuaranteedPortion.value,
    illustrativeContribution: goalAnalysis.marketLinkedIllustrativePortion.value,
    duplicateEventKeys,
    irrInputCashFlows,
    irrPercent: goalAnalysis.irrPercent.value,
  };
}
