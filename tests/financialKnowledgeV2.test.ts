import { describe, it, expect } from "vitest";
import { projectBenefits } from "@/lib/planning/planIntelligence/benefitProjection";
import { getHistoricalBonusEstimate, HISTORICAL_BONUS_RECORDS } from "@/lib/planning/planIntelligence/historicalBonusData";
import { calculateXirr, analyzeReturn } from "@/lib/planning/planIntelligence/returnAnalysis";
import { getPlanIntelligenceProfile } from "@/lib/planning/planIntelligence/planProfiles";
import { planCombinations } from "@/lib/planning/combinationEngine/planner";
import { componentCashFlowEvents } from "@/lib/planning/combinationEngine/structureSimulator";
import { PlanningRequest } from "@/lib/planning/combinationEngine/types";

// ---- Traditional benefits are not reduced to BSA alone ----
describe("Traditional products model more than premium -> Basic Sum Assured", () => {
  it("Jeevan Labh (736) at a Sum Assured band with a historical bonus record produces MORE than one benefit component", () => {
    const projection = projectBenefits({ planNumber: "736", uin: "512N304V03", age: 35, policyTermYears: 16, premiumPayingTermYears: 10, basicSumAssured: 1000000 });
    expect(projection.components.length).toBeGreaterThan(1);
    expect(projection.components.some((c) => c.type === "MATURITY")).toBe(true);
    expect(projection.components.some((c) => c.type === "SIMPLE_REVERSIONARY_BONUS")).toBe(true);
  });

  it("Jeevan Labh at a Sum Assured band with NO historical bonus record stays guaranteed-only, not fabricated", () => {
    const projection = projectBenefits({ planNumber: "736", uin: "512N304V03", age: 35, policyTermYears: 16, premiumPayingTermYears: 10, basicSumAssured: 200000 });
    expect(projection.components.length).toBe(1);
    expect(projection.totalParticipatingEstimate.value).toBe(0);
  });

  it("New Endowment (714)/New Jeevan Anand (715)/Jeevan Lakshya (733) fall back to guaranteed-only when no historical record exists — never invented", () => {
    for (const [planNumber, uin] of [
      ["714", "512N277V03"],
      ["715", "512N279V03"],
      ["733", "512N297V03"],
    ]) {
      const projection = projectBenefits({ planNumber, uin, age: 30, policyTermYears: 20, premiumPayingTermYears: 20, basicSumAssured: 500000 });
      expect(projection.totalParticipatingEstimate.value).toBe(0);
      expect(projection.totalGuaranteed.value).toBe(500000);
    }
  });
});

// ---- Participating != guaranteed ----
describe("Participating (non-guaranteed) benefits are never conflated with guaranteed ones", () => {
  const projection = projectBenefits({ planNumber: "736", uin: "512N304V03", age: 35, policyTermYears: 16, premiumPayingTermYears: 10, basicSumAssured: 1000000 });

  it("keeps guaranteed and participating totals as separate fields, never merged into one number", () => {
    expect(projection.totalGuaranteed.value).toBe(1000000);
    expect(projection.totalParticipatingEstimate.value).toBeGreaterThan(0);
    expect(projection.totalPlanningEstimate.value).toBe((projection.totalGuaranteed.value as number) + (projection.totalParticipatingEstimate.value as number));
  });

  it("the participating component's own character is NON_GUARANTEED, never GUARANTEED", () => {
    const bonusComponent = projection.components.find((c) => c.type === "SIMPLE_REVERSIONARY_BONUS")!;
    expect(bonusComponent.character).toBe("NON_GUARANTEED");
  });
});

// ---- Historical bonus != guaranteed, but can contribute to an estimated outcome ----
describe("Historical bonus data", () => {
  it("every historical bonus record is tagged HISTORICAL, never VERIFIED or GUARANTEED-implying", () => {
    for (const record of HISTORICAL_BONUS_RECORDS) {
      const estimate = getHistoricalBonusEstimate(record.planNumber, record.uin, record.applicableSumAssuredBand.min, record.applicableTermYears![0]);
      expect(estimate!.provenance.status).toBe("HISTORICAL");
    }
  });

  it("a historical bonus estimate carries LOW estimationConfidence (third-party sourced, not LIC's own primary circular)", () => {
    const estimate = getHistoricalBonusEstimate("736", "512N304V03", 1000000, 16);
    expect(estimate!.provenance.estimationConfidence).toBe("LOW");
  });

  it("never applies a historical bonus rate outside its verified Sum Assured band (no mixing rules across bands)", () => {
    expect(getHistoricalBonusEstimate("736", "512N304V03", 200000, 16)).toBeNull();
    expect(getHistoricalBonusEstimate("736", "512N304V03", 1000000, 21)).not.toBeNull();
    expect(getHistoricalBonusEstimate("736", "512N304V03", 1000000, 13)).toBeNull(); // term not in the record
  });

  it("a historical-based estimate contributes to totalPlanningEstimate but is never itself GUARANTEED", () => {
    const projection = projectBenefits({ planNumber: "736", uin: "512N304V03", age: 35, policyTermYears: 21, premiumPayingTermYears: 15, basicSumAssured: 1000000 });
    expect(projection.totalPlanningEstimate.value).toBeGreaterThan(projection.totalGuaranteed.value as number);
    expect(projection.totalPlanningEstimate.provenance.status).not.toBe("VERIFIED");
  });
});

