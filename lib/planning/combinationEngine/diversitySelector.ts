// Stage 13 — Diversity Selection. Compares structures on multiple
// deterministic dimensions and picks up to 3 MEANINGFULLY DIFFERENT
// ones — explicitly NOT a single numeric score-and-sort. Structures are
// never labeled/ranked here ("Structure A/B/C" labeling, if any, is the
// caller's presentation concern, not a quality judgment made here).
//
// Two steps:
//  1. Dedup by product-set: many structures share the exact same set of
//     products at different allocation/PPT/BSA sizings. Only the
//     best-specified version of THAT SAME combination is kept — the one
//     using the customer's own stated budget most fully without
//     exceeding it. This is not a cross-combination quality ranking; it
//     only avoids presenting several sizings of the identical
//     combination as if they were distinct alternatives.
//  2. Greedily select representatives whose dimensional signature
//     (component count / market exposure / income-or-liquidity
//     orientation) differs from every already-selected one, iterating
//     in a neutral order (structure id, not catalogue position) so the
//     result never depends on candidate-generation order.

import { AnalyzedStructure, CandidateStructure } from "@/lib/planning/combinationEngine/types";

interface StructureSignature {
  componentCount: number;
  hasMarketLinked: boolean;
  hasIncomeOrLiquidity: boolean;
  planSetKey: string;
}

function signatureOf(structure: CandidateStructure): StructureSignature {
  return {
    componentCount: structure.components.length,
    hasMarketLinked: structure.components.some((c) => c.marketLinked),
    hasIncomeOrLiquidity: structure.components.some((c) => c.role === "INCOME_GENERATION" || c.role === "SCHEDULED_LIQUIDITY" || c.role === "RETIREMENT"),
    planSetKey: structure.components
      .map((c) => `${c.planNumber}::${c.uin}`)
      .sort()
      .join("+"),
  };
}

function signaturesDiffer(a: StructureSignature, b: StructureSignature): boolean {
  return a.componentCount !== b.componentCount || a.hasMarketLinked !== b.hasMarketLinked || a.hasIncomeOrLiquidity !== b.hasIncomeOrLiquidity;
}

export function selectDiverseStructures(analyzed: AnalyzedStructure[], monthlyCapacity: number, max = 3): AnalyzedStructure[] {
  const byPlanSet = new Map<string, AnalyzedStructure>();
  for (const item of analyzed) {
    const used = item.monthlyBudgetUsed.value;
    if (used != null && used > monthlyCapacity) continue; // never over the customer's own stated capacity
    const key = signatureOf(item.structure).planSetKey;
    const existing = byPlanSet.get(key);
    const existingUsed = existing?.monthlyBudgetUsed.value ?? -Infinity;
    if (!existing || (used ?? -Infinity) > existingUsed) {
      byPlanSet.set(key, item);
    }
  }

  const representatives = [...byPlanSet.values()].sort((a, b) => a.structure.id.localeCompare(b.structure.id));

  const selected: AnalyzedStructure[] = [];
  const selectedSignatures: StructureSignature[] = [];

  for (const candidate of representatives) {
    if (selected.length >= max) break;
    const sig = signatureOf(candidate.structure);
    if (selectedSignatures.every((s) => signaturesDiffer(s, sig))) {
      selected.push(candidate);
      selectedSignatures.push(sig);
    }
  }
  // Fewer than `max` genuinely distinct shapes exist — fill remaining
  // slots from the same neutral order rather than forcing a shape that
  // isn't actually there.
  for (const candidate of representatives) {
    if (selected.length >= max) break;
    if (!selected.includes(candidate)) selected.push(candidate);
  }

  return selected;
}
