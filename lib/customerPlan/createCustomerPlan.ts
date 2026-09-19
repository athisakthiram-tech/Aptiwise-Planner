// Builds a CustomerPlan — a STABLE SNAPSHOT of already-calculated
// planning results, never a live reference. This function:
//
//  - runs NO product engine and derives NO new financial figure itself —
//    every number here already came from strategyGenerator.ts,
//    protectionNeeds.ts, goalNeeds.ts or lib/planning/resultsViewModel.ts;
//  - deep-copies every nested object/array it stores, so mutating the
//    CustomerPlan later (or a future change to the live StrategyResult
//    object it was built from) can never retroactively alter a saved
//    plan;
//  - is deterministic except for the injectable id/time providers, so
//    tests can assert byte-for-byte snapshot equality.
//
// A future update to a product's rate table, or to the strategy
// generator's own logic, must never silently change an already-created
// plan — that is the entire reason this module exists instead of simply
// storing a strategyId and re-running the pipeline on open.

import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { GoalNeedResult } from "@/lib/planning/goalNeeds";
import { getGoalVisualData, getProtectionVisualData } from "@/lib/planning/resultsViewModel";
import { StrategyComponent, StrategyResult } from "@/lib/planning/strategyTypes";
import { deriveDisclosures } from "@/lib/customerPlan/disclosures";
import { validateCustomerPlan } from "@/lib/customerPlan/customerPlanValidation";
import {
  CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION,
  CustomerPlan,
  CustomerPlanComponentSnapshot,
  CustomerPlanIdentity,
} from "@/lib/customerPlan/types";
import { ComparisonValue, ValueStatus } from "@/lib/comparison/protectionAdjustedComparison";
import { Locale } from "@/lib/i18n/types";

export interface CreateCustomerPlanInput {
  customerProfile: CustomerFinancialProfile;
  protectionNeed: ProtectionNeedResult;
  goalNeed: GoalNeedResult;
  selectedStrategy: StrategyResult;
  locale: Locale;
  customer?: { name?: string | null; phone?: string | null };
  // Injectable for deterministic tests — default to real id/time.
  idProvider?: () => string;
  nowProvider?: () => Date;
}

