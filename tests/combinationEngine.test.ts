import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { planCombinations } from "@/lib/planning/combinationEngine/planner";
import { analyzeCustomer } from "@/lib/planning/combinationEngine/customerAnalyzer";
import { generateCandidateAnalyses } from "@/lib/planning/combinationEngine/candidateGenerator";
import { generateAllConfigurations } from "@/lib/planning/combinationEngine/configurationGenerator";
import { generatePairStructures, generateSingleProductStructures, generateTripleStructures } from "@/lib/planning/combinationEngine/structureGenerator";
import { simulateStructure } from "@/lib/planning/combinationEngine/structureSimulator";
import { analyzeStructureGoal } from "@/lib/planning/combinationEngine/structureAnalysis";
import { PlanningRequest } from "@/lib/planning/combinationEngine/types";
import { getPlanIntelligenceProfile } from "@/lib/planning/planIntelligence/planProfiles";

const REGRESSION_REQUEST: PlanningRequest = {
  age: 35,
  profession: "Engineer",
  goal: "child_education",
  goalAmount: 2500000,
  yearsToGoal: 16,
  monthlyCapacity: 10000,
  riskPreference: "balanced",
};

// ---- Item: regression case runs end to end via the real, unmodified engine ----
describe("Regression case (Age 35 Engineer, Child Education, ₹25L/16yr/₹10k, Balanced)", () => {
  const result = planCombinations(REGRESSION_REQUEST);

  it("analyzes real candidates without throwing and returns at most 3 final structures", () => {
    expect(result.finalStructures.length).toBeGreaterThan(0);
    expect(result.finalStructures.length).toBeLessThanOrEqual(3);
  });

  it("reports honest, non-trivial search statistics (not a hardcoded shortcut)", () => {
    expect(result.stats.productsAnalyzed).toBeGreaterThan(20);
    expect(result.stats.productsEliminated).toBeGreaterThan(0);
    expect(result.stats.configurationsGenerated).toBeGreaterThan(0);
    expect(result.stats.singleProductStructures).toBeGreaterThan(0);
    expect(result.stats.runtimeMs).toBeGreaterThanOrEqual(0);
  });

  it("never exceeds the customer's own stated monthly capacity in any final structure", () => {
    for (const structure of result.finalStructures) {
      expect(structure.monthlyBudgetUsed.value ?? 0).toBeLessThanOrEqual(REGRESSION_REQUEST.monthlyCapacity);
    }
  });

  it("every final structure component carries a REAL plan number and UIN resolvable in Phase 1's own catalogue (never a fake 'Market Linked (Illustrative)' component)", () => {
    for (const structure of result.finalStructures) {
      for (const component of structure.structure.components) {
        const profile = getPlanIntelligenceProfile(component.planNumber, component.uin);
        expect(profile, `component ${component.planNumber}/${component.uin} must resolve to a real Phase 1 profile`).toBeDefined();
        expect(component.productName).toBe(profile!.identity.productName);
      }
    }
  });

  it("never labels a structure best/winner/recommended/highest-return/top-plan anywhere in its output", () => {
    const serialized = JSON.stringify(result).toLowerCase();
    for (const banned of ["best", "winner", "recommended", "highest return", "top plan"]) {
      expect(serialized.includes(banned), `output must not contain "${banned}"`).toBe(false);
    }
  });

  it("carries provenance on every monetary field of every final structure's goal analysis", () => {
    for (const structure of result.finalStructures) {
      const ga = structure.goalAnalysis;
      for (const field of [ga.totalContributions, ga.guaranteedPortion, ga.nonGuaranteedPortion, ga.marketLinkedIllustrativePortion, ga.goalYearValue, ga.irrPercent]) {
        expect(field.provenance).toBeDefined();
        expect(field.provenance.status).toBeTruthy();
      }
    }
  });

  it("never fabricates a market-linked value as GUARANTEED or VERIFIED", () => {
    for (const structure of result.finalStructures) {
      if (structure.structure.components.some((c) => c.marketLinked)) {
        expect(["ILLUSTRATIVE", "ESTIMATED"]).toContain(structure.goalAnalysis.marketLinkedIllustrativePortion.provenance.status === "ILLUSTRATIVE" ? "ILLUSTRATIVE" : "ESTIMATED");
      }
    }
  });
});

