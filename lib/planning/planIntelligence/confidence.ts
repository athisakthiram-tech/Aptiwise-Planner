// Confidence/provenance helpers for the Plan Intelligence Model
// (Section 23). Mirrors the spirit of lib/planning/statusUtils.ts
// (never silently upgrade a weaker status when combining values) but
// operates on this layer's own DataConfidence vocabulary, which is
// intentionally NOT the same type as lib/insurance/ValueStatus (see
// types.ts's header comment for why).

import { DataConfidence, Provenance, ProvenancedValue } from "@/lib/planning/planIntelligence/types";

// Ordered weakest-to-strongest for combination purposes. HISTORICAL and
// ILLUSTRATIVE are deliberately placed below ESTIMATED: a historical/
// illustrative figure describes something other than "this specific
// calculated planning value" (a past fund return, or a future what-if
// scenario) and must never let an aggregate look more current-value-like
// than it is.
const CONFIDENCE_RANK: Record<DataConfidence, number> = {
  ILLUSTRATIVE: 0,
  HISTORICAL: 1,
  ESTIMATED: 2,
  DERIVED: 3,
  VERIFIED: 4,
};

export function weakestConfidence(statuses: readonly DataConfidence[]): DataConfidence {
  if (statuses.length === 0) return "ILLUSTRATIVE";
  return statuses.reduce((weakest, s) => (CONFIDENCE_RANK[s] < CONFIDENCE_RANK[weakest] ? s : weakest));
}

export function verified(value: number | null, sourceReferences: string[]): ProvenancedValue {
  return { value, provenance: { status: "VERIFIED", sourceReferences } };
}

export function derived(value: number | null, method: string, sourceReferences: string[]): ProvenancedValue {
  return { value, provenance: { status: "DERIVED", method, sourceReferences } };
}

export function estimated(value: number | null, method: string, sourceReferences: string[]): ProvenancedValue {
  return { value, provenance: { status: "ESTIMATED", method, sourceReferences } };
}

export function illustrative(value: number | null, sourceReferences: string[] = []): ProvenancedValue {
  return { value, provenance: { status: "ILLUSTRATIVE", sourceReferences } };
}

export function historical(value: number | null, sourceReferences: string[], asOf?: string): ProvenancedValue {
  return { value, provenance: { status: "HISTORICAL", sourceReferences, asOf } };
}

// A value genuinely not yet estimatable — status stays ESTIMATED with an
// explicit method name explaining why, and value stays null. Never
// treated the same as an ordinary missing/optional field: a caller can
// still show WHY it's missing rather than a blank space.
export function notYetEstimatable(reason: string): ProvenancedValue {
  return { value: null, provenance: { status: "ESTIMATED", method: `not_yet_estimatable: ${reason}`, sourceReferences: [] } };
}

export function combineProvenance(values: readonly ProvenancedValue[]): Provenance {
  return { status: weakestConfidence(values.map((v) => v.provenance.status)), sourceReferences: Array.from(new Set(values.flatMap((v) => v.provenance.sourceReferences))) };
}
