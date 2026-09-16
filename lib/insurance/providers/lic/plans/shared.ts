// Small pure helpers reused by the Stage 4D plan modules (717, 714, 715,
// 774, 912) to avoid re-deriving the same two structural checks five
// times. Deliberately NOT used to change plan733.ts/plan736.ts, which
// keep their own inline versions unchanged.

// A Basic Sum Assured increment band: sums up to and including
// `maxInclusive` must be a multiple of `multiple`; the last band (the
// one actually matched) has `maxInclusive: null` for "and above".
export interface SumAssuredBand {
  maxInclusive: number | null;
  multiple: number;
}

export function isValidSumAssuredIncrement(sumAssured: number, bands: SumAssuredBand[]): boolean {
  const band =
    bands.find((b) => b.maxInclusive != null && sumAssured <= b.maxInclusive) ??
    bands[bands.length - 1];
  return sumAssured % band.multiple === 0;
}

// Exact-match only lookup — never the nearest row, never an interpolated
// value. Used for every official sample-premium table in this codebase.
export function findExactPremiumRow<T extends { age: number; policyTermYears: number }>(
  rows: readonly T[],
  age: number,
  policyTermYears: number
): T | undefined {
  return rows.find((row) => row.age === age && row.policyTermYears === policyTermYears);
}
