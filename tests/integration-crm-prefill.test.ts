import { describe, it, expect } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { deriveAgeFromDateOfBirth, mapPrefillToProfileSeed, PlannerPrefill } from "@/lib/integration/crm/prefill";
import { validateCrmPrefillPayload } from "@/lib/integration/crm/validation";

describe("deriveAgeFromDateOfBirth — DOB -> age boundary behavior", () => {
  it("computes age correctly when the birthday has already passed this year", () => {
    expect(deriveAgeFromDateOfBirth("2000-01-15", "2026-09-19")).toBe(26);
  });

  it("computes age correctly on the exact birthday", () => {
    expect(deriveAgeFromDateOfBirth("2000-09-19", "2026-09-19")).toBe(26);
  });

  it("has not yet incremented age the day before the birthday", () => {
    expect(deriveAgeFromDateOfBirth("2000-09-20", "2026-09-19")).toBe(25);
  });

  it("returns null for a date of birth in the future", () => {
    expect(deriveAgeFromDateOfBirth("2030-01-01", "2026-09-19")).toBeNull();
  });

  it("returns null for an implausible age (>119)", () => {
    expect(deriveAgeFromDateOfBirth("1850-01-01", "2026-09-19")).toBeNull();
  });

  it("returns null for a malformed date string, never a guessed number", () => {
    expect(deriveAgeFromDateOfBirth("not-a-date", "2026-09-19")).toBeNull();
    expect(deriveAgeFromDateOfBirth("2000-13-40", "2026-09-19")).toBeNull();
  });
});

