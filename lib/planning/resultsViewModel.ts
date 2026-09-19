// Pure, React-free view-model layer between the planning engine's domain
// types (StrategyResult, ProtectionNeedResult, ...) and the customer-
// facing results UI (components/planner/results/*). No financial
// calculation happens here — every number already comes from
// strategyGenerator.ts/protectionNeeds.ts/goalNeeds.ts. This module only
// groups, sorts, and re-shapes that output for rendering, and resolves a
// ValueStatus/StrategyReasonCode to an i18n key + icon — never raw
// English text, so every string stays translatable.

import { InsuranceCategory, ValueStatus } from "@/types/insurance";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { combineNumeric } from "@/lib/planning/statusUtils";
import { StrategyComponent, StrategyFamily, StrategyReasonCode, StrategyResult } from "@/lib/planning/strategyTypes";

// ---- Family grouping ----

export interface StrategyFamilyGroup {
  family: StrategyFamily;
  strategies: StrategyResult[];
}

// A fixed, non-evaluative family order (mirrors strategyGenerator.ts's
// own generation order) — never reordered by perceived quality. Only
// families that actually produced at least one strategy for this
// customer are returned.
const FAMILY_ORDER: StrategyFamily[] = [
  "protection_investment",
  "traditional_protection",
  "market_linked_insurance",
  "traditional_structure",
  "retirement_structure",
];

// Deterministic, neutral ordering within a family — ascending by the
// primary component's Plan Number. This is a tie-break for stable
// rendering, never a quality/preference judgement.
function comparePlanNumberAscending(a: StrategyResult, b: StrategyResult): number {
  const aNum = Number(a.components[0]?.product?.planNumber ?? 0);
  const bNum = Number(b.components[0]?.product?.planNumber ?? 0);
  return aNum - bNum;
}

export function groupStrategiesByFamily(strategies: StrategyResult[]): StrategyFamilyGroup[] {
  return FAMILY_ORDER.map((family) => ({
    family,
    strategies: strategies.filter((s) => s.family === family).sort(comparePlanNumberAscending),
  })).filter((group) => group.strategies.length > 0);
}

// ---- Family display metadata ----

export interface FamilyMeta {
  icon: string;
  titleKey: string;
  blurbKey: string;
}

export const FAMILY_META: Record<StrategyFamily, FamilyMeta> = {
  protection_investment: {
    icon: "🛡️📈",
    titleKey: "results.family.title.protection_investment",
    blurbKey: "results.family.blurb.protection_investment",
  },
  traditional_protection: {
    icon: "🏦🛡️",
    titleKey: "results.family.title.traditional_protection",
    blurbKey: "results.family.blurb.traditional_protection",
  },
  market_linked_insurance: {
    icon: "📊",
    titleKey: "results.family.title.market_linked_insurance",
    blurbKey: "results.family.blurb.market_linked_insurance",
  },
  traditional_structure: {
    icon: "🏦",
    titleKey: "results.family.title.traditional_structure",
    blurbKey: "results.family.blurb.traditional_structure",
  },
  retirement_structure: {
    icon: "🌴",
    titleKey: "results.family.title.retirement_structure",
    blurbKey: "results.family.blurb.retirement_structure",
  },
};

// ---- Status presentation (Section 7) ----

export interface StatusPresentation {
  icon: string;
  i18nKey: string;
}

// Maps the engine's own ValueStatus vocabulary onto a customer-facing
// icon + label — never invents a new status, never recolors one status
// as another.
const STATUS_PRESENTATION: Record<ValueStatus, StatusPresentation> = {
  verified: { icon: "✓", i18nKey: "results.status.verified" },
  illustrative: { icon: "~", i18nKey: "results.status.illustrative" },
  unavailable: { icon: "!", i18nKey: "results.status.unavailable" },
  not_applicable: { icon: "○", i18nKey: "results.status.notApplicable" },
  partial: { icon: "◐", i18nKey: "results.status.partial" },
  conditional: { icon: "◇", i18nKey: "results.status.conditional" },
};

export function getStatusPresentation(status: ValueStatus): StatusPresentation {
  return STATUS_PRESENTATION[status];
}

// ---- Budget safety (Section 6 — critical) ----

export type BudgetPresentation =
  | {
      kind: "verified";
      monthlyBudgetAvailable: number | null;
      used: number;
      remaining: number | null;
    }
  | {
      kind: "unverified";
      monthlyBudgetAvailable: number | null;
      // The illustrative-investment component's assumed monthly amount,
      // if this strategy has one — shown as "before insurance premium
      // adjustment", NEVER summed with an unknown premium into a false
      // "within budget" figure.
      illustrativeInvestmentAmount: number | null;
    };

