import { describe, it, expect } from "vitest";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { getOfficialSources } from "@/lib/insurance/providers/lic/sourceRegistry";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import * as plan736 from "@/lib/insurance/providers/lic/plans/plan736";
import { getLicProductByIdentity, LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { InsuranceProduct } from "@/types/insurance";

const plan736Product = getLicProductByIdentity("736", plan736.PLAN_736_UIN) as InsuranceProduct;

describe("Plan 736 registry: version safety", () => {
  it("resolves by exact planNumber+UIN", () => {
    const engine = getLicProductEngine("736", plan736.PLAN_736_UIN);
    expect(engine).toBeDefined();
    expect(engine?.provider).toBe("LIC");
  });

  it("never resolves for a wrong/stale UIN", () => {
    expect(getLicProductEngine("736", "512N000V00")).toBeUndefined();
  });

  it("never resolves the same-numbered product under a different UIN", () => {
    expect(getLicProductEngine("736", "512N304V02")).toBeUndefined();
  });

  it("never resolves Plan 736's engine for an unrelated plan number sharing the UIN", () => {
    expect(getLicProductEngine("999", plan736.PLAN_736_UIN)).toBeUndefined();
  });
});

describe("Plan 736 source registry", () => {
  it("cites the locally-supplied sales brochure, never a fabricated URL", () => {
    const sources = getOfficialSources("736", plan736.PLAN_736_UIN);
    const brochureSource = sources.find((s) => s.id === "lic-plan736-sales-brochure-current");
    expect(brochureSource).toBeDefined();
    expect(brochureSource?.sourceType).toBe("sales_brochure");
    expect(brochureSource?.url).toMatch(/licindia\.in/);
  });
});

describe("Plan 736 capability resolution: honest, not exaggerated", () => {
  it("declares eligibility verified and liquidity verified", () => {
    const capabilities = resolveProductCapabilities(plan736Product);
    expect(capabilities.eligibility).toBe("verified");
    expect(capabilities.liquidity).toBe("verified");
  });

  it("declares premium/benefits/familyProtection as partial, never verified outright", () => {
    const capabilities = resolveProductCapabilities(plan736Product);
    expect(capabilities.premium).toBe("partial");
    expect(capabilities.benefits).toBe("partial");
    expect(capabilities.familyProtection).toBe("partial");
  });

  it("declares tax and costs unavailable — no rate or charge is published", () => {
    const capabilities = resolveProductCapabilities(plan736Product);
    expect(capabilities.tax).toBe("unavailable");
    expect(capabilities.costs).toBe("unavailable");
  });
});

describe("Plan 736 through the generic comparison adapter", () => {
  it("surfaces the guaranteed base maturity as a guaranteed goal coverage figure", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 25,
      product: plan736Product,
      context: { age: 30, basicSumAssured: 500000, policyTermYears: 25 },
    });
    expect(comparison.goal.projectedValue.value).toBe(500000);
    expect(comparison.goal.projectedValue.status).toBe("verified");
    expect(comparison.goal.projectedValue.noteCode).toBe("guaranteed_value_only");
    expect(comparison.goal.coverage.value?.coveragePercent).toBe(10);
  });

  it("never includes the non-guaranteed bonus in the guaranteed goal coverage figure", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 25,
      product: plan736Product,
      context: { age: 30, basicSumAssured: 500000, policyTermYears: 25 },
    });
    expect(comparison.guarantees.nonGuaranteedValue.value).toBeNull();
    expect(comparison.guarantees.nonGuaranteedValue.status).toBe("unavailable");
    expect(JSON.stringify(comparison)).not.toMatch(/bonus.*\d/i);
  });

  it("surfaces an exact verified family protection amount when the premium is verified", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 25,
      product: plan736Product,
      context: { age: 30, basicSumAssured: 200000, policyTermYears: 25 },
    });
    expect(comparison.protection.familyProtectionAmount.status).toBe("verified");
    expect(comparison.protection.familyProtectionAmount.value).toBe(200000);
  });

  it("never invents a complete family protection amount when premium is unavailable", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 25,
      product: plan736Product,
      context: { age: 33, basicSumAssured: 300000, policyTermYears: 16 },
    });
    expect(comparison.protection.familyProtectionAmount.status).toBe("unavailable");
    expect(comparison.protection.familyProtectionAmount.value).toBeNull();
  });

  it("never upgrades confidence: status is a direct passthrough from the engine result", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 25,
      product: plan736Product,
      context: { age: 30, basicSumAssured: 500000, policyTermYears: 25 },
    });
    // Non-market-linked, no cost engine registered -> not_applicable, never a fabricated 0.
    expect(comparison.costs.expenseRatio.status).toBe("not_applicable");
    expect(comparison.costs.expenseRatio.value).toBeNull();
  });

  it("never invents a premium value anywhere in the comparison", () => {
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 25,
      product: plan736Product,
      context: { age: 30, basicSumAssured: 500000, policyTermYears: 25 },
    });
    expect(JSON.stringify(comparison)).not.toMatch(/"premium"/i);
  });
});

describe("Regression: Plan 733 and the catalogue are unaffected by Plan 736", () => {
  it("Plan 733's engine is still registered and unchanged", () => {
    const engine = getLicProductEngine("733", "512N297V03");
    expect(engine).toBeDefined();
    expect(engine?.capabilities.premium).toBe("partial");
  });

  it("catalogue still has exactly 40 ACTIVE products", () => {
    expect(LIC_CATALOGUE.filter((p) => p.status === "ACTIVE")).toHaveLength(40);
  });

  it("Plan 736's catalogue-level verification flags are unchanged by adding an engine", () => {
    expect(plan736Product.verification.premiumEngineAvailable).toBe(false);
    expect(plan736Product.verification.benefitEngineAvailable).toBe(false);
    expect(plan736Product.verification.eligibilityRulesVerified).toBe(false);
  });
});
