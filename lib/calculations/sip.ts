import { InvestmentProjectionInput, InvestmentProjectionPoint } from "@/types";

export const ILLUSTRATION_RATES_PCT = [6, 8, 10, 12] as const;

/**
 * Future value of a monthly SIP with monthly compounding.
 * Standard SIP formula: FV = P * [((1+r)^n - 1) / r] * (1+r)
 * where r is the monthly rate and n is the number of months.
 */
export function sipFutureValue(
  monthlyAmount: number,
  annualRatePct: number,
  years: number
): number {
  if (monthlyAmount < 0 || years < 0) {
    throw new Error("monthlyAmount and years must be non-negative");
  }
  const months = Math.round(years * 12);
  if (months === 0) return 0;

  const monthlyRate = annualRatePct / 100 / 12;
  if (monthlyRate === 0) {
    return monthlyAmount * months;
  }

  const fv =
    monthlyAmount *
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
    (1 + monthlyRate);

  return Math.round(fv);
}

export function buildInvestmentProjections(
  input: InvestmentProjectionInput,
  ratesPct: readonly number[] = ILLUSTRATION_RATES_PCT
): InvestmentProjectionPoint[] {
  return ratesPct.map((annualRatePct) => ({
    annualRatePct,
    futureValue: sipFutureValue(input.monthlyAmount, annualRatePct, input.years),
  }));
}
