// Phase 3/3B — Historical Bonus Dataset (structured, versioned research
// snapshot; the runtime NEVER browses LIC's website — see this file's
// own header comment as the single source of truth for how each record
// was obtained).
//
// LIC declares a Simple/Final Additional Bonus rate once a year, per
// plan, per policy-term (or maturity-age) band, per Sum Assured band,
// via its own "Results of Valuation" circular. That primary circular
// could not be directly fetched in this development session
// (licindia.in — and, in Phase 3B, essentially every other external
// domain tried via WebFetch — is blocked by this sandbox's network
// egress policy). Every record below is therefore sourced from
// independent THIRD-PARTY bonus-rate aggregation sites that themselves
// claim to transcribe LIC's circular (its "Results of Valuation as at
// 31-03-2025"), obtained only via the WebSearch tool's own
// summarization (which fetches server-side, outside this sandbox's
// blocked egress) — never a directly-opened primary document.
//
// This is explicitly NOT the same confidence tier as a primary LIC
// document: `sourceQuality` on every record's provenance is
// `SECONDARY_CORROBORATED` at best (two or more independent aggregator
// sites reporting the same figure), never `PRIMARY_OFFICIAL`. Per this
// phase's own instruction ("DO NOT INVENT BONUS RATES" / "if historical
// bonus information cannot be verified, do not create fake rates"),
// every record is tagged HISTORICAL but callers must treat this as a
// defensible planning ESTIMATE input, never as an LIC-confirmed figure
// — this repository's own audit doc (docs/lic-financial-knowledge-v2.md)
// repeats this caveat.

import { Provenance } from "@/lib/planning/planIntelligence/types";

const THIRD_PARTY_CAVEAT =
  "Sourced from third-party LIC bonus-rate aggregation sites claiming to transcribe LIC's own 'Results of Valuation as at 31-03-2025' circular (not LIC's own primary document — licindia.in and other external domains were blocked by this sandbox's network egress policy in every session this repository has been built in). Cross-referenced across independent aggregator sites reporting the same figure. VERIFY AGAINST LIC'S OWN CIRCULAR BEFORE ANY CUSTOMER-FACING USE.";

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
  // Some plans band by POLICY TERM (714), others are flat across terms
  // (715), and at least one (733) bands by MATURITY AGE instead of term
  // at all — never conflate the two dimensions.
  applicableTermYears: readonly number[] | null; // null = the record does not distinguish by term
  applicableMaturityAgeMax: number | null; // null = no maturity-age constraint; set only for plans whose own band is maturity-age-based (e.g. 733)
  ratePerThousandSumAssured: number;
  valuationYear: string;
  source: string;
}