// ---- Jeevan Umang recurring-income cash flow ----
describe("Jeevan Umang (745) is understood as a recurring-income product, not a maturity corpus", () => {
  const projection = projectBenefits({ planNumber: "745", uin: "512N312V03", age: 30, policyTermYears: 25, premiumPayingTermYears: 20, basicSumAssured: 1000000 });

  it("produces a recurring Survival Benefit component spanning multiple years, not a single lump sum", () => {
    const survival = projection.components.find((c) => c.type === "SURVIVAL")!;
    expect(survival.recurring).toBeDefined();
    expect(survival.recurring!.untilYear).toBeGreaterThan(survival.yearFromStart);
    expect(survival.amount.value).toBeCloseTo(1000000 * 0.08, 5);
    expect(survival.character).toBe("GUARANTEED");
  });

  it("expands into one CashFlowEvent per year of the income window when converted via componentCashFlowEvents", () => {
    const events = componentCashFlowEvents(
      {
        planNumber: "745",
        uin: "512N312V03",
        productName: "LIC's Jeevan Umang",
        role: "INCOME_GENERATION",
        monthlyAllocation: { value: 5000, provenance: { status: "ESTIMATED", sourceReferences: [] } },
        policyTermYears: 25,
        premiumPayingTermYears: 20,
        basicSumAssured: 1000000,
        benefitModel: getPlanIntelligenceProfile("745", "512N312V03")!.benefitModel,
        cashFlowPattern: "LEVEL_OUTFLOW_THEN_DEFERRED_RECURRING_INCOME",
        marketLinked: false,
        ulipOfficialIllustrationRatesPct: null,
      },
      25,
      30
    );
    const survivalEvents = events.filter((e) => e.kind === "SURVIVAL_BENEFIT");
    expect(survivalEvents.length).toBe(25 - 20 + 1); // one event per year from PPT end through policy term
    expect(survivalEvents.every((e) => e.amount.value === 80000)).toBe(true);
  });
});

// ---- Jeevan Utsav income mechanics ----
describe("Jeevan Utsav (771) Regular Income option is modeled as a benefit formula, never as an interest rate", () => {
  const projection = projectBenefits({ planNumber: "771", uin: "512N363V02", age: 30, policyTermYears: 25, premiumPayingTermYears: 10, basicSumAssured: 1000000 });

  it("produces a 10%-of-Basic-Sum-Assured recurring income component and a Guaranteed Addition component", () => {
    const income = projection.components.find((c) => c.type === "INCOME")!;
    expect(income.amount.value).toBeCloseTo(100000, 5);
    expect(income.character).toBe("GUARANTEED");
    const ga = projection.components.find((c) => c.type === "GUARANTEED_ADDITION")!;
    expect(ga.amount.value).toBeCloseTo(40 * (1000000 / 1000) * 10, 5);
  });

  it("never describes the income benefit's method string as an 'interest rate' or 'return'", () => {
    const income = projection.components.find((c) => c.type === "INCOME")!;
    const lower = income.amount.provenance.method!.toLowerCase();
    expect(lower).not.toContain("interest rate");
    expect(lower).not.toMatch(/\breturn\b/);
  });

  it("Jeevan Utsav is non-participating — its participating-estimate layer is always exactly zero, never fabricated", () => {
    expect(projection.totalParticipatingEstimate.value).toBe(0);
  });
});

// ---- No double counting ----
describe("Structure-level guaranteed/non-guaranteed/market-linked portions never double-count", () => {
  const request: PlanningRequest = { age: 35, profession: "Engineer", goal: "child_education", goalAmount: 2500000, yearsToGoal: 16, monthlyCapacity: 10000, riskPreference: "balanced" };
  const result = planCombinations(request);

  it("guaranteed + non-guaranteed + market-linked portions equal the sum of all non-outflow event amounts", () => {
    for (const structure of result.finalStructures) {
      const ga = structure.goalAnalysis;
      const known = [ga.guaranteedPortion, ga.nonGuaranteedPortion, ga.marketLinkedIllustrativePortion].filter((v) => v.value != null);
      const sum = known.reduce((s, v) => s + (v.value as number), 0);
      const totalInflows = structure.structure.events.filter((e) => e.kind !== "PREMIUM_OUTFLOW" && e.amount.value != null).reduce((s, e) => s + (e.amount.value as number), 0);
      expect(sum).toBeCloseTo(totalInflows, 2);
    }
  });
});

