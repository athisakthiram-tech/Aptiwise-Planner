import { describe, it, expect } from "vitest";
import { debugPlanForCustomer, debugStructure } from "@/lib/planning/combinationEngine/debugTools";
import { checkConfiguration, checkGoalAnalysis, checkNoDuplicateEvents, checkStructureBudget, checkUlipChargeNeverIncreasesRate, checkXirrReproducesNpv, xirrVerifiedOrNull } from "@/lib/planning/combinationEngine/sanityChecks";
import { planCombinations } from "@/lib/planning/combinationEngine/planner";
import { generateSingleProductStructures } from "@/lib/planning/combinationEngine/structureGenerator";
import { componentCashFlowEvents } from "@/lib/planning/combinationEngine/structureSimulator";
import { generateCandidateAnalyses } from "@/lib/planning/combinationEngine/candidateGenerator";
import { generateAllConfigurations } from "@/lib/planning/combinationEngine/configurationGenerator";
import { analyzeCustomer } from "@/lib/planning/combinationEngine/customerAnalyzer";
import { projectBenefits } from "@/lib/planning/planIntelligence/benefitProjection";
import { getHistoricalBonusEstimate } from "@/lib/planning/planIntelligence/historicalBonusData";
import { calculateCagrFromNav, calculateSimpleReturnFromNav, buildHistoricalPerformancePoint } from "@/lib/planning/planIntelligence/ulipModel";
import { getPlanIntelligenceProfile } from "@/lib/planning/planIntelligence/planProfiles";
import { CandidateAnalysis, PlanningRequest } from "@/lib/planning/combinationEngine/types";

const RETIREMENT_REQUEST: PlanningRequest = { age: 40, profession: "Engineer", goal: "retirement", goalAmount: 5000000, yearsToGoal: 20, monthlyCapacity: 15000, riskPreference: "balanced" };

// ---- Umang premium estimation / multiple PPTs / income timing / post-goal benefits ----
describe("Jeevan Umang (745) premium and benefit foundation", () => {
  it("still honestly reports no defensible premium — 3 independent secondary sources disagreed on the same age/PPT/BSA config", () => {
    const profile = getPlanIntelligenceProfile("745", "512N312V03")!;
    expect(profile.premiumModel.calculationReadiness).toBe("NOT_YET_ESTIMATABLE");
    expect(profile.premiumModel.minimumContribution.value).toBeNull();
  });

  it("produces a correct income stream across multiple PPT choices (15/20/25/30)", () => {
    for (const ppt of [15, 20, 25, 30]) {
      const projection = projectBenefits({ planNumber: "745", uin: "512N312V03", age: 35, policyTermYears: 20, premiumPayingTermYears: ppt, basicSumAssured: 1000000 });
      const survival = projection.components.find((c) => c.type === "SURVIVAL")!;
      expect(survival.yearFromStart).toBe(ppt); // income starts exactly at PPT end, no waiting period for Umang
      expect(survival.amount.value).toBeCloseTo(80000, 5);
    }
  });

  it("income-start timing never assumes a waiting period for Umang (confirmed: 'no waiting period within the PPT')", () => {
    const projection = projectBenefits({ planNumber: "745", uin: "512N312V03", age: 35, policyTermYears: 20, premiumPayingTermYears: 20, basicSumAssured: 1000000 });
    const survival = projection.components.find((c) => c.type === "SURVIVAL")!;
    expect(survival.yearFromStart).toBe(20);
  });

  it("post-goal benefits: for a customer whose goal year falls before age 100, income and the terminal benefit both extend past the goal year", () => {
    const projection = projectBenefits({ planNumber: "745", uin: "512N312V03", age: 40, policyTermYears: 20, premiumPayingTermYears: 20, basicSumAssured: 1000000 });
    const survival = projection.components.find((c) => c.type === "SURVIVAL")!;
    const maturity = projection.components.find((c) => c.type === "MATURITY")!;
    expect(survival.recurring!.untilYear).toBe(60); // 100 - 40
    expect(maturity.yearFromStart).toBe(60);
    expect(survival.recurring!.untilYear).toBeGreaterThan(20); // goal year
  });

  it("debugPlanForCustomer traces the exact remaining reason Umang does not enter the retirement regression", () => {
    const report = debugPlanForCustomer("745", "512N312V03", RETIREMENT_REQUEST);
    expect(report.eliminated).toBe(false); // not eliminated — genuinely relevant and eligible
    expect(report.generatedConfigurations.length).toBe(0); // but Stage 4 can't price it
    expect(report.appearsInFinalStructures).toBe(false);
    expect(report.reasonSummary).toContain("zero usable configurations");
  });
});

