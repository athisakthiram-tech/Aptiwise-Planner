const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  return inrFormatter.format(Math.round(amount));
}

/** Compact form for large numbers, e.g. ₹12.5L, ₹1.2Cr */
export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) {
    return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (abs >= 1_00_000) {
    return `₹${(amount / 1_00_000).toFixed(2)} L`;
  }
  return formatINR(amount);
}
