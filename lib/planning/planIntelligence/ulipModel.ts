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

// Phase 3B (Sections 11/12) — NAV-based return/CAGR calculation. Never
// invoked with fabricated NAV data: this repository found no
// independently-verifiable, multi-dated official NAV series for any of
// its 4 ULIPs this session (a single NAV point, with no earlier dated
// point to compare against, cannot produce any return figure) — see
// docs/lic-ulip-performance-audit.md. These functions exist so that
// WHEN a defensible NAV snapshot pair is found, the return/CAGR
// calculation is already correct and tested, rather than being
// hand-computed and hand-typed at that point.
export interface NavSnapshot {
  fundName: string;
  date: string; // ISO date
  nav: number;
}

export function calculateSimpleReturnFromNav(startNav: number, endNav: number): number {
  if (startNav <= 0) throw new Error("calculateSimpleReturnFromNav requires a positive starting NAV");
  return Math.round(((endNav - startNav) / startNav) * 10000) / 100;
}

export function calculateCagrFromNav(startNav: number, endNav: number, years: number): number {
  if (startNav <= 0) throw new Error("calculateCagrFromNav requires a positive starting NAV");
  if (years <= 0) throw new Error("calculateCagrFromNav requires a positive year interval");
  return Math.round((Math.pow(endNav / startNav, 1 / years) - 1) * 10000) / 100;
}

function yearsBetween(startDate: string, endDate: string): number {
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  return (new Date(endDate).getTime() - new Date(startDate).getTime()) / MS_PER_YEAR;
}

// Builds a HISTORICAL performance point from two dated NAV snapshots —
// "1Y" uses simple return (LIC's own convention for sub-1-year/1-year
// periods), every longer period label uses CAGR. Always status
// HISTORICAL — never presented as ILLUSTRATIVE or a future forecast.
export function buildHistoricalPerformancePoint(params: {
  fundName: string;
  periodLabel: UlipHistoricalPerformancePoint["periodLabel"];
  start: NavSnapshot;
  end: NavSnapshot;
  source: string;
}): UlipHistoricalPerformancePoint {
  const years = yearsBetween(params.start.date, params.end.date);
  const returnPercent = params.periodLabel === "1Y" ? calculateSimpleReturnFromNav(params.start.nav, params.end.nav) : calculateCagrFromNav(params.start.nav, params.end.nav, years);
  return {
    fundName: params.fundName,
    periodLabel: params.periodLabel,
    startDate: params.start.date,
    endDate: params.end.date,
    returnPercent,
    source: params.source,
    asOf: params.end.date,
    status: "HISTORICAL",
  };
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
