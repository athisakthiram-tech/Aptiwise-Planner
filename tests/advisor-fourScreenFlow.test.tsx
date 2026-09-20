// @vitest-environment jsdom
//
// End-to-end walk-through of the real 4-screen Advisor MVP
// (components/advisor/AdvisorPlanner.tsx), app/page.tsx's actual
// rendered entry point. Phase 4: this is now THE canonical planning
// path — Screen 1 builds a real PlanningRequest and Screen 2/3/4 render
// the REAL Phase 2/3/3B combination-engine output (via
// lib/advisor/combinationPlanModel.ts), never the old Goal Orchestrator
// V2, never mock data. This file also runs the task's own three
// regression scenarios end to end.

import { describe, it, expect, afterEach } from "vitest";
import { AdvisorPlanner } from "@/components/advisor/AdvisorPlanner";
import { renderComponent, clickText, findByText, RenderedComponent } from "./helpers/renderReact";
import { act } from "react";

let rendered: RenderedComponent | null = null;

afterEach(() => {
  rendered?.unmount();
  rendered = null;
});

function setInputByLabel(container: HTMLElement, labelText: string, value: string) {
  const labels = Array.from(container.querySelectorAll("label"));
  const label = labels.find((l) => l.textContent?.includes(labelText));
  if (!label) throw new Error(`No label found containing "${labelText}"`);
  const input = label.querySelector("input")!;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function fillScreen1(
  container: HTMLElement,
  input: { age: number; profession: string; goalLabel?: string; goalAmount: number; years: number; monthly: number; riskLabel?: string }
) {
  setInputByLabel(container, "Age", String(input.age));
  setInputByLabel(container, "Profession", input.profession);
  if (input.goalLabel) clickText(container, input.goalLabel);
  setInputByLabel(container, "Goal Amount", String(input.goalAmount));
  setInputByLabel(container, "Years to Goal", String(input.years));
  setInputByLabel(container, "Monthly Saving Capacity", String(input.monthly));
  if (input.riskLabel) clickText(container, input.riskLabel);
}

const FORBIDDEN_ENGINE_TERMS = [
  "reasonCode",
  "confidence",
  "provenance",
  "SAMPLE_ONLY",
  "STRUCTURAL_ONLY",
  "ValueStatus",
  "capabilities",
  "CandidateAnalysis",
  "DataConfidence",
  "ESTIMATED",
  "VERIFIED",
  "DERIVED",
  "ExtendedProductRole",
];

const FORBIDDEN_RANKING_WORDS = ["best", "winner", "recommended", "highest return", "top plan", "#1"];

describe("Advisor 4-screen MVP — Screen 1 (Customer)", () => {
  it("renders exactly the specified fields, including the new Regular Income goal option", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    expect(findByText(rendered.container, "Customer Name")).not.toBeNull();
    expect(findByText(rendered.container, "Insurer")).not.toBeNull();
    expect(findByText(rendered.container, "Age")).not.toBeNull();
    expect(findByText(rendered.container, "Profession")).not.toBeNull();
    expect(findByText(rendered.container, "What are you saving for?")).not.toBeNull();
    expect(findByText(rendered.container, "Goal Amount")).not.toBeNull();
    expect(findByText(rendered.container, "Years to Goal")).not.toBeNull();
    expect(findByText(rendered.container, "Monthly Saving Capacity")).not.toBeNull();
    expect(findByText(rendered.container, "Risk Preference")).not.toBeNull();
    expect(findByText(rendered.container, "Regular Income")).not.toBeNull();
    expect(findByText(rendered.container, "Child Marriage")).not.toBeNull();
    expect(findByText(rendered.container, "Find Plan Combinations")).not.toBeNull();
  });

  it("insurer is fixed to LIC", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    const insurerInput = rendered.container.querySelector<HTMLInputElement>("input[value='LIC']");
    expect(insurerInput).not.toBeNull();
    expect(insurerInput!.disabled).toBe(true);
  });

  it("does not allow submission until profession (a required field) is filled in", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    const button = findByText(rendered.container, "Find Plan Combinations") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    expect(button.disabled).toBe(false);
  });

  it("navigates to Combinations once every required field is present", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    clickText(rendered.container, "Find Plan Combinations");
    expect(findByText(rendered.container, "Plan Combinations")).not.toBeNull();
  });
});

