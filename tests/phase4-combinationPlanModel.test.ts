// Phase 4 — unit tests for lib/advisor/combinationPlanModel.ts, the ONE
// adapter between the Phase 2/3/3B combination engine and Screens
// 2/3/4. These tests call the real engine (planCombinations under the
// hood via planAdvisorStructures) — never a mock — and assert the
// specific guarantees Phase 4 requires: max 3 structures, no broken
// cards, real LIC identities, allocation sums, locale-independent
// numbers, and no fabricated Umang/Utsav premium.

import { describe, it, expect } from "vitest";
import {
  AdvisorCustomerInputLike,
  buildPlanningRequest,
  buildStrategyResultForSnapshot,
  planAdvisorStructures,
} from "@/lib/advisor/combinationPlanModel";
import { t } from "@/lib/i18n/translations";
import { LOCALES } from "@/lib/i18n/types";

const REGRESSION_A: AdvisorCustomerInputLike = {
  age: 35,
  profession: "Engineer",
  goalOption: "child_education",
  targetGoalAmount: 2_500_000,
  yearsToGoal: 16,
  monthlyBudget: 10_000,
  riskComfort: "medium",
};

const REGRESSION_B: AdvisorCustomerInputLike = {
  age: 40,
  profession: "Engineer",
  goalOption: "retirement",
  targetGoalAmount: 5_000_000,
  yearsToGoal: 20,
  monthlyBudget: 15_000,
  riskComfort: "medium",
};

const REGRESSION_C: AdvisorCustomerInputLike = {
  age: 30,
  profession: "Business Owner",
  goalOption: "wealth",
  targetGoalAmount: 5_000_000,
  yearsToGoal: 20,
  monthlyBudget: 20_000,
  riskComfort: "high",
};

describe("buildPlanningRequest", () => {
  it("builds a real PlanningRequest from complete Screen 1 input", () => {
    const request = buildPlanningRequest(REGRESSION_A);
    expect(request).not.toBeNull();
    expect(request).toEqual({
      age: 35,
      profession: "Engineer",
      goal: "child_education",
      goalAmount: 2_500_000,
      yearsToGoal: 16,
      monthlyCapacity: 10_000,
      riskPreference: "balanced",
    });
  });

  it("returns null (never a fabricated request) when a required field is missing", () => {
    expect(buildPlanningRequest({ ...REGRESSION_A, age: null })).toBeNull();
    expect(buildPlanningRequest({ ...REGRESSION_A, targetGoalAmount: null })).toBeNull();
    expect(buildPlanningRequest({ ...REGRESSION_A, yearsToGoal: null })).toBeNull();
    expect(buildPlanningRequest({ ...REGRESSION_A, monthlyBudget: null })).toBeNull();
    expect(buildPlanningRequest({ ...REGRESSION_A, monthlyBudget: 0 })).toBeNull();
  });

  it("maps 'other' to wealth and 'regular_income' to retirement for candidate search only", () => {
    expect(buildPlanningRequest({ ...REGRESSION_A, goalOption: "other" })?.goal).toBe("wealth");
    expect(buildPlanningRequest({ ...REGRESSION_A, goalOption: "regular_income" })?.goal).toBe("retirement");
  });
});

