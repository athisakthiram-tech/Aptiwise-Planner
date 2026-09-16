export interface ComparisonAttribute {
  key: string;
  label: string;
  emoji: string;
  protectionNote: string;
  growthNote: string;
  why: string;
}

// label/protectionNote/growthNote/why hold translation KEYS, not literal
// text — components must render them via t(key, locale). Neutral,
// educational content — never ranks one option as universally superior.
export const COMPARISON_ATTRIBUTES: ComparisonAttribute[] = [
  {
    key: "life_cover",
    label: "protection.compare.life_cover.label",
    emoji: "❤️",
    protectionNote: "protection.compare.life_cover.protectionNote",
    growthNote: "protection.compare.life_cover.growthNote",
    why: "protection.compare.life_cover.why",
  },
  {
    key: "goal_planning",
    label: "protection.compare.goal_planning.label",
    emoji: "🎯",
    protectionNote: "protection.compare.goal_planning.protectionNote",
    growthNote: "protection.compare.goal_planning.growthNote",
    why: "protection.compare.goal_planning.why",
  },
  {
    key: "growth_potential",
    label: "protection.compare.growth_potential.label",
    emoji: "📈",
    protectionNote: "protection.compare.growth_potential.protectionNote",
    growthNote: "protection.compare.growth_potential.growthNote",
    why: "protection.compare.growth_potential.why",
  },
  {
    key: "volatility",
    label: "protection.compare.volatility.label",
    emoji: "🎢",
    protectionNote: "protection.compare.volatility.protectionNote",
    growthNote: "protection.compare.volatility.growthNote",
    why: "protection.compare.volatility.why",
  },
  {
    key: "liquidity",
    label: "protection.compare.liquidity.label",
    emoji: "💧",
    protectionNote: "protection.compare.liquidity.protectionNote",
    growthNote: "protection.compare.liquidity.growthNote",
    why: "protection.compare.liquidity.why",
  },
  {
    key: "family_protection",
    label: "protection.compare.family_protection.label",
    emoji: "🛡️",
    protectionNote: "protection.compare.family_protection.protectionNote",
    growthNote: "protection.compare.family_protection.growthNote",
    why: "protection.compare.family_protection.why",
  },
];