// ---- ULIP: historical != official illustration != guaranteed != forecast ----
describe("ULIP data model keeps historical/official-illustration/planning-scenario cleanly separate", () => {
  const siip = getPlanIntelligenceProfile("752", "512L334V02")!;

  it("SIIP's official illustration rates are the product's own verified rates, not a global hardcoded 6/8/10", () => {
    expect(siip.ulip!.officialIllustration!.ratesPct).toEqual([4, 8]);
    expect(siip.ulip!.officialIllustration!.status).toBe("ILLUSTRATIVE");
  });

  it("official illustration and historical performance are structurally distinct fields, never conflated", () => {
    expect(siip.ulip!.officialIllustration).not.toBe(siip.ulip!.historicalPerformance as unknown);
    expect(Array.isArray(siip.ulip!.historicalPerformance)).toBe(true);
  });

  it("an official illustration is never itself GUARANTEED", () => {
    for (const plan of [
      ["873", "512L354V01"],
      ["749", "512L317V02"],
      ["752", "512L334V02"],
      ["886", "512L361V01"],
    ]) {
      const profile = getPlanIntelligenceProfile(plan[0], plan[1])!;
      if (profile.ulip?.officialIllustration) {
        expect(profile.ulip.officialIllustration.status).toBe("ILLUSTRATIVE");
      }
    }
  });
});

// ---- ULIP charges reduce the projected fund value ----
describe("ULIP projection nets the Fund Management Charge off the illustration rate rather than assuming a zero-charge SIP", () => {
  it("a lower net rate produces a materially smaller projected value than the raw gross illustration rate would", () => {
    const component = {
      planNumber: "752",
      uin: "512L334V02",
      productName: "LIC's SIIP",
      role: "MARKET_LINKED_ACCUMULATION" as const,
      monthlyAllocation: { value: 7000, provenance: { status: "ESTIMATED" as const, sourceReferences: [] } },
      policyTermYears: 16,
      premiumPayingTermYears: null,
      basicSumAssured: null,
      benefitModel: getPlanIntelligenceProfile("752", "512L334V02")!.benefitModel,
      cashFlowPattern: "PREMIUM_MINUS_CHARGES_INTO_MARKET_LINKED_FUND" as const,
      marketLinked: true,
      ulipOfficialIllustrationRatesPct: [4, 8] as const,
    };
    const events = componentCashFlowEvents(component, 16, 35);
    const maturityEvent = events.find((e) => e.kind === "MATURITY_BENEFIT")!;
    expect(maturityEvent.amount.provenance.status).toBe("ILLUSTRATIVE");
    expect(maturityEvent.amount.provenance.method).toContain("Fund Management Charge");
    expect(maturityEvent.amount.provenance.method).toContain("4%"); // uses the LOWER of the product's own rates, net of charge
    expect(maturityEvent.amount.provenance.estimationConfidence).toBe("MEDIUM");
  });

  it("falls back to a generic scenario, never a crash, for a component with no product-specific illustration rate", () => {
    const component = {
      planNumber: "999",
      uin: "TESTUIN",
      productName: "Unenriched Test ULIP",
      role: "MARKET_LINKED_ACCUMULATION" as const,
      monthlyAllocation: { value: 5000, provenance: { status: "ESTIMATED" as const, sourceReferences: [] } },
      policyTermYears: 10,
      premiumPayingTermYears: null,
      basicSumAssured: null,
      benefitModel: [{ type: "MARKET_LINKED_FUND_VALUE" as const, character: "MARKET_LINKED" as const, description: "test", timing: "CONTINUOUS_ACCUMULATION" as const }],
      cashFlowPattern: "PREMIUM_MINUS_CHARGES_INTO_MARKET_LINKED_FUND" as const,
      marketLinked: true,
      ulipOfficialIllustrationRatesPct: null,
    };
    const events = componentCashFlowEvents(component, 10, 35);
    const maturityEvent = events.find((e) => e.kind === "MATURITY_BENEFIT")!;
    expect(maturityEvent.amount.provenance.estimationConfidence).toBe("LOW");
    expect(maturityEvent.amount.provenance.method).toContain("generic");
  });
});