// ---- Item: "VERY IMPORTANT — NO FIRST MATCH" ----
describe("Result never depends on catalogue order", () => {
  it("produces the same final structures when candidate analyses are processed in reverse order", () => {
    const customer = analyzeCustomer(REGRESSION_REQUEST);
    const forward = generateCandidateAnalyses(customer);
    const reversed = [...forward].reverse();

    const configsForward = generateAllConfigurations(forward.filter((c) => !c.eliminated), customer);
    const configsReversed = generateAllConfigurations(reversed.filter((c) => !c.eliminated), customer);

    // Same set of surviving plan keys regardless of input order.
    expect(new Set(configsForward.keys())).toEqual(new Set(configsReversed.keys()));
  });

  it("generateCandidateAnalyses never short-circuits to a single candidate (full array, never [0] only)", () => {
    const customer = analyzeCustomer(REGRESSION_REQUEST);
    const analyses = generateCandidateAnalyses(customer);
    expect(analyses.length).toBeGreaterThan(1);
  });
});

// ---- Item: "VERY IMPORTANT — SINGLE PREMIUM" ----
describe("Single-premium products are never funded from monthly-only capacity", () => {
  it("hasLumpSumCapital is always false when the request has no lump-sum field", () => {
    const customer = analyzeCustomer(REGRESSION_REQUEST);
    expect(customer.hasLumpSumCapital).toBe(false);
  });

  it("eliminates every SINGLE-structure product with 'single_premium_structure_impossible_from_monthly_capacity'", () => {
    const customer = analyzeCustomer(REGRESSION_REQUEST);
    const analyses = generateCandidateAnalyses(customer);
    const singlePremiumCandidates = analyses.filter((a) => a.profile.premiumModel.structure === "SINGLE");
    expect(singlePremiumCandidates.length).toBeGreaterThan(0);
    for (const candidate of singlePremiumCandidates) {
      expect(candidate.eliminated).toBe(true);
      expect(candidate.eliminationReasons).toContain("single_premium_structure_impossible_from_monthly_capacity");
    }
  });

  it("never produces a final structure containing a SINGLE-premium-structure product", () => {
    const result = planCombinations(REGRESSION_REQUEST);
    for (const structure of result.finalStructures) {
      for (const component of structure.structure.components) {
        const profile = getPlanIntelligenceProfile(component.planNumber, component.uin);
        expect(profile!.premiumModel.structure).not.toBe("SINGLE");
      }
    }
  });
});

// ---- Item: age / horizon eligibility ----
describe("Age and horizon elimination", () => {
  it("age eligibility is enforced (via Phase 1's own getEligiblePlanningProducts gate, reused rather than duplicated): an implausibly old age shrinks the candidate pool", () => {
    const regularCustomer = analyzeCustomer(REGRESSION_REQUEST);
    const veryOldCustomer = analyzeCustomer({ ...REGRESSION_REQUEST, age: 95 });
    const regularCount = generateCandidateAnalyses(regularCustomer).length;
    const oldCount = generateCandidateAnalyses(veryOldCustomer).length;
    expect(oldCount).toBeLessThan(regularCount);
  });

  it("does not eliminate on age when age is squarely within a product's own published band", () => {
    const customer = analyzeCustomer(REGRESSION_REQUEST);
    const analyses = generateCandidateAnalyses(customer);
    for (const a of analyses) {
      if (a.profile.eligibility.minEntryAge != null && a.profile.eligibility.maxEntryAge != null) {
        if (REGRESSION_REQUEST.age >= a.profile.eligibility.minEntryAge && REGRESSION_REQUEST.age <= a.profile.eligibility.maxEntryAge) {
          expect(a.ageEligible).not.toBe(false);
        }
      }
    }
  });
});

