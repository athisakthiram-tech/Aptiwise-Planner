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
import { checkGoalAnalysis, checkStructureBudget } from "@/lib/planning/combinationEngine/sanityChecks";
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
    const simulated = simulateStructure(structure, request.yearsToGoal, request.monthlyCapacity, request.age);
    const goalAnalysis = analyzeStructureGoal(simulated, request.goalAmount, request.yearsToGoal, request.age);

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

  // Defensive last line (Section 23 — sanity checks): a structure that
  // is over budget or whose goal-year math produced a non-finite value
  // is a bug, not a result to report. This never fires in the normal
  // path (every stage above already prevents both), but a result this
  // engine returns must never be allowed to carry a NaN/Infinity or a
  // budget violation regardless of how it got there.
  const sane = analyzed.filter((item) => checkStructureBudget(item.structure, request.monthlyCapacity).length === 0 && checkGoalAnalysis(item.goalAnalysis).length === 0);

  const finalStructures = selectDiverseStructures(sane, request.monthlyCapacity, 3);

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
