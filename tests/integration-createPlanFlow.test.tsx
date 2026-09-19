// @vitest-environment jsdom
//
// Tasks 7/8 — proves "📋 Create Customer Plan" is reachable from the
// real StrategyDetails screen and produces a real, frozen CustomerPlan
// that CustomerPlanPreview then renders using the REAL ProposalActions
// (Download PDF / Share Plan / WhatsApp Summary / Save Draft) — never a
// second, fake action bar, and never the old "coming next" placeholder.

import { describe, it, expect, afterEach } from "vitest";
import { StrategyDetails } from "@/components/planner/results/StrategyDetails";
import { CustomerPlanPreview } from "@/components/customerPlan/CustomerPlanPreview";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { runTask12Pipeline } from "./helpers/task12Fixture";
import { renderComponent, clickText, findByText, RenderedComponent } from "./helpers/renderReact";

let rendered: RenderedComponent | null = null;

afterEach(() => {
  rendered?.unmount();
  rendered = null;
});

describe("Create Customer Plan — reachable from the real strategy detail screen", () => {
  it("clicking Create Customer Plan on StrategyDetails produces a frozen CustomerPlan matching the selected strategy", () => {
    const { profile, protectionNeed, goalNeed, selectedStrategy } = runTask12Pipeline();
    let createdPlan: CustomerPlan | null = null;

    rendered = renderComponent(
      <StrategyDetails
        strategy={selectedStrategy}
        protectionNeed={protectionNeed}
        goalNeed={goalNeed}
        profile={profile}
        locale="en"
        onBack={() => {}}
        onCreatePlan={(plan) => (createdPlan = plan)}
      />
    );

    expect(findByText(rendered.container, "Create Customer Plan")).not.toBeNull();
    clickText(rendered.container, "Create Customer Plan");

    expect(createdPlan).not.toBeNull();
    expect(createdPlan!.selectedStrategy.strategyId).toBe(selectedStrategy.id);
    expect(createdPlan!.selectedStrategy.components[0].product?.planNumber).toBe("894");
    // Never a "recommended"/"best"/"winner" strategy anywhere in the UI.
    expect(rendered.container.textContent?.toLowerCase()).not.toContain("recommended");
    expect(rendered.container.textContent?.toLowerCase()).not.toContain("best plan");
  });

  it("the created plan renders in CustomerPlanPreview with the REAL ProposalActions, never a placeholder", () => {
    const { profile, protectionNeed, goalNeed, selectedStrategy } = runTask12Pipeline();
    let createdPlan: CustomerPlan | null = null;

    rendered = renderComponent(
      <StrategyDetails
        strategy={selectedStrategy}
        protectionNeed={protectionNeed}
        goalNeed={goalNeed}
        profile={profile}
        locale="en"
        onBack={() => {}}
        onCreatePlan={(plan) => (createdPlan = plan)}
      />
    );
    clickText(rendered.container, "Create Customer Plan");
    rendered.unmount();

    rendered = renderComponent(
      <CustomerPlanPreview plan={createdPlan!} locale="en" onBack={() => {}} onPlanChange={() => {}} onViewDrafts={() => {}} />
    );

    // The real proposal actions are present...
    expect(findByText(rendered.container, "Download PDF")).not.toBeNull();
    expect(findByText(rendered.container, "WhatsApp Summary")).not.toBeNull();
    expect(findByText(rendered.container, "Save Draft Locally")).not.toBeNull();
    // ...and the obsolete placeholder text is gone for good.
    expect(rendered.container.textContent).not.toContain("coming next");
    expect(rendered.container.textContent).not.toContain("not available in this preview");
    // Full product identity is visible, not hidden behind a summary.
    expect(rendered.container.textContent).toContain("894");
    expect(rendered.container.textContent).toContain("512N368V01");
  });

  it("an unavailable premium is shown as 'Requires verification', never as ₹0", () => {
    const { profile, protectionNeed, goalNeed, selectedStrategy } = runTask12Pipeline();
    // Plan 894's term premium is genuinely unavailable for this fixture
    // (age 32 isn't in the plan's own published sample rows) — the real
    // bug this whole audit started from.
    expect(selectedStrategy.components[0].monthlyPremium.status).toBe("unavailable");

    rendered = renderComponent(
      <StrategyDetails
        strategy={selectedStrategy}
        protectionNeed={protectionNeed}
        goalNeed={goalNeed}
        profile={profile}
        locale="en"
        onBack={() => {}}
        onCreatePlan={() => {}}
      />
    );

    // The "Premium status" row specifically must read "—" (unknown),
    // never "₹0" — a genuinely CALCULATED zero elsewhere on this same
    // screen (e.g. a fully-closed protection gap) is legitimate and
    // must not be confused with an unavailable value being coerced to
    // zero, which is exactly what this assertion targets.
    const premiumLabel = findByText(rendered.container, "Premium status");
    expect(premiumLabel).not.toBeNull();
    const premiumRow = premiumLabel!.parentElement!;
    expect(premiumRow.textContent).not.toContain("₹0");
    expect(premiumRow.textContent).toContain("Requires verification");
  });
});