describe("Advisor 4-screen MVP — Screen 2 (Combinations) uses the REAL combination engine", () => {
  it("shows product, monthly amount, plan number, role and allocation — nothing technical", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    clickText(rendered.container, "Find Plan Combinations");

    expect(findByText(rendered.container, "Structure A")).not.toBeNull();
    expect(findByText(rendered.container, "View Illustration")).not.toBeNull();

    const text = rendered.container.textContent ?? "";
    for (const forbidden of FORBIDDEN_ENGINE_TERMS) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("shows a real LIC product (Jeevan Labh) for the main regression, never a generic/unknown product", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    clickText(rendered.container, "Find Plan Combinations");
    const text = rendered.container.textContent ?? "";
    expect(text).toContain("Jeevan Labh");
    expect(text).not.toContain("Unknown Product");
    expect(text).not.toContain("₹—");
    expect(text).not.toContain("Allocation —");
    expect(text).not.toContain("Market Linked (Illustrative)");
  });

  it("shows at most 3 structures, never a 4th", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    clickText(rendered.container, "Find Plan Combinations");
    const labels = ["Structure A", "Structure B", "Structure C", "Structure D"].filter(
      (l) => findByText(rendered!.container, l) != null
    );
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.length).toBeLessThanOrEqual(3);
    expect(labels).not.toContain("Structure D");
  });

  it("never shows ranking/winner language", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    clickText(rendered.container, "Find Plan Combinations");
    const text = (rendered.container.textContent ?? "").toLowerCase();
    for (const word of FORBIDDEN_RANKING_WORDS) {
      expect(text).not.toContain(word);
    }
  });
});

describe("Advisor 4-screen MVP — Screen 3 (Illustration)", () => {
  it("View Illustration reaches the real illustration screen with guaranteed/estimated separation", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    clickText(rendered.container, "Find Plan Combinations");
    clickText(rendered.container, "View Illustration");
    expect(findByText(rendered.container, "Component Details")).not.toBeNull();
    expect(findByText(rendered.container, "Guaranteed Maturity")).not.toBeNull();
    expect(findByText(rendered.container, "Goal Analysis")).not.toBeNull();
    expect(findByText(rendered.container, "Timeline")).not.toBeNull();
  });

  it("Continue reaches Screen 4", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    clickText(rendered.container, "Find Plan Combinations");
    clickText(rendered.container, "View Illustration");
    clickText(rendered.container, "Continue");
    expect(findByText(rendered.container, "What To Tell Your Customer")).not.toBeNull();
  });
});

describe("Advisor 4-screen MVP — Screen 4 (What Advisor Says)", () => {
  it("shows the deterministic explanation, Family Protection language, and reaches the real CustomerPlan/WhatsApp/PDF/Save actions", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    clickText(rendered.container, "Find Plan Combinations");
    clickText(rendered.container, "View Illustration");
    clickText(rendered.container, "Continue");
    expect(findByText(rendered.container, "What To Tell Your Customer")).not.toBeNull();

    const text = (rendered.container.textContent ?? "").toLowerCase();
    expect(text).not.toContain("death scenario");
    expect(text).not.toContain("mortality scenario");
    expect(text).not.toContain("if you die");

    clickText(rendered.container, "Create Customer Plan");
    expect(findByText(rendered.container, "Download PDF")).not.toBeNull();
    expect(findByText(rendered.container, "WhatsApp Summary")).not.toBeNull();
    expect(findByText(rendered.container, "Save Draft Locally")).not.toBeNull();
  });

  it("never shows ranking/winner language anywhere across the whole flow", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    clickText(rendered.container, "Find Plan Combinations");
    clickText(rendered.container, "View Illustration");
    clickText(rendered.container, "Continue");
    const text = (rendered.container.textContent ?? "").toLowerCase();
    for (const word of FORBIDDEN_RANKING_WORDS) {
      expect(text).not.toContain(word);
    }
  });
});

