import { describe, it, expect } from "vitest";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { getOfficialSources } from "@/lib/insurance/providers/lic/sourceRegistry";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import * as plan890 from "@/lib/insurance/providers/lic/plans/plan890";
import * as plan888 from "@/lib/insurance/providers/lic/plans/plan888";
import { getLicProductByIdentity, LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { InsuranceProduct } from "@/types/insurance";

const PLANS = [
  { planNumber: "890", uin: plan890.PLAN_890_UIN, id: "lic-890" },
  { planNumber: "888", uin: plan888.PLAN_888_UIN, id: "lic-888" },
] as const;

describe("Stage 4F: version safety across both new engines", () => {
  it.each(PLANS)("$planNumber resolves by exact planNumber+UIN", ({ planNumber, uin }) => {
    const engine = getLicProductEngine(planNumber, uin);
    expect(engine).toBeDefined();
    expect(engine?.provider).toBe("LIC");
  });

  it.each(PLANS)("$planNumber never resolves for a wrong/stale UIN", ({ planNumber }) => {
    expect(getLicProductEngine(planNumber, "512N000V00")).toBeUndefined();
  });

  it.each(PLANS)("$planNumber's engine never resolves under a different plan number", ({ uin }) => {
    expect(getLicProductEngine("999", uin)).toBeUndefined();
  });
});

describe("Stage 4F: source registry cites the supplied brochures, never fabricating a URL", () => {
  it.each(PLANS)("$planNumber has a sales_brochure source", ({ planNumber, uin }) => {
    const sources = getOfficialSources(planNumber, uin);
    const brochure = sources.find((s) => s.id === `lic-plan${planNumber}-sales-brochure-current`);
    expect(brochure).toBeDefined();
    expect(brochure?.sourceType).toBe("sales_brochure");
    expect(brochure?.url).toMatch(/licindia\.in/);
  });
});

describe("Stage 4F: capability resolution is honest for both plans", () => {
  it.each(PLANS)("$planNumber declares eligibility and liquidity verified", ({ planNumber, uin }) => {
    const product = getLicProductByIdentity(planNumber, uin) as InsuranceProduct;
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.eligibility).toBe("verified");
    expect(capabilities.liquidity).toBe("verified");
  });

  it.each(PLANS)(
    "$planNumber declares premium/benefits/familyProtection as partial, never verified outright",
    ({ planNumber, uin }) => {
      const product = getLicProductByIdentity(planNumber, uin) as InsuranceProduct;
      const capabilities = resolveProductCapabilities(product);
      expect(capabilities.premium).toBe("partial");
      expect(capabilities.benefits).toBe("partial");
      expect(capabilities.familyProtection).toBe("partial");
    }
  );

  it.each(PLANS)("$planNumber declares tax and costs unavailable", ({ planNumber, uin }) => {
    const product = getLicProductByIdentity(planNumber, uin) as InsuranceProduct;
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.tax).toBe("unavailable");
    expect(capabilities.costs).toBe("unavailable");
  });
});

describe("Stage 4F: generic comparison adapter works for both new plans without a bespoke adapter", () => {
  it("Plan 890's guaranteed maturity (BSA + Guaranteed Addition) surfaces as guaranteed goal coverage", () => {
    const product = getLicProductByIdentity("890", plan890.PLAN_890_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 2000000,
      horizonYears: 20,
      product,
      context: { age: 30, basicSumAssured: 1000000, policyTermYears: 20 },
    });
    expect(comparison.goal.projectedValue.status).toBe("verified");
    expect(comparison.goal.projectedValue.value).toBeGreaterThan(1000000);
  });

  it("Plan 888's BSA-based Guaranteed Addition needs no premium at all", () => {
    const product = getLicProductByIdentity("888", plan888.PLAN_888_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 2000000,
      horizonYears: 20,
      product,
      context: { age: 35, basicSumAssured: 300000, policyTermYears: 20 },
    });
    expect(comparison.goal.projectedValue.status).toBe("verified");
    expect(comparison.goal.projectedValue.value).toBe(300000 + 420000);
  });

  it("never invents a premium value anywhere in the comparison", () => {
    const product = getLicProductByIdentity("890", plan890.PLAN_890_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 2000000,
      horizonYears: 20,
      product,
      context: { age: 30, basicSumAssured: 1000000, policyTermYears: 20 },
    });
    expect(JSON.stringify(comparison)).not.toMatch(/"premium"/i);
  });

  it("stays fully unavailable, never throwing, when required inputs are missing", () => {
    const product = getLicProductByIdentity("888", plan888.PLAN_888_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 2000000,
      horizonYears: 20,
      product,
      context: {},
    });
    expect(comparison.goal.projectedValue.status).toBe("unavailable");
    expect(comparison.protection.familyProtectionAmount.status).toBe("unavailable");
  });
});

describe("Stage 4F regression: previously-implemented plans are unaffected", () => {
  it("Plan 889's engine is still registered with its original capabilities", () => {
    const engine = getLicProductEngine("889", "512N394V01");
    expect(engine).toBeDefined();
    expect(engine?.capabilities.liquidity).toBe("verified");
    expect(engine?.capabilities.familyProtection).toBe("partial");
  });

  it("Plan 748's engine is still registered with its original capabilities", () => {
    const engine = getLicProductEngine("748", "512N316V03");
    expect(engine).toBeDefined();
    expect(engine?.capabilities.premium).toBe("partial");
  });
});

describe("Stage 4F regression: the active catalogue is unchanged", () => {
  it("still has exactly 40 ACTIVE products", () => {
    expect(LIC_CATALOGUE.filter((p) => p.status === "ACTIVE")).toHaveLength(40);
  });

  it.each(PLANS)("$planNumber's catalogue-level verification flags are unchanged by adding an engine", ({ id }) => {
    const product = LIC_CATALOGUE.find((p) => p.id === id) as InsuranceProduct;
    expect(product.verification.premiumEngineAvailable).toBe(false);
    expect(product.verification.benefitEngineAvailable).toBe(false);
    expect(product.verification.eligibilityRulesVerified).toBe(false);
  });
});
