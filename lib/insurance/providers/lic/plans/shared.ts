// Small pure helpers reused by the Stage 4D plan modules (717, 714, 715,
// 774, 912) to avoid re-deriving the same two structural checks five
// times. Deliberately NOT used to change plan733.ts/plan736.ts, which
// keep their own inline versions unchanged.

import { LiquidityResult, PremiumFrequency } from "@/types/insurance";

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

// Reused by Plan 889 (New Jeevan Sathi), Plan 770 (Bima Platinum) and
// Plan 881 (Bima Lakshmi) — all three define their Guaranteed Addition as
// "<rate> per thousand Total (Tabular) Annualized Premium in respect of
// Premiums Paid", accruing at the end of every policy year for
// `accrualYears`, where the "premium paid" figure keeps growing during the
// Premium Paying Term and then stays flat (no further premiums are ever
// due) for any remaining accrual years. This is the exact wording each
// brochure uses, cross-checked against each plan's own published Benefit
// Illustration table before being trusted — see the per-plan verification
// docs for the reconciliation. Never used to interpolate/extrapolate a
// rate itself; `ratePerThousand` must always come from a published table.
export function accrueGuaranteedAdditionOnPremium(
  annualPremium: number,
  ratePerThousand: number,
  accrualYears: number,
  premiumPayingTermYears: number
): number {
  const rate = ratePerThousand / 1000;
  let guaranteedAddition = 0;
  for (let policyYear = 1; policyYear <= accrualYears; policyYear += 1) {
    const cumulativePremiumPaid = annualPremium * Math.min(policyYear, premiumPayingTermYears);
    guaranteedAddition += rate * cumulativePremiumPaid;
  }
  return Math.round(guaranteedAddition);
}

// Shared liquidity facts for the "pure risk" term plans (Digi Term/Yuva
// Term/New Tech-Term/Yuva Credit Life/Digi Credit Life): every one of
// these brochures states plainly "No loan will be available under this
// plan" (always false, never conditional), and "no surrender value...
// however, Unexpired Risk Premium Value, if any, shall be payable" only
// for Single or Limited Premium — a Regular Premium policy pays nothing
// on surrender at all. This distinguishes these plans from the
// endowment-style plans elsewhere in this codebase, where loan/surrender
// are both genuinely always available once vesting conditions are met.
export function pureRiskLiquidity(
  context: { policyTermYears?: number; premiumPayingTermYears?: number; premiumMode?: PremiumFrequency },
  sourceId: string
): LiquidityResult {
  const isSingle = context.premiumMode === "single";
  const isRegular =
    !isSingle && context.policyTermYears != null && context.premiumPayingTermYears === context.policyTermYears;
  return {
    surrenderAvailable: { status: "verified", value: !isRegular, sourceIds: [sourceId] },
    loanAvailable: { status: "verified", value: false, sourceIds: [sourceId] },
  };
}
