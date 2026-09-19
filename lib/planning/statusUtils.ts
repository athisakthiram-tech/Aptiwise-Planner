// Small, shared ValueStatus helpers for the planning layer. Mirrors the
// same "never upgrade confidence while combining data" rule already used
// by lib/comparison/genericLicComparison.ts's liquidity combination — kept
// as its own tiny module here rather than duplicated inline in every
// planning file that needs to combine several ComparisonValues into one.

import { ValueStatus } from "@/types/insurance";
import { ComparisonValue } from "@/lib/comparison/protectionAdjustedComparison";

// Ordered weakest-to-strongest. Combining several statuses can only ever
// land on the weakest one present — never upgraded.
const STATUS_WEAKNESS_ORDER: ValueStatus[] = [
  "unavailable",
  "conditional",
  "partial",
  "illustrative",
  "not_applicable",
  "verified",
];

export function weakestStatus(statuses: ValueStatus[]): ValueStatus {
  if (statuses.length === 0) return "unavailable";
  return statuses.reduce((weakest, current) =>
    STATUS_WEAKNESS_ORDER.indexOf(current) < STATUS_WEAKNESS_ORDER.indexOf(weakest) ? current : weakest
  );
}

// Combines several numeric ComparisonValues into one total. A
// `not_applicable` input is excluded entirely (that dimension genuinely
// doesn't exist for that component, so it contributes neither a value
// nor a status) — everything else (including `unavailable`) counts
// toward both the sum-of-known-values and the combined status, so a
// strategy can never claim a complete total while one of its real,
// applicable components is actually unknown.
export function combineNumeric(values: ComparisonValue<number>[]): ComparisonValue<number> {
  const relevant = values.filter((v) => v.status !== "not_applicable");
  if (relevant.length === 0) return { value: null, status: "not_applicable" };

  const known = relevant.filter((v) => v.value != null);
  const total = known.length > 0 ? known.reduce((sum, v) => sum + (v.value as number), 0) : null;
  return { value: total, status: weakestStatus(relevant.map((v) => v.status)) };
}
