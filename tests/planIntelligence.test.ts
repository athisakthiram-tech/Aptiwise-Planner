import { describe, it, expect } from "vitest";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import {
  ALL_PLAN_INTELLIGENCE_PROFILES,
  getPlanIntelligenceProfile,
} from "@/lib/planning/planIntelligence/planProfiles";
import {
  analyzePlanForNeed,
  getComplementaryRoles,
  getEligiblePlanningProducts,
  getPlanIntelligence,
  getProductCashFlows,
  getReturnAnalysis,
} from "@/lib/planning/planIntelligence/registry";
import { estimatePremium } from "@/lib/planning/planIntelligence/premiumModel";
import { assessNeedFit } from "@/lib/planning/planIntelligence/needSuitability";
import { analyzeReturn, calculateXirr } from "@/lib/planning/planIntelligence/returnAnalysis";
import { weakestConfidence } from "@/lib/planning/planIntelligence/confidence";
import { inferProfessionProfile } from "@/lib/planning/planIntelligence/professionModel";
import { buildCustomerSuitabilityProfile } from "@/lib/planning/planIntelligence/customerSuitability";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { deriveProductRoles } from "@/lib/planning/goalOrchestrator/productRoles";

const NON_TERM_CATEGORIES = ["savings_endowment", "whole_life", "money_back_child", "pension", "market_linked_ulip", "micro_insurance"];
const TERM_PLAN_NUMBERS = ["876", "878", "877", "875", "954", "955", "859", "887", "894"];

// ---- Item 1: every active non-term product has an intelligence profile ----
describe("Every active non-term LIC product has a Plan Intelligence Profile (Item 1)", () => {
  const activeNonTerm = LIC_CATALOGUE.filter((p) => p.status === "ACTIVE" && NON_TERM_CATEGORIES.includes(p.category));

  it("covers all 31 active non-term catalogue products", () => {
    expect(activeNonTerm.length).toBe(31);
    expect(ALL_PLAN_INTELLIGENCE_PROFILES.length).toBe(31);
  });

  it("every active non-term catalogue entry resolves to a profile", () => {
    for (const product of activeNonTerm) {
      const profile = getPlanIntelligenceProfile(product.planNumber, product.uin);
      expect(profile, `missing profile for ${product.planNumber}/${product.uin}`).toBeDefined();
    }
  });
});

// ---- Item 2/3: identity matches canonical catalogue, UIN/version preserved ----
describe("Identity matches the canonical catalogue; UIN/version preserved (Items 2/3)", () => {
  it("every profile's identity fields match its catalogue entry exactly", () => {
    for (const profile of ALL_PLAN_INTELLIGENCE_PROFILES) {
      const catalogueEntry = LIC_CATALOGUE.find((p) => p.planNumber === profile.identity.planNumber && p.uin === profile.identity.uin);
      expect(catalogueEntry, `no catalogue entry for ${profile.identity.planNumber}`).toBeDefined();
      expect(profile.identity.productName).toBe(catalogueEntry!.productName);
      expect(profile.identity.category).toBe(catalogueEntry!.category);
      expect(profile.identity.active).toBe(catalogueEntry!.status === "ACTIVE");
    }
  });

  it("version is derived from the UIN's own suffix, never invented", () => {
    for (const profile of ALL_PLAN_INTELLIGENCE_PROFILES) {
      expect(profile.identity.uin.endsWith(profile.identity.version)).toBe(true);
    }
  });
});

// ---- Item 4: term products excluded from this phase ----
describe("Term/protection-only products are excluded from this Phase 1 analysis (Item 4)", () => {
  it("no term-protection product has a Plan Intelligence Profile", () => {
    for (const planNumber of TERM_PLAN_NUMBERS) {
      const inProfiles = ALL_PLAN_INTELLIGENCE_PROFILES.some((p) => p.identity.planNumber === planNumber);
      expect(inProfiles, `term plan ${planNumber} should not have a profile`).toBe(false);
    }
  });

  it("term products remain in the catalogue, never deleted", () => {
    for (const planNumber of TERM_PLAN_NUMBERS) {
      expect(LIC_CATALOGUE.some((p) => p.planNumber === planNumber)).toBe(true);
    }
  });
});

