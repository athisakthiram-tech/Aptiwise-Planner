import { describe, it, expect } from "vitest";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { getOfficialSources } from "@/lib/insurance/providers/lic/sourceRegistry";
import { resolveProductCapabilities, getLicVerificationSummary } from "@/lib/insurance/capabilities";
import { buildLicProductComparison } from "@/lib/comparison/genericLicComparison";
import { buildPlan733Comparison } from "@/lib/comparison/protectionAdjustedComparison";
import * as plan733 from "@/lib/insurance/providers/lic/plans/plan733";
import { getLicProductByIdentity, LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getPlanEngine } from "@/lib/insurance/engineRegistry";
import { InsuranceProduct } from "@/types/insurance";

const plan733Product = getLicProductByIdentity("733", plan733.PLAN_733_UIN) as InsuranceProduct;
// A catalogue-only product (no engine registered) to prove the resolver
// never invents capability for products it hasn't verified. Plans 736,
// 717, 714, 715, 774 and 912 all gained engines in Stage 4C/4D, so a
// still-unregistered plan (Jeevan Umang) is used here.
const catalogueOnlyProduct = getLicProductByIdentity("745", "512N312V03") as InsuranceProduct;

describe("A. LicProductEngine registry", () => {
  it("resolves Plan 733 by exact planNumber+UIN", () => {
    const engine = getLicProductEngine("733", plan733.PLAN_733_UIN);
    expect(engine).toBeDefined();
    expect(engine?.provider).toBe("LIC");
  });

  it("never resolves an engine for a wrong/stale UIN", () => {
    expect(getLicProductEngine("733", "512N000V00")).toBeUndefined();
  });

  it("never resolves an engine for an unregistered product", () => {
    expect(getLicProductEngine("745", "512N312V03")).toBeUndefined();
  });

  it("coexists with the existing per-plan engineRegistry.ts without conflict", () => {
    const legacy = getPlanEngine("LIC", "733", plan733.PLAN_733_UIN);
    const generic = getLicProductEngine("733", plan733.PLAN_733_UIN);
    expect(legacy.eligibility).not.toBeNull();
    expect(generic).toBeDefined();
  });
});

describe("Official source registry", () => {
  it("returns Plan 733's catalogue-supplied source", () => {
    const sources = getOfficialSources("733", plan733.PLAN_733_UIN);
    expect(sources.length).toBeGreaterThan(0);
    expect(sources[0].url).toMatch(/licindia\.in/);
  });

  it("returns an empty array (never invents a source) for an unknown identity", () => {
    expect(getOfficialSources("999999", "NOT-A-REAL-UIN")).toEqual([]);
  });
});

describe("B. Capability resolver", () => {
  it("declares Plan 733's honest, non-exaggerated capabilities", () => {
    const capabilities = resolveProductCapabilities(plan733Product);
    expect(capabilities.eligibility).toBe("verified");
    expect(capabilities.premium).toBe("partial");
    expect(capabilities.benefits).toBe("partial");
    expect(capabilities.familyProtection).toBe("unavailable");
    expect(capabilities.tax).toBe("unavailable");
    expect(capabilities.costs).toBe("unavailable");
    expect(capabilities.liquidity).toBe("unavailable");
  });

  it("resolves every dimension to unavailable for a catalogue-only product, with no per-product file needed", () => {
    const capabilities = resolveProductCapabilities(catalogueOnlyProduct);
    expect(Object.values(capabilities)).toEqual([
      "unavailable",
      "unavailable",
      "unavailable",
      "unavailable",
      "unavailable",
      "unavailable",
      "unavailable",
    ]);
  });

  it("resolves capabilities for all 40 active catalogue products without throwing", () => {
    const active = LIC_CATALOGUE.filter((p) => p.status === "ACTIVE");
    expect(active).toHaveLength(40);
    for (const product of active) {
      expect(() => resolveProductCapabilities(product)).not.toThrow();
    }
  });
});