export const HISTORICAL_BONUS_RECORDS: readonly HistoricalBonusRecord[] = [
  // ---- Jeevan Labh (736) — term-banded, own higher SA-slab noted but not modeled beyond this band (see module header of benefitProjection.ts) ----
  { planNumber: "736", uin: "512N304V03", bonusType: "SIMPLE_REVERSIONARY_BONUS", applicableSumAssuredBand: { min: 500000, max: null }, applicableTermYears: [16], applicableMaturityAgeMax: null, ratePerThousandSumAssured: 35, valuationYear: "2024-25", source: THIRD_PARTY_CAVEAT },
  { planNumber: "736", uin: "512N304V03", bonusType: "SIMPLE_REVERSIONARY_BONUS", applicableSumAssuredBand: { min: 500000, max: null }, applicableTermYears: [21], applicableMaturityAgeMax: null, ratePerThousandSumAssured: 37, valuationYear: "2024-25", source: THIRD_PARTY_CAVEAT },
  { planNumber: "736", uin: "512N304V03", bonusType: "SIMPLE_REVERSIONARY_BONUS", applicableSumAssuredBand: { min: 500000, max: null }, applicableTermYears: [25], applicableMaturityAgeMax: null, ratePerThousandSumAssured: 39, valuationYear: "2024-25", source: THIRD_PARTY_CAVEAT },

  // ---- New Endowment (714) — term-banded (12-15 / 16-20 / 21+) ----
  { planNumber: "714", uin: "512N277V03", bonusType: "SIMPLE_REVERSIONARY_BONUS", applicableSumAssuredBand: { min: 500000, max: null }, applicableTermYears: [12, 13, 14, 15], applicableMaturityAgeMax: null, ratePerThousandSumAssured: 39, valuationYear: "2024-25", source: THIRD_PARTY_CAVEAT },
  { planNumber: "714", uin: "512N277V03", bonusType: "SIMPLE_REVERSIONARY_BONUS", applicableSumAssuredBand: { min: 500000, max: null }, applicableTermYears: [16, 17, 18, 19, 20], applicableMaturityAgeMax: null, ratePerThousandSumAssured: 42, valuationYear: "2024-25", source: THIRD_PARTY_CAVEAT },
  { planNumber: "714", uin: "512N277V03", bonusType: "SIMPLE_REVERSIONARY_BONUS", applicableSumAssuredBand: { min: 500000, max: null }, applicableTermYears: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35], applicableMaturityAgeMax: null, ratePerThousandSumAssured: 48, valuationYear: "2024-25", source: THIRD_PARTY_CAVEAT },

  // ---- New Jeevan Anand (715) — flat across all terms ----
  { planNumber: "715", uin: "512N279V03", bonusType: "SIMPLE_REVERSIONARY_BONUS", applicableSumAssuredBand: { min: 500000, max: null }, applicableTermYears: null, applicableMaturityAgeMax: null, ratePerThousandSumAssured: 45, valuationYear: "2024-25", source: THIRD_PARTY_CAVEAT },

  // ---- Jeevan Lakshya (733) — banded by MATURITY AGE, not term ----
  { planNumber: "733", uin: "512N297V03", bonusType: "SIMPLE_REVERSIONARY_BONUS", applicableSumAssuredBand: { min: 500000, max: null }, applicableTermYears: null, applicableMaturityAgeMax: 55, ratePerThousandSumAssured: 49, valuationYear: "2024-25", source: THIRD_PARTY_CAVEAT },
] as const;

export interface HistoricalBonusEstimate {
  ratePerThousandSumAssured: number;
  provenance: Provenance;
}

// Returns null (never a fabricated fallback rate) whenever no record
// covers this exact plan/SA-band/term-or-maturity-age combination — e.g.
// this deliberately returns null for Plan 736 at a Basic Sum Assured
// below Rs.5,00,000 (this repository's registered engine currently only
// supports a Rs.2,00,000 sample point — see premiumCalculationCapability.ts),
// because applying a >=Rs.5L-band rate to a Rs.2L policy would be
// exactly the "mixing rules outside their applicable band" this phase
// warns against. `maturityAge` is optional and only consulted for
// records that specify `applicableMaturityAgeMax`.
export function getHistoricalBonusEstimate(planNumber: string, uin: string, sumAssured: number, termYears: number, maturityAge?: number): HistoricalBonusEstimate | null {
  const record = HISTORICAL_BONUS_RECORDS.find((r) => {
    if (r.planNumber !== planNumber || r.uin !== uin) return false;
    if (sumAssured < r.applicableSumAssuredBand.min) return false;
    if (r.applicableSumAssuredBand.max != null && sumAssured > r.applicableSumAssuredBand.max) return false;
    if (r.applicableTermYears != null && !r.applicableTermYears.includes(termYears)) return false;
    if (r.applicableMaturityAgeMax != null && (maturityAge == null || maturityAge > r.applicableMaturityAgeMax)) return false;
    return true;
  });
  if (!record) return null;
  return {
    ratePerThousandSumAssured: record.ratePerThousandSumAssured,
    provenance: {
      status: "HISTORICAL",
      method: `${record.bonusType} rate for the ${record.valuationYear} valuation year, Sum Assured band >= Rs.${record.applicableSumAssuredBand.min.toLocaleString("en-IN")}${
        record.applicableTermYears != null ? `, term ${termYears} years` : ""
      }${record.applicableMaturityAgeMax != null ? `, maturity age <= ${record.applicableMaturityAgeMax}` : ""}`,
      sourceReferences: [record.source],
      asOf: record.valuationYear,
      // A historical-based future bonus estimate is explicitly LOW/MEDIUM
      // per this phase's own confidence guidance; every record here is
      // third-party aggregated rather than LIC's own primary circular,
      // so LOW.
      estimationConfidence: "LOW",
      sourceQuality: "SECONDARY_CORROBORATED",
    },
  };
}