describe("mapPrefillToProfileSeed — CRM prefill never fabricates planning-specific fields", () => {
  it("derives age from dateOfBirth, never trusting a raw sent age (there is no 'age' field to trust)", () => {
    const prefill: PlannerPrefill = { dateOfBirth: "1990-06-01" };
    const seed = mapPrefillToProfileSeed(prefill, "2026-09-19");
    expect(seed.age).toBe(36);
  });

  it("leaves age unset (not 0, not undefined-as-zero) when DOB is absent or invalid", () => {
    expect(mapPrefillToProfileSeed({}, "2026-09-19").age).toBeUndefined();
    expect(mapPrefillToProfileSeed({ dateOfBirth: "bad" }, "2026-09-19").age).toBeUndefined();
  });

  it("derives annualIncome from monthlyIncome deterministically", () => {
    const seed = mapPrefillToProfileSeed({ monthlyIncome: 50000 }, "2026-09-19");
    expect(seed.annualIncome).toBe(600000);
  });

  it("never sets any planning-specific field CRM doesn't structure today", () => {
    const seed = mapPrefillToProfileSeed(
      { customerName: "Ananya", phone: "9876543210", dateOfBirth: "1990-06-01", occupation: "Teacher", familySize: 4, monthlyIncome: 50000 },
      "2026-09-19"
    );
    // Goal/coverage/liabilities/investments/budget/risk stay entirely
    // untouched by CRM prefill — Planner must still collect these.
    const seedKeys = Object.keys(seed);
    for (const forbidden of [
      "goalType",
      "targetGoalAmount",
      "yearsToGoal",
      "existingLifeCover",
      "existingInvestments",
      "outstandingLiabilities",
      "monthlyBudget",
      "riskComfort",
      "liquidityPreference",
      "numberOfDependants",
    ]) {
      expect(seedKeys, `mapPrefillToProfileSeed unexpectedly set ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("does NOT automatically map CRM familySize into numberOfDependants (requires advisor confirmation)", () => {
    const seed = mapPrefillToProfileSeed({ familySize: 4 }, "2026-09-19");
    expect(seed.numberOfDependants).toBeUndefined();
  });

  it("merged with UNKNOWN_CUSTOMER_PROFILE, every non-CRM field stays null — unknown never becomes zero", () => {
    const seed = mapPrefillToProfileSeed({ dateOfBirth: "1990-06-01", monthlyIncome: 50000 }, "2026-09-19");
    const profile = { ...UNKNOWN_CUSTOMER_PROFILE, ...seed };
    expect(profile.existingLifeCover).toBeNull();
    expect(profile.existingInvestments).toBeNull();
    expect(profile.outstandingLiabilities).toBeNull();
    expect(profile.monthlyBudget).toBeNull();
    expect(profile.targetGoalAmount).toBeNull();
    expect(profile.age).toBe(36);
    expect(profile.annualIncome).toBe(600000);
  });
});

describe("CRM provenance never affects financial calculation", () => {
  it("a profile seeded from CRM prefill produces IDENTICAL protection/goal-need results to the same values entered manually", () => {
    const crmSeed = mapPrefillToProfileSeed({ dateOfBirth: "1990-06-01", monthlyIncome: 50000 }, "2026-09-19");
    const crmProfile = {
      ...UNKNOWN_CUSTOMER_PROFILE,
      ...crmSeed,
      monthlyBudget: 15000,
      goalType: "child_education" as const,
      targetGoalAmount: 3000000,
      yearsToGoal: 15,
      existingInvestments: 400000,
      outstandingLiabilities: 1500000,
      existingLifeCover: 500000,
    };
    const manualProfile = {
      ...UNKNOWN_CUSTOMER_PROFILE,
      age: 36,
      annualIncome: 600000,
      monthlyBudget: 15000,
      goalType: "child_education" as const,
      targetGoalAmount: 3000000,
      yearsToGoal: 15,
      existingInvestments: 400000,
      outstandingLiabilities: 1500000,
      existingLifeCover: 500000,
    };

    expect(calculateProtectionNeed({ profile: crmProfile })).toEqual(calculateProtectionNeed({ profile: manualProfile }));
    expect(
      calculateGoalNeed({ targetGoal: crmProfile.targetGoalAmount, currentResources: crmProfile.existingInvestments })
    ).toEqual(calculateGoalNeed({ targetGoal: manualProfile.targetGoalAmount, currentResources: manualProfile.existingInvestments }));
  });
});

describe("validateCrmPrefillPayload — untrusted external data", () => {
  it("accepts a fully valid payload", () => {
    const result = validateCrmPrefillPayload({
      name: "Ananya",
      phone: "9876543210",
      dateOfBirth: "1990-06-01",
      occupation: "Teacher",
      familySize: 4,
      monthlyIncome: 50000,
    });
    expect(result.valid).toBe(true);
    expect(result.value?.customerName).toBe("Ananya");
  });

  it("accepts an empty payload (every field optional — CRM may know nothing yet)", () => {
    expect(validateCrmPrefillPayload({}).valid).toBe(true);
  });

  it("rejects a future date of birth", () => {
    const result = validateCrmPrefillPayload({ dateOfBirth: "2099-01-01" });
    expect(result.valid).toBe(false);
  });

  it("rejects NaN/Infinity for monthlyIncome, never silently converting it", () => {
    expect(validateCrmPrefillPayload({ monthlyIncome: NaN }).valid).toBe(false);
    expect(validateCrmPrefillPayload({ monthlyIncome: Infinity }).valid).toBe(false);
  });

  it("rejects a negative or non-integer family size", () => {
    expect(validateCrmPrefillPayload({ familySize: -1 }).valid).toBe(false);
    expect(validateCrmPrefillPayload({ familySize: 2.5 }).valid).toBe(false);
  });

  it("rejects an oversized name/occupation string rather than truncating it", () => {
    const result = validateCrmPrefillPayload({ name: "A".repeat(1000) });
    expect(result.valid).toBe(false);
    expect(result.value).toBeNull();
  });

  it("rejects a non-object payload", () => {
    expect(validateCrmPrefillPayload(null).valid).toBe(false);
    expect(validateCrmPrefillPayload("not an object").valid).toBe(false);
    expect(validateCrmPrefillPayload(42).valid).toBe(false);
  });
});
