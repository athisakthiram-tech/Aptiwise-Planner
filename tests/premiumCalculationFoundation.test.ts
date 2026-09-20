// Premium & Product Calculation Foundation V2.
//
// These tests exercise REAL registered plan engines end-to-end (never
// mocks) — the same convention every other lic-plan*.test.ts file in
// this repo already follows — to prove the new capability registry
// (lib/insurance/premiumCalculationCapability.ts) and the PPT-safety
// fixes it documents are wired into real code, not just declared.

import { describe, it, expect } from "vitest";
import {
  getPremiumCalculationDomain,
  listPremiumCalculationDomains,
} from "@/lib/insurance/premiumCalculationCapability";
import { LIC_PRODUCT_ENGINES, getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { LicCalculationContext } from "@/types/insurance";
import { solveBudgetFit } from "@/lib/planning/goalOrchestrator/budgetSolver";
import { assessProductEligibility } from "@/lib/planning/productEligibility";
import { getLicProductByIdentity } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_736_UIN } from "@/lib/insurance/providers/lic/plans/plan736";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateGoalStructures } from "@/lib/planning/goalOrchestrator/goalStructureGenerator";
import { generateStrategies } from "@/lib/planning/strategyGenerator";

describe("premiumCalculationCapability — every registered engine is classified (Section 1/2)", () => {
  it("has a classified domain for all 31 registered engines", () => {
    expect(LIC_PRODUCT_ENGINES.length).toBe(31);
    for (const engine of LIC_PRODUCT_ENGINES) {
      const domain = getPremiumCalculationDomain(engine.planNumber, engine.uin);
      expect(domain, `missing domain for plan ${engine.planNumber}`).toBeDefined();
    }
  });

  it("every domain declares a real EngineCalculationCapability value for both premium and benefits", () => {
    const valid = ["FULL_CALCULATION", "PARTIAL_CALCULATION", "SAMPLE_ONLY", "STRUCTURAL_ONLY"];
    for (const domain of listPremiumCalculationDomains()) {
      expect(valid).toContain(domain.premiumCapability);
      expect(valid).toContain(domain.benefitCapability);
    }
  });

  it("a SAMPLE_ONLY engine is never mislabeled FULL_CALCULATION for premium", () => {
    const domain = getPremiumCalculationDomain("736", PLAN_736_UIN)!;
    expect(domain.premiumCapability).toBe("SAMPLE_ONLY");
  });

  it("products whose premium is a direct customer choice (annuities/ULIPs/New Pension Plus) are STRUCTURAL_ONLY for premium, never FULL_CALCULATION or SAMPLE_ONLY", () => {
    for (const [plan, uin] of [
      ["867", "512L347V01"],
      ["857", "512N337V07"],
      ["862", "512N342V05"],
      ["879", "512N386V01"],
      ["758", "512N338V08"],
      ["873", "512L354V01"],
      ["749", "512L317V02"],
      ["886", "512L361V01"],
    ]) {
      const domain = getPremiumCalculationDomain(plan, uin)!;
      expect(domain.premiumCapability).toBe("STRUCTURAL_ONLY");
      // Their BENEFIT/BSA formula from a chosen premium is still fully
      // computable — STRUCTURAL_ONLY on premium must never be conflated
      // with "nothing about this product is calculable".
      expect(domain.benefitCapability).not.toBe("STRUCTURAL_ONLY");
    }
  });
});

describe("Jeevan Labh (736) — PPT is not silently ignored (Section 4/19 regression)", () => {
  const engine = getLicProductEngine("736", PLAN_736_UIN)!;

  it("age 30, term 16, PPT omitted resolves the published premium (unchanged behavior)", () => {
    const result = engine.calculatePremium!({ age: 30, basicSumAssured: 200000, policyTermYears: 16, premiumMode: "yearly" });
    expect(result.available).toBe(true);
    expect(result.premium).toBe(17767);
  });

  it("age 30, term 16, the ONE valid PPT (10) explicitly supplied still resolves the same premium", () => {
    const result = engine.calculatePremium!({
      age: 30,
      basicSumAssured: 200000,
      policyTermYears: 16,
      premiumPayingTermYears: 10,
      premiumMode: "yearly",
    });
    expect(result.available).toBe(true);
    expect(result.premium).toBe(17767);
  });

  it("age 30, term 16, an INVALID PPT for that term (15, which belongs to term 21) is honestly unavailable, never the term-16 premium", () => {
    const result = engine.calculatePremium!({
      age: 30,
      basicSumAssured: 200000,
      policyTermYears: 16,
      premiumPayingTermYears: 15,
      premiumMode: "yearly",
    });
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });

  it("age 30, term 21 with PPT 10 (term 16's own PPT, invalid for term 21) is honestly unavailable", () => {
    const result = engine.calculatePremium!({
      age: 30,
      basicSumAssured: 200000,
      policyTermYears: 21,
      premiumPayingTermYears: 10,
      premiumMode: "yearly",
    });
    expect(result.available).toBe(false);
  });

  it("the capability registry's own derivePremiumPayingTermYears matches the engine's real accepted PPT for every published term", () => {
    const domain = getPremiumCalculationDomain("736", PLAN_736_UIN)!;
    for (const term of [16, 21, 25]) {
      const derivedPpt = domain.derivePremiumPayingTermYears!(term);
      const result = engine.calculatePremium!({ age: 30, basicSumAssured: 200000, policyTermYears: term, premiumPayingTermYears: derivedPpt! });
      expect(result.available).toBe(true);
    }
  });
});