// ---- Utsav premium / Regular / Flexi / waiting period ----
describe("Jeevan Utsav (771) premium and benefit foundation", () => {
  it("still honestly reports no defensible premium", () => {
    const profile = getPlanIntelligenceProfile("771", "512N363V02")!;
    expect(profile.premiumModel.calculationReadiness).toBe("NOT_YET_ESTIMATABLE");
  });

  it("Regular Income waiting period holds across multiple PPT choices (5-16 years)", () => {
    for (const ppt of [5, 10, 16]) {
      const projection = projectBenefits({ planNumber: "771", uin: "512N363V02", age: 35, policyTermYears: 20, premiumPayingTermYears: ppt, basicSumAssured: 1000000 });
      const income = projection.components.find((c) => c.type === "INCOME")!;
      expect(income.yearFromStart).toBe(ppt + 2);
    }
  });

  it("debugPlanForCustomer traces the exact remaining reason Utsav does not enter the retirement regression", () => {
    const report = debugPlanForCustomer("771", "512N363V02", RETIREMENT_REQUEST);
    expect(report.eliminated).toBe(false);
    expect(report.generatedConfigurations.length).toBe(0);
    expect(report.appearsInFinalStructures).toBe(false);
  });
});

// ---- Bonus database: bands, provenance, historical != guaranteed ----
describe("Participating bonus database (714/715/733/736)", () => {
  it("respects each plan's own banding dimension (term for 714, flat for 715, maturity-age for 733)", () => {
    expect(getHistoricalBonusEstimate("714", "512N277V03", 1000000, 15)).not.toBeNull(); // 12-15yr band
    expect(getHistoricalBonusEstimate("714", "512N277V03", 1000000, 20)).not.toBeNull(); // 16-20yr band
    expect(getHistoricalBonusEstimate("715", "512N279V03", 1000000, 12)).not.toBeNull(); // flat, any term
    expect(getHistoricalBonusEstimate("715", "512N279V03", 1000000, 35)).not.toBeNull();
    expect(getHistoricalBonusEstimate("733", "512N297V03", 1000000, 20, 50)).not.toBeNull(); // maturity age 50 <= 55
    expect(getHistoricalBonusEstimate("733", "512N297V03", 1000000, 20, 60)).toBeNull(); // maturity age 60 > 55
  });

  it("never applies a rate outside its verified Sum Assured band", () => {
    expect(getHistoricalBonusEstimate("714", "512N277V03", 499999, 20)).toBeNull();
    expect(getHistoricalBonusEstimate("714", "512N277V03", 500000, 20)).not.toBeNull();
  });

  it("HISTORICAL bonus provenance is never confused with GUARANTEED", () => {
    const estimate = getHistoricalBonusEstimate("714", "512N277V03", 1000000, 20)!;
    expect(estimate.provenance.status).toBe("HISTORICAL");
    expect(estimate.provenance.sourceQuality).toBe("SECONDARY_CORROBORATED");
    expect(estimate.provenance.status).not.toBe("VERIFIED");
  });
});

