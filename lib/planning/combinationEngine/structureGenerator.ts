// Stages 5-8 — Structure Generation. Builds SingleProductStructure[],
// PairStructure[] and OptionalTripleStructure[] out of the per-plan
// CandidateConfiguration[] map from configurationGenerator.ts.
//
// Pruning (Stage 5's own rules), applied here rather than downstream:
//   - a configuration whose premium is null was already dropped in
//     configurationGenerator.ts and is skipped again defensively here.
//   - a combination whose summed premium exceeds monthlyCapacity is
//     never produced (rather than produced-then-filtered).
//   - a pair is never even combinatorially expanded unless its two
//     products' roles/cash-flow pattern/market-risk classification
//     differ in some way — two functionally identical products add no
//     meaningful complement (Stage 7's own pruning rule).
//   - a triple is only attempted on top of an already-valid pair, and
//     only when the third product contributes a role neither existing
//     component already has — "only where genuinely useful" (Stage 8),
//     never added merely to look sophisticated.

import { CandidateAnalysis, CandidateConfiguration, CandidateStructure, StructureComponent } from "@/lib/planning/combinationEngine/types";

// Bounds on the combinatorial search — kept small and deterministic so
// the regression case runs in interactive time without needing every
// possible configuration to be tried against every other (Section
// PERFORMANCE reports the effect of these bounds on the actual run).
const MAX_CONFIGS_PER_PLAN_IN_PAIR = 6;
const MAX_CONFIGS_PER_PLAN_IN_TRIPLE = 3;
const MAX_TRIPLE_PLAN_SETS = 40;

function toComponent(candidate: CandidateAnalysis, config: CandidateConfiguration): StructureComponent {
  return {
    planNumber: config.planNumber,
    uin: config.uin,
    productName: candidate.profile.identity.productName,
    role: config.role,
    monthlyAllocation: config.monthlyPremium,
    policyTermYears: config.policyTermYears,
    premiumPayingTermYears: config.premiumPayingTermYears,
    basicSumAssured: config.basicSumAssuredCandidate,
    benefitModel: candidate.profile.benefitModel,
    cashFlowPattern: candidate.profile.cashFlowPattern,
    marketLinked: candidate.profile.marketRisk === "MARKET_LINKED",
    ulipOfficialIllustrationRatesPct: candidate.profile.ulip?.officialIllustration?.ratesPct ?? null,
  };
}

// A deterministic id built from the structure's own content (product
// identity + priced allocation + term/PPT/BSA) — never from catalogue
// position, so two runs over the same candidate set always produce the
// same id for the same real structure ("VERY IMPORTANT — NO FIRST
// MATCH": nothing here depends on array order).
function structureId(components: StructureComponent[]): string {
  return components
    .map((c) => `${c.planNumber}::${c.uin}@${c.monthlyAllocation.value ?? "x"}/ppt${c.premiumPayingTermYears ?? "x"}/bsa${c.basicSumAssured ?? "x"}`)
    .sort()
    .join("+");
}

function makeStructure(components: StructureComponent[]): CandidateStructure {
  return { id: structureId(components), components, timeline: [], events: [] };
}

// Two candidates are treated as adding no meaningful complement only
// when their combination roles, cash-flow pattern AND market-risk
// classification are ALL identical — anything else (a different role
// set, a different cash-flow shape, or one being market-linked while
// the other isn't) is a genuine structural difference worth offering.
function candidatesComplement(a: CandidateAnalysis, b: CandidateAnalysis): boolean {
  const rolesA = new Set(a.profile.combinationRoles);
  const rolesB = new Set(b.profile.combinationRoles);
  const sameRoles = rolesA.size === rolesB.size && [...rolesA].every((r) => rolesB.has(r));
  if (!sameRoles) return true;
  if (a.profile.cashFlowPattern !== b.profile.cashFlowPattern) return true;
  if (a.profile.marketRisk !== b.profile.marketRisk) return true;
  return false;
}

// ---- Stage 6: single-product structures ----
export function generateSingleProductStructures(
  candidatesByPlan: Map<string, CandidateAnalysis>,
  configsByPlan: Map<string, CandidateConfiguration[]>
): CandidateStructure[] {
  const structures: CandidateStructure[] = [];
  for (const [planKey, configs] of configsByPlan) {
    const candidate = candidatesByPlan.get(planKey);
    if (!candidate) continue;
    for (const config of configs) {
      if (config.monthlyPremium.value == null) continue;
      structures.push(makeStructure([toComponent(candidate, config)]));
    }
  }
  return structures;
}

// ---- Stage 7: pair structures ----
export interface PairGenerationResult {
  structures: CandidateStructure[];
  pairsTested: number;
  validPairs: number;
  validPairPlanKeys: [string, string][];
}