function defaultId(): string {
  // crypto.randomUUID is available in both modern browsers and Node 19+;
  // this codebase's CustomerPlan id has no other meaning than uniqueness.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Deep-copies a ComparisonValue without assuming its `value` is a
// primitive (GoalCoverage is a plain object) — a plain-object spread is
// enough here since nothing in this codebase nests a ComparisonValue's
// value more than one level deep.
function cloneComparisonValue<T>(cv: ComparisonValue<T>): ComparisonValue<T> {
  const clonedValue =
    cv.value != null && typeof cv.value === "object" ? ({ ...(cv.value as object) } as T) : cv.value;
  return { value: clonedValue, status: cv.status, source: cv.source, noteCode: cv.noteCode };
}

function needStatusToValueStatus(status: ProtectionNeedResult["status"] | GoalNeedResult["status"]): ValueStatus {
  if (status === "calculated") return "verified";
  if (status === "partial") return "partial";
  return "unavailable";
}

function snapshotComponent(component: StrategyComponent): CustomerPlanComponentSnapshot {
  const premium = cloneComparisonValue(component.monthlyPremium);
  const maturityBenefit = cloneComparisonValue(component.maturityBenefit);

  return {
    role: component.role,
    provider: component.product ? "LIC" : null,
    product: component.product
      ? {
          productName: component.product.productName,
          planNumber: component.product.planNumber,
          uin: component.product.uin,
          category: component.product.category,
          sourceId: `lic-${component.product.planNumber}`,
        }
      : null,
    eligible: component.eligible,
    premium,
    deathBenefit: cloneComparisonValue(component.deathBenefit),
    maturityBenefit,
    // Never fabricated: only present when the generator actually
    // recorded the rate/duration used AND both figures are known.
    investmentIllustration:
      component.illustration != null && premium.value != null && maturityBenefit.value != null
        ? {
            contributionAmount: premium.value,
            years: component.illustration.years,
            ratePct: component.illustration.ratePct,
            projectedValue: maturityBenefit.value,
            status: "illustrative",
            disclaimerCode: "illustration_only_not_guaranteed_returns",
          }
        : null,
    reasonCodes: [...component.reasonCodes],
  };
}

function snapshotIdentity(customer: CreateCustomerPlanInput["customer"]): CustomerPlanIdentity {
  return {
    name: customer?.name?.trim() ? customer.name.trim() : null,
    phone: customer?.phone?.trim() ? customer.phone.trim() : null,
  };
}

export function createCustomerPlan(input: CreateCustomerPlanInput): CustomerPlan {
  const { customerProfile, protectionNeed, goalNeed, selectedStrategy, locale } = input;
  const now = (input.nowProvider ?? (() => new Date()))().toISOString();
  const id = (input.idProvider ?? defaultId)();

  const protectionVisual = getProtectionVisualData(selectedStrategy, protectionNeed);
  const goalVisual = getGoalVisualData(selectedStrategy, customerProfile);

  const plan: CustomerPlan = {
    id,
    schemaVersion: CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    localeAtCreation: locale,
    customer: snapshotIdentity(input.customer),
    financialPicture: {
      goal: {
        goalType: customerProfile.goalType,
        targetAmount: customerProfile.targetGoalAmount,
        yearsToGoal: customerProfile.yearsToGoal,
        currentResources: customerProfile.existingInvestments,
        structureValue: goalVisual.structureValue,
        goalCoveragePercent: goalVisual.coveragePercent,
        remainingGoalGap: goalVisual.remainingGap,
        structureValueStatus: goalVisual.structureValueStatus,
        status: needStatusToValueStatus(goalNeed.status),
      },
      protection: {
        requiredProtection: protectionVisual.required,
        requiredStatus: protectionVisual.requiredStatus,
        existingProtection: protectionVisual.existing,
        protectionProvidedByStructure: protectionVisual.providedByStructure,
        protectionProvidedByStructureStatus: protectionVisual.providedByStructureStatus,
        remainingProtectionGap: protectionVisual.remainingGap,
        remainingProtectionGapStatus: protectionVisual.remainingGapStatus,
        methodology: protectionNeed.methodology,
      },
      budget: {
        monthlyBudgetAvailable: selectedStrategy.monthlyBudgetAvailable,
        monthlyBudgetVerifiedUsed: selectedStrategy.monthlyBudgetVerifiedUsed,
        monthlyBudgetUsageStatus: selectedStrategy.monthlyBudgetUsageStatus,
        remainingBudget: selectedStrategy.remainingBudget,
      },
    },
    selectedStrategy: {
      strategyId: selectedStrategy.id,
      family: selectedStrategy.family,
      components: selectedStrategy.components.map(snapshotComponent),
      protectionCoverage: cloneComparisonValue(selectedStrategy.protectionCoverage),
      protectionGap: cloneComparisonValue(selectedStrategy.protectionGap),
      goalCoverage: cloneComparisonValue(selectedStrategy.goalCoverage),
      goalGap: cloneComparisonValue(selectedStrategy.goalGap),
      marketExposure: cloneComparisonValue(selectedStrategy.marketExposure),
      liquidity: cloneComparisonValue(selectedStrategy.liquidity),
      guarantees: cloneComparisonValue(selectedStrategy.guarantees),
      costs: cloneComparisonValue(selectedStrategy.costs),
      taxTreatment: cloneComparisonValue(selectedStrategy.taxTreatment),
      assumptions: [...selectedStrategy.assumptions],
      warnings: [...selectedStrategy.warnings],
      reasonCodes: [...selectedStrategy.reasonCodes],
      confidence: selectedStrategy.confidence,
    },
    disclosures: deriveDisclosures(selectedStrategy),
    sourceMetadata: {
      snapshotNote: "snapshot_not_live_reference",
      strategyIdAtCreation: selectedStrategy.id,
    },
  };

  // Belt-and-braces: round-trip through JSON so the returned plan can
  // never accidentally retain a live reference into the caller's
  // StrategyResult/profile objects (e.g. a shared nested array) even if
  // a future edit to this function forgets to clone something.
  const snapshot = JSON.parse(JSON.stringify(plan)) as CustomerPlan;

  // A proposal that fails its own invariants is a bug in this builder
  // (or in the strategy it was built from) — surfaced immediately as an
  // exception rather than silently persisted or repaired.
  const validation = validateCustomerPlan(snapshot);
  if (!validation.valid) {
    throw new Error(`createCustomerPlan produced an invalid plan: ${validation.errors.join("; ")}`);
  }

  return snapshot;
}