describe("planAdvisorStructures — real engine, real regressions", () => {
  for (const [name, input] of [
    ["A", REGRESSION_A],
    ["B", REGRESSION_B],
    ["C", REGRESSION_C],
  ] as const) {
    it(`Regression ${name}: never returns more than 3 structures`, () => {
      const request = buildPlanningRequest(input)!;
      const views = planAdvisorStructures(request);
      expect(views.length).toBeLessThanOrEqual(3);
    });

    it(`Regression ${name}: every structure has a real LIC plan number/UIN for every component, never a fake product`, () => {
      const request = buildPlanningRequest(input)!;
      const views = planAdvisorStructures(request);
      for (const view of views) {
        expect(view.components.length).toBeGreaterThan(0);
        for (const component of view.components) {
          expect(component.planNumber).toMatch(/^\d+$/);
          expect(component.uin).toMatch(/^512/);
          expect(component.productName.length).toBeGreaterThan(0);
          expect(component.monthlyPremium).toBeGreaterThan(0);
        }
      }
    });

    it(`Regression ${name}: allocation amounts sum to the structure's monthly total and percentages sum to ~100`, () => {
      const request = buildPlanningRequest(input)!;
      const views = planAdvisorStructures(request);
      for (const view of views) {
        const sum = view.allocations.reduce((s, a) => s + a.amount, 0);
        expect(sum).toBe(view.monthlyTotal);
        if (view.allocations.length > 1) {
          const percentSum = view.allocations.reduce((s, a) => s + a.percent, 0);
          expect(percentSum).toBeGreaterThanOrEqual(98);
          expect(percentSum).toBeLessThanOrEqual(102);
        }
      }
    });

    it(`Regression ${name}: structure letters are assigned A/B/C in order, never skipping to a 4th`, () => {
      const request = buildPlanningRequest(input)!;
      const views = planAdvisorStructures(request);
      const expectedLetters = ["A", "B", "C"].slice(0, views.length);
      expect(views.map((v) => v.letter)).toEqual(expectedLetters);
    });

    it(`Regression ${name}: no characteristic label ever uses best/winner/recommended wording`, () => {
      const request = buildPlanningRequest(input)!;
      const views = planAdvisorStructures(request);
      for (const view of views) {
        if (view.characteristicI18nKey) {
          for (const locale of LOCALES.map((l) => l.code)) {
            const text = t(view.characteristicI18nKey, locale).toLowerCase();
            for (const word of ["best", "winner", "recommended", "#1", "top"]) {
              expect(text).not.toContain(word);
            }
          }
        }
      }
    });
  }

  it("Regression A: the goal-year guaranteed value at the component level matches the structure-level goal analysis (no silent disagreement)", () => {
    const request = buildPlanningRequest(REGRESSION_A)!;
    const views = planAdvisorStructures(request);
    const structureA = views.find((v) => v.letter === "A")!;
    expect(structureA).toBeDefined();
    const componentGuaranteedSum = structureA.components.reduce((s, c) => s + (c.guaranteedAtGoal ?? 0), 0);
    expect(componentGuaranteedSum).toBe(structureA.goalAnalysis.guaranteedAtGoal);
  });

  it("never fabricates a premium for Umang/Utsav — they simply don't appear if the engine can't price them", () => {
    // Sweep a range of inputs; Umang/Utsav are a documented known
    // limitation (eligible but never configurable) — if they ever DO
    // appear, they must carry a real premium, never a placeholder.
    const scenarios: AdvisorCustomerInputLike[] = [REGRESSION_A, REGRESSION_B, REGRESSION_C];
    for (const scenario of scenarios) {
      const request = buildPlanningRequest(scenario)!;
      const views = planAdvisorStructures(request);
      for (const view of views) {
        for (const component of view.components) {
          if (component.productName.includes("Umang") || component.productName.includes("Utsav")) {
            expect(component.monthlyPremium).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

describe("Locale independence — EN/TA/HI must never change calculated numbers", () => {
  for (const [name, input] of [
    ["A", REGRESSION_A],
    ["B", REGRESSION_B],
    ["C", REGRESSION_C],
  ] as const) {
    it(`Regression ${name}: planAdvisorStructures produces identical numeric output regardless of locale`, () => {
      // planAdvisorStructures itself takes no locale argument — this
      // test documents and locks in that guarantee structurally: the
      // same PlanningRequest always produces the same numeric view,
      // and only rendering (t()) is locale-dependent.
      const request = buildPlanningRequest(input)!;
      const first = planAdvisorStructures(request);
      const second = planAdvisorStructures(request);
      expect(JSON.stringify(first.map((v) => ({ ...v, raw: undefined })))).toBe(
        JSON.stringify(second.map((v) => ({ ...v, raw: undefined })))
      );
    });
  }
});

describe("buildStrategyResultForSnapshot", () => {
  it("adapts the selected structure into a StrategyResult usable by createCustomerPlan, preserving the same monthly total", () => {
    const request = buildPlanningRequest(REGRESSION_A)!;
    const views = planAdvisorStructures(request);
    const structureA = views[0];
    const strategy = buildStrategyResultForSnapshot(structureA.raw, request.monthlyCapacity);
    const componentPremiumSum = strategy.components.reduce((s, c) => s + (c.monthlyPremium.value ?? 0), 0);
    expect(componentPremiumSum).toBe(structureA.monthlyTotal);
    for (const component of strategy.components) {
      expect(component.product).not.toBeNull();
    }
  });
});