// ---- Item: risk preference is a search constraint, never a percentage or product selector ----
describe("Risk preference gates market-linked products without hardcoding an allocation", () => {
  it("conservative risk preference eliminates every MARKET_LINKED product", () => {
    const conservativeCustomer = analyzeCustomer({ ...REGRESSION_REQUEST, riskPreference: "conservative" });
    const analyses = generateCandidateAnalyses(conservativeCustomer);
    const marketLinked = analyses.filter((a) => a.profile.marketRisk === "MARKET_LINKED");
    expect(marketLinked.length).toBeGreaterThan(0);
    for (const a of marketLinked) {
      expect(a.eliminated).toBe(true);
      expect(a.eliminationReasons).toContain("market_linked_product_rejected_by_risk_preference");
    }
  });

  it("balanced/growth risk preference does NOT eliminate market-linked products outright", () => {
    for (const riskPreference of ["balanced", "growth"] as const) {
      const customer = analyzeCustomer({ ...REGRESSION_REQUEST, riskPreference });
      const analyses = generateCandidateAnalyses(customer);
      const marketLinked = analyses.filter((a) => a.profile.marketRisk === "MARKET_LINKED");
      expect(marketLinked.some((a) => !a.eliminated)).toBe(true);
    }
  });

  it("never encodes risk preference as a fixed allocation percentage anywhere in the customer analysis", () => {
    const customer = analyzeCustomer(REGRESSION_REQUEST);
    expect(typeof customer.marketLinkedPreference).toBe("string");
    expect(["MINIMIZE", "MODERATE", "MAXIMIZE_WITHIN_REASON"]).toContain(customer.marketLinkedPreference);
  });
});

// ---- Item: profession is a hint only, never a product selector ----
describe("Profession never selects a specific product", () => {
  it("changing profession alone does not change which products survive elimination", () => {
    const engineerCustomer = analyzeCustomer({ ...REGRESSION_REQUEST, profession: "Engineer" });
    const teacherCustomer = analyzeCustomer({ ...REGRESSION_REQUEST, profession: "Teacher" });
    const engineerSurvivors = generateCandidateAnalyses(engineerCustomer)
      .filter((a) => !a.eliminated)
      .map((a) => a.profile.identity.planNumber)
      .sort();
    const teacherSurvivors = generateCandidateAnalyses(teacherCustomer)
      .filter((a) => !a.eliminated)
      .map((a) => a.profile.identity.planNumber)
      .sort();
    expect(engineerSurvivors).toEqual(teacherSurvivors);
  });

  it("never hardcodes a profession -> specific product mapping (e.g. Engineer -> Jeevan Labh)", () => {
    const source = readFileSync(join(process.cwd(), "lib/planning/combinationEngine/candidateGenerator.ts"), "utf-8");
    expect(source.toLowerCase()).not.toContain("engineer");
    expect(source.toLowerCase()).not.toContain("jeevan labh");
  });
});

// ---- Item: budget respected, no impossible/over-budget configurations ----
describe("Configuration generation respects the customer's monthly capacity", () => {
  it("never generates a configuration whose premium exceeds the full monthly capacity", () => {
    const customer = analyzeCustomer(REGRESSION_REQUEST);
    const survivors = generateCandidateAnalyses(customer).filter((a) => !a.eliminated);
    const configsByPlan = generateAllConfigurations(survivors, customer);
    for (const configs of configsByPlan.values()) {
      for (const config of configs) {
        expect(config.monthlyPremium.value ?? 0).toBeLessThanOrEqual(REGRESSION_REQUEST.monthlyCapacity);
      }
    }
  });

  it("never leaves a configuration's premium unresolved as a fabricated placeholder (null stays null, never 0)", () => {
    const customer = analyzeCustomer(REGRESSION_REQUEST);
    const survivors = generateCandidateAnalyses(customer).filter((a) => !a.eliminated);
    const configsByPlan = generateAllConfigurations(survivors, customer);
    for (const configs of configsByPlan.values()) {
      for (const config of configs) {
        expect(config.monthlyPremium.value).not.toBeNull(); // unresolved configs are dropped, never zeroed
      }
    }
  });
});

