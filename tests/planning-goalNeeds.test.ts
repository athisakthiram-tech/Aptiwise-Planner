import { describe, it, expect } from "vitest";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";

describe("Goal Need — coverage below, at, and above 100%", () => {
  it("reports coverage below 100% with a remaining gap and no surplus", () => {
    const result = calculateGoalNeed({ targetGoal: 5000000, currentResources: 3000000 });
    expect(result.status).toBe("calculated");
    expect(result.goalCoveragePercent).toBe(60);
    expect(result.remainingGoalGap).toBe(2000000);
    expect(result.surplus).toBe(0);
  });

  it("reports exactly 100% coverage with zero gap and zero surplus", () => {
    const result = calculateGoalNeed({ targetGoal: 5000000, currentResources: 5000000 });
    expect(result.goalCoveragePercent).toBe(100);
    expect(result.remainingGoalGap).toBe(0);
    expect(result.surplus).toBe(0);
  });

  it("reports above 100% coverage with a surplus and zero gap", () => {
    const result = calculateGoalNeed({ targetGoal: 5000000, currentResources: 7000000 });
    expect(result.goalCoveragePercent).toBe(140);
    expect(result.remainingGoalGap).toBe(0);
    expect(result.surplus).toBe(2000000);
  });
});

describe("Goal Need — zero/invalid target handling", () => {
  it("returns unavailable for a zero target rather than dividing by zero", () => {
    const result = calculateGoalNeed({ targetGoal: 0, currentResources: 1000000 });
    expect(result.status).toBe("unavailable");
    expect(result.goalCoveragePercent).toBeNull();
  });

  it("returns unavailable for a negative target", () => {
    const result = calculateGoalNeed({ targetGoal: -100, currentResources: 1000000 });
    expect(result.status).toBe("unavailable");
  });

  it("returns unavailable when the target itself is unknown", () => {
    const result = calculateGoalNeed({ targetGoal: null, currentResources: 1000000 });
    expect(result.status).toBe("unavailable");
    expect(result.goalCoverageAmount).toBeNull();
  });
});

describe("Goal Need — missing values never become zero", () => {
  it("returns unavailable (not a 0% coverage) when no resources are known at all", () => {
    const result = calculateGoalNeed({ targetGoal: 5000000, currentResources: null });
    expect(result.status).toBe("unavailable");
    expect(result.goalCoveragePercent).toBeNull();
    expect(result.currentResources).toBeNull();
  });

  it("marks status partial when currentResources is unknown but a projected resource is known", () => {
    const result = calculateGoalNeed({
      targetGoal: 5000000,
      currentResources: null,
      projectedResources: { amount: 2000000, status: "illustrative" },
    });
    expect(result.status).toBe("partial");
    expect(result.goalCoveragePercent).toBe(40);
  });
});

describe("Goal Need — confidence never upgraded past the weakest known resource", () => {
  it("uses illustrative confidence when the only resource is an illustrative projection", () => {
    const result = calculateGoalNeed({
      targetGoal: 1000000,
      currentResources: null,
      projectedResources: { amount: 1000000, status: "illustrative" },
    });
    expect(result.confidence).toBe("illustrative");
  });

  it("downgrades combined confidence to the weaker of the two resource statuses", () => {
    const result = calculateGoalNeed({
      targetGoal: 1000000,
      currentResources: 500000, // treated as "verified" (customer-stated)
      projectedResources: { amount: 500000, status: "illustrative" },
    });
    expect(result.confidence).toBe("illustrative");
  });

  it("reports verified confidence when only the customer's own stated resources are used", () => {
    const result = calculateGoalNeed({ targetGoal: 1000000, currentResources: 500000 });
    expect(result.confidence).toBe("verified");
  });
});
