import { describe, it, expect } from "vitest";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { getOfficialSources } from "@/lib/insurance/providers/lic/sourceRegistry";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import * as plan717 from "@/lib/insurance/providers/lic/plans/plan717";
import * as plan714 from "@/lib/insurance/providers/lic/plans/plan714";
import * as plan715 from "@/lib/insurance/providers/lic/plans/plan715";
import * as plan774 from "@/lib/insurance/providers/lic/plans/plan774";
import * as plan912 from "@/lib/insurance/providers/lic/plans/plan912";
import { getLicProductByIdentity, LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { InsuranceProduct } from "@/types/insurance";

const PLANS = [
  { planNumber: "717", uin: plan717.PLAN_717_UIN, id: "lic-717" },
  { planNumber: "714", uin: plan714.PLAN_714_UIN, id: "lic-714" },
  { planNumber: "715", uin: plan715.PLAN_715_UIN, id: "lic-715" },
  { planNumber: "774", uin: plan774.PLAN_774_UIN, id: "lic-774" },
  { planNumber: "912", uin: plan912.PLAN_912_UIN, id: "lic-912" },
] as const;

describe("Stage 4D: version safety across all 5 new engines", () => {
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

describe("Stage 4D: source registry cites the supplied brochures, never fabricating a URL", () => {
  it.each(PLANS)("$planNumber has a sales_brochure source", ({ planNumber, uin }) => {
    const sources = getOfficialSources(planNumber, uin);
    const brochure = sources.find((s) => s.id === `lic-plan${planNumber}-sales-brochure-current`);
    expect(brochure).toBeDefined();
    expect(brochure?.sourceType).toBe("sales_brochure");
    expect(brochure?.url).toMatch(/licindia\.in/);
  });
});

describe("Stage 4D: capability resolution is honest for all 5 plans", () => {
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

describe("Stage 4D: generic comparison adapter works for every new plan without a bespoke adapter", () => {
  it("Plan 714 surfaces a verified guaranteed maturity as guaranteed goal coverage", () => {
    const product = getLicProductByIdentity("714", plan714.PLAN_714_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 35,
      product,
      context: { age: 30, basicSumAssured: 500000, policyTermYears: 35, premiumPayingTermYears: 35 },
    });
    expect(comparison.goal.projectedValue.value).toBe(500000);
    expect(comparison.goal.projectedValue.status).toBe("verified");
    expect(comparison.goal.coverage.value?.coveragePercent).toBe(10);
  });

  it("never includes a non-guaranteed bonus in the guaranteed goal coverage figure", () => {
    const product = getLicProductByIdentity("715", plan715.PLAN_715_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 35,
      product,
      context: { age: 30, basicSumAssured: 500000, policyTermYears: 35 },
    });
    expect(comparison.guarantees.nonGuaranteedValue.value).toBeNull();
    expect(comparison.guarantees.nonGuaranteedValue.status).toBe("unavailable");
    expect(JSON.stringify(comparison)).not.toMatch(/bonus.*\d/i);
  });

  it("Plan 774's fully guaranteed maturity (BSA + Guaranteed Addition) flows through unchanged", () => {
    const product = getLicProductByIdentity("774", plan774.PLAN_774_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 20,
      product,
      context: { age: 5, basicSumAssured: 500000, policyTermYears: 20 },
    });
    expect(comparison.goal.projectedValue.value).toBe(1300000);
    expect(comparison.goal.projectedValue.status).toBe("verified");
  });

  it("never invents a premium value anywhere in the comparison", () => {
    const product = getLicProductByIdentity("912", plan912.PLAN_912_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 10,
      product,
      context: {
        age: 35,
        basicSumAssured: 500000,
        policyTermYears: 10,
        premiumPayingTermYears: 6,
        productSpecificInputs: { deathBenefitOption: "I" },
      },
    });
    expect(JSON.stringify(comparison)).not.toMatch(/"premium"/i);
  });

  it("stays fully unavailable, never throwing, when required inputs are missing", () => {
    const product = getLicProductByIdentity("717", plan717.PLAN_717_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product,
      context: {},
    });
    expect(comparison.goal.projectedValue.status).toBe("unavailable");
    expect(comparison.protection.familyProtectionAmount.status).toBe("unavailable");
  });
});

describe("Stage 4D regression: Plan 733 and Plan 736 are unaffected", () => {
  it("Plan 733's engine is still registered with its original capabilities", () => {
    const engine = getLicProductEngine("733", "512N297V03");
    expect(engine).toBeDefined();
    expect(engine?.capabilities.premium).toBe("partial");
    expect(engine?.capabilities.familyProtection).toBe("unavailable");
  });

  it("Plan 736's engine is still registered with its original capabilities", () => {
    const engine = getLicProductEngine("736", "512N304V03");
    expect(engine).toBeDefined();
    expect(engine?.capabilities.liquidity).toBe("verified");
    expect(engine?.capabilities.familyProtection).toBe("partial");
  });
});

describe("Stage 4D regression: the active catalogue is unchanged", () => {
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
