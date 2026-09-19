// @vitest-environment jsdom
//
// Task 1/14 — walks the REAL Wizard component (not a mocked stand-in)
// from step 1 through to the final step by clicking the same "Continue"
// button a real user would, and proves:
//   - the wizard now has 12 steps, not 13
//   - the obsolete Step8Final screen (old "Your Financial Plan" card,
//     the hardcoded strategy allocation, and the "coming next" share/
//     download/save placeholders) is gone from the runtime tree
//   - the final step is the real, engine-backed PlannerResults journey

import { describe, it, expect, afterEach } from "vitest";
import { Wizard, TOTAL_STEPS } from "@/components/planner/Wizard";
import { renderComponent, findByText, RenderedComponent } from "./helpers/renderReact";
import { act } from "react";

let rendered: RenderedComponent | null = null;

afterEach(() => {
  rendered?.unmount();
  rendered = null;
});

function clickContinue(container: HTMLElement) {
  const button = findByText(container, "Continue");
  if (!button) throw new Error("Continue button not found");
  act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("Wizard — real runtime journey ends on the real PlannerResults, not the old placeholder screen", () => {
  it("the wizard now has 12 steps", () => {
    expect(TOTAL_STEPS).toBe(12);
  });

  it("clicking Continue all the way through never shows the obsolete 'coming next' placeholder text", () => {
    rendered = renderComponent(<Wizard />);

    for (let i = 0; i < TOTAL_STEPS - 1; i++) {
      expect(rendered.container.textContent).not.toContain("coming next");
      expect(rendered.container.textContent).not.toContain("not available in this preview");
      clickContinue(rendered.container);
    }

    // Now on the final step.
    expect(rendered.container.textContent).not.toContain("coming next");
    expect(rendered.container.textContent).not.toContain("not available in this preview");
    expect(rendered.container.textContent).not.toContain("Investment Allocation");
    expect(rendered.container.textContent).not.toContain("Selected Strategy");
  });

  it("the final step is the real PlannerResults journey (Financial Picture + Explore Planning Structures)", () => {
    rendered = renderComponent(<Wizard />);
    for (let i = 0; i < TOTAL_STEPS - 1; i++) {
      clickContinue(rendered.container);
    }

    expect(findByText(rendered.container, "Explore Planning Structures")).not.toBeNull();
    // The old legacy final screen's protection line pulled straight
    // from goal.existingLifeCover — the real journey instead shows the
    // calculated Family Protection card.
    expect(findByText(rendered.container, "Your Family Protection")).not.toBeNull();
    // Draft Plans is only ever offered from the real, wired journey.
    expect(findByText(rendered.container, "Draft Plans")).not.toBeNull();
  });

  it("the progress indicator reflects exactly 12 steps, never 13", () => {
    rendered = renderComponent(<Wizard />);
    expect(rendered.container.textContent).toContain(`of ${TOTAL_STEPS}`);
    expect(rendered.container.textContent).not.toContain("of 13");
  });
});
