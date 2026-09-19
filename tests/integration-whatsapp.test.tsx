// @vitest-environment jsdom
//
// Task 11 — proves the real, visible "WhatsApp Summary" button builds
// its share text from the frozen CustomerPlan and opens WhatsApp
// without ever auto-sending or requiring a phone number.

import { describe, it, expect, vi, afterEach } from "vitest";
import { WhatsAppSummary } from "@/components/customerPlan/export/WhatsAppSummary";
import { buildTask12Plan } from "./helpers/task12Fixture";
import { renderComponent, clickText, RenderedComponent } from "./helpers/renderReact";

let rendered: RenderedComponent | null = null;

afterEach(() => {
  rendered?.unmount();
  rendered = null;
  vi.restoreAllMocks();
});

describe("WhatsApp Summary — real button, frozen plan, no auto-send", () => {
  it("clicking the button opens a wa.me link built from the frozen plan, without a phone number", () => {
    const plan = buildTask12Plan("en", { name: "Ananya" }); // no phone
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

    rendered = renderComponent(<WhatsAppSummary plan={plan} />);
    clickText(rendered.container, "WhatsApp Summary");

    expect(openSpy).toHaveBeenCalledTimes(1);
    const url = openSpy.mock.calls[0][0] as string;
    expect(url.startsWith("https://wa.me/")).toBe(true);
    // No phone was set — the contact picker opens (no phone segment in the path).
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
  });

  it("pre-fills the recipient when the plan does have a phone number, but still never sends automatically", () => {
    const plan = buildTask12Plan("en", { name: "Ananya", phone: "+91 98765 43210" });
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

    rendered = renderComponent(<WhatsAppSummary plan={plan} />);
    clickText(rendered.container, "WhatsApp Summary");

    const url = openSpy.mock.calls[0][0] as string;
    expect(url).toContain("https://wa.me/919876543210");
    // window.open only ever opens WhatsApp for the advisor to review and
    // tap Send themselves — this component makes no network request of
    // its own.
  });

  it("the shared text preserves the full Plan Number and UIN, never abbreviated", () => {
    const plan = buildTask12Plan("en");
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

    rendered = renderComponent(<WhatsAppSummary plan={plan} />);
    clickText(rendered.container, "WhatsApp Summary");

    const url = decodeURIComponent(openSpy.mock.calls[0][0] as string);
    expect(url).toContain("894");
    expect(url).toContain("512N368V01");
    expect(url).not.toContain("512N...");
  });

  it("the shared text preserves the illustrative-investment disclaimer", () => {
    const plan = buildTask12Plan("en");
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

    rendered = renderComponent(<WhatsAppSummary plan={plan} />);
    clickText(rendered.container, "WhatsApp Summary");

    const url = decodeURIComponent(openSpy.mock.calls[0][0] as string);
    expect(url.toLowerCase()).toContain("illustration");
    expect(url.toLowerCase()).toContain("not guaranteed");
  });

  it("never makes a network request itself (window.fetch is never called)", () => {
    const plan = buildTask12Plan("en");
    vi.spyOn(window, "open").mockReturnValue({} as Window);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

    rendered = renderComponent(<WhatsAppSummary plan={plan} />);
    clickText(rendered.container, "WhatsApp Summary");

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