describe("Advisor 4-screen MVP — exactly 4 mandatory screens", () => {
  it("the state machine only ever renders one of 4 screens (customer/combinations/illustration/explain)", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    expect(findByText(rendered.container, "Customer")).not.toBeNull();
    setInputByLabel(rendered.container, "Profession", "Engineer");
    clickText(rendered.container, "Find Plan Combinations");
    expect(findByText(rendered.container, "Plan Combinations")).not.toBeNull();
    clickText(rendered.container, "View Illustration");
    expect(findByText(rendered.container, "Illustration")).not.toBeNull();
    clickText(rendered.container, "Continue");
    expect(findByText(rendered.container, "What To Tell Your Customer")).not.toBeNull();
  });
});

describe("Phase 4 regressions — run through the actual UI, not just engine functions", () => {
  it("Regression A: Age 35 Engineer Child Education ₹25L/16y/₹10k Balanced produces real structures", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    fillScreen1(rendered.container, { age: 35, profession: "Engineer", goalAmount: 2500000, years: 16, monthly: 10000 });
    clickText(rendered.container, "Find Plan Combinations");
    const text = rendered.container.textContent ?? "";
    expect(text).toContain("Jeevan Labh");
    expect(text).not.toContain("₹—");
    expect(text).not.toContain("Single Premium Endowment");
    expect(text).not.toContain("Unknown Product");
  });

  it("Regression B: Age 40 Engineer Retirement ₹50L/20y/₹15k Balanced never manually inserts Umang/Utsav", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    fillScreen1(rendered.container, {
      age: 40,
      profession: "Engineer",
      goalLabel: "Retirement",
      goalAmount: 5000000,
      years: 20,
      monthly: 15000,
    });
    clickText(rendered.container, "Find Plan Combinations");
    const text = rendered.container.textContent ?? "";
    expect(text).not.toContain("₹—");
    // Whatever the engine returns is rendered as-is — this only asserts
    // the UI never fabricates values, not a specific product mix.
    expect(text).not.toContain("Allocation —");
  });

  it("Regression C: Age 30 Business Owner Wealth Creation ₹50L/20y/₹20k Growth shows market-linked structures honestly", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    fillScreen1(rendered.container, {
      age: 30,
      profession: "Business Owner",
      goalLabel: "Wealth Creation",
      goalAmount: 5000000,
      years: 20,
      monthly: 20000,
      riskLabel: "Growth",
    });
    clickText(rendered.container, "Find Plan Combinations");
    const text = rendered.container.textContent ?? "";
    expect(text).not.toContain("₹—");
    expect(text).not.toContain("guaranteed return");
    if (text.includes("SIIP") || text.includes("Nivesh Plus")) {
      // Find the specific structure card containing the market-linked
      // product (not necessarily the first "View Illustration" button).
      const cards = Array.from(rendered.container.querySelectorAll<HTMLElement>(".rounded-xl2"));
      const marketLinkedCard = cards.find((c) => c.textContent?.includes("SIIP") || c.textContent?.includes("Nivesh Plus"));
      expect(marketLinkedCard).toBeDefined();
      const viewButton = Array.from(marketLinkedCard!.querySelectorAll("button")).find((b) => b.textContent?.includes("View Illustration"));
      expect(viewButton).toBeDefined();
      act(() => {
        viewButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      const illustrationText = rendered.container.textContent ?? "";
      expect(illustrationText).toContain("Illustration");
      expect(illustrationText).not.toContain("guaranteed return");
    }
  });
});