// ---- ULIP NAV / CAGR math ----
describe("ULIP NAV return/CAGR calculation", () => {
  it("computes a simple 1-year return correctly", () => {
    expect(calculateSimpleReturnFromNav(100, 112)).toBe(12);
    expect(calculateSimpleReturnFromNav(100, 90)).toBe(-10);
  });

  it("computes CAGR correctly for a known multi-year case", () => {
    // 100 -> 200 over 5 years is exactly a 14.87% CAGR (2^(1/5) - 1)
    const cagr = calculateCagrFromNav(100, 200, 5);
    expect(cagr).toBeCloseTo(14.87, 1);
  });

  it("CAGR of a flat NAV over any period is 0%", () => {
    expect(calculateCagrFromNav(100, 100, 3)).toBe(0);
  });

  it("buildHistoricalPerformancePoint always tags status HISTORICAL, never ILLUSTRATIVE or GUARANTEED", () => {
    const point = buildHistoricalPerformancePoint({
      fundName: "Growth Fund",
      periodLabel: "5Y_CAGR",
      start: { fundName: "Growth Fund", date: "2020-01-01", nav: 15 },
      end: { fundName: "Growth Fund", date: "2025-01-01", nav: 21.7091 },
      source: "test-fixture",
    });
    expect(point.status).toBe("HISTORICAL");
    expect(point.returnPercent).toBeGreaterThan(0);
  });

  it("rejects a non-positive starting NAV rather than returning a nonsensical rate", () => {
    expect(() => calculateCagrFromNav(0, 100, 5)).toThrow();
    expect(() => calculateSimpleReturnFromNav(-5, 10)).toThrow();
  });
});

// ---- Source quality (separate from value provenance) ----
describe("Source quality is tracked separately from DataConfidence", () => {
  it("a HISTORICAL bonus record can carry SECONDARY_CORROBORATED source quality simultaneously", () => {
    const estimate = getHistoricalBonusEstimate("736", "512N304V03", 1000000, 16)!;
    expect(estimate.provenance.status).toBe("HISTORICAL");
    expect(estimate.provenance.sourceQuality).toBe("SECONDARY_CORROBORATED");
  });

  it("never silently upgrades a secondary-sourced value to PRIMARY_OFFICIAL", () => {
    const estimate = getHistoricalBonusEstimate("714", "512N277V03", 1000000, 20)!;
    expect(estimate.provenance.sourceQuality).not.toBe("PRIMARY_OFFICIAL");
  });
});

// ---- Nivesh Plus identity/version flag persists (canary test) ----
describe("Nivesh Plus (749) identity/version discrepancy is documented, not silently resolved", () => {
  it("the profile still uses this repository's original planNumber (749) — no silent rename happened", () => {
    const profile = getPlanIntelligenceProfile("749", "512L317V02");
    expect(profile).toBeDefined();
    expect(profile!.identity.planNumber).toBe("749");
  });

  it("the identity/version conflict is recorded in the profile's own eligibility notes, not lost", () => {
    const profile = getPlanIntelligenceProfile("749", "512L317V02")!;
    const combinedNotes = profile.eligibility.notes.join(" ");
    expect(combinedNotes).toContain("Plan No. 849");
  });
});

// ---- Product debugger ----
describe("debugPlanForCustomer (development-only diagnostic)", () => {
  const regressionRequest: PlanningRequest = { age: 35, profession: "Engineer", goal: "child_education", goalAmount: 2500000, yearsToGoal: 16, monthlyCapacity: 10000, riskPreference: "balanced" };

  it("reports a full trace for a plan that DOES enter the final structures", () => {
    const report = debugPlanForCustomer("736", "512N304V03", regressionRequest);
    expect(report.eliminated).toBe(false);
    expect(report.generatedConfigurations.length).toBeGreaterThan(0);
    expect(report.appearsInFinalStructures).toBe(true);
    expect(report.reasonSummary).toContain("Appears in");
  });

  it("reports a full trace for a plan eliminated at Stage 3, with the real elimination reason", () => {
    const report = debugPlanForCustomer("749", "512L317V02", regressionRequest); // single-premium ULIP
    expect(report.eliminated).toBe(true);
    expect(report.eliminationReasons).toContain("single_premium_structure_impossible_from_monthly_capacity");
    expect(report.reasonSummary).toContain("Eliminated at Stage 3");
  });

  it("throws a clear error for a plan identity that doesn't resolve, rather than returning a silently-empty report", () => {
    expect(() => debugPlanForCustomer("999999", "NOPE", regressionRequest)).toThrow();
  });
});

