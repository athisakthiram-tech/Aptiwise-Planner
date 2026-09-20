// ULIP-specific intelligence (Sections 9/10/11). Keeps three genuinely
// different kinds of information cleanly separate, per spec:
//   - fund/charge MECHANICS (product design facts — DERIVED/VERIFIED)
//   - HISTORICAL fund performance (an actually-occurred past return —
//     never presented as a future promise)
//   - OFFICIAL_ILLUSTRATION (the insurer's own prescribed what-if
//     scenario rates for this specific product/version — never a
//     globally hardcoded 6/8/10)
//
// No historical NAV data is fabricated here — where this repo has no
// verified historical series for a fund, historicalPerformance stays an
// empty array (never a guessed CAGR), and callers must treat an empty
// array as "not available," not as "0% return".

import { UlipFundCharacteristics, UlipHistoricalPerformancePoint, UlipIntelligence, UlipOfficialIllustration } from "@/lib/planning/planIntelligence/types";

export function ulipFund(fundName: string, assetClass: UlipFundCharacteristics["assetClass"], notes: string[] = []): UlipFundCharacteristics {
  return { fundName, assetClass, notes };
}

export function officialIllustration(ratesPct: readonly number[], source: string): UlipOfficialIllustration {
  return { ratesPct, source, status: "ILLUSTRATIVE" };
}

export function buildUlipIntelligence(params: {
  funds: UlipFundCharacteristics[];
  historicalPerformance?: UlipHistoricalPerformancePoint[];
  officialIllustration: UlipOfficialIllustration | null;
  charges: UlipIntelligence["charges"];
  lockInYears: number | null;
}): UlipIntelligence {
  return {
    funds: params.funds,
    historicalPerformance: params.historicalPerformance ?? [],
    officialIllustration: params.officialIllustration,
    charges: params.charges,
    lockInYears: params.lockInYears,
  };
}