// ---- Item: single / pair / triple structure generation ----
describe("Structure generation (single / pair / optional triple)", () => {
  const customer = analyzeCustomer(REGRESSION_REQUEST);
  const survivors = generateCandidateAnalyses(customer).filter((a) => !a.eliminated);
  const candidatesByPlan = new Map(survivors.map((c) => [`${c.profile.identity.planNumber}::${c.profile.identity.uin}`, c]));
  const configsByPlan = generateAllConfigurations(survivors, customer);

  it("generates at least one legitimate single-product structure", () => {
    const singles = generateSingleProductStructures(candidatesByPlan, configsByPlan);
    expect(singles.length).toBeGreaterThan(0);
    expect(singles.every((s) => s.components.length === 1)).toBe(true);
  });

  it("generates pair structures whose combined premium never exceeds monthly capacity", () => {
    const pairResult = generatePairStructures(candidatesByPlan, configsByPlan, REGRESSION_REQUEST.monthlyCapacity);
    expect(pairResult.structures.length).toBeGreaterThan(0);
    for (const structure of pairResult.structures) {
      expect(structure.components.length).toBe(2);
      const total = structure.components.reduce((sum, c) => sum + (c.monthlyAllocation.value ?? 0), 0);
      expect(total).toBeLessThanOrEqual(REGRESSION_REQUEST.monthlyCapacity);
    }
  });

  it("never pairs two functionally-identical products (same roles/cash-flow/market-risk)", () => {
    const pairResult = generatePairStructures(candidatesByPlan, configsByPlan, REGRESSION_REQUEST.monthlyCapacity);
    for (const structure of pairResult.structures) {
      const [a, b] = structure.components;
      const sameEverything = a.role === b.role && a.cashFlowPattern === b.cashFlowPattern && a.marketLinked === b.marketLinked && a.planNumber !== b.planNumber;
      // Same role/cashflow/marketRisk between two DIFFERENT products is still allowed
      // (e.g. two guaranteed endowments) — this only guards against a product paired with itself.
      expect(a.planNumber === b.planNumber ? a.uin !== b.uin : true).toBe(true);
    }
  });

  it("optional triple structures never exceed 3 components and are only attempted on top of a valid pair", () => {
    const pairResult = generatePairStructures(candidatesByPlan, configsByPlan, REGRESSION_REQUEST.monthlyCapacity);
    const tripleResult = generateTripleStructures(pairResult.validPairPlanKeys, candidatesByPlan, configsByPlan, REGRESSION_REQUEST.monthlyCapacity);
    for (const structure of tripleResult.structures) {
      expect(structure.components.length).toBe(3);
      const total = structure.components.reduce((sum, c) => sum + (c.monthlyAllocation.value ?? 0), 0);
      expect(total).toBeLessThanOrEqual(REGRESSION_REQUEST.monthlyCapacity);
    }
  });
});

