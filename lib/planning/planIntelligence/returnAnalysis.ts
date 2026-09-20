// Return analysis (Section 8) — a common analytical interface over a
// product's cash flows. IRR/XIRR here is an ANALYTICAL METRIC computed
// from a specific set of cash flows, never a promised or guaranteed
// return, and never called "interest rate". If any cash flow feeding the
// calculation is itself NON_GUARANTEED/MARKET_LINKED/ILLUSTRATIVE, the
// resulting IRR is downgraded to the same weakest confidence — it can
// never be labeled VERIFIED/guaranteed unless every underlying cash flow
// genuinely is.

import { CashFlowEvent, DataConfidence, ProvenancedValue, ReturnAnalysis } from "@/lib/planning/planIntelligence/types";
import { weakestConfidence } from "@/lib/planning/planIntelligence/confidence";

// Standard XIRR via Newton-Raphson on dated cash flows (year-fraction
// basis, since this layer works in whole years from policy inception).
// Pure and deterministic — no external solver dependency.
export function calculateXirr(cashFlows: { yearFromStart: number; amount: number }[]): number | null {
  if (cashFlows.length < 2) return null;
  const hasInflow = cashFlows.some((c) => c.amount > 0);
  const hasOutflow = cashFlows.some((c) => c.amount < 0);
  if (!hasInflow || !hasOutflow) return null;

  const npv = (rate: number) => cashFlows.reduce((sum, c) => sum + c.amount / Math.pow(1 + rate, c.yearFromStart), 0);
  const npvDerivative = (rate: number) =>
    cashFlows.reduce((sum, c) => sum + (-c.yearFromStart * c.amount) / Math.pow(1 + rate, c.yearFromStart + 1), 0);

  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    const value = npv(rate);
    const derivative = npvDerivative(rate);
    if (Math.abs(derivative) < 1e-10) break;
    const nextRate = rate - value / derivative;
    if (!Number.isFinite(nextRate) || nextRate <= -0.99) return null;
    if (Math.abs(nextRate - rate) < 1e-7) return Math.round(nextRate * 10000) / 100;
    rate = nextRate;
  }
  return Number.isFinite(rate) ? Math.round(rate * 10000) / 100 : null;
}

function sumKnown(values: readonly ProvenancedValue[]): ProvenancedValue {
  if (values.length === 0) return { value: null, provenance: { status: "ESTIMATED", sourceReferences: [] } };
  if (values.some((v) => v.value == null)) {
    return { value: null, provenance: { status: weakestConfidence(values.map((v) => v.provenance.status)), sourceReferences: [] } };
  }
  return {
    value: values.reduce((sum, v) => sum + (v.value as number), 0),
    provenance: { status: weakestConfidence(values.map((v) => v.provenance.status)), sourceReferences: Array.from(new Set(values.flatMap((v) => v.provenance.sourceReferences))) },
  };
}

export function analyzeReturn(events: CashFlowEvent[]): ReturnAnalysis {
  const outflows = events.filter((e) => e.kind === "PREMIUM_OUTFLOW" || e.kind === "CHARGE_DEDUCTION");
  const guaranteedInflows = events.filter((e) => e.kind !== "PREMIUM_OUTFLOW" && e.kind !== "CHARGE_DEDUCTION" && e.amount.provenance.status === "VERIFIED");
  const nonGuaranteedInflows = events.filter(
    (e) => e.kind !== "PREMIUM_OUTFLOW" && e.kind !== "CHARGE_DEDUCTION" && e.amount.provenance.status !== "VERIFIED"
  );
  const incomeEvents = events.filter((e) => e.kind === "INCOME_PAYMENT" || e.kind === "SURVIVAL_BENEFIT");
  const maturityEvents = events.filter((e) => e.kind === "MATURITY_BENEFIT");

  const totalPremiumPaid = sumKnown(outflows.map((e) => e.amount));
  const guaranteedBenefitsReceived = sumKnown(guaranteedInflows.map((e) => e.amount));
  const nonGuaranteedIllustratedBenefits = sumKnown(nonGuaranteedInflows.map((e) => e.amount));
  const incomeReceived = sumKnown(incomeEvents.map((e) => e.amount));
  const maturityValue = sumKnown(maturityEvents.map((e) => e.amount));
  const totalValueReceived = sumKnown([...guaranteedInflows, ...nonGuaranteedInflows].map((e) => e.amount));

  const lastEventYear = events.length > 0 ? Math.max(...events.map((e) => e.yearFromStart)) : null;
  const goalYearValue =
    lastEventYear != null
      ? sumKnown(events.filter((e) => e.yearFromStart === lastEventYear && e.kind !== "PREMIUM_OUTFLOW").map((e) => e.amount))
      : { value: null, provenance: { status: "ESTIMATED" as DataConfidence, sourceReferences: [] } };

  let irrPercent: ProvenancedValue = { value: null, provenance: { status: "ESTIMATED", sourceReferences: [] } };
  if (totalPremiumPaid.value != null && totalValueReceived.value != null) {
    const signedFlows = [
      ...outflows.map((e) => ({ yearFromStart: e.yearFromStart, amount: -(e.amount.value ?? 0) })),
      ...guaranteedInflows.map((e) => ({ yearFromStart: e.yearFromStart, amount: e.amount.value ?? 0 })),
      ...nonGuaranteedInflows.map((e) => ({ yearFromStart: e.yearFromStart, amount: e.amount.value ?? 0 })),
    ];
    const irr = calculateXirr(signedFlows);
    if (irr != null) {
      // Never guaranteed unless EVERY inflow feeding it is itself
      // VERIFIED — the moment a single non-guaranteed/illustrative cash
      // flow contributes, the IRR is at most as confident as that flow.
      const status = nonGuaranteedInflows.length > 0 ? weakestConfidence(nonGuaranteedInflows.map((e) => e.amount.provenance.status)) : "VERIFIED";
      irrPercent = { value: irr, provenance: { status, method: "XIRR over dated premium outflows and benefit inflows", sourceReferences: [] } };
    }
  }

  return {
    totalPremiumPaid,
    guaranteedBenefitsReceived,
    nonGuaranteedIllustratedBenefits,
    incomeReceived,
    maturityValue,
    goalYearValue,
    totalValueReceived,
    irrPercent,
  };
}
