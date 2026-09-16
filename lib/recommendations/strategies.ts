import { Strategy } from "@/types";

// title/tagline/description/riskLabel hold translation KEYS, not literal
// text — components must render them via t(key, locale). Deliberately
// neutral content: none is labeled "best"; allocations are illustrative
// starting points for discussion, not personalized advice.
export const STRATEGIES: Strategy[] = [
  {
    id: "protection_first",
    title: "strategy.protection_first.title",
    emoji: "🛡️",
    tagline: "strategy.protection_first.tagline",
    description: "strategy.protection_first.description",
    riskLabel: "strategy.risk.lower",
    riskEmoji: "🟢",
    protectionAllocationPct: 60,
    growthAllocationPct: 40,
  },
  {
    id: "balanced",
    title: "strategy.balanced.title",
    emoji: "⚖️",
    tagline: "strategy.balanced.tagline",
    description: "strategy.balanced.description",
    riskLabel: "strategy.risk.medium",
    riskEmoji: "🟡",
    protectionAllocationPct: 40,
    growthAllocationPct: 60,
  },
  {
    id: "growth_focused",
    title: "strategy.growth_focused.title",
    emoji: "🚀",
    tagline: "strategy.growth_focused.tagline",
    description: "strategy.growth_focused.description",
    riskLabel: "strategy.risk.higher",
    riskEmoji: "🔴",
    protectionAllocationPct: 20,
    growthAllocationPct: 80,
  },
];

export function getStrategyById(id: string): Strategy | undefined {
  return STRATEGIES.find((s) => s.id === id);
}