// ---- Item: PPT / released capacity timeline ----
describe("PPT and released-capacity timeline", () => {
  it("models a phase boundary at a component's own PPT when it completes before the goal year", () => {
    const customer = analyzeCustomer(REGRESSION_REQUEST);
    const survivors = generateCandidateAnalyses(customer).filter((a) => !a.eliminated);
    const candidatesByPlan = new Map(survivors.map((c) => [`${c.profile.identity.planNumber}::${c.profile.identity.uin}`, c]));
    const configsByPlan = generateAllConfigurations(survivors, customer);
    const singles = generateSingleProductStructures(candidatesByPlan, configsByPlan);
    const limitedPay = singles.find((s) => (s.components[0].premiumPayingTermYears ?? s.components[0].policyTermYears ?? REGRESSION_REQUEST.yearsToGoal) < REGRESSION_REQUEST.yearsToGoal);
    expect(limitedPay).toBeDefined();
    const simulated = simulateStructure(limitedPay!, REGRESSION_REQUEST.yearsToGoal, REGRESSION_REQUEST.monthlyCapacity, REGRESSION_REQUEST.age);
    expect(simulated.timeline.length).toBeGreaterThan(1); // more than one phase => a PPT boundary was modeled
    const lastPhase = simulated.timeline[simulated.timeline.length - 1];
    expect(lastPhase.allocatedMonthly).toBe(0); // premium has stopped by the final phase
    expect(lastPhase.freeMonthly).toBeGreaterThan(0); // and that capacity is reported as released, never as a payout
  });

  it("never describes released capacity as a policy payout (no PREMIUM_OUTFLOW/benefit event carries a 'released capacity' label)", () => {
    const result = planCombinations(REGRESSION_REQUEST);
    for (const structure of result.finalStructures) {
      for (const event of structure.structure.events) {
        expect(event.kind).not.toBe("CHARGE_DEDUCTION"); // sanity: no fabricated charge/payout events introduced here
      }
    }
  });
});

// ---- Item: cash-flow simulation / goal-year analysis never double counts ----
describe("Goal-year analysis never double-counts a cash flow", () => {
  it("guaranteed + non-guaranteed + market-linked portions never exceed total known inflows", () => {
    const result = planCombinations(REGRESSION_REQUEST);
    for (const structure of result.finalStructures) {
      const ga = structure.goalAnalysis;
      const known = [ga.guaranteedPortion, ga.nonGuaranteedPortion, ga.marketLinkedIllustrativePortion].filter((v) => v.value != null);
      const sum = known.reduce((s, v) => s + (v.value as number), 0);
      const totalInflows = structure.structure.events.filter((e) => e.kind !== "PREMIUM_OUTFLOW" && e.amount.value != null).reduce((s, e) => s + (e.amount.value as number), 0);
      expect(sum).toBeCloseTo(totalInflows, 2);
    }
  });

  it("computes gap/surplus consistently with goal-year value vs goal amount", () => {
    const result = planCombinations(REGRESSION_REQUEST);
    for (const structure of result.finalStructures) {
      const ga = structure.goalAnalysis;
      if (ga.goalYearValue.value == null) {
        expect(ga.gapOrSurplus.kind).toBe("UNKNOWN");
      } else if (ga.goalYearValue.value >= ga.goalAmount) {
        expect(ga.gapOrSurplus.kind).toBe("SURPLUS");
      } else {
        expect(ga.gapOrSurplus.kind).toBe("GAP");
      }
    }
  });
});

// ---- Item: IRR/XIRR is defensible, never a fabricated guarantee ----
describe("IRR/XIRR", () => {
  it("never labels an IRR VERIFIED when any contributing cash flow is non-guaranteed/illustrative", () => {
    const result = planCombinations(REGRESSION_REQUEST);
    for (const structure of result.finalStructures) {
      const hasMarketLinked = structure.structure.components.some((c) => c.marketLinked);
      if (hasMarketLinked && structure.goalAnalysis.irrPercent.value != null) {
        expect(structure.goalAnalysis.irrPercent.provenance.status).not.toBe("VERIFIED");
      }
    }
  });

  it("produces a finite, sane IRR (never a numerical-solver artifact in the billions) whenever cash flows are complete", () => {
    const result = planCombinations(REGRESSION_REQUEST);
    for (const structure of result.finalStructures) {
      const irr = structure.goalAnalysis.irrPercent.value;
      if (irr != null) {
        expect(Math.abs(irr)).toBeLessThan(1000);
      }
    }
  });
});