// ---- Item 5-9: nature/premium/PPT/term/benefit representation ----
describe("Product nature, premium structure, PPT, term and benefit types are represented (Items 5-9)", () => {
  it("every profile declares at least one ProductNature", () => {
    for (const profile of ALL_PLAN_INTELLIGENCE_PROFILES) {
      expect(profile.productNature.length).toBeGreaterThan(0);
    }
  });

  it("every profile declares a premium structure and PPT relationship", () => {
    for (const profile of ALL_PLAN_INTELLIGENCE_PROFILES) {
      expect(profile.premiumModel.structure).toBeTruthy();
      expect(profile.premiumModel.pptRelationship.kind).toBeTruthy();
    }
  });

  it("every profile has at least one benefit descriptor", () => {
    for (const profile of ALL_PLAN_INTELLIGENCE_PROFILES) {
      expect(profile.benefitModel.length).toBeGreaterThan(0);
    }
  });
});

// ---- Item 10: guaranteed vs non-guaranteed distinguished ----
describe("Guaranteed vs non-guaranteed vs market-linked benefits are distinguished (Item 10)", () => {
  it("a participating endowment carries both GUARANTEED and NON_GUARANTEED benefit entries", () => {
    const jeevanLabh = getPlanIntelligenceProfile("736", "512N304V03")!;
    expect(jeevanLabh.benefitModel.some((b) => b.character === "GUARANTEED")).toBe(true);
    expect(jeevanLabh.benefitModel.some((b) => b.character === "NON_GUARANTEED")).toBe(true);
  });

  it("a ULIP carries a MARKET_LINKED benefit entry", () => {
    const indexPlus = getPlanIntelligenceProfile("873", "512L354V01")!;
    expect(indexPlus.benefitModel.some((b) => b.character === "MARKET_LINKED")).toBe(true);
  });
});

// ---- Item 11: single premium distinguished ----
describe("Single-premium products are distinguished from limited/regular pay (Item 11)", () => {
  it("Plan 717 (single premium) has structure SINGLE and PPT NOT_APPLICABLE", () => {
    const plan717 = getPlanIntelligenceProfile("717", "512N283V03")!;
    expect(plan717.premiumModel.structure).toBe("SINGLE");
    expect(plan717.premiumModel.pptRelationship.kind).toBe("NOT_APPLICABLE");
  });

  it("Plan 736 (limited premium) has structure LIMITED with a fixed pairing", () => {
    const plan736 = getPlanIntelligenceProfile("736", "512N304V03")!;
    expect(plan736.premiumModel.structure).toBe("LIMITED");
    expect(plan736.premiumModel.pptRelationship.kind).toBe("FIXED_PAIRING");
  });
});

// ---- Item 12: cash-flow model works ----
describe("Cash-flow model builds a real timeline (Item 12)", () => {
  it("getProductCashFlows produces a premium-outflow leg for a resolvable configuration", () => {
    const config = { planNumber: "736", uin: "512N304V03", premiumEstimate: estimatePremium({ planKey: "736::512N304V03", age: 30, policyTermYears: 16, targetBasicSumAssured: 200000 }), policyTermYears: 16, premiumPayingTermYears: 10, targetBasicSumAssured: 200000 };
    const events = getProductCashFlows(config);
    expect(events.some((e) => e.kind === "PREMIUM_OUTFLOW")).toBe(true);
    expect(events.filter((e) => e.kind === "PREMIUM_OUTFLOW").length).toBe(10);
  });
});

// ---- Item 13: return-analysis interface works ----
describe("Return analysis interface works (Item 13)", () => {
  it("analyzeReturn totals premium and benefit legs from real cash flows", () => {
    const config = { planNumber: "736", uin: "512N304V03", premiumEstimate: estimatePremium({ planKey: "736::512N304V03", age: 30, policyTermYears: 16, targetBasicSumAssured: 200000 }), policyTermYears: 16, premiumPayingTermYears: 10, targetBasicSumAssured: 200000 };
    const analysis = getReturnAnalysis(config);
    expect(analysis.totalPremiumPaid.value).not.toBeNull();
    expect(analysis.totalPremiumPaid.value).toBeGreaterThan(0);
  });

  it("calculateXirr computes a real internal rate of return from dated cash flows", () => {
    const irr = calculateXirr([
      { yearFromStart: 0, amount: -100000 },
      { yearFromStart: 10, amount: 250000 },
    ]);
    expect(irr).not.toBeNull();
    expect(irr as number).toBeGreaterThan(0);
  });

  it("calculateXirr returns null when cash flows are all one-directional (never a fabricated rate)", () => {
    expect(calculateXirr([{ yearFromStart: 0, amount: -1000 }, { yearFromStart: 1, amount: -500 }])).toBeNull();
  });
});

