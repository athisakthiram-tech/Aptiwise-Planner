import { describe, it, expect } from "vitest";
import { STRATEGIES, getStrategyById } from "@/lib/recommendations/strategies";

describe("strategies", () => {
  it("has exactly three strategies", () => {
    expect(STRATEGIES).toHaveLength(3);
  });

  it("each strategy's allocations sum to 100", () => {
    for (const s of STRATEGIES) {
      expect(s.protectionAllocationPct + s.growthAllocationPct).toBe(100);
    }
  });

  it("does not label any strategy as universally best", () => {
    for (const s of STRATEGIES) {
      const text = `${s.title} ${s.tagline} ${s.description}`.toLowerCase();
      expect(text).not.toMatch(/\bbest\b/);
    }
  });

  it("getStrategyById returns the matching strategy", () => {
    expect(getStrategyById("balanced")?.id).toBe("balanced");
    expect(getStrategyById("nonexistent")).toBeUndefined();
  });
});