export function generatePairStructures(
  candidatesByPlan: Map<string, CandidateAnalysis>,
  configsByPlan: Map<string, CandidateConfiguration[]>,
  monthlyCapacity: number
): PairGenerationResult {
  const planKeys = [...configsByPlan.keys()];
  const structures: CandidateStructure[] = [];
  const validPairPlanKeys: [string, string][] = [];
  let pairsTested = 0;
  let validPairs = 0;

  for (let i = 0; i < planKeys.length; i++) {
    for (let j = i + 1; j < planKeys.length; j++) {
      const keyA = planKeys[i];
      const keyB = planKeys[j];
      const candidateA = candidatesByPlan.get(keyA);
      const candidateB = candidatesByPlan.get(keyB);
      if (!candidateA || !candidateB) continue;

      pairsTested++;
      if (!candidatesComplement(candidateA, candidateB)) continue;

      const configsA = configsByPlan.get(keyA)!.slice(0, MAX_CONFIGS_PER_PLAN_IN_PAIR);
      const configsB = configsByPlan.get(keyB)!.slice(0, MAX_CONFIGS_PER_PLAN_IN_PAIR);
      let pairHasValidStructure = false;

      for (const configA of configsA) {
        if (configA.monthlyPremium.value == null) continue;
        for (const configB of configsB) {
          if (configB.monthlyPremium.value == null) continue;
          const combined = configA.monthlyPremium.value + configB.monthlyPremium.value;
          if (combined > monthlyCapacity) continue;
          pairHasValidStructure = true;
          structures.push(makeStructure([toComponent(candidateA, configA), toComponent(candidateB, configB)]));
        }
      }
      if (pairHasValidStructure) {
        validPairs++;
        validPairPlanKeys.push([keyA, keyB]);
      }
    }
  }

  return { structures, pairsTested, validPairs, validPairPlanKeys };
}

// ---- Stage 8: optional triple structures ----
export interface TripleGenerationResult {
  structures: CandidateStructure[];
  triplesTested: number;
  validTriples: number;
}

export function generateTripleStructures(
  validPairPlanKeys: [string, string][],
  candidatesByPlan: Map<string, CandidateAnalysis>,
  configsByPlan: Map<string, CandidateConfiguration[]>,
  monthlyCapacity: number
): TripleGenerationResult {
  const structures: CandidateStructure[] = [];
  let triplesTested = 0;
  let validTriples = 0;
  const allPlanKeys = [...configsByPlan.keys()];
  const consideredPlanTriples = new Set<string>();

  for (const [keyA, keyB] of validPairPlanKeys) {
    const candidateA = candidatesByPlan.get(keyA);
    const candidateB = candidatesByPlan.get(keyB);
    if (!candidateA || !candidateB) continue;
    const pairRoles = new Set([...candidateA.profile.combinationRoles, ...candidateB.profile.combinationRoles]);

    for (const keyC of allPlanKeys) {
      if (keyC === keyA || keyC === keyB) continue;
      if (consideredPlanTriples.size > MAX_TRIPLE_PLAN_SETS) break;
      const tripleKey = [keyA, keyB, keyC].sort().join("|");
      if (consideredPlanTriples.has(tripleKey)) continue;
      consideredPlanTriples.add(tripleKey);

      const candidateC = candidatesByPlan.get(keyC);
      if (!candidateC) continue;
      // Only genuinely useful: the third component must add a role
      // neither existing component in the pair already provides.
      if (candidateC.profile.combinationRoles.every((r) => pairRoles.has(r))) continue;

      triplesTested++;

      const configsA = configsByPlan.get(keyA)!.slice(0, MAX_CONFIGS_PER_PLAN_IN_TRIPLE);
      const configsB = configsByPlan.get(keyB)!.slice(0, MAX_CONFIGS_PER_PLAN_IN_TRIPLE);
      const configsC = configsByPlan.get(keyC)!.slice(0, MAX_CONFIGS_PER_PLAN_IN_TRIPLE);
      let tripleValid = false;

      for (const configA of configsA) {
        if (configA.monthlyPremium.value == null) continue;
        for (const configB of configsB) {
          if (configB.monthlyPremium.value == null) continue;
          for (const configC of configsC) {
            if (configC.monthlyPremium.value == null) continue;
            const combined = configA.monthlyPremium.value + configB.monthlyPremium.value + configC.monthlyPremium.value;
            if (combined > monthlyCapacity) continue;
            tripleValid = true;
            structures.push(makeStructure([toComponent(candidateA, configA), toComponent(candidateB, configB), toComponent(candidateC, configC)]));
          }
        }
      }
      if (tripleValid) validTriples++;
    }
  }

  return { structures, triplesTested, validTriples };
}