describe("Regular-Pay-only engines reject a PPT that doesn't equal Policy Term (714/715)", () => {
  it("Plan 714 (New Endowment) rejects PPT != term", () => {
    const engine = getLicProductEngine("714", "512N277V03")!;
    const valid = engine.calculatePremium!({ age: 30, basicSumAssured: 200000, policyTermYears: 15, premiumMode: "yearly" });
    expect(valid.available).toBe(true);
    const mismatched = engine.calculatePremium!({
      age: 30,
      basicSumAssured: 200000,
      policyTermYears: 15,
      premiumPayingTermYears: 10,
      premiumMode: "yearly",
    });
    expect(mismatched.available).toBe(false);
  });

  it("Plan 715 (New Jeevan Anand) rejects PPT != term", () => {
    const engine = getLicProductEngine("715", "512N279V03")!;
    const valid = engine.calculatePremium!({ age: 30, basicSumAssured: 200000, policyTermYears: 15, premiumMode: "yearly" });
    expect(valid.available).toBe(true);
    const mismatched = engine.calculatePremium!({
      age: 30,
      basicSumAssured: 200000,
      policyTermYears: 15,
      premiumPayingTermYears: 25,
      premiumMode: "yearly",
    });
    expect(mismatched.available).toBe(false);
  });
});

describe("Derived-PPT engines reject a PPT that contradicts the Term-offset formula (748/890/733)", () => {
  it("Plan 748 (Bima Shree, PPT = Term - 4) rejects a contradictory PPT", () => {
    const engine = getLicProductEngine("748", "512N316V03")!;
    const valid = engine.calculatePremium!({ age: 20, basicSumAssured: 1000000, policyTermYears: 14, premiumMode: "yearly" });
    expect(valid.available).toBe(true);
    const mismatched = engine.calculatePremium!({
      age: 20,
      basicSumAssured: 1000000,
      policyTermYears: 14,
      premiumPayingTermYears: 5, // the real derived PPT for term 14 is 10, not 5
      premiumMode: "yearly",
    });
    expect(mismatched.available).toBe(false);
  });

  it("Plan 890 (New Bima Jyoti, PPT = Term - 5) rejects a contradictory PPT", () => {
    const engine = getLicProductEngine("890", "512N395V01")!;
    const valid = engine.calculatePremium!({ age: 20, basicSumAssured: 1000000, policyTermYears: 15, premiumMode: "yearly" });
    expect(valid.available).toBe(true);
    const mismatched = engine.calculatePremium!({
      age: 20,
      basicSumAssured: 1000000,
      policyTermYears: 15,
      premiumPayingTermYears: 15,
      premiumMode: "yearly",
    });
    expect(mismatched.available).toBe(false);
  });

  it("Plan 733 (Jeevan Lakshya, PPT = Term - 3) rejects a contradictory PPT", () => {
    const engine = getLicProductEngine("733", "512N297V03")!;
    const valid = engine.calculatePremium!({ age: 20, basicSumAssured: 200000, policyTermYears: 13, premiumMode: "yearly" });
    expect(valid.available).toBe(true);
    const mismatched = engine.calculatePremium!({
      age: 20,
      basicSumAssured: 200000,
      policyTermYears: 13,
      premiumPayingTermYears: 12,
      premiumMode: "yearly",
    });
    expect(mismatched.available).toBe(false);
  });
});