// ---- Structure debugger ----
describe("debugStructure (development-only diagnostic)", () => {
  it("shows per-component cash flows, goal-year value, and a clean double-count check for a real structure", () => {
    const regressionRequest: PlanningRequest = { age: 35, profession: "Engineer", goal: "child_education", goalAmount: 2500000, yearsToGoal: 16, monthlyCapacity: 10000, riskPreference: "balanced" };
    const customer = analyzeCustomer(regressionRequest);
    const survivors = generateCandidateAnalyses(customer).filter((a: CandidateAnalysis) => !a.eliminated);
    const candidatesByPlan = new Map(survivors.map((c) => [`${c.profile.identity.planNumber}::${c.profile.identity.uin}`, c]));
    const configsByPlan = generateAllConfigurations(survivors, customer);
    const singles = generateSingleProductStructures(candidatesByPlan, configsByPlan);
    const report = debugStructure(singles[0], regressionRequest);

    expect(report.components.length).toBe(1);
    expect(report.duplicateEventKeys).toEqual([]);
    expect(report.goalYearValue === null || Number.isFinite(report.goalYearValue)).toBe(true);
    expect(report.irrInputCashFlows.length).toBeGreaterThan(0);
  });
});

// ---- Sanity checks ----
describe("Sanity assertions", () => {
  it("checkConfiguration flags a non-positive premium", () => {
    const issues = checkConfiguration({ planNumber: "x", uin: "y", policyTermYears: 10, premiumPayingTermYears: 10, basicSumAssuredCandidate: null, monthlyPremium: { value: 0, provenance: { status: "ESTIMATED", sourceReferences: [] } }, role: "GOAL_ACCUMULATION" });
    expect(issues.some((i) => i.code === "PREMIUM_NOT_POSITIVE")).toBe(true);
  });

  it("checkConfiguration flags PPT exceeding the policy term", () => {
    const issues = checkConfiguration({ planNumber: "x", uin: "y", policyTermYears: 10, premiumPayingTermYears: 15, basicSumAssuredCandidate: null, monthlyPremium: { value: 100, provenance: { status: "ESTIMATED", sourceReferences: [] } }, role: "GOAL_ACCUMULATION" });
    expect(issues.some((i) => i.code === "PPT_EXCEEDS_TERM")).toBe(true);
  });

  it("checkStructureBudget flags a structure whose components exceed monthly capacity", () => {
    const structure = {
      id: "test",
      components: [{ planNumber: "x", uin: "y", productName: "test", role: "GOAL_ACCUMULATION" as const, monthlyAllocation: { value: 20000, provenance: { status: "ESTIMATED" as const, sourceReferences: [] } }, policyTermYears: 10, premiumPayingTermYears: 10, basicSumAssured: null, benefitModel: [], cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY" as const, marketLinked: false, ulipOfficialIllustrationRatesPct: null }],
      timeline: [],
      events: [],
    };
    expect(checkStructureBudget(structure, 10000).length).toBeGreaterThan(0);
    expect(checkStructureBudget(structure, 25000).length).toBe(0);
  });

  it("checkNoDuplicateEvents flags a genuine (kind, year) collision", () => {
    const events = [
      { yearFromStart: 5, kind: "MATURITY_BENEFIT" as const, amount: { value: 100, provenance: { status: "DERIVED" as const, sourceReferences: [] } } },
      { yearFromStart: 5, kind: "MATURITY_BENEFIT" as const, amount: { value: 100, provenance: { status: "DERIVED" as const, sourceReferences: [] } } },
    ];
    expect(checkNoDuplicateEvents(events).length).toBe(1);
  });

  it("checkNoDuplicateEvents passes for genuinely distinct years (e.g. a recurring income schedule)", () => {
    const events = [5, 6, 7].map((y) => ({ yearFromStart: y, kind: "SURVIVAL_BENEFIT" as const, amount: { value: 100, provenance: { status: "DERIVED" as const, sourceReferences: [] } } }));
    expect(checkNoDuplicateEvents(events)).toEqual([]);
  });

  it("checkGoalAnalysis flags a non-finite value", () => {
    const badAnalysis = {
      totalContributions: { value: NaN, provenance: { status: "ESTIMATED" as const, sourceReferences: [] } },
      guaranteedPortion: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      nonGuaranteedPortion: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      marketLinkedIllustrativePortion: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      incomeReceivedBeforeGoal: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      incomeReceivedAfterGoal: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      goalYearValue: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      goalAmount: 100,
      goalCoveragePercent: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      gapOrSurplus: { kind: "GAP" as const, amount: { value: 100, provenance: { status: "VERIFIED" as const, sourceReferences: [] } } },
      irrPercent: { value: null, provenance: { status: "ESTIMATED" as const, sourceReferences: [] } },
      perComponentReturn: [],
    };
    expect(checkGoalAnalysis(badAnalysis).some((i) => i.code === "NON_FINITE_VALUE")).toBe(true);
  });

  it("checkGoalAnalysis flags a guaranteedPortion built from a non-guaranteed status", () => {
    const badAnalysis = {
      totalContributions: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      guaranteedPortion: { value: 100, provenance: { status: "HISTORICAL" as const, sourceReferences: [] } },
      nonGuaranteedPortion: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      marketLinkedIllustrativePortion: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      incomeReceivedBeforeGoal: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      incomeReceivedAfterGoal: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      goalYearValue: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      goalAmount: 100,
      goalCoveragePercent: { value: 0, provenance: { status: "VERIFIED" as const, sourceReferences: [] } },
      gapOrSurplus: { kind: "GAP" as const, amount: { value: 100, provenance: { status: "VERIFIED" as const, sourceReferences: [] } } },
      irrPercent: { value: null, provenance: { status: "ESTIMATED" as const, sourceReferences: [] } },
      perComponentReturn: [],
    };
    expect(checkGoalAnalysis(badAnalysis).some((i) => i.code === "GUARANTEED_NOT_GUARANTEED_STATUS")).toBe(true);
  });

  it("checkXirrReproducesNpv passes for a genuinely-computed IRR and flags a fabricated one", () => {
    const flows = [
      { yearFromStart: 0, amount: -1000 },
      { yearFromStart: 5, amount: 2000 },
    ];
    const realIrr = xirrVerifiedOrNull(flows);
    expect(checkXirrReproducesNpv(flows, realIrr).length).toBe(0);
    expect(checkXirrReproducesNpv(flows, 999999).length).toBeGreaterThan(0); // an implausible fabricated rate fails
  });

  it("checkUlipChargeNeverIncreasesRate flags a charge that would increase the projected rate", () => {
    expect(checkUlipChargeNeverIncreasesRate(4, 2.65).length).toBe(0); // charges correctly reduce the rate
    expect(checkUlipChargeNeverIncreasesRate(4, 5).length).toBeGreaterThan(0); // would mean a charge INCREASED the rate — a bug
  });

  it("planCombinations output already satisfies every structure-level sanity check for the real regression case", () => {
    const request: PlanningRequest = { age: 35, profession: "Engineer", goal: "child_education", goalAmount: 2500000, yearsToGoal: 16, monthlyCapacity: 10000, riskPreference: "balanced" };
    const result = planCombinations(request);
    for (const structure of result.finalStructures) {
      expect(checkStructureBudget(structure.structure, request.monthlyCapacity)).toEqual([]);
      expect(checkGoalAnalysis(structure.goalAnalysis)).toEqual([]);
      // Duplicate-event checking is scoped PER COMPONENT: two different
      // components legitimately both pay a premium (or both mature) in
      // the same year — that is not double-counting. What must never
      // happen is the SAME component emitting two events for the same
      // (kind, year).
      for (const component of structure.structure.components) {
        const componentEvents = componentCashFlowEvents(component, request.yearsToGoal, request.age);
        expect(checkNoDuplicateEvents(componentEvents)).toEqual([]);
      }
    }
  });
});

// ---- Existing phases still pass (spot checks; full suites run separately) ----
describe("Phase 1/2/3 invariants hold after Phase 3B", () => {
  it("regression case still returns at most 3 real structures with real product identities", () => {
    const request: PlanningRequest = { age: 35, profession: "Engineer", goal: "child_education", goalAmount: 2500000, yearsToGoal: 16, monthlyCapacity: 10000, riskPreference: "balanced" };
    const result = planCombinations(request);
    expect(result.finalStructures.length).toBeGreaterThan(0);
    expect(result.finalStructures.length).toBeLessThanOrEqual(3);
    for (const s of result.finalStructures) {
      for (const c of s.structure.components) {
        expect(getPlanIntelligenceProfile(c.planNumber, c.uin)).toBeDefined();
      }
    }
  });
});
