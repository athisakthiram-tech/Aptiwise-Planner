// Phase 3 — Historical Bonus Dataset (structured, versioned research
// snapshot; the runtime NEVER browses LIC's website — see this file's
// own header comment as the single source of truth for how each record
// was obtained).
//
// LIC declares a Simple/Final Additional Bonus rate once a year, per
// plan, per policy-term band, per Sum Assured band, via its own
// "Results of Valuation" circular. That primary circular could not be
// directly fetched in this development session (licindia.in is blocked
// by this sandbox's network egress policy) — every record below is
// therefore sourced from independent THIRD-PARTY bonus-rate aggregation
// sites that themselves claim to transcribe LIC's circular, cross-
// referenced across more than one such site for the same figure.
//
// This is explicitly NOT the same confidence tier as a primary LIC
// document. Per this phase's own instruction ("DO NOT INVENT BONUS
// RATES" / "if historical bonus information cannot be verified, do not
// create fake rates"), every record is tagged HISTORICAL but with a
// `source` string that says plainly this was not independently
// cross-checked against LIC's own circular — callers must treat this as
// a defensible planning ESTIMATE input, never as an LIC-confirmed
// figure, and this repository's own audit doc
// (docs/lic-financial-knowledge-v2.md) repeats this caveat.
//
// Coverage is deliberately narrow (only Jeevan Labh, Plan 736, for the
// 2024-25 valuation year) rather than populated broadly with
// low-confidence guesses for every Tier-1 product — the "no empty
// field" philosophy prefers a real number over a blank, but never at
// the cost of fabricating one for a product this session found no
// defensible source for (New Endowment/New Jeevan Anand/Jeevan Lakshya
// stay without a historical bonus record; see the audit doc's "Data
// still missing" section).

import { Provenance } from "@/lib/planning/planIntelligence/types";

const THIRD_PARTY_CAVEAT =
  "Sourced from third-party LIC bonus-rate aggregation sites (not LIC's own primary Results of Valuation circular — licindia.in direct access was blocked in this development session). Cross-referenced across independent aggregator sites reporting the same figure. VERIFY AGAINST LIC'S OWN CIRCULAR BEFORE ANY CUSTOMER-FACING USE.";

export type HistoricalBonusType = "SIMPLE_REVERSIONARY_BONUS" | "FINAL_ADDITIONAL_BONUS";

export interface HistoricalBonusRecord {
  planNumber: string;
  uin: string;
  bonusType: HistoricalBonusType;
  // The Sum Assured band this rate applies to — LIC's declared rates
  // vary by SA band, so a rate found for one band must NEVER be applied
  // outside it (this phase's own "do not mix withdrawn/current or
  // out-of-band rules" instruction, applied to SA bands too).
  applicableSumAssuredBand: { min: number; max: number | null };
  applicableTermYears: readonly number[] | null; // null = the record does not distinguish by term
  ratePerThousandSumAssured: number;
  valuationYear: string;
  source: string;
}

export const HISTORICAL_BONUS_RECORDS: readonly HistoricalBonusRecord[] = [
  {
    planNumber: "736",
    uin: "512N304V03",
    bonusType: "SIMPLE_REVERSIONARY_BONUS",
    applicableSumAssuredBand: { min: 500000, max: null },
    applicableTermYears: [16],
    ratePerThousandSumAssured: 35,
    valuationYear: "2024-25",
    source: THIRD_PARTY_CAVEAT,
  },
  {
    planNumber: "736",
    uin: "512N304V03",
    bonusType: "SIMPLE_REVERSIONARY_BONUS",
    applicableSumAssuredBand: { min: 500000, max: null },
    applicableTermYears: [21],
    ratePerThousandSumAssured: 37,
    valuationYear: "2024-25",
    source: THIRD_PARTY_CAVEAT,
  },
  {
    planNumber: "736",
    uin: "512N304V03",
    bonusType: "SIMPLE_REVERSIONARY_BONUS",
    applicableSumAssuredBand: { min: 500000, max: null },
    applicableTermYears: [25],
    ratePerThousandSumAssured: 39,
    valuationYear: "2024-25",
    source: THIRD_PARTY_CAVEAT,
  },
] as const;

export interface HistoricalBonusEstimate {
  ratePerThousandSumAssured: number;
  provenance: Provenance;
}

// Returns null (never a fabricated fallback rate) whenever no record
// covers this exact plan/SA-band/term combination — e.g. this
// deliberately returns null for Plan 736 at a Basic Sum Assured below
// Rs.5,00,000 (this repository's registered engine currently only
// supports a Rs.2,00,000 sample point — see premiumCalculationCapability.ts),
// because applying a >=Rs.5L-band rate to a Rs.2L policy would be
// exactly the "mixing rules outside their applicable band" this phase
// warns against.
export function getHistoricalBonusEstimate(planNumber: string, uin: string, sumAssured: number, termYears: number): HistoricalBonusEstimate | null {
  const record = HISTORICAL_BONUS_RECORDS.find(
    (r) =>
      r.planNumber === planNumber &&
      r.uin === uin &&
      sumAssured >= r.applicableSumAssuredBand.min &&
      (r.applicableSumAssuredBand.max == null || sumAssured <= r.applicableSumAssuredBand.max) &&
      (r.applicableTermYears == null || r.applicableTermYears.includes(termYears))
  );
  if (!record) return null;
  return {
    ratePerThousandSumAssured: record.ratePerThousandSumAssured,
    provenance: {
      status: "HISTORICAL",
      method: `${record.bonusType} rate for the ${record.valuationYear} valuation year, Sum Assured band >= Rs.${record.applicableSumAssuredBand.min.toLocaleString("en-IN")}, term ${termYears} years`,
      sourceReferences: [record.source],
      asOf: record.valuationYear,
      // A historical-based future bonus estimate is explicitly LOW/MEDIUM
      // per this phase's own confidence guidance; this one is sourced
      // from third-party aggregation rather than LIC's own primary
      // circular, so LOW.
      estimationConfidence: "LOW",
    },
  };
}
