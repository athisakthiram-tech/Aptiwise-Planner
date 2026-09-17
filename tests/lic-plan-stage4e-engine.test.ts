import { describe, it, expect } from "vitest";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { getOfficialSources } from "@/lib/insurance/providers/lic/sourceRegistry";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import * as plan734 from "@/lib/insurance/providers/lic/plans/plan734";
import * as plan881 from "@/lib/insurance/providers/lic/plans/plan881";
import * as plan748 from "@/lib/insurance/providers/lic/plans/plan748";
import * as plan770 from "@/lib/insurance/providers/lic/plans/plan770";
import * as plan889 from "@/lib/insurance/providers/lic/plans/plan889";
import { getLicProductByIdentity, LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { InsuranceProduct } from "@/types/insurance";

const PLANS = [
  { planNumber: "734", uin: plan734.PLAN_734_UIN, id: "lic-734" },
  { planNumber: "881", uin: plan881.PLAN_881_UIN, id: "lic-881" },
  { planNumber: "748", uin: plan748.PLAN_748_UIN, id: "lic-748" },
  { planNumber: "770", uin: plan770.PLAN_770_UIN, id: "lic-770" },
  { planNumber: "889", uin: plan889.PLAN_889_UIN, id: "lic-889" },
] as const;

describe("Stage 4E: version safety across all 5 new engines", () => {
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

describe("Stage 4E: source registry cites the supplied brochures, never fabricating a URL", () => {
  it.each(PLANS)("$planNumber has a sales_brochure source", ({ planNumber, uin }) => {
    const sources = getOfficialSources(planNumber, uin);
    const brochure = sources.find((s) => s.id === `lic-plan${planNumber}-sales-brochure-current`);
    expect(brochure).toBeDefined();
    expect(brochure?.sourceType).toBe("sales_brochure");
    expect(brochure?.url).toMatch(/licindia\.in/);
  });
});

describe("Stage 4E: capability resolution is honest for all 5 plans", () => {
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

describe("Stage 4E: generic comparison adapter works for every new plan without a bespoke adapter", () => {
  it("Plan 734's guaranteed maturity (Option 1, 100% BSA) surfaces as guaranteed goal coverage", () => {
    const product = getLicProductByIdentity("734", plan734.PLAN_734_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 2000000,
      horizonYears: 17,
      product,
      context: { age: 8, basicSumAssured: 200000, productSpecificInputs: { survivalBenefitOption: "1" } },
    });
    expect(comparison.goal.projectedValue.value).toBe(200000);
    expect(comparison.goal.projectedValue.status).toBe("verified");
  });

  it("never includes the discretionary Loyalty Addition in Plan 748's guaranteed goal coverage figure", () => {
    const product = getLicProductByIdentity("748", plan748.PLAN_748_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 2000000,
      horizonYears: 14,
      product,
      context: { age: 20, basicSumAssured: 1000000, policyTermYears: 14 },
    });
    expect(comparison.guarantees.nonGuaranteedValue.value).toBeNull();
    expect(comparison.guarantees.nonGuaranteedValue.status).toBe("unavailable");
    expect(JSON.stringify(comparison)).not.toMatch(/loyalty.*\d/i);
  });

  it("Plan 770's fully guaranteed maturity (BSA + Guaranteed Addition) flows through unchanged", () => {
    const product = getLicProductByIdentity("770", plan770.PLAN_770_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 2000000,
      horizonYears: 30,
      product,
      context: {
        age: 35,
        basicSumAssured: 300000,
        policyTermYears: 30,
        premiumPayingTermYears: 7,
      },
    });
    expect(comparison.goal.projectedValue.status).toBe("verified");
    expect(comparison.goal.projectedValue.value).toBeGreaterThan(300000);
  });

  it("never invents a premium value anywhere in the comparison", () => {
    const product = getLicProductByIdentity("889", plan889.PLAN_889_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 2000000,
      horizonYears: 25,
      product,
      context: {
        age: 35,
        basicSumAssured: 300000,
        policyTermYears: 25,
        premiumPayingTermYears: 15,
        productSpecificInputs: { deathBenefitOption: "I" },
      },
    });
    expect(JSON.stringify(comparison)).not.toMatch(/"premium"/i);
  });

  it("stays fully unavailable, never throwing, when required inputs are missing", () => {
    const product = getLicProductByIdentity("881", plan881.PLAN_881_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 2000000,
      horizonYears: 25,
      product,
      context: {},
    });
    expect(comparison.goal.projectedValue.status).toBe("unavailable");
    expect(comparison.protection.familyProtectionAmount.status).toBe("unavailable");
  });
});

describe("Stage 4E regression: previously-implemented plans (733, 736, 717, 714, 715, 774, 912) are unaffected", () => {
  it("Plan 733's engine is still registered with its original capabilities", () => {
    const engine = getLicProductEngine("733", "512N297V03");
    expect(engine).toBeDefined();
    expect(engine?.capabilities.premium).toBe("partial");
    expect(engine?.capabilities.familyProtection).toBe("unavailable");
  });

  it("Plan 912's engine is still registered with its original capabilities", () => {
    const engine = getLicProductEngine("912", "512N387V02");
    expect(engine).toBeDefined();
    expect(engine?.capabilities.liquidity).toBe("verified");
    expect(engine?.capabilities.familyProtection).toBe("partial");
  });
});

describe("Stage 4E regression: the active catalogue is unchanged", () => {
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