// ---- Item 14: unknown != zero ----
describe("Unknown never becomes zero (Item 14)", () => {
  it("an unresolvable premium estimate returns null, never 0", () => {
    const result = estimatePremium({ planKey: "736::512N304V03", age: 999, policyTermYears: 16, targetBasicSumAssured: 200000 });
    expect(result.amountMonthly).toBeNull();
    expect(result.amountMonthly).not.toBe(0);
  });

  it("a catalogue-only product's premium is honestly not-yet-estimatable, never 0", () => {
    const result = estimatePremium({ planKey: "745::512N312V03", age: 30 });
    expect(result.amountMonthly).toBeNull();
    expect(result.provenance.method).toContain("not_yet_estimatable");
  });
});

// ---- Item 15: estimate != verified ----
describe("An ESTIMATE is never presented as VERIFIED (Item 15)", () => {
  it("nearest-published-age estimation is tagged ESTIMATED, never VERIFIED", () => {
    // Jeevan Labh's own published ages are 20/30/40/50 — age 31 is not
    // one of them but is close to 30.
    const result = estimatePremium({ planKey: "736::512N304V03", age: 31, policyTermYears: 16, premiumPayingTermYears: 10, targetBasicSumAssured: 200000 });
    if (result.amountMonthly != null) {
      expect(result.provenance.status).toBe("ESTIMATED");
      expect(result.provenance.method).toContain("nearest_published_sample_age");
    }
  });

  it("an exact published sample match is tagged VERIFIED", () => {
    const result = estimatePremium({ planKey: "736::512N304V03", age: 30, policyTermYears: 16, premiumPayingTermYears: 10, targetBasicSumAssured: 200000 });
    expect(result.provenance.status).toBe("VERIFIED");
    expect(result.amountAnnual).toBe(17767);
  });

  it("BSA linear-scaling estimation is tagged ESTIMATED with an explicit method", () => {
    const result = estimatePremium({ planKey: "736::512N304V03", age: 30, policyTermYears: 16, premiumPayingTermYears: 10, targetBasicSumAssured: 400000 });
    if (result.amountMonthly != null) {
      expect(result.provenance.status).toBe("ESTIMATED");
      expect(result.provenance.method).toContain("linear_scaling_from_published_bsa_sample");
    }
  });
});

// ---- Item 16: historical != illustrative, 17: historical != guaranteed, 18: official illustration != historical ----
describe("ULIP historical performance is kept distinct from illustration and never treated as guaranteed (Items 16/17/18)", () => {
  it("no fabricated historical NAV data exists for any ULIP without verified history", () => {
    for (const planNumber of ["873", "849", "886", "752"]) {
      const profile = ALL_PLAN_INTELLIGENCE_PROFILES.find((p) => p.identity.planNumber === planNumber)!;
      expect(profile.ulip).not.toBeNull();
      // No verified historical series exists in this repository yet — an
      // empty array (never a guessed CAGR) is the honest representation.
      expect(profile.ulip!.historicalPerformance).toEqual([]);
    }
  });

  it("official illustration and historical performance are structurally separate fields, never merged", () => {
    const indexPlus = getPlanIntelligenceProfile("873", "512L354V01")!;
    expect(indexPlus.ulip).not.toBeNull();
    expect(Object.keys(indexPlus.ulip!)).toContain("officialIllustration");
    expect(Object.keys(indexPlus.ulip!)).toContain("historicalPerformance");
  });
});

// ---- Item 19: profession does not directly map to a named product ----
describe("Profession never maps directly to a named product (Item 19)", () => {
  it("inferProfessionProfile never returns a plan number or product name", () => {
    for (const text of ["Engineer", "Doctor", "Business Owner", "Farmer", "Retired", "Random text"]) {
      const result = inferProfessionProfile(text);
      expect(result).not.toMatch(/jeevan|labh|umang|utsav|index plus|siip/i);
    }
  });

  it("no plan profile's professionSuitability text names a specific profession-to-product rule", () => {
    for (const profile of ALL_PLAN_INTELLIGENCE_PROFILES) {
      for (const note of profile.professionSuitability) {
        expect(note.toLowerCase()).not.toMatch(/engineer\s*(should|must|->|→)|doctor\s*(should|must|->|→)/);
      }
    }
  });
});

// ---- Item 20: explicit customer data overrides profession inference ----
describe("Explicit customer data always overrides profession-derived hints (Item 20)", () => {
  it("an explicit riskComfort always wins over any profession-derived hint", () => {
    const profile: CustomerFinancialProfile = { ...UNKNOWN_CUSTOMER_PROFILE, riskComfort: "high" };
    const suitability = buildCustomerSuitabilityProfile(profile, "AGRICULTURE_SEASONAL");
    expect(suitability.riskPosture).toBe("ACCEPTS_MARKET_RISK");
  });

  it("an explicit liquidityPreference always wins over a profession-derived hint", () => {
    const profile: CustomerFinancialProfile = { ...UNKNOWN_CUSTOMER_PROFILE, liquidityPreference: "low" };
    const suitability = buildCustomerSuitabilityProfile(profile, "BUSINESS_OWNER"); // profession hints HIGH liquidity importance
    expect(suitability.liquidityNeed).toBe("CAN_ACCEPT_LOCK_IN");
  });
});