export function getBudgetPresentation(strategy: StrategyResult): BudgetPresentation {
  if (
    strategy.monthlyBudgetUsageStatus === "verified" &&
    strategy.monthlyBudgetVerifiedUsed != null
  ) {
    return {
      kind: "verified",
      monthlyBudgetAvailable: strategy.monthlyBudgetAvailable,
      used: strategy.monthlyBudgetVerifiedUsed,
      remaining: strategy.remainingBudget,
    };
  }

  const illustrativeComponent = strategy.components.find((c) => c.role === "illustrative_investment");
  return {
    kind: "unverified",
    monthlyBudgetAvailable: strategy.monthlyBudgetAvailable,
    illustrativeInvestmentAmount: illustrativeComponent?.monthlyPremium.value ?? null,
  };
}

// ---- Protection visual (Section 8) ----

export interface ProtectionVisualData {
  required: number | null;
  requiredStatus: ValueStatus;
  existing: number | null;
  providedByStructure: number | null;
  providedByStructureStatus: ValueStatus;
  remainingGap: number | null;
  remainingGapStatus: ValueStatus;
}

function protectionNeedStatusToValueStatus(status: ProtectionNeedResult["status"]): ValueStatus {
  if (status === "calculated") return "verified";
  if (status === "partial") return "partial";
  return "unavailable";
}

export function getProtectionVisualData(
  strategy: StrategyResult,
  protectionNeed: ProtectionNeedResult
): ProtectionVisualData {
  const provided = combineNumeric(strategy.components.map((c) => c.deathBenefit));
  return {
    required: protectionNeed.requiredProtection,
    requiredStatus: protectionNeedStatusToValueStatus(protectionNeed.status),
    existing: protectionNeed.existingProtection,
    providedByStructure: provided.value,
    providedByStructureStatus: provided.status,
    remainingGap: strategy.protectionGap.value,
    remainingGapStatus: strategy.protectionGap.status,
  };
}

// ---- Goal visual (Section 9) ----

export interface GoalVisualData {
  targetGoal: number | null;
  currentResources: number | null;
  structureValue: number | null;
  structureValueStatus: ValueStatus;
  coveragePercent: number | null;
  remainingGap: number | null;
  status: ValueStatus;
}

// The "structure value" contribution is whichever component actually
// reports a maturity/projected value for this strategy (a traditional
// plan's maturity benefit, or the illustrative investment's projection)
// — never both at once (a strategy only ever has one such component) and
// never upgraded past that component's own status.
function findStructureValueComponent(strategy: StrategyResult): StrategyComponent | undefined {
  return strategy.components.find((c) => c.maturityBenefit.value != null);
}

export function getGoalVisualData(strategy: StrategyResult, profile: CustomerFinancialProfile): GoalVisualData {
  const coverage = strategy.goalCoverage;
  const structureComponent = findStructureValueComponent(strategy);

  return {
    targetGoal: profile.targetGoalAmount,
    currentResources: profile.existingInvestments,
    structureValue: structureComponent?.maturityBenefit.value ?? null,
    structureValueStatus: structureComponent?.maturityBenefit.status ?? "unavailable",
    coveragePercent: coverage.value?.coveragePercent ?? null,
    remainingGap: coverage.value?.remainingGap ?? null,
    status: coverage.status,
  };
}

// ---- Reason codes (Section 11) ----

// Single source of truth for every code the strategy generator can
// produce — used both by the UI (to resolve an i18n key) and by tests
// (to assert every code has a translation in every locale).
export const ALL_STRATEGY_REASON_CODES: StrategyReasonCode[] = [
  "PROTECTION_GAP_PRESENT",
  "NO_PROTECTION_GAP",
  "GOAL_FUNDING_REQUIRED",
  "GOAL_ALREADY_COVERED",
  "MARKET_RISK_ACCEPTED",
  "MARKET_RISK_NOT_PREFERRED",
  "LIQUIDITY_IMPORTANT",
  "RETIREMENT_GOAL",
  "PRODUCT_ELIGIBLE",
  "PRODUCT_NEEDS_MORE_INFO",
  "PREMIUM_VERIFIED",
  "PREMIUM_UNAVAILABLE",
  "ADDITIONAL_PROTECTION_REQUIRED",
  "NO_ELIGIBLE_PRODUCTS",
];

export function reasonCodeI18nKey(code: StrategyReasonCode): string {
  return `results.reason.${code}`;
}

// ---- Free-form assumption/warning codes ----
// strategyGenerator.ts records these as stable snake_case codes (not
// StrategyReasonCode — they're documentation of a modeling choice, not a
// "why is this shown" reason) rather than English sentences, so they can
// be localized the same way as everything else.
export function assumptionI18nKey(code: string): string {
  return `results.assumption.${code}`;
}

export function warningI18nKey(code: string): string {
  return `results.warning.${code}`;
}

// ---- Category labels ----

export function categoryI18nKey(category: InsuranceCategory): string {
  return `results.category.${category}`;
}

// ---- Compare selection (Section 12) ----

export const MAX_COMPARE_SELECTIONS = 3;

// Toggling past the limit is a no-op (never silently evicts an existing
// selection) — the UI surfaces `results.compare.limitReached` instead.
export function toggleCompareSelection(current: readonly string[], id: string): string[] {
  if (current.includes(id)) return current.filter((existing) => existing !== id);
  if (current.length >= MAX_COMPARE_SELECTIONS) return [...current];
  return [...current, id];
}
