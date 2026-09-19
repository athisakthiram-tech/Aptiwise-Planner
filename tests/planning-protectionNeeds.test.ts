import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

describe("Protection Need — complete inputs", () => {
  it("calculates all three components and a final gap when every input is provided", () => {
    const result = calculateProtectionNeed({
      profile: profile({
        outstandingLiabilities: 2000000,
        annualFamilyExpenses: 600000,
        goalType: "child_education",
        targetGoalAmount: 3000000,
        existingInvestments: 500000,
        existingLifeCover: 1000000,
      }),
      incomeReplacementYears: 10,
    });

    expect(result.status).toBe("calculated");
    expect(result.components.outstandingLiabilities).toBe(2000000);
    expect(result.components.futureFamilySupport).toBe(6000000); // 600000 * 10
    expect(result.components.goalObligations).toBe(2500000); // 3000000 - 500000
    expect(result.requiredProtection).toBe(2000000 + 6000000 + 2500000);
    expect(result.protectionGap).toBe(result.requiredProtection! - 1000000);
  });
});

describe("Protection Need — missing inputs", () => {
  it("returns unavailable when nothing at all is provided", () => {
    const result = calculateProtectionNeed({ profile: profile() });
    expect(result.status).toBe("unavailable");
    expect(result.requiredProtection).toBeNull();
    expect(result.protectionGap).toBeNull();
  });

  it("returns partial when only liabilities are known", () => {
    const result = calculateProtectionNeed({ profile: profile({ outstandingLiabilities: 1500000 }) });
    expect(result.status).toBe("partial");
    expect(result.requiredProtection).toBe(1500000);
    expect(result.missingInputs).toContain("goalType");
    expect(result.missingInputs).toContain("targetGoalAmount");
  });

  it("never invents an income-replacement-years assumption — omitting it skips futureFamilySupport without marking it missing", () => {
    const result = calculateProtectionNeed({
      profile: profile({ outstandingLiabilities: 1000000, annualFamilyExpenses: 500000 }),
      // incomeReplacementYears intentionally omitted
    });
    expect(result.components.futureFamilySupport).toBeNull();
    expect(result.missingInputs).not.toContain("annualFamilyExpenses");
  });

  it("marks annualFamilyExpenses missing only when incomeReplacementYears WAS requested", () => {
    const result = calculateProtectionNeed({
      profile: profile({ outstandingLiabilities: 1000000 }),
      incomeReplacementYears: 10,
    });
    expect(result.components.futureFamilySupport).toBeNull();
    expect(result.missingInputs).toContain("annualFamilyExpenses");
    expect(result.status).toBe("partial");
  });
});

describe("Protection Need — existing cover vs. gap", () => {
  it("floors the protection gap at 0 when existing cover exceeds the calculated need", () => {
    const result = calculateProtectionNeed({
      profile: profile({ outstandingLiabilities: 1000000, existingLifeCover: 5000000 }),
    });
    expect(result.requiredProtection).toBe(1000000);
    expect(result.protectionGap).toBe(0);
  });

  it("returns exactly zero protection gap when existing cover equals the required amount", () => {
    const result = calculateProtectionNeed({
      profile: profile({ outstandingLiabilities: 2000000, existingLifeCover: 2000000 }),
    });
    expect(result.protectionGap).toBe(0);
  });
});

describe("Protection Need — liabilities component", () => {
  it("passes outstanding liabilities through directly", () => {
    const result = calculateProtectionNeed({ profile: profile({ outstandingLiabilities: 3200000 }) });
    expect(result.components.outstandingLiabilities).toBe(3200000);
  });
});

describe("Protection Need — goal obligations component", () => {
  it("computes the unfunded portion of the goal as the obligation", () => {
    const result = calculateProtectionNeed({
      profile: profile({ goalType: "home", targetGoalAmount: 4000000, existingInvestments: 1500000 }),
    });
    expect(result.components.goalObligations).toBe(2500000);
  });

  it("never lets goal obligations go negative when existing investments exceed the target", () => {
    const result = calculateProtectionNeed({
      profile: profile({ goalType: "home", targetGoalAmount: 1000000, existingInvestments: 5000000 }),
    });
    expect(result.components.goalObligations).toBe(0);
  });
});

describe("Protection Need — eligible assets/resources offset goal obligations", () => {
  it("uses existingInvestments to reduce the goal obligation, not the total required protection twice", () => {
    const withoutAssets = calculateProtectionNeed({
      profile: profile({ outstandingLiabilities: 1000000, goalType: "wealth", targetGoalAmount: 2000000 }),
    });
    const withAssets = calculateProtectionNeed({
      profile: profile({
        outstandingLiabilities: 1000000,
        goalType: "wealth",
        targetGoalAmount: 2000000,
        existingInvestments: 800000,
      }),
    });
    expect(withoutAssets.requiredProtection).toBe(1000000 + 2000000);
    expect(withAssets.requiredProtection).toBe(1000000 + 1200000);
  });
});

describe("Protection Need — missing values never become zero", () => {
  it("leaves protectionGap null (not equal to requiredProtection) when existing cover is unknown", () => {
    const result = calculateProtectionNeed({ profile: profile({ outstandingLiabilities: 1000000 }) });
    expect(result.existingProtection).toBeNull();
    expect(result.protectionGap).toBeNull();
    expect(result.missingInputs).toContain("existingLifeCover");
  });

  it("leaves a component null, not 0, when its own inputs are absent", () => {
    const result = calculateProtectionNeed({ profile: profile({ outstandingLiabilities: 1000000 }) });
    expect(result.components.futureFamilySupport).toBeNull();
    expect(result.components.goalObligations).toBeNull();
  });
});