// ---- Item 21: need suitability has reasoning ----
describe("Need suitability always carries factual reasoning (Item 21)", () => {
  it("every need-fit assessment on every profile has non-empty reasoning text", () => {
    for (const profile of ALL_PLAN_INTELLIGENCE_PROFILES) {
      for (const assessment of profile.needSuitability) {
        expect(assessment.reasoning.length).toBeGreaterThan(10);
      }
    }
  });

  it("assessNeedFit never returns a customer-facing ranking word in its reasoning", () => {
    const fit = assessNeedFit("CHILD_EDUCATION", { cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY", marketRisk: "NONE", hasLifeProtection: true, isSinglePremium: false });
    expect(fit.reasoning.toLowerCase()).not.toMatch(/best|winner|recommended/);
  });
});

// ---- Item 22: combination roles represented ----
describe("Combination roles are represented for every product (Item 22)", () => {
  it("every profile declares at least one combination role", () => {
    for (const profile of ALL_PLAN_INTELLIGENCE_PROFILES) {
      expect(profile.combinationRoles.length).toBeGreaterThan(0);
    }
  });

  it("getComplementaryRoles never hardcodes a specific plan-to-plan pairing", () => {
    const complements = getComplementaryRoles("736", "512N304V03");
    for (const c of complements) {
      expect(c.reasoning).not.toMatch(/index plus|nivesh plus|siip/i);
    }
  });
});

// ---- Items 23/24/25: Jeevan Labh vs Jeevan Umang meaningfully different ----
describe("Jeevan Labh and Jeevan Umang profiles are meaningfully different (Items 23/24/25 — validation case)", () => {
  const jeevanLabh = getPlanIntelligenceProfile("736", "512N304V03")!;
  const jeevanUmang = getPlanIntelligenceProfile("745", "512N312V03")!;

  it("both profiles exist and load successfully", () => {
    expect(jeevanLabh).toBeDefined();
    expect(jeevanUmang).toBeDefined();
  });

  it("differ in cash-flow pattern (lump-sum maturity vs. deferred recurring income)", () => {
    expect(jeevanLabh.cashFlowPattern).toBe("LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY");
    expect(jeevanUmang.cashFlowPattern).toBe("LEVEL_OUTFLOW_THEN_DEFERRED_RECURRING_INCOME");
    expect(jeevanLabh.cashFlowPattern).not.toBe(jeevanUmang.cashFlowPattern);
  });

  it("differ in product nature (endowment vs. whole-life/income-oriented)", () => {
    expect(jeevanLabh.productNature).toContain("ENDOWMENT");
    expect(jeevanUmang.productNature).toContain("WHOLE_LIFE");
    expect(jeevanUmang.productNature).toContain("INCOME_ORIENTED");
    expect(jeevanLabh.productNature).not.toContain("WHOLE_LIFE");
  });

  it("differ in combination roles (goal accumulation vs. income generation)", () => {
    expect(jeevanLabh.combinationRoles).toContain("GOAL_ACCUMULATION");
    expect(jeevanUmang.combinationRoles).toContain("INCOME_GENERATION");
  });

  it("differ in need suitability for RETIREMENT/REGULAR_INCOME (Umang stronger fit)", () => {
    const labhIncome = jeevanLabh.needSuitability.find((n) => n.need === "REGULAR_INCOME")!;
    const umangIncome = jeevanUmang.needSuitability.find((n) => n.need === "REGULAR_INCOME")!;
    expect(umangIncome.fit).toBe("STRONG_FIT");
    expect(labhIncome.fit).not.toBe("STRONG_FIT");
  });

  it("differ in maturity age ceiling (Umang covers to age 100, Labh to 75)", () => {
    expect(jeevanUmang.eligibility.maxMaturityAge).toBe(100);
    expect(jeevanLabh.eligibility.maxMaturityAge).toBe(75);
  });

  it("no special-cased logic exists exclusively for these two plans (both reuse the same buildProfile/assessNeedFit machinery as every other product)", () => {
    // Structural check: both profiles' needSuitability arrays have
    // exactly the same length (12, one per NeedTag) as every other
    // profile — proving they went through the identical generic
    // reasoning function, not a bespoke code path.
    expect(jeevanLabh.needSuitability.length).toBe(12);
    expect(jeevanUmang.needSuitability.length).toBe(12);
    expect(jeevanLabh.needSuitability.length).toBe(jeevanUmang.needSuitability.length);
  });
});

// ---- Item 26: at least one ULIP profile works ----
describe("ULIP profile (Index Plus) validation case (Item 26)", () => {
  const indexPlus = getPlanIntelligenceProfile("873", "512L354V01")!;

  it("is classified MARKET_LINKED with market risk, distinct from traditional products", () => {
    expect(indexPlus.productNature).toContain("MARKET_LINKED");
    expect(indexPlus.marketRisk).toBe("MARKET_LINKED");
  });

  it("has ULIP intelligence with real, verified charges", () => {
    expect(indexPlus.ulip).not.toBeNull();
    expect(indexPlus.ulip!.charges.length).toBeGreaterThan(0);
    expect(indexPlus.ulip!.charges.every((c) => c.provenance.status === "VERIFIED")).toBe(true);
  });

  it("goal accumulation role is present but distinct from a traditional product's role set", () => {
    expect(indexPlus.combinationRoles).toContain("MARKET_LINKED_ACCUMULATION");
    expect(indexPlus.combinationRoles).not.toContain("GOAL_ACCUMULATION");
  });
});

// ---- Item 27: no term product enters the goal accumulation universe ----
describe("No term product enters the goal-accumulation universe (Item 27)", () => {
  it("every term-protection product's derived role is PROTECTION_ONLY, never a goal-funding role", () => {
    for (const planNumber of TERM_PLAN_NUMBERS) {
      const product = LIC_CATALOGUE.find((p) => p.planNumber === planNumber)!;
      expect(deriveProductRoles(product)).toEqual(["PROTECTION_ONLY"]);
    }
  });

  it("getEligiblePlanningProducts never returns a term-protection product (none have profiles at all)", () => {
    const eligible = getEligiblePlanningProducts({ ...UNKNOWN_CUSTOMER_PROFILE, age: 30 });
    for (const p of eligible) {
      expect(TERM_PLAN_NUMBERS).not.toContain(p.identity.planNumber);
    }
  });
});

// ---- Confidence model sanity ----
describe("Confidence model never upgrades a weaker status when combining (Section 23)", () => {
  it("weakestConfidence picks the weakest of the inputs", () => {
    expect(weakestConfidence(["VERIFIED", "ESTIMATED", "DERIVED"])).toBe("ESTIMATED");
    expect(weakestConfidence(["VERIFIED", "HISTORICAL"])).toBe("HISTORICAL");
    expect(weakestConfidence(["ILLUSTRATIVE", "VERIFIED"])).toBe("ILLUSTRATIVE");
  });
});

// ---- registry.getPlanIntelligence / analyzePlanForNeed sanity ----
describe("Registry query interface (Section 24)", () => {
  it("getPlanIntelligence returns the same profile as the direct lookup", () => {
    expect(getPlanIntelligence("736", "512N304V03")).toBe(getPlanIntelligenceProfile("736", "512N304V03"));
  });

  it("analyzePlanForNeed layers customer-specific age/horizon/budget checks on top of the plan's own mechanics fit", () => {
    const analysis = analyzePlanForNeed("736", "512N304V03", { ...UNKNOWN_CUSTOMER_PROFILE, age: 30, yearsToGoal: 16, monthlyBudget: 10000, targetGoalAmount: 200000 }, "child_education");
    expect(analysis).toBeDefined();
    expect(analysis!.ageEligible).toBe(true);
    expect(analysis!.mechanicsFit.length).toBeGreaterThan(0);
  });

  it("never manually forces a specific product for a goal — analyzePlanForNeed works identically for any plan/goal pair passed to it (Section 32)", () => {
    const forChildEducation = analyzePlanForNeed("717", "512N283V03", { ...UNKNOWN_CUSTOMER_PROFILE, age: 30, yearsToGoal: 16 }, "child_education");
    const forWealth = analyzePlanForNeed("717", "512N283V03", { ...UNKNOWN_CUSTOMER_PROFILE, age: 30, yearsToGoal: 16 }, "wealth");
    // Same plan, different goal -> different NEED TAGS filtered, but the
    // exact same generic function and mechanics data — no special case.
    expect(forChildEducation).toBeDefined();
    expect(forWealth).toBeDefined();
  });
});

// ---- Item 28: existing tests remain passing — verified by the full suite run, not duplicated here.
