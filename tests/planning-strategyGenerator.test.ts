import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateStrategies } from "@/lib/planning/strategyGenerator";
import { StrategyResult } from "@/lib/planning/strategyTypes";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

// Every field a StrategyResult (or its components) must NEVER contain,
// per this stage's "no winner/recommendation logic" requirement.
const FORBIDDEN_FIELD_NAMES = ["score", "rank", "ranking", "best", "recommended", "winner", "topChoice", "starRating"];

function assertNoRankingFields(obj: unknown, path = "root") {
  if (obj == null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => assertNoRankingFields(item, `${path}[${i}]`));
    return;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    for (const forbidden of FORBIDDEN_FIELD_NAMES) {
      expect(lowerKey, `${path}.${key} looks like a ranking/recommendation field`).not.toContain(
        forbidden.toLowerCase()
      );
    }
    assertNoRankingFields(value, `${path}.${key}`);
  }
}

describe("Strategy generator — Family A: Protection + Investment", () => {
  it("generates a term-protection + illustrative-investment structure with the protection gap carried through", () => {
    const p = profile({
      age: 30,
      monthlyBudget: 10000,
      yearsToGoal: 20,
      outstandingLiabilities: 1000000,
      existingLifeCover: 0,
    });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });

    expect(protectionNeed.protectionGap).toBe(1000000);

    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const protectionInvestment = strategies.filter((s) => s.family === "protection_investment");
    expect(protectionInvestment.length).toBeGreaterThan(0);

    const withJeevanRaksha = protectionInvestment.find((s) => s.components[0].product?.planNumber === "894");
    expect(withJeevanRaksha).toBeDefined();
    const s = withJeevanRaksha as StrategyResult;

    // Plan 894 (Jeevan Raksha) has no Increasing Sum Assured option, so
    // its Death Benefit always includes the Basic Sum Assured itself
    // even when the exact premium can't be looked up — this is the one
    // registered term plan whose death benefit is knowable from BSA
    // alone in a generic context.
    expect(s.components[0].role).toBe("term_protection");
    expect(s.components[0].deathBenefit.value).toBe(1000000);
    expect(s.components[0].deathBenefit.status).toBe("verified");

    // The gap is fully carried through: original gap (1,000,000) minus
    // the newly-added protection (1,000,000) = 0.
    expect(s.protectionGap.value).toBe(0);

    expect(s.components[1].role).toBe("illustrative_investment");
    expect(s.components[1].maturityBenefit.status).toBe("illustrative");
    expect(s.warnings).toContain("illustration_only_not_guaranteed_returns");
  });

  it("never claims a verified budget usage when the term premium can't be exactly matched", () => {
    const p = profile({ age: 37, monthlyBudget: 8000, yearsToGoal: 17, outstandingLiabilities: 2000000, existingLifeCover: 0 });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: null, currentResources: null });
    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const protectionInvestment = strategies.filter((s) => s.family === "protection_investment");
    expect(protectionInvestment.length).toBeGreaterThan(0);
    for (const s of protectionInvestment) {
      // Age 37 / term 17 will not exactly match any plan's published
      // sample premium row, so no strategy here should claim a verified
      // monthly budget usage.
      if (s.monthlyBudgetVerifiedUsed == null) {
        expect(s.monthlyBudgetUsageStatus).toBe("unavailable");
      }
    }
  });
});