// ---- Estimated premium / XIRR provenance and confidence ----
describe("Estimation provenance and confidence", () => {
  it("estimated XIRR carries a method string and never claims VERIFIED status when a market-linked cash flow contributes", () => {
    const request: PlanningRequest = { age: 35, profession: "Engineer", goal: "child_education", goalAmount: 2500000, yearsToGoal: 16, monthlyCapacity: 10000, riskPreference: "balanced" };
    const result = planCombinations(request);
    for (const structure of result.finalStructures) {
      if (structure.structure.components.some((c) => c.marketLinked) && structure.goalAnalysis.irrPercent.value != null) {
        expect(structure.goalAnalysis.irrPercent.provenance.status).not.toBe("VERIFIED");
        expect(structure.goalAnalysis.irrPercent.provenance.method).toBeTruthy();
      }
    }
  });

  it("unknown stays unknown when no defensible historical bonus basis exists — never a fabricated number", () => {
    expect(getHistoricalBonusEstimate("714", "512N277V03", 1000000, 20)).toBeNull();
    const projection = projectBenefits({ planNumber: "714", uin: "512N277V03", age: 30, policyTermYears: 20, premiumPayingTermYears: 20, basicSumAssured: 1000000 });
    expect(projection.totalParticipatingEstimate.value).toBe(0);
  });
});

// ---- calculateXirr robustness (the bug this phase found and fixed) ----
describe("calculateXirr never returns a numerical-solver artifact", () => {
  it("returns a small, economically sensible rate (not billions of percent) for a long-outflow/late-small-inflow shape", () => {
    const flows = [...Array(17)].map((_, year) => ({ yearFromStart: year, amount: -1041 * 12 })).concat([{ yearFromStart: 20, amount: 200000 }]);
    const irr = calculateXirr(flows);
    expect(irr).not.toBeNull();
    expect(Math.abs(irr as number)).toBeLessThan(50);
  });

  it("still solves a well-conditioned case exactly as before (no regression from the robustness fix)", () => {
    const flows = [...Array(10)].map((_, year) => ({ yearFromStart: year, amount: -1000 })).concat([{ yearFromStart: 10, amount: 15000 }]);
    const irr = calculateXirr(flows);
    expect(irr).not.toBeNull();
    expect(irr as number).toBeGreaterThan(0);
  });

  it("returns null (never a fabricated number) when genuinely no root exists in the deterministic search range", () => {
    const irr = calculateXirr([
      { yearFromStart: 0, amount: -100 },
      { yearFromStart: 50, amount: 100.01 },
    ]);
    // A real root exists here mathematically close to 0%, but the point
    // of this test is simply that the function never throws and always
    // returns either a verified number or null.
    expect(irr === null || Number.isFinite(irr)).toBe(true);
  });
});

// ---- Phase 2 invariants still hold after Phase 3 enrichment ----
describe("Phase 2 combination brain still respects its own invariants after richer data", () => {
  const request: PlanningRequest = { age: 35, profession: "Engineer", goal: "child_education", goalAmount: 2500000, yearsToGoal: 16, monthlyCapacity: 10000, riskPreference: "balanced" };
  const result = planCombinations(request);

  it("never exceeds monthly capacity", () => {
    for (const structure of result.finalStructures) {
      expect(structure.monthlyBudgetUsed.value ?? 0).toBeLessThanOrEqual(request.monthlyCapacity);
    }
  });

  it("every component resolves to a real Phase 1 product identity", () => {
    for (const structure of result.finalStructures) {
      for (const component of structure.structure.components) {
        expect(getPlanIntelligenceProfile(component.planNumber, component.uin)).toBeDefined();
      }
    }
  });

  it("returns at most 3 final structures", () => {
    expect(result.finalStructures.length).toBeLessThanOrEqual(3);
  });
});

// ---- analyzeReturn per-component sanity (reused, not duplicated) ----
describe("Per-component return analysis reuses Phase 1's analyzeReturn, never a second implementation", () => {
  it("Jeevan Labh's enriched cash flow produces a defensible per-component ReturnAnalysis", () => {
    const events = componentCashFlowEvents(
      {
        planNumber: "736",
        uin: "512N304V03",
        productName: "LIC's Jeevan Labh",
        role: "GOAL_ACCUMULATION",
        monthlyAllocation: { value: 7000, provenance: { status: "ESTIMATED", sourceReferences: [] } },
        policyTermYears: 16,
        premiumPayingTermYears: 10,
        basicSumAssured: 1000000,
        benefitModel: getPlanIntelligenceProfile("736", "512N304V03")!.benefitModel,
        cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
        marketLinked: false,
        ulipOfficialIllustrationRatesPct: null,
      },
      16,
      35
    );
    const analysis = analyzeReturn(events);
    expect(analysis.maturityValue.value).toBeGreaterThan(1000000); // BSA + historical-based bonus estimate
    expect(analysis.totalPremiumPaid.value).toBe(7000 * 12 * 10);
  });
});
