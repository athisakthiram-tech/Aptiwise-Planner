import { describe, it, expect } from "vitest";
import { LIC_CATALOGUE, getLicProductByIdentity } from "@/lib/insurance/providers/lic/catalogue";
import { matchLicProducts } from "@/lib/insurance/matching";
import { GoalInput } from "@/types";

const UIN_PATTERN = /^512[A-Z]\d{3}V\d{2}$/;

// The 40 supplied ACTIVE identities from the 2026-09-16 official
// category-page audit (docs/lic-catalogue-audit.md).
const SUPPLIED_ACTIVE_IDENTITIES: Array<[planNumber: string, uin: string]> = [
  // Endowment
  ["717", "512N283V03"],
  ["714", "512N277V03"],
  ["715", "512N279V03"],
  ["733", "512N297V03"],
  ["736", "512N304V03"],
  ["774", "512N365V02"],
  ["912", "512N387V02"],
  ["881", "512N389V01"],
  ["888", "512N393V01"],
  ["889", "512N394V01"],
  ["890", "512N395V01"],
  ["770", "512N397V01"],
  // Whole Life
  ["745", "512N312V03"],
  ["771", "512N363V02"],
  ["883", "512N392V01"],
  // Money Back
  ["748", "512N316V03"],
  ["720", "512N280V03"],
  ["721", "512N278V03"],
  ["732", "512N296V03"],
  ["734", "512N299V03"],
  // Term Assurance
  ["876", "512N356V02"],
  ["878", "512N358V01"],
  ["877", "512N357V01"],
  ["875", "512N355V02"],
  ["954", "512N351V02"],
  ["955", "512N350V02"],
  ["859", "512N341V01"],
  ["887", "512N360V01"],
  ["894", "512N368V01"],
  // Pension
  ["867", "512L347V01"],
  ["857", "512N337V07"],
  ["758", "512N338V08"],
  ["862", "512N342V05"],
  ["879", "512N386V01"],
  // Unit Linked
  ["873", "512L354V01"],
  ["749", "512L317V02"],
  ["752", "512L334V02"],
  ["886", "512L361V01"],
  // Micro Insurance
  ["751", "512N329V03"],
  ["880", "512N388V01"],
];

const activeProducts = LIC_CATALOGUE.filter((p) => p.status === "ACTIVE");
const marketLinkedActiveUins = new Set([
  "512L347V01", // New Pension Plus
  "512L354V01", // Index Plus
  "512L317V02", // Nivesh Plus
  "512L334V02", // SIIP
  "512L361V01", // Protection Plus
]);

describe("catalogue contains exactly the 40 supplied ACTIVE identities", () => {
  it("has exactly 40 ACTIVE products", () => {
    expect(activeProducts).toHaveLength(40);
  });

  it("represents every supplied (planNumber, uin) pair as ACTIVE", () => {
    for (const [planNumber, uin] of SUPPLIED_ACTIVE_IDENTITIES) {
      const match = activeProducts.find((p) => p.planNumber === planNumber && p.uin === uin);
      expect(match, `missing ACTIVE ${planNumber}/${uin}`).toBeDefined();
    }
  });

  it("has no ACTIVE product outside the supplied list", () => {
    expect(activeProducts).toHaveLength(SUPPLIED_ACTIVE_IDENTITIES.length);
  });
});

