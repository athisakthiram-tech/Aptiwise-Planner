// @vitest-environment jsdom
//
// Task 10 — proves the real, visible "💾 Save Draft Locally" button
// persists a plan via the actual storage abstraction, that the saved
// draft actually shows up in the real DraftPlans list component, and
// that opening it hands back the frozen values unchanged — end to end
// through real DOM components, not just the storage unit tests already
// covering customerPlanStorage.ts in isolation.

import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { SaveDraftAction } from "@/components/customerPlan/SaveDraftAction";
import { DraftPlans } from "@/components/customerPlan/DraftPlans";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { buildTask12Plan } from "./helpers/task12Fixture";
import { renderComponent, clickText, findByText, RenderedComponent } from "./helpers/renderReact";

let rendered: RenderedComponent | null = null;

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  rendered?.unmount();
  rendered = null;
  window.localStorage.clear();
});

describe("Save Draft — real button persists through the real storage abstraction", () => {
  it("clicking Save Draft Locally shows the on-this-device confirmation", () => {
    const plan = buildTask12Plan("en", { name: "Ananya" });
    rendered = renderComponent(<SaveDraftAction plan={plan} locale="en" />);

    clickText(rendered.container, "Save Draft Locally");

    expect(findByText(rendered.container, "Draft saved on this device.")).not.toBeNull();
  });

  it("the saved draft actually appears in the real DraftPlans list, with the frozen customer name and goal", () => {
    const plan = buildTask12Plan("en", { name: "Ananya" });
    rendered = renderComponent(<SaveDraftAction plan={plan} locale="en" />);
    clickText(rendered.container, "Save Draft Locally");
    rendered.unmount();

    rendered = renderComponent(<DraftPlans locale="en" onBack={() => {}} onOpen={() => {}} />);
    expect(rendered.container.textContent).toContain("Ananya");
    expect(rendered.container.textContent).toContain("Child Education");
    expect(rendered.container.textContent).toContain("Protection + Investment");
  });

  it("opening the saved draft returns a plan whose frozen financial figures are byte-identical to what was saved", () => {
    const plan = buildTask12Plan("en", { name: "Ananya" });
    rendered = renderComponent(<SaveDraftAction plan={plan} locale="en" />);
    clickText(rendered.container, "Save Draft Locally");
    rendered.unmount();

    let opened: CustomerPlan | null = null;
    rendered = renderComponent(
      <DraftPlans locale="en" onBack={() => {}} onOpen={(p) => (opened = p)} />
    );
    clickText(rendered.container, "Open");

    expect(opened).not.toBeNull();
    expect(opened!.id).toBe(plan.id);
    expect(opened!.selectedStrategy).toEqual(plan.selectedStrategy);
    expect(opened!.financialPicture).toEqual(plan.financialPicture);
    // Full identity, never abbreviated, still intact after a real
    // localStorage round-trip.
    expect(opened!.selectedStrategy.components[0].product?.planNumber).toBe("894");
    expect(opened!.selectedStrategy.components[0].product?.uin).toBe("512N368V01");
  });

  it("deleting a draft from the real DraftPlans list removes it from real storage", () => {
    const plan = buildTask12Plan("en", { name: "Ananya" });
    rendered = renderComponent(<SaveDraftAction plan={plan} locale="en" />);
    clickText(rendered.container, "Save Draft Locally");
    rendered.unmount();

    rendered = renderComponent(<DraftPlans locale="en" onBack={() => {}} onOpen={() => {}} />);
    expect(rendered.container.textContent).toContain("Ananya");
    clickText(rendered.container, "Delete");

    expect(rendered.container.textContent).not.toContain("Ananya");
  });
});