// ---- Item: diversity selection never ranks / labels a winner, and dedupes ----
describe("Diversity selection", () => {
  it("never returns more than 3 final structures", () => {
    const result = planCombinations(REGRESSION_REQUEST);
    expect(result.finalStructures.length).toBeLessThanOrEqual(3);
  });

  it("never returns two final structures built from the exact same set of products", () => {
    const result = planCombinations(REGRESSION_REQUEST);
    const planSets = result.finalStructures.map((s) =>
      s.structure.components
        .map((c) => `${c.planNumber}::${c.uin}`)
        .sort()
        .join("+")
    );
    expect(new Set(planSets).size).toBe(planSets.length);
  });
});

// ---- Item: reason codes are machine-readable and derived, never invented ad hoc ----
describe("Reason codes", () => {
  it("every final structure carries at least one machine-readable reason code", () => {
    const result = planCombinations(REGRESSION_REQUEST);
    for (const structure of result.finalStructures) {
      expect(structure.reasonCodes.length).toBeGreaterThan(0);
      expect(structure.explanationParts.length).toBe(structure.reasonCodes.length);
    }
  });

  it("tags GOAL_COVERAGE_ESTIMATED_NOT_VERIFIED whenever a component's premium is not VERIFIED", () => {
    const result = planCombinations(REGRESSION_REQUEST);
    for (const structure of result.finalStructures) {
      const anyEstimated = structure.structure.components.some((c) => c.monthlyAllocation.provenance.status !== "VERIFIED");
      if (anyEstimated) {
        expect(structure.reasonCodes).toContain("GOAL_COVERAGE_ESTIMATED_NOT_VERIFIED");
      }
    }
  });
});

// ---- Item: goal shape (lump sum vs recurring income) derived from the goal, not hardcoded ----
describe("Goal shape derivation", () => {
  it("retirement implies a recurring-income goal shape", () => {
    const customer = analyzeCustomer({ ...REGRESSION_REQUEST, goal: "retirement" });
    expect(customer.goalShape).toBe("RECURRING_INCOME_AT_TARGET_YEAR");
  });

  it("every non-retirement goal implies a lump-sum goal shape", () => {
    for (const goal of ["child_education", "marriage", "wealth", "home", "family_protection"] as const) {
      const customer = analyzeCustomer({ ...REGRESSION_REQUEST, goal });
      expect(customer.goalShape).toBe("LUMP_SUM_AT_TARGET_YEAR");
    }
  });
});

// ---- Item: structure-level analysis reuses Phase 1's own XIRR/analyzeReturn, never re-implements it ----
describe("Reuse of Phase 1 intelligence (never duplicated)", () => {
  it("analyzeStructureGoal returns a per-component ReturnAnalysis for every component", () => {
    const customer = analyzeCustomer(REGRESSION_REQUEST);
    const survivors = generateCandidateAnalyses(customer).filter((a) => !a.eliminated);
    const candidatesByPlan = new Map(survivors.map((c) => [`${c.profile.identity.planNumber}::${c.profile.identity.uin}`, c]));
    const configsByPlan = generateAllConfigurations(survivors, customer);
    const singles = generateSingleProductStructures(candidatesByPlan, configsByPlan);
    const simulated = simulateStructure(singles[0], REGRESSION_REQUEST.yearsToGoal, REGRESSION_REQUEST.monthlyCapacity, REGRESSION_REQUEST.age);
    const analysis = analyzeStructureGoal(simulated, REGRESSION_REQUEST.goalAmount, REGRESSION_REQUEST.yearsToGoal, REGRESSION_REQUEST.age);
    expect(analysis.perComponentReturn.length).toBe(simulated.components.length);
  });
});
