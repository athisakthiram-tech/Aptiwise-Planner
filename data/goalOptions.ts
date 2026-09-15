import { GoalType, RiskComfort } from "@/types";

export const GOAL_TYPE_OPTIONS: { id: GoalType; label: string; emoji: string }[] = [
  { id: "child_education", label: "Child Education", emoji: "🎓" },
  { id: "home", label: "Home", emoji: "🏠" },
  { id: "marriage", label: "Marriage", emoji: "💍" },
  { id: "retirement", label: "Retirement", emoji: "🌴" },
  { id: "wealth", label: "Wealth", emoji: "💰" },
  { id: "family_protection", label: "Family Protection", emoji: "🛡️" },
];

export const RISK_COMFORT_OPTIONS: { id: RiskComfort; label: string; emoji: string }[] = [
  { id: "low", label: "Low", emoji: "🟢" },
  { id: "medium", label: "Medium", emoji: "🟡" },
  { id: "high", label: "High", emoji: "🔴" },
];

export function getGoalOption(goalType: GoalType) {
  return GOAL_TYPE_OPTIONS.find((g) => g.id === goalType)!;
}
