// Single source of truth for "what can we actually show about this
// product". Combines catalogue verification metadata with whatever
// engine (if any) is registered for the exact product identity — never
// two separate, possibly-contradictory verification stories.

import { InsuranceProduct, ProductCapabilities } from "@/types/insurance";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";

// A catalogue-only product (the overwhelming majority today) has verified
// identity/status but zero verified financial capability — this is the
// honest default, not a placeholder to fill in later per-product.
const NO_ENGINE_CAPABILITIES: ProductCapabilities = {
  eligibility: "unavailable",
  premium: "unavailable",
  benefits: "unavailable",
  familyProtection: "unavailable",
  tax: "unavailable",
  costs: "unavailable",
  liquidity: "unavailable",
};

export function resolveProductCapabilities(product: InsuranceProduct): ProductCapabilities {
  const engine = getLicProductEngine(product.planNumber, product.uin);
  return engine ? { ...engine.capabilities } : { ...NO_ENGINE_CAPABILITIES };
}

export interface LicVerificationSummary {
  totalActiveProducts: number;
  productsWithEngines: number;
  fullyVerifiedProducts: number;
  partiallyVerifiedProducts: number;
  catalogueOnlyProducts: number;
}

// Every count is derived live from the canonical catalogue + engine
// registry — never hardcoded, so it can never drift out of sync with a
// future catalogue or engine change.
export function getLicVerificationSummary(): LicVerificationSummary {
  const activeProducts = LIC_CATALOGUE.filter((p) => p.status === "ACTIVE");

  let productsWithEngines = 0;
  let fullyVerifiedProducts = 0;
  let partiallyVerifiedProducts = 0;
  let catalogueOnlyProducts = 0;

  for (const product of activeProducts) {
    const hasEngine = getLicProductEngine(product.planNumber, product.uin) != null;
    if (hasEngine) productsWithEngines++;

    const statuses = Object.values(resolveProductCapabilities(product));
    const allVerified = statuses.every((status) => status === "verified");
    const anyVerifiedOrPartial = statuses.some((status) => status === "verified" || status === "partial");

    if (allVerified) {
      fullyVerifiedProducts++;
    } else if (anyVerifiedOrPartial) {
      partiallyVerifiedProducts++;
    } else {
      catalogueOnlyProducts++;
    }
  }

  return {
    totalActiveProducts: activeProducts.length,
    productsWithEngines,
    fullyVerifiedProducts,
    partiallyVerifiedProducts,
    catalogueOnlyProducts,
  };
}