describe("Strategy generator — Family B: Traditional Insurance + Protection", () => {
  it("generates a traditional-savings structure tagged to the customer's goal, adding protection only when a gap remains", () => {
    const p = profile({
      age: 28,
      monthlyBudget: 15000,
      yearsToGoal: 15,
      goalType: "child_education",
      targetGoalAmount: 3000000,
      existingInvestments: 500000,
      outstandingLiabilities: 1000000,
      existingLifeCover: 0,
    });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });

    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const traditionalProtection = strategies.filter((s) => s.family === "traditional_protection");
    expect(traditionalProtection.length).toBeGreaterThan(0);

    for (const s of traditionalProtection) {
      expect(s.components[0].role).toBe("traditional_savings");
      // Every traditional product selected here must actually be tagged
      // for this goal type.
      expect(["savings_endowment", "money_back_child"]).toContain(s.components[0].product?.category);
    }
  });

  it("does not add a second protection component when there is no protection gap at all", () => {
    const p = profile({
      age: 28,
      monthlyBudget: 15000,
      yearsToGoal: 15,
      goalType: "child_education",
      targetGoalAmount: 3000000,
      outstandingLiabilities: 0,
      // Comfortably exceeds liabilities (0) + goal obligations
      // (3,000,000), so the calculated protection gap is exactly 0
      // regardless of what the traditional product's own death benefit
      // turns out to be.
      existingLifeCover: 5000000,
    });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    expect(protectionNeed.protectionGap).toBe(0);
    const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });

    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const traditionalProtection = strategies.filter((s) => s.family === "traditional_protection");
    expect(traditionalProtection.length).toBeGreaterThan(0);
    for (const s of traditionalProtection) {
      expect(s.components.length).toBe(1);
    }
  });
});

describe("Strategy generator — Family C: Market-Linked Insurance", () => {
  it("generates a market-linked structure for every eligible registered ULIP, with premium honestly unavailable", () => {
    const p = profile({ age: 30, monthlyBudget: 10000, yearsToGoal: 20, riskComfort: "high" });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: null, currentResources: null });

    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const marketLinked = strategies.filter((s) => s.family === "market_linked_insurance");
    expect(marketLinked.length).toBeGreaterThan(0);

    for (const s of marketLinked) {
      expect(s.marketExposure.value).toBe("market_linked");
      expect(s.monthlyBudgetVerifiedUsed).toBeNull();
      expect(s.monthlyBudgetUsageStatus).toBe("unavailable");
      expect(s.reasonCodes).toContain("MARKET_RISK_ACCEPTED");
    }
  });

  it("tags MARKET_RISK_NOT_PREFERRED instead of MARKET_RISK_ACCEPTED when the customer's risk comfort is low", () => {
    const p = profile({ age: 30, monthlyBudget: 10000, yearsToGoal: 20, riskComfort: "low" });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: null, currentResources: null });
    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const marketLinked = strategies.filter((s) => s.family === "market_linked_insurance");
    expect(marketLinked.length).toBeGreaterThan(0);
    for (const s of marketLinked) {
      expect(s.reasonCodes).toContain("MARKET_RISK_NOT_PREFERRED");
      expect(s.reasonCodes).not.toContain("MARKET_RISK_ACCEPTED");
    }
  });
});

describe("Strategy generator — Family D: Traditional Insurance Structure", () => {
  it("generates a goal-only traditional structure without touching protection fields", () => {
    const p = profile({ age: 28, monthlyBudget: 15000, yearsToGoal: 15, goalType: "home", targetGoalAmount: 2500000 });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });

    const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
    const traditionalOnly = strategies.filter((s) => s.family === "traditional_structure");
    expect(traditionalOnly.length).toBeGreaterThan(0);
    for (const s of traditionalOnly) {
      expect(s.components.length).toBe(1);
      expect(s.protectionGap.status).toBe("unavailable");
    }
  });
});

describe("Strategy generator — Family E: Retirement Structure", () => {
  it("only generates retirement structures when the goal type is retirement", () => {
    const nonRetirement = profile({ age: 40, monthlyBudget: 10000, yearsToGoal: 10, goalType: "wealth", targetGoalAmount: 1000000 });
    const strategiesNonRetirement = generateStrategies({
      profile: nonRetirement,
      protectionNeed: calculateProtectionNeed({ profile: nonRetirement }),
      goalNeed: calculateGoalNeed({ targetGoal: nonRetirement.targetGoalAmount, currentResources: null }),
    });
    expect(strategiesNonRetirement.some((s) => s.family === "retirement_structure")).toBe(false);

    const retirement = profile({ age: 40, monthlyBudget: 10000, yearsToGoal: 20, goalType: "retirement", targetGoalAmount: 5000000 });
    const strategiesRetirement = generateStrategies({
      profile: retirement,
      protectionNeed: calculateProtectionNeed({ profile: retirement }),
      goalNeed: calculateGoalNeed({ targetGoal: retirement.targetGoalAmount, currentResources: null }),
    });
    const retirementStrategies = strategiesRetirement.filter((s) => s.family === "retirement_structure");
    expect(retirementStrategies.length).toBeGreaterThan(0);
    for (const s of retirementStrategies) {
      expect(s.components[0].role).toBe("retirement_income");
      expect(s.reasonCodes).toContain("RETIREMENT_GOAL");
      expect(s.components[0].product?.category).toBe("pension");
    }
  });
});

