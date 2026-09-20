import { describe, it, expect } from "vitest";
import { buildCashFlowTimeline, freeMonthlyCapacityAfterPpt } from "@/lib/planning/goalOrchestrator/cashFlowTimeline";

describe("buildCashFlowTimeline — Section 8/9's worked example, exactly", () => {
  it("a 16-year horizon with a 10-year-PPT ₹7,000 component frees ₹10,000 for years 11-16", () => {
    const phases = buildCashFlowTimeline({
      horizonYears: 16,
      monthlyCapacity: 10000,
      components: [{ monthlyPremium: 7000, premiumPayingTermYears: 10 }],
    });
    expect(phases).toEqual([
      { fromYear: 1, toYear: 10, allocatedMonthly: 7000, freeMonthly: 3000 },
      { fromYear: 11, toYear: 16, allocatedMonthly: 0, freeMonthly: 10000 },
    ]);
  });

  it("produces exactly 6 post-PPT years for a 16-year horizon with a 10-year PPT", () => {
    const phases = buildCashFlowTimeline({
      horizonYears: 16,
      monthlyCapacity: 10000,
      components: [{ monthlyPremium: 7000, premiumPayingTermYears: 10 }],
    });
    const postPptPhase = phases[phases.length - 1];
    expect(postPptPhase.toYear - postPptPhase.fromYear + 1).toBe(6);
  });

  it("a component with no PPT (pays for the whole horizon) produces a single, unbroken phase", () => {
    const phases = buildCashFlowTimeline({
      horizonYears: 16,
      monthlyCapacity: 10000,
      components: [{ monthlyPremium: 7000, premiumPayingTermYears: null }],
    });
    expect(phases).toEqual([{ fromYear: 1, toYear: 16, allocatedMonthly: 7000, freeMonthly: 3000 }]);
  });

  it("never lets allocated capacity exceed the customer's stated monthly capacity across phases", () => {
    const phases = buildCashFlowTimeline({
      horizonYears: 16,
      monthlyCapacity: 10000,
      components: [
        { monthlyPremium: 6000, premiumPayingTermYears: 10 },
        { monthlyPremium: 4000, premiumPayingTermYears: null },
      ],
    });
    for (const phase of phases) {
      expect(phase.allocatedMonthly).toBeLessThanOrEqual(10000);
      expect(phase.allocatedMonthly + phase.freeMonthly).toBe(10000);
    }
  });

  it("combines two components with different PPTs into three correctly-bounded phases", () => {
    const phases = buildCashFlowTimeline({
      horizonYears: 16,
      monthlyCapacity: 10000,
      components: [
        { monthlyPremium: 5000, premiumPayingTermYears: 8 },
        { monthlyPremium: 3000, premiumPayingTermYears: 12 },
      ],
    });
    expect(phases).toEqual([
      { fromYear: 1, toYear: 8, allocatedMonthly: 8000, freeMonthly: 2000 },
      { fromYear: 9, toYear: 12, allocatedMonthly: 3000, freeMonthly: 7000 },
      { fromYear: 13, toYear: 16, allocatedMonthly: 0, freeMonthly: 10000 },
    ]);
  });

  it("returns an empty timeline for a non-positive horizon rather than throwing", () => {
    expect(buildCashFlowTimeline({ horizonYears: 0, monthlyCapacity: 10000, components: [] })).toEqual([]);
  });

  it("a PPT equal to or longer than the horizon never creates an artificial extra phase", () => {
    const phases = buildCashFlowTimeline({
      horizonYears: 16,
      monthlyCapacity: 10000,
      components: [{ monthlyPremium: 7000, premiumPayingTermYears: 16 }],
    });
    expect(phases).toEqual([{ fromYear: 1, toYear: 16, allocatedMonthly: 7000, freeMonthly: 3000 }]);
  });
});

describe("freeMonthlyCapacityAfterPpt", () => {
  it("reports the correct freed capacity for a year within the post-PPT phase", () => {
    const free = freeMonthlyCapacityAfterPpt({
      horizonYears: 16,
      monthlyCapacity: 10000,
      components: [{ monthlyPremium: 7000, premiumPayingTermYears: 10 }],
      afterYear: 11,
    });
    expect(free).toBe(10000);
  });

  it("reports the correct free capacity during the paying phase", () => {
    const free = freeMonthlyCapacityAfterPpt({
      horizonYears: 16,
      monthlyCapacity: 10000,
      components: [{ monthlyPremium: 7000, premiumPayingTermYears: 10 }],
      afterYear: 5,
    });
    expect(free).toBe(3000);
  });
});
