export function totalPlannedContributions(
  monthlyBudget: number,
  years: number
): number {
  if (monthlyBudget < 0 || years < 0) {
    throw new Error("monthlyBudget and years must be non-negative");
  }
  return monthlyBudget * 12 * years;
}

export function goalProgressPct(
  totalContributions: number,
  targetAmount: number
): number {
  if (targetAmount <= 0) return 0;
  return Math.min(100, Math.round((totalContributions / targetAmount) * 100));
}
