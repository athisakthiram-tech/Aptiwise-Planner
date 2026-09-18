import { describe, it, expect } from "vitest";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { getOfficialSources } from "@/lib/insurance/providers/lic/sourceRegistry";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import * as plan876 from "@/lib/insurance/providers/lic/plans/plan876";
import * as plan875 from "@/lib/insurance/providers/lic/plans/plan875";
import * as plan954 from "@/lib/insurance/providers/lic/plans/plan954";
import * as plan877 from "@/lib/insurance/providers/lic/plans/plan877";
import * as plan878 from "@/lib/insurance/providers/lic/plans/plan878";
import { getLicProductByIdentity, LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { InsuranceProduct } from "@/types/insurance";

const PLANS = [
  { planNumber: "876", uin: plan876.PLAN_876_UIN, id: "lic-876" },
  { planNumber: "875", uin: plan875.PLAN_875_UIN, id: "lic-875" },
  { planNumber: "954", uin: plan954.PLAN_954_UIN, id: "lic-954" },
  { planNumber: "877", uin: plan877.PLAN_877_UIN, id: "lic-877" },
  { planNumber: "878", uin: plan878.PLAN_878_UIN, id: "lic-878" },
] as const;

describe("Stage 4G: version safety across all 5 new engines", () => {
  it.each(PLANS)("$planNumber resolves by exact planNumber+UIN", ({ planNumber, uin }) => {
    const engine = getLicProductEngine(planNumber, uin);
    expect(engine).toBeDefined();
    expect(engine?.provider).toBe("LIC");
  });

  it.each(PLANS)("$planNumber never resolves for a wrong/stale UIN", ({ planNumber }) => {
    expect(getLicProductEngine(planNumber, "512N000V00")).toBeUndefined();
  });
});

describe("Stage 4G: source registry cites the supplied brochures, never fabricating a URL", () => {
  it.each(PLANS)("$planNumber has a sales_brochure source", ({ planNumber, uin }) => {
    const sources = getOfficialSources(planNumber, uin);
    const brochure = sources.find((s) => s.id === `lic-plan${planNumber}-sales-brochure-current`);
    expect(brochure).toBeDefined();
    expect(brochure?.sourceType).toBe("sales_brochure");
    expect(brochure?.url).toMatch(/licindia\.in/);
  });
});

describe("Stage 4G: capability resolution is honest for all 5 plans", () => {
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

describe("Stage 4G: liquidity facts correctly differ from every endowment plan (no loan; surrender depends on mode)", () => {
  it("Regular Premium reports no surrender value and no loan", () => {
    const engine = getLicProductEngine("876", plan876.PLAN_876_UIN);
    const liquidity = engine?.evaluateLiquidity?.({
      policyTermYears: 20,
      premiumPayingTermYears: 20,
      premiumMode: "yearly",
    });
    expect(liquidity?.loanAvailable.value).toBe(false);
    expect(liquidity?.surrenderAvailable.value).toBe(false);
  });

  it("Single Premium reports a possible Unexpired Risk Premium Value, but still no loan", () => {
    const engine = getLicProductEngine("877", plan877.PLAN_877_UIN);
    const liquidity = engine?.evaluateLiquidity?.({ premiumMode: "single" });
    expect(liquidity?.loanAvailable.value).toBe(false);
    expect(liquidity?.surrenderAvailable.value).toBe(true);
  });
});

describe("Stage 4G: no plan in this batch ever reports a maturity benefit — these are all pure risk plans", () => {
  it.each(PLANS)("$planNumber never returns a maturity benefit", ({ planNumber, uin }) => {
    const product = getLicProductByIdentity(planNumber, uin) as InsuranceProduct;
    const engine = getLicProductEngine(planNumber, uin);
    const benefits = engine?.calculateBenefits?.({
      age: 30,
      basicSumAssured: 5000000,
      policyTermYears: 20,
      premiumMode: "yearly",
      productSpecificInputs: { deathBenefitOption: "I", interestRate: 8 },
    });
    expect(benefits?.maturityBenefit).toBeUndefined();
    void product;
  });
});

describe("Stage 4G: generic comparison adapter works for every new plan without a bespoke adapter", () => {
  it("never invents a premium value anywhere in the comparison", () => {
    const product = getLicProductByIdentity("954", plan954.PLAN_954_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 10000000,
      horizonYears: 20,
      product,
      context: {
        age: 20,
        basicSumAssured: 10000000,
        policyTermYears: 20,
        productSpecificInputs: { deathBenefitOption: "I" },
      },
    });
    expect(JSON.stringify(comparison)).not.toMatch(/"premium"/i);
  });

  it("reports family protection (Sum Assured on Death) even though the goal/maturity dimension is unavailable", () => {
    const product = getLicProductByIdentity("878", plan878.PLAN_878_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 25,
      product,
      context: { age: 30, basicSumAssured: 5000000, policyTermYears: 25 },
    });
    expect(comparison.goal.projectedValue.status).toBe("unavailable");
    expect(comparison.protection.familyProtectionAmount.status).toBe("verified");
    expect(comparison.protection.familyProtectionAmount.value).toBe(5000000);
  });

  it("stays fully unavailable, never throwing, when required inputs are missing", () => {
    const product = getLicProductByIdentity("877", plan877.PLAN_877_UIN) as InsuranceProduct;
    const comparison = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 25,
      product,
      context: {},
    });
    expect(comparison.protection.familyProtectionAmount.status).toBe("unavailable");
  });
});

describe("Stage 4G regression: previously-implemented plans are unaffected", () => {
  it("Plan 888's engine is still registered with its original capabilities", () => {
    const engine = getLicProductEngine("888", "512N393V01");
    expect(engine).toBeDefined();
    expect(engine?.capabilities.liquidity).toBe("verified");
  });

  it("Plan 890's endowment-style liquidity (loan/surrender both true) is unaffected by the new pureRiskLiquidity helper", () => {
    const engine = getLicProductEngine("890", "512N395V01");
    const liquidity = engine?.evaluateLiquidity?.({});
    expect(liquidity?.loanAvailable.value).toBe(true);
    expect(liquidity?.surrenderAvailable.value).toBe(true);
  });
});

describe("Stage 4G regression: the active catalogue is unchanged", () => {
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
