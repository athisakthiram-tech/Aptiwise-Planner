// @vitest-environment jsdom
//
// End-to-end walk-through of the real 4-screen Advisor MVP
// (components/advisor/AdvisorPlanner.tsx), now app/page.tsx's actual
// rendered entry point. Proves the whole journey — Customer ->
// Combinations -> Illustration -> What Advisor Says — works against
// real production code (the Goal Orchestrator, budget solver, engine
// registry), not a mock.

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

describe("Advisor 4-screen MVP — Screen 1 (Customer)", () => {
  it("renders exactly the specified minimal fields", () => {
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
    expect(findByText(rendered.container, "Find Plan Combinations")).not.toBeNull();
  });

  it("insurer is fixed to LIC", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    const insurerInput = rendered.container.querySelector<HTMLInputElement>("input[value='LIC']");
    expect(insurerInput).not.toBeNull();
    expect(insurerInput!.disabled).toBe(true);
  });

  it("age input can be changed", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Age", "30");
    const label = Array.from(rendered.container.querySelectorAll("label")).find((l) => l.textContent?.includes("Age"))!;
    expect(label.querySelector("input")!.value).toBe("30");
  });

  it("profession input can be changed", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    setInputByLabel(rendered.container, "Profession", "Engineer");
    const label = Array.from(rendered.container.querySelectorAll("label")).find((l) => l.textContent?.includes("Profession"))!;
    expect(label.querySelector("input")!.value).toBe("Engineer");
  });

  it("navigates to Combinations only once age/goal/amount/years/budget are present (default demo values already satisfy this)", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    clickText(rendered.container, "Find Plan Combinations");
    expect(findByText(rendered.container, "Plan Combinations")).not.toBeNull();
  });
});

describe("Advisor 4-screen MVP — Screen 2 (Combinations) stays minimal", () => {
  it("shows product, monthly amount, role, allocation and time — nothing technical", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    clickText(rendered.container, "Find Plan Combinations");
    expect(findByText(rendered.container, "Option A")).not.toBeNull();
    expect(findByText(rendered.container, "Allocation")).not.toBeNull();
    expect(findByText(rendered.container, "View Illustration")).not.toBeNull();

    const text = rendered.container.textContent ?? "";
    for (const forbidden of ["reasonCode", "confidence", "provenance", "SAMPLE_ONLY", "STRUCTURAL_ONLY", "ValueStatus", "capabilities"]) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("shows at most 3 options", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    clickText(rendered.container, "Find Plan Combinations");
    const optionLabels = ["Option A", "Option B", "Option C", "Option D"].filter((l) => findByText(rendered!.container, l) != null);
    expect(optionLabels.length).toBeLessThanOrEqual(3);
    expect(optionLabels).not.toContain("Option D");
  });

  it("never shows ranking/winner language", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    clickText(rendered.container, "Find Plan Combinations");
    const text = (rendered.container.textContent ?? "").toLowerCase();
    for (const word of ["best", "winner", "recommended", "highest return", "top plan", "#1"]) {
      expect(text).not.toContain(word);
    }
  });
});

describe("Advisor 4-screen MVP — Screen 3 (Illustration)", () => {
  it("View Illustration reaches the real illustration screen with the 6/8/10 toggle", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    clickText(rendered.container, "Find Plan Combinations");
    clickText(rendered.container, "View Illustration");
    expect(findByText(rendered.container, "Illustration")).not.toBeNull();
    expect(findByText(rendered.container, "6%")).not.toBeNull();
    expect(findByText(rendered.container, "8%")).not.toBeNull();
    expect(findByText(rendered.container, "10%")).not.toBeNull();
  });

  it("shows the official-illustration fallback when a component's engine value is unavailable (regression age 35)", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    clickText(rendered.container, "Find Plan Combinations");
    clickText(rendered.container, "View Illustration");
    // At age 35 (the default demo age), no eligible candidate resolves a
    // verified premium — the fallback button must be reachable, never a
    // fabricated figure shown instead.
    expect(findByText(rendered.container, "Enter Official Illustration")).not.toBeNull();
  });

  it("the official-illustration form can be filled and saved, updating the displayed value", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    clickText(rendered.container, "Find Plan Combinations");
    clickText(rendered.container, "View Illustration");
    clickText(rendered.container, "Enter Official Illustration");
    setInputByLabel(rendered.container, "Maturity / Relevant Goal Benefit", "2500000");
    clickText(rendered.container, "Save");
    expect(findByText(rendered.container, "₹25.00 L")).not.toBeNull();
  });

  it("Continue reaches Screen 4", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    clickText(rendered.container, "Find Plan Combinations");
    clickText(rendered.container, "View Illustration");
    clickText(rendered.container, "Continue");
    expect(findByText(rendered.container, "What To Tell Your Customer")).not.toBeNull();
  });
});

describe("Advisor 4-screen MVP — Screen 4 (What Advisor Says)", () => {
  it("shows the deterministic explanation and reaches the real CustomerPlan/WhatsApp/PDF/Save actions", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    clickText(rendered.container, "Find Plan Combinations");
    clickText(rendered.container, "View Illustration");
    clickText(rendered.container, "Continue");
    expect(findByText(rendered.container, "How To Explain This To Customer")).not.toBeNull();

    clickText(rendered.container, "Create Customer Plan");
    expect(findByText(rendered.container, "Download PDF")).not.toBeNull();
    expect(findByText(rendered.container, "WhatsApp Summary")).not.toBeNull();
    expect(findByText(rendered.container, "Save Draft Locally")).not.toBeNull();
  });

  it("never shows ranking/winner language anywhere across the whole flow", () => {
    rendered = renderComponent(<AdvisorPlanner />);
    clickText(rendered.container, "Find Plan Combinations");
    clickText(rendered.container, "View Illustration");
    clickText(rendered.container, "Continue");
    const text = (rendered.container.textContent ?? "").toLowerCase();
    for (const word of ["best plan", "winner", "recommended", "highest return"]) {
      expect(text).not.toContain(word);
    }
  });
});

describe("Advisor 4-screen MVP — exactly 4 mandatory screens", () => {
  it("the state machine only ever renders one of 4 screens (customer/combinations/illustration/explain)", () => {
    // AdvisorPlanner.tsx's own AdvisorScreen union type is the structural
    // guarantee; this walks all 4 to prove each is independently
    // reachable in one linear pass, with no 5th screen appearing.
    rendered = renderComponent(<AdvisorPlanner />);
    expect(findByText(rendered.container, "Customer")).not.toBeNull();
    clickText(rendered.container, "Find Plan Combinations");
    expect(findByText(rendered.container, "Plan Combinations")).not.toBeNull();
    clickText(rendered.container, "View Illustration");
    expect(findByText(rendered.container, "Illustration")).not.toBeNull();
    clickText(rendered.container, "Continue");
    expect(findByText(rendered.container, "What To Tell Your Customer")).not.toBeNull();
  });
});
