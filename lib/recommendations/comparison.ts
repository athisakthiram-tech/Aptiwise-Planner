export interface ComparisonAttribute {
  key: string;
  label: string;
  emoji: string;
  protectionNote: string;
  growthNote: string;
  why: string;
}

// Neutral, educational comparison content — never ranks one option as
// universally superior.
export const COMPARISON_ATTRIBUTES: ComparisonAttribute[] = [
  {
    key: "life_cover",
    label: "Life Cover",
    emoji: "❤️",
    protectionNote: "Pays a sum assured to family on an insured event, per policy terms.",
    growthNote: "No life cover component.",
    why: "Life insurance is a contract to pay a defined benefit on a covered event, subject to the policy's terms and exclusions. Market investments don't provide this contractual protection.",
  },
  {
    key: "goal_planning",
    label: "Goal Planning",
    emoji: "🎯",
    protectionNote: "Some plans combine cover with disciplined savings.",
    growthNote: "Commonly used to target a future corpus.",
    why: "Both can support a goal, but they work differently — one via a protection contract, the other via market participation.",
  },
  {
    key: "growth_potential",
    label: "Growth Potential",
    emoji: "📈",
    protectionNote: "Typically lower, some portions may be guaranteed.",
    growthNote: "Potentially higher, but not assured.",
    why: "Market-linked instruments have historically offered higher long-term growth potential, but returns are never guaranteed and can be negative in any given period.",
  },
  {
    key: "volatility",
    label: "Market Volatility",
    emoji: "🎢",
    protectionNote: "Guaranteed components are largely insulated from market swings.",
    growthNote: "Value can rise and fall with markets.",
    why: "Market-linked products fluctuate with market conditions. Insurance guarantees (where applicable) come from the insurer's contractual promise, not market performance.",
  },
  {
    key: "liquidity",
    label: "Liquidity",
    emoji: "💧",
    protectionNote: "Often limited; early exit may reduce value or attract charges.",
    growthNote: "Generally more accessible, though this varies by product.",
    why: "Insurance products are designed for the long term and may penalise early withdrawal. Many investment products offer easier access to funds, but this varies widely.",
  },
  {
    key: "family_protection",
    label: "Family Protection",
    emoji: "🛡️",
    protectionNote: "Core purpose — a defined payout to protect dependents.",
    growthNote: "Indirect — depends on the value accumulated at the time of need.",
    why: "Insurance is purpose-built to protect a family financially on a covered event. Investments can help a family too, but only to the extent value has already accumulated.",
  },
];