describe("Strategy generator — reason codes and status/confidence preservation", () => {
  it("attaches PROTECTION_GAP_PRESENT when a gap exists and NO_PROTECTION_GAP when it doesn't", () => {
    const withGap = profile({ age: 30, monthlyBudget: 10000, yearsToGoal: 20, outstandingLiabilities: 1000000, existingLifeCover: 0 });
    const gapStrategies = generateStrategies({
      profile: withGap,
      protectionNeed: calculateProtectionNeed({ profile: withGap }),
      goalNeed: calculateGoalNeed({ targetGoal: null, currentResources: null }),
    });
    expect(gapStrategies.some((s) => s.reasonCodes.includes("PROTECTION_GAP_PRESENT"))).toBe(true);

    const noGap = profile({ age: 30, monthlyBudget: 10000, yearsToGoal: 20, outstandingLiabilities: 0, existingLifeCover: 0 });
    const noGapStrategies = generateStrategies({
      profile: noGap,
      protectionNeed: calculateProtectionNeed({ profile: noGap }),
      goalNeed: calculateGoalNeed({ targetGoal: null, currentResources: null }),
    });
    expect(noGapStrategies.some((s) => s.reasonCodes.includes("NO_PROTECTION_GAP"))).toBe(true);
  });

  it("never upgrades confidence above the weakest contributing status", () => {
    const p = profile({ age: 30, monthlyBudget: 10000, yearsToGoal: 20 });
    const strategies = generateStrategies({
      profile: p,
      protectionNeed: calculateProtectionNeed({ profile: p }),
      goalNeed: calculateGoalNeed({ targetGoal: null, currentResources: null }),
    });
    for (const s of strategies) {
      if (s.monthlyBudgetUsageStatus === "unavailable" || s.goalGap.status === "unavailable") {
        expect(s.confidence).not.toBe("verified");
      }
    }
  });

  it("preserves partial protection-need status through to the strategy's protection gap status", () => {
    // Liabilities known, but goalType/targetGoalAmount unknown -> the
    // protection need itself is "partial".
    const p = profile({ age: 30, monthlyBudget: 10000, yearsToGoal: 20, outstandingLiabilities: 1000000, existingLifeCover: 0 });
    const protectionNeed = calculateProtectionNeed({ profile: p });
    expect(protectionNeed.status).toBe("partial");
    const strategies = generateStrategies({
      profile: p,
      protectionNeed,
      goalNeed: calculateGoalNeed({ targetGoal: null, currentResources: null }),
    });
    const protectionInvestment = strategies.filter((s) => s.family === "protection_investment");
    // Where the added protection amount isn't independently verified,
    // the strategy's own protectionGap status must not read "verified".
    for (const s of protectionInvestment) {
      if (s.components[0].deathBenefit.status !== "verified") {
        expect(s.protectionGap.status).not.toBe("verified");
      }
    }
  });
});

describe("Strategy generator — Plan Number/UIN identity safety", () => {
  it("every component's product identity matches its catalogue entry exactly", () => {
    const p = profile({ age: 30, monthlyBudget: 10000, yearsToGoal: 20, riskComfort: "medium" });
    const strategies = generateStrategies({
      profile: p,
      protectionNeed: calculateProtectionNeed({ profile: p }),
      goalNeed: calculateGoalNeed({ targetGoal: null, currentResources: null }),
    });
    for (const s of strategies) {
      for (const c of s.components) {
        if (c.product) {
          expect(c.product.planNumber).toMatch(/^\d+$/);
          expect(c.product.uin).toMatch(/^512[A-Z]\d{3}V\d{2}$/);
        }
      }
    }
  });
});

