// @vitest-environment jsdom
//
// Task 5 — proves the real "🔧 Configure structure" control on
// StrategyDetails actually reaches the real registered engine (never a
// second calculation implementation) and turns a genuinely-verifiable
// premium from "Requires verification" into a real, engine-computed
// verified value once the advisor enters that product's own published
// configuration — and that an arbitrary, non-matching configuration
// honestly stays "Requires verification" rather than fabricating a
// number.

import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { StrategyDetails } from "@/components/planner/results/StrategyDetails";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateStrategies } from "@/lib/planning/strategyGenerator";
import { renderComponent, clickText, findByText, RenderedComponent } from "./helpers/renderReact";

let rendered: RenderedComponent | null = null;

afterEach(() => {
  rendered?.unmount();
  rendered = null;
});

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

function setInputValue(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    nativeSetter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

// ProductConfigurationPanel's fields are <label>text<input/></label> —
// the label IS the input's own container, so find the label by its
// text and read the input straight off it (not off some bubbled-up
// ancestor div, which every field's label text would also match).
function inputForLabel(container: HTMLElement, labelText: string): HTMLInputElement {
  const label = Array.from(container.querySelectorAll("label")).find((l) => l.textContent?.includes(labelText));
  if (!label) throw new Error(`No label found containing "${labelText}"`);
  return label.querySelector("input")!;
}

describe("Product configuration panel — real engine, no fabricated values", () => {
  // Plan 894's own published Sample Illustrative Premium: age 30, BSA
  // 5,00,000, policy term 20 years -> Rs.2,730/year (see plan894.ts).
  it("age 30's protection_investment/Plan 894 strategy starts with the term premium unavailable", () => {
    const p = profile({ age: 30, monthlyBudget: 15000, yearsToGoal: 20, existingLifeCover: 0, outstandingLiabilities: 1000000 });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: null, currentResources: null });
    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const strategy = strategies.find((s) => s.family === "protection_investment" && s.components[0].product?.planNumber === "894")!;

    rendered = renderComponent(
      <StrategyDetails strategy={strategy} protectionNeed={protectionNeed} goalNeed={goalNeed} profile={p} locale="en" onBack={() => {}} onCreatePlan={() => {}} />
    );
    const premiumRow = findByText(rendered.container, "Premium status")!.parentElement!;
    expect(premiumRow.textContent).toContain("Requires verification");
  });

  it("entering the product's own published Basic Sum Assured/Policy Term turns the premium genuinely verified in the live UI", () => {
    const p = profile({ age: 30, monthlyBudget: 15000, yearsToGoal: 20, existingLifeCover: 0, outstandingLiabilities: 1000000 });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: null, currentResources: null });
    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const strategy = strategies.find((s) => s.family === "protection_investment" && s.components[0].product?.planNumber === "894")!;

    rendered = renderComponent(
      <StrategyDetails strategy={strategy} protectionNeed={protectionNeed} goalNeed={goalNeed} profile={p} locale="en" onBack={() => {}} onCreatePlan={() => {}} />
    );

    clickText(rendered.container, "Configure structure");
    const bsaInput = inputForLabel(rendered.container, "Basic Sum Assured");
    const termInput = inputForLabel(rendered.container, "Policy Term (years)");
    setInputValue(bsaInput, "500000");
    setInputValue(termInput, "20");
    clickText(rendered.container, "Apply");

    const premiumRow = findByText(rendered.container, "Premium status")!.parentElement!;
    expect(premiumRow.textContent).toContain("Verified");
    expect(premiumRow.textContent).not.toContain("Requires verification");
    // Rs.2,730 annual / 12, rounded — the plan's own published row.
    expect(premiumRow.textContent).toContain(Math.round(2730 / 12).toString());
  });

  it("an arbitrary Basic Sum Assured that doesn't match any published row honestly stays unavailable — never fabricated", () => {
    const p = profile({ age: 30, monthlyBudget: 15000, yearsToGoal: 20, existingLifeCover: 0, outstandingLiabilities: 1000000 });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: null, currentResources: null });
    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const strategy = strategies.find((s) => s.family === "protection_investment" && s.components[0].product?.planNumber === "894")!;

    rendered = renderComponent(
      <StrategyDetails strategy={strategy} protectionNeed={protectionNeed} goalNeed={goalNeed} profile={p} locale="en" onBack={() => {}} onCreatePlan={() => {}} />
    );

    clickText(rendered.container, "Configure structure");
    const bsaInput = inputForLabel(rendered.container, "Basic Sum Assured");
    setInputValue(bsaInput, "4000000");
    clickText(rendered.container, "Apply");

    const premiumRow = findByText(rendered.container, "Premium status")!.parentElement!;
    expect(premiumRow.textContent).toContain("Requires verification");
  });
});
