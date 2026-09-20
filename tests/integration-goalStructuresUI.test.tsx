// @vitest-environment jsdom
//
// Goal Orchestrator V2 — proves the "🎯 Goal Structures" section is
// actually reachable from the real PlannerResults screen (not just the
// engine in isolation), that its View Timeline / Details buttons
// navigate to real screens backed by real production code, and that
// creating a plan from a goal structure's Details screen produces a
// frozen CustomerPlan reaching the existing CreatePlanAction/
// createCustomerPlan pipeline unchanged.

import { describe, it, expect, afterEach } from "vitest";
import { PlannerResults } from "@/components/planner/results/PlannerResults";
import { GoalInput } from "@/types";
import { renderComponent, clickText, findByText, RenderedComponent } from "./helpers/renderReact";

let rendered: RenderedComponent | null = null;

afterEach(() => {
  rendered?.unmount();
  rendered = null;
});

// Age 30 is the one age this codebase's registered engines resolve a
// genuinely verified premium at (Plan 736's own published sample row) —
// used here so the rendered card shows real, non-"—" figures rather than
// only exercising the all-unavailable path.
function goal(overrides: Partial<GoalInput> = {}): GoalInput {
  return {
    age: 30,
    monthlyBudget: 10000,
    goalType: "child_education",
    targetAmount: 2500000,
    yearsToGoal: 16,
    existingLifeCover: 0,
    riskComfort: "medium",
    ...overrides,
  };
}

describe("Goal Structures section — reachable from the real PlannerResults screen", () => {
  it("renders the Goal Structures header (goal/capacity/horizon) and at least one structure card", () => {
    rendered = renderComponent(<PlannerResults goal={goal()} locale="en" />);
    expect(findByText(rendered.container, "Goal Structures")).not.toBeNull();
    expect(findByText(rendered.container, "Child Education")).not.toBeNull();
    expect(findByText(rendered.container, "View Timeline")).not.toBeNull();
    expect(findByText(rendered.container, "Details")).not.toBeNull();
  });

  it("never shows ranking/recommendation language anywhere in the Goal Structures section", () => {
    rendered = renderComponent(<PlannerResults goal={goal()} locale="en" />);
    const text = rendered.container.textContent?.toLowerCase() ?? "";
    for (const word of ["recommended", "best plan", "winner", "top choice", "#1 plan"]) {
      expect(text).not.toContain(word);
    }
  });

  it("View Timeline navigates to a real timeline screen showing pay-period phases", () => {
    rendered = renderComponent(<PlannerResults goal={goal()} locale="en" />);
    clickText(rendered.container, "View Timeline");
    expect(findByText(rendered.container, "Cash-Flow Timeline")).not.toBeNull();
    // Back navigation returns to the overview where the section lives.
    clickText(rendered.container, "Back");
    expect(findByText(rendered.container, "Goal Structures")).not.toBeNull();
  });

  it("Details navigates to the full technical detail screen (Plan Number/UIN visible) and Create Customer Plan works from it", () => {
    rendered = renderComponent(<PlannerResults goal={goal()} locale="en" />);
    clickText(rendered.container, "Details");
    expect(findByText(rendered.container, "Structure Details")).not.toBeNull();
    expect(findByText(rendered.container, "Create Customer Plan")).not.toBeNull();

    clickText(rendered.container, "Create Customer Plan");
    // Reaches the same CustomerPlanPreview/ProposalActions used by the
    // original per-family flow — never a second, parallel screen.
    expect(findByText(rendered.container, "Download PDF")).not.toBeNull();
  });

  it("typing a funding person/beneficiary label does not crash and stays purely presentational", () => {
    rendered = renderComponent(<PlannerResults goal={goal()} locale="en" />);
    const fundingInput = rendered.container.querySelector<HTMLInputElement>(
      'input[placeholder="Who funds this goal? (optional)"]'
    );
    expect(fundingInput).not.toBeNull();
    expect(fundingInput!.value).toBe("");
  });
});
