// Aptiwise Plan Combination Brain — Phase 2 top-level orchestrator.
//
// CustomerAnalysis -> CandidateAnalysis[] -> ProductConfiguration[] ->
// SingleProductStructure[] -> PairStructure[] -> OptionalTripleStructure[]
// -> simulateStructure() -> analyzeStructure() -> selectDiverseStructures(max=3)
//
// This module wires the pipeline together and does no independent
// product/mechanics reasoning of its own — every judgment comes from
// the stage modules, which in turn never re-derive Phase 1's own
// intelligence. UI presentation (labels, localized copy, rounding for
// display) is explicitly deferred to Phase 3 — this module's output is
// full-precision, provenance-tagged data.

import { analyzeCustomer } from "@/lib/planning/combinationEngine/customerAnalyzer";
import { generateCandidateAnalyses } from "@/lib/planning/combinationEngine/candidateGenerator";
import { generateAllConfigurations } from "@/lib/planning/combinationEngine/configurationGenerator";
import { generatePairStructures, generateSingleProductStructures, generateTripleStructures } from "@/lib/planning/combinationEngine/structureGenerator";
import { simulateStructure } from "@/lib/planning/combinationEngine/structureSimulator";
import { analyzeStructureGoal } from "@/lib/planning/combinationEngine/structureAnalysis";
import { selectDiverseStructures } from "@/lib/planning/combinationEngine/diversitySelector";
import { generateExplanationParts, generateReasonCodes } from "@/lib/planning/combinationEngine/reasonGenerator";
import { combineProvenance } from "@/lib/planning/planIntelligence/confidence";
import { AnalyzedStructure, CandidateAnalysis, PlanningRequest, PlanningResult } from "@/lib/planning/combinationEngine/types";

export function planCombinations(request: PlanningRequest): PlanningResult {
  const startedAt = Date.now();

  const customer = analyzeCustomer(request);
  const candidateAnalyses = generateCandidateAnalyses(customer);
  const survivingCandidates = candidateAnalyses.filter((c) => !c.eliminated);

  const candidatesByPlan = new Map<string, CandidateAnalysis>(
    survivingCandidates.map((c) => [`${c.profile.identity.planNumber}::${c.profile.identity.uin}`, c])
  );
  const configsByPlan = generateAllConfigurations(survivingCandidates, customer);
  const configurationsGenerated = [...configsByPlan.values()].reduce((sum, arr) => sum + arr.length, 0);

  const singleStructures = generateSingleProductStructures(candidatesByPlan, configsByPlan);
  const pairResult = generatePairStructures(candidatesByPlan, configsByPlan, request.monthlyCapacity);
  const tripleResult = generateTripleStructures(pairResult.validPairPlanKeys, candidatesByPlan, configsByPlan, request.monthlyCapacity);

  const allStructures = [...singleStructures, ...pairResult.structures, ...tripleResult.structures];

  const analyzed: AnalyzedStructure[] = allStructures.map((structure) => {
    const simulated = simulateStructure(structure, request.yearsToGoal, request.monthlyCapacity);
    const goalAnalysis = analyzeStructureGoal(simulated, request.goalAmount, request.yearsToGoal);

    const monthlyBudgetUsedValue = simulated.components.reduce((sum, c) => sum + (c.monthlyAllocation.value ?? 0), 0);
    const monthlyBudgetUsed = {
      value: monthlyBudgetUsedValue,
      provenance: combineProvenance(simulated.components.map((c) => c.monthlyAllocation)),
    };

    const reasonCodes = generateReasonCodes(simulated, customer);
    const explanationParts = generateExplanationParts(reasonCodes);
    const dataConfidence = combineProvenance([...simulated.components.map((c) => c.monthlyAllocation), goalAnalysis.goalYearValue]).status;

    return { structure: simulated, goalAnalysis, dataConfidence, reasonCodes, explanationParts, monthlyBudgetUsed };
  });

  const finalStructures = selectDiverseStructures(analyzed, request.monthlyCapacity, 3);

  return {
    finalStructures,
    stats: {
      productsAnalyzed: candidateAnalyses.length,
      productsEliminated: candidateAnalyses.length - survivingCandidates.length,
      configurationsGenerated,
      singleProductStructures: singleStructures.length,
      pairsTested: pairResult.pairsTested,
      validPairs: pairResult.validPairs,
      triplesTested: tripleResult.triplesTested,
      validTriples: tripleResult.validTriples,
      finalSimulatedStructures: analyzed.length,
      runtimeMs: Date.now() - startedAt,
    },
  };
}

export type { PlanningRequest, PlanningResult } from "@/lib/planning/combinationEngine/types";
