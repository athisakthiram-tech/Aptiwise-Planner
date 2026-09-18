import { describe, it, expect } from "vitest";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { getOfficialSources } from "@/lib/insurance/providers/lic/sourceRegistry";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import * as plan887 from "@/lib/insurance/providers/lic/plans/plan887";
import * as plan894 from "@/lib/insurance/providers/lic/plans/plan894";
import * as plan859 from "@/lib/insurance/providers/lic/plans/plan859";
import * as plan955 from "@/lib/insurance/providers/lic/plans/plan955";
import { getLicProductByIdentity, LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { InsuranceProduct } from "@/types/insurance";

const PLANS = [
  { planNumber: "887", uin: plan887.PLAN_887_UIN, id: "lic-887" },
  { planNumber: "894", uin: plan894.PLAN_894_UIN, id: "lic-894" },
  { planNumber: "859", uin: plan859.PLAN_859_UIN, id: "lic-859" },
  { planNumber: "955", uin: plan955.PLAN_955_UIN, id: "lic-955" },
] as const;

describe("Stage 4H: version safety across all 4 new engines", () => {
  it.each(PLANS)("$planNumber resolves by exact planNumber+UIN", ({ planNumber, uin }) => {
    const engine = getLicProductEngine(planNumber, uin);
    expect(engine).toBeDefined();
    expect(engine?.provider).toBe("LIC");
  });

  it.each(PLANS)("$planNumber never resolves for a wrong/stale UIN", ({ planNumber }) => {
    expect(getLicProductEngine(planNumber, "512N000V00")).toBeUndefined();
  });
});

describe("Stage 4H: source registry cites the supplied brochures, never fabricating a URL", () => {
  it.each(PLANS)("$planNumber has a sales_brochure source", ({ planNumber, uin }) => {
    const sources = getOfficialSources(planNumber, uin);
    const brochure = sources.find((s) => s.id === `lic-plan${planNumber}-sales-brochure-current`);
    expect(brochure).toBeDefined();
    expect(brochure?.sourceType).toBe("sales_brochure");
    expect(brochure?.url).toMatch(/licindia\.in/);
  });
});

describe("Stage 4H: capability resolution is honest for all 4 plans", () => {
  it.each(PLANS)("$planNumber declares eligibility and liquidity verified", ({ planNumber, uin }) => {
    const product = getLicProductByIdentity(planNumber, uin) as InsuranceProduct;
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.eligibility).toBe("verified");
    expect(capabilities.liquidity).toBe("verified");
  });

  it.each(PLANS)("$planNumber declares tax and costs unavailable", ({ planNumber, uin }) => {
    const product = getLicProductByIdentity(planNumber, uin) as InsuranceProduct;
    const capabilities = resolveProductCapabilities(product);
    expect(capabilities.tax).toBe("unavailable");
    expect(capabilities.costs).toBe("unavailable");
  });
});

describe("Stage 4H: no plan in this batch ever reports a maturity benefit — these are all pure risk plans", () => {
  it.each(PLANS)("$planNumber never returns a maturity benefit", ({ planNumber, uin }) => {
    const engine = getLicProductEngine(planNumber, uin);
    const benefits = engine?.calculateBenefits?.({
      age: 30,
      basicSumAssured: 25000000,
      policyTermYears: 20,
      premiumMode: "yearly",
      productSpecificInputs: { deathBenefitOption: "I" },
    });
    expect(benefits?.maturityBenefit).toBeUndefined();
  });
});

describe("Stage 4H: generic comparison adapter works for every new plan without a bespoke adapter", () => {
  it("never invents a premium value anywhere in the comparison", () => {
    const product = getLicProductByIdentity("955", plan955.PLAN_955_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 25000000,
      horizonYears: 20,
      product,
      context: {
        age: 20,
        basicSumAssured: 5000000,
        policyTermYears: 20,
        productSpecificInputs: { deathBenefitOption: "I" },
      },
    });
    expect(JSON.stringify(comparison)).not.toMatch(/"premium"/i);
  });

  it("reports family protection even though the goal/maturity dimension is unavailable (Jeevan Raksha)", () => {
    const product = getLicProductByIdentity("894", plan894.PLAN_894_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 500000,
      horizonYears: 20,
      product,
      context: { age: 20, basicSumAssured: 500000, policyTermYears: 20 },
    });
    expect(comparison.goal.projectedValue.status).toBe("unavailable");
    expect(comparison.protection.familyProtectionAmount.status).toBe("verified");
    expect(comparison.protection.familyProtectionAmount.value).toBe(500000);
  });

  it("stays fully unavailable, never throwing, when required inputs are missing (Saral Jeevan Bima)", () => {
    const product = getLicProductByIdentity("859", plan859.PLAN_859_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 500000,
      horizonYears: 20,
      product,
      context: {},
    });
    expect(comparison.protection.familyProtectionAmount.status).toBe("unavailable");
  });
});

describe("Stage 4H regression: previously-implemented plans are unaffected", () => {
  it("Plan 878's engine is still registered with its original capabilities", () => {
    const engine = getLicProductEngine("878", "512N358V01");
    expect(engine).toBeDefined();
    expect(engine?.capabilities.liquidity).toBe("verified");
  });

  it("Plan 954's Level Sum Assured Option I still behaves exactly as before (no Increasing-option regression)", () => {
    const engine = getLicProductEngine("954", "512N351V02");
    const result = engine?.calculateBenefits?.({
      age: 20,
      basicSumAssured: 10000000,
      policyTermYears: 20,
      productSpecificInputs: { deathBenefitOption: "I" },
    });
    expect(result?.guaranteedBenefits?.absoluteAmountAssuredFromPolicyYear16).toBeUndefined();
  });
});

describe("Stage 4H regression: the active catalogue is unchanged", () => {
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
