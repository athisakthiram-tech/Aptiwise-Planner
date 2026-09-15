import { describe, it, expect } from "vitest";
import { totalPlannedContributions, goalProgressPct } from "@/lib/calculations/contributions";

describe("totalPlannedContributions", () => {
  it("multiplies monthly budget by 12 and years", () => {
    expect(totalPlannedContributions(10000, 15)).toBe(10000 * 12 * 15);
  });

  it("returns 0 when years is 0", () => {
    expect(totalPlannedContributions(10000, 0)).toBe(0);
  });

  it("throws for negative inputs", () => {
    expect(() => totalPlannedContributions(-1, 5)).toThrow();
    expect(() => totalPlannedContributions(1000, -1)).toThrow();
  });
});

describe("goalProgressPct", () => {
  it("caps progress at 100", () => {
    expect(goalProgressPct(2000000, 1000000)).toBe(100);
  });

  it("computes a proportional percentage", () => {
    expect(goalProgressPct(500000, 1000000)).toBe(50);
  });

  it("returns 0 for a non-positive target", () => {
    expect(goalProgressPct(500000, 0)).toBe(0);
  });
});