describe("budgetSolver — searches only the product's own supported Basic Sum Assured values (Section 9/10)", () => {
  function plan736Assessment(context: LicCalculationContext) {
    const product = getLicProductByIdentity("736", PLAN_736_UIN)!;
    return assessProductEligibility(product, context)!;
  }

  it("resolves the real published Basic Sum Assured even when the seed target is wildly different, never inventing an intermediate value", () => {
    const baseContext: LicCalculationContext = { age: 30, premiumMode: "yearly" };
    const assessment = plan736Assessment({ ...baseContext, policyTermYears: 16 });
    const result = solveBudgetFit({
      assessment,
      role: "traditional_savings",
      baseContext,
      policyTermYears: 16,
      initialBsaCandidate: 987654321, // absurd seed, nowhere near any round-lakh guess
      maxMonthlyBudget: 10000,
      reasonCodes: [],
    });
    expect(result.fits).toBe(true);
    expect(result.basicSumAssured).toBe(200000);
  });

  it("never resolves a Basic Sum Assured outside the product's own declared supported set", () => {
    const domain = getPremiumCalculationDomain("736", PLAN_736_UIN)!;
    const baseContext: LicCalculationContext = { age: 30, premiumMode: "yearly" };
    const assessment = plan736Assessment({ ...baseContext, policyTermYears: 16 });
    const result = solveBudgetFit({
      assessment,
      role: "traditional_savings",
      baseContext,
      policyTermYears: 16,
      initialBsaCandidate: 5000000,
      maxMonthlyBudget: 10000,
      reasonCodes: [],
    });
    if (result.basicSumAssured != null) {
      expect(domain.supportedBasicSumAssuredValues).toContain(result.basicSumAssured);
    }
  });
});

describe("Goal Orchestrator uses the engine's own derived PPT, not a generic guess (Section 4/9 integration)", () => {
  function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
    return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
  }

  it("Structure B's primary component PPT for Jeevan Labh matches the capability registry's own derivation, not a coincidental guess-list hit", () => {
    const p = profile({
      age: 30,
      monthlyBudget: 10000,
      goalType: "child_education",
      targetGoalAmount: 2500000,
      yearsToGoal: 16,
      riskComfort: "medium",
    });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });
    const structures = generateGoalStructures({ profile: p, protectionNeed, goalNeed });
    const structureB = structures.find((s) => s.id.startsWith("goal_structure_b"));
    expect(structureB).toBeDefined();
    const primaryConfig = structureB!.strategyResult.components[0].configuration;
    const domain = getPremiumCalculationDomain("736", PLAN_736_UIN)!;
    expect(primaryConfig?.premiumPayingTermYears).toBe(domain.derivePremiumPayingTermYears!(16));
  });
});

describe("Planning Monthly Equivalent is distinguished from LIC's own monthly premium (Section 7/8)", () => {
  it("a yearly-mode verified premium's monthly figure carries a 'planning monthly equivalent' noteCode, never presented as LIC's own monthly-mode premium", () => {
    // The exact real, already-verified configuration from
    // planning-strategyGenerator.test.ts: Jeevan Raksha (894), age 30,
    // BSA 5,00,000, term 20 -> Rs.2,730/year, a genuinely verified
    // (never fabricated) yearly premium.
    const p: CustomerFinancialProfile = {
      ...UNKNOWN_CUSTOMER_PROFILE,
      age: 30,
      monthlyBudget: 15000,
      yearsToGoal: 20,
      existingLifeCover: 0,
      outstandingLiabilities: 1000000,
    };
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: null, currentResources: null });
    const strategies = generateStrategies({
      profile: p,
      protectionNeed,
      goalNeed,
      termConfiguration: { basicSumAssured: 500000, policyTermYears: 20 },
    });
    const strategy = strategies.find(
      (s) => s.family === "protection_investment" && s.components[0].product?.planNumber === "894"
    )!;
    const premium = strategy.components[0].monthlyPremium;
    expect(premium.status).toBe("verified");
    expect(premium.value).toBe(Math.round(2730 / 12));
    expect(premium.noteCode).toBe("planning_monthly_equivalent_derived_from_verified_premium");
  });
});

describe("Sample tables are not rate tables — unsupported configurations stay unavailable, never fabricated (Section 5/26)", () => {
  it("Amritbaal (774), a plan with exactly ONE published sample point, is unavailable for any other age", () => {
    const engine = getLicProductEngine("774", "512N365V02")!;
    const offSample = engine.calculatePremium!({
      age: 30,
      basicSumAssured: 500000,
      policyTermYears: 20,
      premiumMode: "yearly",
      productSpecificInputs: { deathBenefitOption: "III" },
    });
    expect(offSample.available).toBe(false);
  });

  it("an unsupported age for Jeevan Labh (47) never resolves a fabricated premium", () => {
    const engine = getLicProductEngine("736", PLAN_736_UIN)!;
    const result = engine.calculatePremium!({ age: 47, basicSumAssured: 200000, policyTermYears: 16, premiumMode: "yearly" });
    expect(result.available).toBe(false);
    expect(result.premium).toBeUndefined();
  });
});
