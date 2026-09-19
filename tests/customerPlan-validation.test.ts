import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateStrategies } from "@/lib/planning/strategyGenerator";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { validateCustomerPlan } from "@/lib/customerPlan/customerPlanValidation";
import { CustomerPlan } from "@/lib/customerPlan/types";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

function buildValidPlan(): CustomerPlan {
  const p = profile({
    age: 30,
    monthlyBudget: 15000,
    yearsToGoal: 20,
    goalType: "child_education",
    targetGoalAmount: 3000000,
    existingInvestments: 400000,
    outstandingLiabilities: 1000000,
    existingLifeCover: 0,
    riskComfort: "medium",
  });
  const protectionNeed = calculateProtectionNeed({ profile: p });
  const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });
  const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
  // Plan 894 (Jeevan Raksha) has no Increasing Sum Assured option, so its
  // Death Benefit is always a verified, non-null value even without an
  // exact premium match — a reliable fixture for these tests, same
  // reasoning as tests/customerPlan-create.test.ts.
  const strategy = strategies.find(
    (s) => s.family === "protection_investment" && s.components[0].product?.planNumber === "894"
  )!;
  return createCustomerPlan({ customerProfile: p, protectionNeed, goalNeed, selectedStrategy: strategy, locale: "en" });
}

describe("validateCustomerPlan — accepts a genuinely valid plan", () => {
  it("passes validation for a plan built by createCustomerPlan", () => {
    const plan = buildValidPlan();
    const result = validateCustomerPlan(plan);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("validateCustomerPlan — schema version", () => {
  it("rejects an unsupported schema version", () => {
    const plan = buildValidPlan();
    const result = validateCustomerPlan({ ...plan, schemaVersion: 999 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("schema version"))).toBe(true);
  });

  it("rejects a non-object candidate", () => {
    expect(validateCustomerPlan(null).valid).toBe(false);
    expect(validateCustomerPlan("not a plan").valid).toBe(false);
    expect(validateCustomerPlan(42).valid).toBe(false);
  });
});

describe("validateCustomerPlan — product identity", () => {
  it("rejects a component with an invalid UIN", () => {
    const plan = buildValidPlan();
    const component = plan.selectedStrategy.components.find((c) => c.product)!;
    const broken = {
      ...plan,
      selectedStrategy: {
        ...plan.selectedStrategy,
        components: plan.selectedStrategy.components.map((c) =>
          c === component ? { ...c, product: { ...c.product!, uin: "not-a-uin" } } : c
        ),
      },
    };
    const result = validateCustomerPlan(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("uin"))).toBe(true);
  });

  it("rejects a component with a missing Plan Number", () => {
    const plan = buildValidPlan();
    const component = plan.selectedStrategy.components.find((c) => c.product)!;
    const broken = {
      ...plan,
      selectedStrategy: {
        ...plan.selectedStrategy,
        components: plan.selectedStrategy.components.map((c) =>
          c === component ? { ...c, product: { ...c.product!, planNumber: "" } } : c
        ),
      },
    };
    expect(validateCustomerPlan(broken).valid).toBe(false);
  });
});

describe("validateCustomerPlan — status recognition", () => {
  it("rejects a component with an unrecognized status string", () => {
    const plan = buildValidPlan();
    const component = plan.selectedStrategy.components[0];
    const broken = {
      ...plan,
      selectedStrategy: {
        ...plan.selectedStrategy,
        components: plan.selectedStrategy.components.map((c) =>
          c === component ? { ...c, premium: { value: null, status: "definitely_fine" } } : c
        ),
      },
    };
    const result = validateCustomerPlan(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("recognized status"))).toBe(true);
  });

  it("rejects a component whose 'unavailable' field carries a fabricated numeric value", () => {
    const plan = buildValidPlan();
    const component = plan.selectedStrategy.components.find((c) => c.premium.status === "unavailable")!;
    const broken = {
      ...plan,
      selectedStrategy: {
        ...plan.selectedStrategy,
        components: plan.selectedStrategy.components.map((c) =>
          c === component ? { ...c, premium: { value: 5000, status: "unavailable" } } : c
        ),
      },
    };
    const result = validateCustomerPlan(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("non-null value"))).toBe(true);
  });
});

describe("validateCustomerPlan — numeric safety", () => {
  it("rejects NaN in a component value", () => {
    const plan = buildValidPlan();
    const component = plan.selectedStrategy.components.find((c) => c.deathBenefit.value != null)!;
    const broken = {
      ...plan,
      selectedStrategy: {
        ...plan.selectedStrategy,
        components: plan.selectedStrategy.components.map((c) =>
          c === component ? { ...c, deathBenefit: { value: NaN, status: "verified" } } : c
        ),
      },
    };
    const result = validateCustomerPlan(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("not finite"))).toBe(true);
  });

  it("rejects Infinity in financialPicture", () => {
    const plan = buildValidPlan();
    const broken = { ...plan, financialPicture: { ...plan.financialPicture, protection: { ...plan.financialPicture.protection, requiredProtection: Infinity } } };
    const result = validateCustomerPlan(broken);
    expect(result.valid).toBe(false);
  });
});

describe("validateCustomerPlan — internal consistency", () => {
  it("rejects a goalCoverage with both a positive remaining gap and a positive surplus", () => {
    const plan = buildValidPlan();
    const broken = {
      ...plan,
      selectedStrategy: {
        ...plan.selectedStrategy,
        goalCoverage: { value: { coveragePercent: 150, remainingGap: 10, surplus: 10 }, status: "illustrative" as const },
      },
    };
    const result = validateCustomerPlan(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("remaining gap and a surplus"))).toBe(true);
  });
});

describe("validateCustomerPlan — required fields", () => {
  it("rejects a plan missing selectedStrategy", () => {
    const plan = buildValidPlan();
    const { selectedStrategy: _unused, ...broken } = plan;
    expect(validateCustomerPlan(broken).valid).toBe(false);
  });

  it("rejects a plan missing financialPicture", () => {
    const plan = buildValidPlan();
    const { financialPicture: _unused, ...broken } = plan;
    expect(validateCustomerPlan(broken).valid).toBe(false);
  });

  it("rejects a plan with an empty id", () => {
    const plan = buildValidPlan();
    expect(validateCustomerPlan({ ...plan, id: "" }).valid).toBe(false);
  });

  it("never repairs an invalid plan — errors are reported, the object is untouched", () => {
    const plan = buildValidPlan();
    const broken = { ...plan, id: "" };
    const before = JSON.stringify(broken);
    validateCustomerPlan(broken);
    expect(JSON.stringify(broken)).toBe(before);
  });
});