describe("D. Plan 733 regression through the generic engine adapter", () => {
  it("evaluateEligibility matches calling plan733.ts directly", () => {
    const engine = getLicProductEngine("733", plan733.PLAN_733_UIN);
    const viaAdapter = engine?.evaluateEligibility?.({
      age: 30,
      basicSumAssured: 500000,
      policyTermYears: 20,
      premiumPayingTermYears: 17,
    });
    const direct = plan733.evaluateEligibility({
      age: 30,
      sumAssured: 500000,
      policyTermYears: 20,
      premiumPaymentTermYears: 17,
      product: plan733Product,
    });
    expect(viaAdapter).toEqual(direct);
  });

  it("calculatePremium matches calling plan733.ts directly for an exact sample match", () => {
    const engine = getLicProductEngine("733", plan733.PLAN_733_UIN);
    const viaAdapter = engine?.calculatePremium?.({
      age: 30,
      basicSumAssured: 200000,
      policyTermYears: 20,
    });
    const direct = plan733.calculatePremium({
      age: 30,
      sumAssured: 200000,
      policyTermYears: 20,
      product: plan733Product,
    });
    expect(viaAdapter).toEqual(direct);
    expect(viaAdapter?.available).toBe(true);
  });

  it("calculateBenefits matches calling plan733.ts directly and never needs age", () => {
    const engine = getLicProductEngine("733", plan733.PLAN_733_UIN);
    const viaAdapter = engine?.calculateBenefits?.({ basicSumAssured: 500000 });
    const direct = plan733.calculateBenefits({ age: 0, sumAssured: 500000, product: plan733Product });
    expect(viaAdapter).toEqual(direct);
    expect(viaAdapter?.deathBenefit).toBeUndefined();
  });

  it("reports missing age honestly for eligibility/premium rather than silently computing", () => {
    const engine = getLicProductEngine("733", plan733.PLAN_733_UIN);
    expect(engine?.evaluateEligibility?.({}).eligible).toBeNull();
    expect(engine?.evaluateEligibility?.({}).missingInputs).toContain("age");
    expect(engine?.calculatePremium?.({}).available).toBe(false);
  });
});

describe("E. Generic comparison adapter", () => {
  it("produces the same goal/protection figures as the Plan 733-specific adapter", () => {
    const benefits = plan733.calculateBenefits({ age: 30, sumAssured: 500000, product: plan733Product });
    const specific = buildPlan733Comparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
      benefits,
    });
    const generic = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
      context: { basicSumAssured: 500000 },
    });
    expect(generic.goal.projectedValue).toEqual(specific.goal.projectedValue);
    expect(generic.goal.coverage).toEqual(specific.goal.coverage);
    expect(generic.protection.familyProtectionAmount).toEqual(specific.protection.familyProtectionAmount);
    expect(generic.guarantees.nonGuaranteedValue.status).toBe("unavailable");
  });

  it("stays unavailable, never fabricating, when the engine has no benefits for the given context", () => {
    const generic = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
      context: {},
    });
    expect(generic.goal.projectedValue.value).toBeNull();
    expect(generic.goal.projectedValue.status).toBe("unavailable");
  });

  it("returns a fully unavailable comparison for a product with no registered engine, never throwing", () => {
    const generic = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: catalogueOnlyProduct,
      context: { basicSumAssured: 500000 },
    });
    expect(generic.goal.projectedValue.status).toBe("unavailable");
    expect(generic.protection.familyProtectionAmount.status).toBe("unavailable");
  });

  it("never invents a premium value anywhere in the generic comparison", () => {
    const generic = buildLicProductComparison({
      targetAmount: 5000000,
      horizonYears: 15,
      product: plan733Product,
      context: { basicSumAssured: 500000 },
    });
    expect(JSON.stringify(generic)).not.toMatch(/"premium"/i);
  });
});

describe("F. LIC verification summary", () => {
  it("derives counts live from the catalogue and registry", () => {
    const summary = getLicVerificationSummary();
    expect(summary.totalActiveProducts).toBe(40);
    // Plans 733, 736, 717, 714, 715, 774, 912, 734, 881, 748, 770, 889,
    // 890, 888, 876, 875, 954, 877, 878, 887, 894, 859 and 955 are
    // registered as of Stage 4H.
    expect(summary.productsWithEngines).toBe(23);
    expect(summary.fullyVerifiedProducts).toBe(0);
    expect(summary.partiallyVerifiedProducts).toBe(23);
    expect(summary.catalogueOnlyProducts).toBe(17);
    expect(
      summary.fullyVerifiedProducts + summary.partiallyVerifiedProducts + summary.catalogueOnlyProducts
    ).toBe(summary.totalActiveProducts);
  });
});