describe("every ACTIVE product has complete, verified identity metadata", () => {
  it.each(activeProducts.map((p) => [p.id, p] as const))("%s", (_id, product) => {
    expect(product.productName).toBeTruthy();
    expect(product.planNumber).toBeTruthy();
    expect(product.uin).toBeTruthy();
    expect(product.category).toBeTruthy();
    expect(product.status).toBe("ACTIVE");
    expect(typeof product.marketLinked).toBe("boolean");
    expect(product.officialSourceUrl).toMatch(/licindia\.in/);
    expect(product.verification.identityVerified).toBe(true);
    expect(product.verification.activeStatusVerified).toBe(true);
  });

  it("UIN is non-empty and structurally valid for every product (active or withdrawn)", () => {
    for (const product of LIC_CATALOGUE) {
      expect(product.uin.length).toBeGreaterThan(0);
      expect(product.uin).toMatch(UIN_PATTERN);
    }
  });

  it("has no duplicate planNumber+uin pair", () => {
    const keys = LIC_CATALOGUE.map((p) => `${p.planNumber}::${p.uin}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("new catalogue-only entries never claim unimplemented financial verification", () => {
  it.each(activeProducts.map((p) => [p.id, p] as const))("%s", (_id, product) => {
    expect(product.verification.premiumEngineAvailable).toBe(false);
    expect(product.verification.benefitEngineAvailable).toBe(false);
    expect(product.verification.taxTreatmentVerified).toBe(false);
    expect(product.verification.costStructureVerified).toBe(false);
    expect(product.verification.familyProtectionVerified).toBe(false);
    expect(product.verification.liquidityVerified).toBe(false);
  });

  it("preserves Plan 733's existing (unelevated) catalogue verification state", () => {
    const plan733 = getLicProductByIdentity("733", "512N297V03");
    expect(plan733?.verification.eligibilityRulesVerified).toBe(false);
    expect(plan733?.verification.benefitEngineAvailable).toBe(false);
    expect(plan733?.verification.premiumEngineAvailable).toBe(false);
    expect(plan733?.verification.identityVerified).toBe(true);
  });
});

describe("market-linked classification", () => {
  it("flags the 5 known market-linked/ULIP products as marketLinked", () => {
    for (const uin of marketLinkedActiveUins) {
      const product = activeProducts.find((p) => p.uin === uin);
      expect(product?.marketLinked, `expected ${uin} to be market-linked`).toBe(true);
    }
  });

  it("keeps every other active product non-market-linked", () => {
    const nonMarketLinked = activeProducts.filter((p) => !marketLinkedActiveUins.has(p.uin));
    expect(nonMarketLinked).toHaveLength(35);
    for (const product of nonMarketLinked) {
      expect(product.marketLinked).toBe(false);
    }
  });

  it("classifies New Pension Plus as PENSION category but market-linked", () => {
    const newPensionPlus = getLicProductByIdentity("867", "512L347V01");
    expect(newPensionPlus?.category).toBe("pension");
    expect(newPensionPlus?.marketLinked).toBe(true);
  });
});

describe("version safety: withdrawn/replaced products are never active", () => {
  it("carries at least one withdrawn version sharing a plan number with an ACTIVE product", () => {
    const withdrawn912 = LIC_CATALOGUE.find(
      (p) => p.planNumber === "912" && p.status === "WITHDRAWN"
    );
    expect(withdrawn912).toBeDefined();
    expect(withdrawn912?.uin).toBe("512N387V01");
  });

  it("exact identity lookup returns the ACTIVE version for the current UIN", () => {
    const active = getLicProductByIdentity("912", "512N387V02");
    expect(active?.status).toBe("ACTIVE");
  });

  it("exact identity lookup returns the WITHDRAWN version for the old UIN, never silently upgraded", () => {
    const withdrawn = getLicProductByIdentity("912", "512N387V01");
    expect(withdrawn?.status).toBe("WITHDRAWN");
  });

  it("a wrong/stale UIN never falls back to the same plan number's other version", () => {
    expect(getLicProductByIdentity("912", "512N999V99")).toBeUndefined();
    expect(getLicProductByIdentity("857", "512N337V06")?.status).toBe("WITHDRAWN");
    expect(getLicProductByIdentity("857", "512N337V07")?.status).toBe("ACTIVE");
    expect(getLicProductByIdentity("758", "512N338V07")?.status).toBe("WITHDRAWN");
    expect(getLicProductByIdentity("758", "512N338V08")?.status).toBe("ACTIVE");
  });

  it("withdrawn products are never returned by the active goal matcher", () => {
    const goal: GoalInput = {
      age: 35,
      monthlyBudget: 10000,
      goalType: "wealth",
      targetAmount: 5000000,
      yearsToGoal: 15,
      existingLifeCover: 1000000,
      riskComfort: "medium",
    };
    const result = matchLicProducts(goal);
    const withdrawnIds = LIC_CATALOGUE.filter((p) => p.status === "WITHDRAWN").map((p) => p.id);
    for (const match of result.potentialMatches) {
      expect(withdrawnIds).not.toContain(match.product.id);
    }
  });

  it("matchLicProducts filters strictly by status === ACTIVE", () => {
    const withdrawnOnlyCatalogue = LIC_CATALOGUE.filter((p) => p.status === "WITHDRAWN");
    const goal: GoalInput = {
      age: 35,
      monthlyBudget: 10000,
      goalType: "family_protection",
      targetAmount: 5000000,
      yearsToGoal: 15,
      existingLifeCover: 1000000,
      riskComfort: "medium",
    };
    const result = matchLicProducts(goal, withdrawnOnlyCatalogue);
    expect(result.potentialMatches).toHaveLength(0);
  });
});
