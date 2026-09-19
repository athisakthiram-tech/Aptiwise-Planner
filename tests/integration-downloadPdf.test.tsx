// @vitest-environment jsdom
//
// Task 9 — proves the VISIBLE, PRODUCTION "Download PDF" button (not
// just the underlying print-helper functions) actually reaches
// window.print(). This is exactly the class of bug this whole audit is
// about: a correctly unit-tested helper that was never wired to a real
// button.

import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { ProposalActions } from "@/components/customerPlan/export/ProposalActions";
import { buildTask12Plan } from "./helpers/task12Fixture";
import { renderComponent, clickText, findByText, RenderedComponent } from "./helpers/renderReact";

let rendered: RenderedComponent | null = null;

afterEach(() => {
  rendered?.unmount();
  rendered = null;
  vi.restoreAllMocks();
});

describe("Download PDF — real button reaches the real print flow", () => {
  it("clicking the visible 'Download PDF' button calls window.print()", () => {
    const plan = buildTask12Plan("en", { name: "Ananya" });
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    rendered = renderComponent(<ProposalActions plan={plan} />);
    expect(findByText(rendered.container, "Download PDF")).not.toBeNull();

    clickText(rendered.container, "Download PDF");

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("sets document.title to the sanitized proposal filename before printing", () => {
    const plan = buildTask12Plan("en", { name: "Ananya" });
    vi.spyOn(window, "print").mockImplementation(() => {});
    document.title = "Aptiwise Planner";

    rendered = renderComponent(<ProposalActions plan={plan} />);
    clickText(rendered.container, "Download PDF");

    expect(document.title).toContain("Ananya");
    expect(document.title).not.toBe("Aptiwise Planner");
  });

  it("a second immediate click does not open a second print dialog (no double-generation)", () => {
    const plan = buildTask12Plan("en");
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    rendered = renderComponent(<ProposalActions plan={plan} />);
    const button = rendered.container.querySelector("button")!;
    act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    // The button now reads "Preparing…" and is disabled — clicking the
    // same DOM node again (as a real double-click would) must still not
    // invoke window.print a second time.
    act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("shows a failure message instead of crashing when window.print is unavailable", () => {
    const plan = buildTask12Plan("en");
    const originalPrint = window.print;
    // @ts-expect-error simulating an environment without print support
    delete window.print;

    rendered = renderComponent(<ProposalActions plan={plan} />);
    expect(() => clickText(rendered!.container, "Download PDF")).not.toThrow();
    expect(rendered.container.textContent?.toLowerCase()).toContain("try again");

    window.print = originalPrint;
  });

  it("the hidden print-only ProposalDocument for this plan shows the full Plan Number and UIN", () => {
    const plan = buildTask12Plan("en");
    vi.spyOn(window, "print").mockImplementation(() => {});
    rendered = renderComponent(<ProposalActions plan={plan} />);

    expect(rendered.container.textContent).toContain("894");
    expect(rendered.container.textContent).toContain("512N368V01");
  });
});