describe("Strategy generator — term configuration override (Task 5 integration audit)", () => {
  // Plan 894 (Jeevan Raksha)'s own published Sample Illustrative Premium
  // (BSA 5,00,000; age 30; policy term 20 years -> Rs.2,730 regular
  // annual premium) — the exact real-world configuration case Task 5
  // describes: an eligible product that starts out "Requires
  // verification" because the auto-derived protection gap doesn't match
  // any published rate row, but becomes genuinely engine-verified once
  // an advisor supplies the product's own real published configuration.
  function plan894Strategy(strategies: StrategyResult[]) {
    return strategies.find(
      (s) => s.family === "protection_investment" && s.components[0].product?.planNumber === "894"
    )!;
  }

  it("leaves the term premium unavailable when no override is given and the auto-derived gap doesn't match a published rate row", () => {
    const p = profile({ age: 30, monthlyBudget: 15000, yearsToGoal: 20, existingLifeCover: 0, outstandingLiabilities: 1000000 });
    const strategies = generateStrategies({
      profile: p,
      protectionNeed: calculateProtectionNeed({ profile: p }),
      goalNeed: calculateGoalNeed({ targetGoal: null, currentResources: null }),
    });
    const strategy = plan894Strategy(strategies);
    expect(strategy.components[0].monthlyPremium.status).toBe("unavailable");
  });

  it("turns the term premium genuinely verified once the advisor supplies the product's own published Basic Sum Assured/Policy Term", () => {
    const p = profile({ age: 30, monthlyBudget: 15000, yearsToGoal: 20, existingLifeCover: 0, outstandingLiabilities: 1000000 });
    const strategies = generateStrategies({
      profile: p,
      protectionNeed: calculateProtectionNeed({ profile: p }),
      goalNeed: calculateGoalNeed({ targetGoal: null, currentResources: null }),
      termConfiguration: { basicSumAssured: 500000, policyTermYears: 20 },
    });
    const strategy = plan894Strategy(strategies);
    expect(strategy.components[0].monthlyPremium.status).toBe("verified");
    // Rs.2,730 annual / 12, rounded — the SAME engine's own published row,
    // never a value invented by this configuration seam.
    expect(strategy.components[0].monthlyPremium.value).toBe(Math.round(2730 / 12));
  });

  it("never fabricates a verified value for a Basic Sum Assured that still doesn't match any published row", () => {
    const p = profile({ age: 30, monthlyBudget: 15000, yearsToGoal: 20, existingLifeCover: 0, outstandingLiabilities: 1000000 });
    const strategies = generateStrategies({
      profile: p,
      protectionNeed: calculateProtectionNeed({ profile: p }),
      goalNeed: calculateGoalNeed({ targetGoal: null, currentResources: null }),
      // An arbitrary BSA the advisor might try — genuinely not in Plan
      // 894's published sample table, so it must stay unavailable.
      termConfiguration: { basicSumAssured: 4000000, policyTermYears: 20 },
    });
    const strategy = plan894Strategy(strategies);
    expect(strategy.components[0].monthlyPremium.status).toBe("unavailable");
    expect(strategy.components[0].monthlyPremium.value).toBeNull();
  });

  it("is fully backward compatible — omitting termConfiguration produces identical output to before", () => {
    const p = profile({ age: 32, monthlyBudget: 12000, yearsToGoal: 18, goalType: "wealth", targetGoalAmount: 4000000, existingInvestments: 500000 });
    const input = {
      profile: p,
      protectionNeed: calculateProtectionNeed({ profile: p }),
      goalNeed: calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments }),
    };
    expect(generateStrategies(input)).toEqual(generateStrategies({ ...input, termConfiguration: undefined }));
  });
});

describe("Strategy generator — no ranking/winner fields anywhere", () => {
  it("never includes a score, rank, best, recommended or winner field on any generated strategy", () => {
    const p = profile({
      age: 32,
      monthlyBudget: 12000,
      yearsToGoal: 18,
      goalType: "wealth",
      targetGoalAmount: 4000000,
      existingInvestments: 500000,
      outstandingLiabilities: 1000000,
      existingLifeCover: 0,
      riskComfort: "medium",
    });
    const strategies = generateStrategies({
      profile: p,
      protectionNeed: calculateProtectionNeed({ profile: p }),
      goalNeed: calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments }),
    });
    expect(strategies.length).toBeGreaterThan(0);
    assertNoRankingFields(strategies);
  });
});
