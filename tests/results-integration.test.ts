import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { runPlanningPipeline } from "@/lib/planning/planningPipeline";
import { groupStrategiesByFamily, getBudgetPresentation, toggleCompareSelection } from "@/lib/planning/resultsViewModel";
import { isRegisteredProduct } from "@/lib/planning/productEligibility";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getLicVerificationSummary } from "@/lib/insurance/capabilities";
import { t } from "@/lib/i18n/translations";
import { LOCALES } from "@/lib/i18n/types";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

describe("Results integration — real pipeline wired through the view-model", () => {
  const p = profile({
    age: 30,
    monthlyBudget: 15000,
    yearsToGoal: 20,
    goalType: "child_education",
    targetGoalAmount: 3000000,
    existingInvestments: 400000,
    outstandingLiabilities: 1000000,
    existingLifeCover: 0,
    riskComfort: "medium",
  });
  const result = runPlanningPipeline({ profile: p });
  const groups = groupStrategiesByFamily(result.strategies);

  it("produces at least one family group with real, identity-safe product data", () => {
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      for (const strategy of group.strategies) {
        for (const component of strategy.components) {
          if (component.product) {
            expect(component.product.planNumber.length).toBeGreaterThan(0);
            expect(component.product.uin).toMatch(/^512[A-Z]\d{3}V\d{2}$/);
            expect(component.product.productName.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("never surfaces a catalogue-only (unregistered) product anywhere in the grouped view", () => {
    for (const group of groups) {
      for (const strategy of group.strategies) {
        for (const component of strategy.components) {
          if (component.product) {
            expect(
              isRegisteredProduct({
                ...LIC_CATALOGUE[0],
                planNumber: component.product.planNumber,
                uin: component.product.uin,
              })
            ).toBe(true);
          }
        }
      }
    }
  });

  it("includes at least one strategy whose budget usage is honestly unverified", () => {
    const anyUnverified = result.strategies.some((s) => getBudgetPresentation(s).kind === "unverified");
    expect(anyUnverified).toBe(true);
  });

  it("resolves every generated strategy's reason codes to real text in EN, TA and HI", () => {
    for (const locale of LOCALES.map((l) => l.code)) {
      for (const strategy of result.strategies) {
        for (const code of strategy.reasonCodes) {
          expect(t(`results.reason.${code}`, locale)).not.toBe(`results.reason.${code}`);
        }
      }
    }
  });

  it("keeps compare selection capped at 3 even against a real, larger strategy list", () => {
    let selected: string[] = [];
    for (const strategy of result.strategies) {
      selected = toggleCompareSelection(selected, strategy.id);
    }
    expect(selected.length).toBe(Math.min(3, result.strategies.length));
  });
});

describe("Results integration — no regression to the existing engine/catalogue counts", () => {
  it("keeps 40 active products and 31 registered engines untouched by the results UI work", () => {
    const summary = getLicVerificationSummary();
    expect(summary.totalActiveProducts).toBe(40);
    expect(summary.productsWithEngines).toBe(31);
    expect(summary.catalogueOnlyProducts).toBe(9);
  });
});
