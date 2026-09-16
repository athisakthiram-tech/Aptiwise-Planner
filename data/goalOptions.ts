import { GoalType, RiskComfort } from "@/types";

// `label`/`riskLabel` hold translation KEYS (see lib/i18n/translations.ts),
// not literal text — components must render them via t(key, locale).
export const GOAL_TYPE_OPTIONS: { id: GoalType; label: string; emoji: string }[] = [
  { id: "child_education", label: "goals.type.child_education", emoji: "🎓" },
  { id: "home", label: "goals.type.home", emoji: "🏠" },
  { id: "marriage", label: "goals.type.marriage", emoji: "💍" },
  { id: "retirement", label: "goals.type.retirement", emoji: "🌴" },
  { id: "wealth", label: "goals.type.wealth", emoji: "💰" },
  { id: "family_protection", label: "goals.type.family_protection", emoji: "🛡️" },
];

export const RISK_COMFORT_OPTIONS: { id: RiskComfort; label: string; emoji: string }[] = [
  { id: "low", label: "risk.low", emoji: "🟢" },
  { id: "medium", label: "risk.medium", emoji: "🟡" },
  { id: "high", label: "risk.high", emoji: "🔴" },
];

export function getGoalOption(goalType: GoalType) {
  return GOAL_TYPE_OPTIONS.find((g) => g.id === goalType)!;
}
