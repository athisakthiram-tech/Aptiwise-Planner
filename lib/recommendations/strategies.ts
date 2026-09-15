import { Strategy } from "@/types";

// Presentational strategy definitions. Deliberately neutral — none is
// labeled "best"; allocations are illustrative starting points for
// discussion, not personalized advice.
export const STRATEGIES: Strategy[] = [
  {
    id: "protection_first",
    title: "Protection First",
    emoji: "🛡️",
    tagline: "Protection + conservative savings orientation",
    description:
      "Prioritises life cover and capital safety, with a smaller share aimed at steady, lower-volatility growth.",
    riskLabel: "Lower",
    riskEmoji: "🟢",
    protectionAllocationPct: 60,
    growthAllocationPct: 40,
  },
  {
    id: "balanced",
    title: "Balanced",
    emoji: "⚖️",
    tagline: "Protection + market-linked growth",
    description:
      "Splits attention between protecting the family and letting a meaningful portion pursue market-linked growth.",
    riskLabel: "Medium",
    riskEmoji: "🟡",
    protectionAllocationPct: 40,
    growthAllocationPct: 60,
  },
  {
    id: "growth_focused",
    title: "Growth Focused",
    emoji: "🚀",
    tagline: "Greater market exposure",
    description:
      "Leans towards market-linked instruments for higher growth potential, while keeping a base level of protection.",
    riskLabel: "Higher",
    riskEmoji: "🔴",
    protectionAllocationPct: 20,
    growthAllocationPct: 80,
  },
];

export function getStrategyById(id: string): Strategy | undefined {
  return STRATEGIES.find((s) => s.id === id);
}
