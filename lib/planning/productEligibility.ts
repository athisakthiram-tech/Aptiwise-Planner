// Product eligibility layer for the planning engine: the ONLY door
// through which a product can enter strategy generation. Reuses the
// existing catalogue + engine registry + capability resolver — never a
// second, duplicate insurance engine.
//
// A product with no registered LicProductEngine (today: 9 of the 40
// active LIC products) never reaches this layer's output. Catalogue
// presence, identity, or category alone is never enough for a product to
// participate in a calculated strategy.

import { InsuranceCategory, InsuranceProduct, LicCalculationContext, ProductCapabilities } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { resolveProductCapabilities } from "@/lib/insurance/capabilities";

export interface ProductEligibilityAssessment {
  product: InsuranceProduct;
  capabilities: ProductCapabilities;
  // null only if the registered engine genuinely has no
  // evaluateEligibility method (the contract allows it, even though
  // every engine registered today implements one) — never fabricated.
  eligible: boolean | null;
  reasonCodes: { code: string; params?: Record<string, number> }[];
  missingInputs: string[];
}

// Exact planNumber+UIN match against the engine registry — the same
// version-safety rule every other lookup in this codebase follows. A
// product that merely shares a plan number with a registered engine, but
// not its exact UIN, is never treated as registered.
export function isRegisteredProduct(product: InsuranceProduct): boolean {
  return getLicProductEngine(product.planNumber, product.uin) != null;
}

export function assessProductEligibility(
  product: InsuranceProduct,
  context: LicCalculationContext
): ProductEligibilityAssessment | null {
  const engine = getLicProductEngine(product.planNumber, product.uin);
  if (!engine) return null; // not registered — never enters strategy generation

  const eligibility = engine.evaluateEligibility?.(context);
  return {
    product,
    capabilities: resolveProductCapabilities(product),
    eligible: eligibility?.eligible ?? null,
    reasonCodes: eligibility?.reasonCodes ?? [],
    missingInputs: eligibility?.missingInputs ?? [],
  };
}

export interface ListEligibleProductsOptions {
  categories?: InsuranceCategory[];
  // When true (default), a product whose eligibility engine reports
  // `eligible: false` is excluded from the result. `eligible: null`
  // ("needs more information") is always kept — it is not the same as
  // ineligible, and the strategy generator is the layer that decides
  // what to do with a "needs more info" product.
  excludeIneligible?: boolean;
}

// The single generic entry point every strategy family should use to
// find candidate products — never a bespoke per-family product list.
// Only ACTIVE, registered products are ever considered; catalogue-only
// products (no engine) are structurally excluded by
// assessProductEligibility returning null for them.
export function listEligibleProducts(
  context: LicCalculationContext,
  options: ListEligibleProductsOptions = {}
): ProductEligibilityAssessment[] {
  const { categories, excludeIneligible = true } = options;

  return LIC_CATALOGUE.filter((p) => p.status === "ACTIVE")
    .filter((p) => !categories || categories.includes(p.category))
    .map((p) => assessProductEligibility(p, context))
    .filter((assessment): assessment is ProductEligibilityAssessment => assessment != null)
    .filter((assessment) => !excludeIneligible || assessment.eligible !== false);
}
