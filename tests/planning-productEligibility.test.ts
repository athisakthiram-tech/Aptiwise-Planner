import { describe, it, expect } from "vitest";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  assessProductEligibility,
  isRegisteredProduct,
  listEligibleProducts,
} from "@/lib/planning/productEligibility";

const DIGI_TERM = LIC_CATALOGUE.find((p) => p.id === "lic-876")!; // registered engine
const JEEVAN_UMANG = LIC_CATALOGUE.find((p) => p.id === "lic-745")!; // catalogue-only, no engine

describe("Product eligibility layer — registered vs. catalogue-only", () => {
  it("recognizes a registered product by exact Plan Number + UIN", () => {
    expect(isRegisteredProduct(DIGI_TERM)).toBe(true);
  });

  it("recognizes a catalogue-only product as not registered", () => {
    expect(isRegisteredProduct(JEEVAN_UMANG)).toBe(false);
  });

  it("assesses a registered product and returns a real eligibility result", () => {
    const assessment = assessProductEligibility(DIGI_TERM, { age: 30, policyTermYears: 20, basicSumAssured: 5000000 });
    expect(assessment).not.toBeNull();
    expect(assessment!.product.id).toBe("lic-876");
  });

  it("returns null for a catalogue-only product — it can never enter strategy generation", () => {
    const assessment = assessProductEligibility(JEEVAN_UMANG, { age: 30 });
    expect(assessment).toBeNull();
  });

  it("a wrong/stale UIN for a registered plan number is treated as unregistered, never falls back to the active engine", () => {
    const staleUinProduct = { ...DIGI_TERM, uin: "000X000V00" };
    expect(isRegisteredProduct(staleUinProduct)).toBe(false);
    expect(assessProductEligibility(staleUinProduct, { age: 30 })).toBeNull();
  });
});

describe("Product eligibility layer — listEligibleProducts", () => {
  it("only returns products registered with an engine, from the whole active catalogue", () => {
    const results = listEligibleProducts({ age: 30, policyTermYears: 20 });
    expect(results.every((r) => isRegisteredProduct(r.product))).toBe(true);
    expect(results.some((r) => r.product.id === "lic-745")).toBe(false);
  });

  it("filters to the requested categories only", () => {
    const results = listEligibleProducts({ age: 30, policyTermYears: 20 }, { categories: ["term_protection"] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.product.category === "term_protection")).toBe(true);
  });

  it("excludes a product an engine reports as ineligible (eligible: false)", () => {
    // Age 10 fails every term_protection product's minimum entry age.
    const results = listEligibleProducts({ age: 10, policyTermYears: 20 }, { categories: ["term_protection"] });
    expect(results.length).toBe(0);
  });

  it("keeps a product whose eligibility is 'needs more information' (eligible: null) rather than excluding it", () => {
    // Missing basicSumAssured/term for most term plans yields eligible:
    // null (insufficient info), not false — this must NOT be excluded.
    const results = listEligibleProducts({ age: 30 }, { categories: ["term_protection"], excludeIneligible: true });
    expect(results.some((r) => r.eligible === null)).toBe(true);
  });
});
