// Core domain types for Aptiwise Planner.
// Kept independent of any product/vendor so real Aptiwise/insurer data
// can be plugged in later without changing the UI layer.

export type GoalType =
  | "child_education"
  | "home"
  | "marriage"
  | "retirement"
  | "wealth"
  | "family_protection";

export type RiskComfort = "low" | "medium" | "high";

export interface GoalInput {
  age: number;
  monthlyBudget: number;
  goalType: GoalType;
  targetAmount: number;
  yearsToGoal: number;
  existingLifeCover: number;
  riskComfort: RiskComfort;
}

export type StrategyId = "protection_first" | "balanced" | "growth_focused";

export interface Strategy {
  id: StrategyId;
  title: string;
  emoji: string;
  tagline: string;
  description: string;
  riskLabel: string;
  riskEmoji: string;
  protectionAllocationPct: number;
  growthAllocationPct: number;
}

export interface InvestmentProjectionPoint {
  annualRatePct: number;
  futureValue: number;
}

export interface InvestmentProjectionInput {
  monthlyAmount: number;
  years: number;
}

// Mock product types — placeholders only, no real insurer/fund data.
export type ProductCategory = "protection" | "savings" | "equity";

export interface MockProduct {
  id: string;
  category: ProductCategory;
  name: string;
  provider: string;
  summary: string;
  isGuaranteed: boolean;
}
