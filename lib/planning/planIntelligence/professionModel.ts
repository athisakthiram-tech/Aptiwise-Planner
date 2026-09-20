// Profession model (Sections 14/15). Deliberately NOT a product mapping
// — "Engineer -> Jeevan Labh" is exactly what this module refuses to do.
// A profession only ever produces broad CASH-FLOW HINTS (income
// stability, PPT sustainability, mode preference, liquidity importance),
// which customerSuitability.ts treats as a starting default that any
// explicit customer input always overrides.

import { ProfessionCashFlowHints, ProfessionProfile } from "@/lib/planning/planIntelligence/types";

const PROFESSION_HINTS: Record<ProfessionProfile, ProfessionCashFlowHints> = {
  SALARIED_STABLE: {
    incomeStability: "STABLE",
    monthlyPredictability: "HIGH",
    longPptSustainability: "LIKELY_SUSTAINABLE",
    preferredPremiumModeHint: "monthly",
    liquidityImportance: "MEDIUM",
  },
  SALARIED_VARIABLE: {
    incomeStability: "VARIABLE",
    monthlyPredictability: "MEDIUM",
    longPptSustainability: "UNCERTAIN",
    preferredPremiumModeHint: "NO_STRONG_PREFERENCE",
    liquidityImportance: "MEDIUM",
  },
  SELF_EMPLOYED: {
    incomeStability: "VARIABLE",
    monthlyPredictability: "MEDIUM",
    longPptSustainability: "UNCERTAIN",
    preferredPremiumModeHint: "yearly",
    liquidityImportance: "MEDIUM",
  },
  BUSINESS_OWNER: {
    incomeStability: "VARIABLE",
    monthlyPredictability: "LOW",
    longPptSustainability: "UNCERTAIN",
    preferredPremiumModeHint: "yearly",
    liquidityImportance: "HIGH",
  },
  PROFESSIONAL: {
    incomeStability: "STABLE",
    monthlyPredictability: "HIGH",
    longPptSustainability: "LIKELY_SUSTAINABLE",
    preferredPremiumModeHint: "NO_STRONG_PREFERENCE",
    liquidityImportance: "MEDIUM",
  },
  AGRICULTURE_SEASONAL: {
    incomeStability: "SEASONAL",
    monthlyPredictability: "LOW",
    longPptSustainability: "UNCERTAIN",
    preferredPremiumModeHint: "yearly",
    liquidityImportance: "HIGH",
  },
  IRREGULAR_INCOME: {
    incomeStability: "VARIABLE",
    monthlyPredictability: "LOW",
    longPptSustainability: "UNLIKELY",
    preferredPremiumModeHint: "single",
    liquidityImportance: "HIGH",
  },
  RETIRED: {
    incomeStability: "STABLE",
    monthlyPredictability: "HIGH",
    longPptSustainability: "UNCERTAIN",
    preferredPremiumModeHint: "single",
    liquidityImportance: "HIGH",
  },
  OTHER: {
    incomeStability: "UNKNOWN",
    monthlyPredictability: "UNKNOWN",
    longPptSustainability: "UNKNOWN",
    preferredPremiumModeHint: "NO_STRONG_PREFERENCE",
    liquidityImportance: "UNKNOWN",
  },
};

export function getProfessionCashFlowHints(profile: ProfessionProfile): ProfessionCashFlowHints {
  return PROFESSION_HINTS[profile];
}

// A free-text profession label never maps to a product — it maps, at
// most, to one of these broad profiles, and only when the text clearly
// suggests one; anything unclear stays OTHER (unknown), never guessed
// into a specific product-relevant category.
const KEYWORD_HINTS: { profile: ProfessionProfile; keywords: RegExp }[] = [
  { profile: "BUSINESS_OWNER", keywords: /business owner|entrepreneur|proprietor/i },
  { profile: "SELF_EMPLOYED", keywords: /self.?employed|freelance|consultant/i },
  { profile: "AGRICULTURE_SEASONAL", keywords: /farm|agricult/i },
  { profile: "RETIRED", keywords: /retired/i },
  { profile: "PROFESSIONAL", keywords: /doctor|lawyer|engineer|architect|accountant|ca\b|chartered/i },
  { profile: "SALARIED_STABLE", keywords: /salaried|employee|govern?ment|service/i },
];

export function inferProfessionProfile(freeText: string | null | undefined): ProfessionProfile {
  if (!freeText) return "OTHER";
  const match = KEYWORD_HINTS.find((k) => k.keywords.test(freeText));
  return match?.profile ?? "OTHER";
}
