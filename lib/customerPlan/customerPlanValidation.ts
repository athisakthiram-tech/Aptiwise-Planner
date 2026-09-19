// Runtime validation for CustomerPlan — no external schema-validation
// dependency (this codebase doesn't already depend on one, and the
// shape is small and stable enough not to need one). Validation only
// REPORTS problems; it never repairs, coerces, or fabricates a value to
// make an invalid plan pass.

import { ValueStatus } from "@/types/insurance";
import { CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION, CustomerPlan } from "@/lib/customerPlan/types";

export interface CustomerPlanValidationResult {
  valid: boolean;
  errors: string[];
}

const VALUE_STATUSES: ValueStatus[] = [
  "verified",
  "illustrative",
  "partial",
  "conditional",
  "unavailable",
  "not_applicable",
];

function isValueStatus(x: unknown): x is ValueStatus {
  return typeof x === "string" && (VALUE_STATUSES as string[]).includes(x);
}

// A value is "finite where present" — null/undefined are fine (unknown),
// but a present numeric field must never be NaN or +/-Infinity.
function isFiniteOrAbsent(x: unknown): boolean {
  return x == null || (typeof x === "number" && Number.isFinite(x));
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.length > 0;
}

const UIN_PATTERN = /^512[A-Z]\d{3}V\d{2}$/;

function pushIf(errors: string[], condition: boolean, message: string) {
  if (condition) errors.push(message);
}

export function validateCustomerPlan(candidate: unknown): CustomerPlanValidationResult {
  const errors: string[] = [];

  if (candidate == null || typeof candidate !== "object") {
    return { valid: false, errors: ["Plan is not an object."] };
  }
  const plan = candidate as Partial<CustomerPlan>;

  pushIf(errors, plan.schemaVersion !== CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION, `Unsupported schema version: ${String(plan.schemaVersion)}.`);
  pushIf(errors, !isNonEmptyString(plan.id), "Missing or empty plan id.");
  pushIf(errors, !isNonEmptyString(plan.createdAt) || Number.isNaN(Date.parse(plan.createdAt as string)), "Missing or invalid createdAt.");
  pushIf(errors, !isNonEmptyString(plan.updatedAt) || Number.isNaN(Date.parse(plan.updatedAt as string)), "Missing or invalid updatedAt.");

  if (!plan.selectedStrategy) {
    errors.push("Missing selectedStrategy.");
  } else {
    const strategy = plan.selectedStrategy;
    pushIf(errors, !isNonEmptyString(strategy.strategyId), "selectedStrategy.strategyId is missing.");
    pushIf(errors, !isValueStatus(strategy.confidence), "selectedStrategy.confidence is not a recognized status.");
    pushIf(errors, !Array.isArray(strategy.components) || strategy.components.length === 0, "selectedStrategy must have at least one component.");

    for (const [i, component] of (strategy.components ?? []).entries()) {
      if (component.product) {
        pushIf(errors, !isNonEmptyString(component.product.planNumber), `components[${i}].product.planNumber is missing.`);
        pushIf(
          errors,
          !isNonEmptyString(component.product.uin) || !UIN_PATTERN.test(component.product.uin),
          `components[${i}].product.uin is missing or not a valid UIN.`
        );
      }
      for (const field of ["premium", "deathBenefit", "maturityBenefit"] as const) {
        const cv = component[field];
        if (!cv || !isValueStatus(cv.status)) {
          errors.push(`components[${i}].${field}.status is not a recognized status.`);
          continue;
        }
        // A dimension the engine reported as unavailable must never
        // carry a fabricated numeric value.
        pushIf(errors, cv.status === "unavailable" && cv.value != null, `components[${i}].${field} is 'unavailable' but has a non-null value.`);
        // An illustrative dimension is exactly what it says — never
        // silently reclassified as verified/guaranteed elsewhere.
        pushIf(
          errors,
          cv.status === "illustrative" && field === "maturityBenefit" && component.investmentIllustration == null && component.role === "illustrative_investment",
          `components[${i}].maturityBenefit is illustrative but no investmentIllustration metadata was kept.`
        );
        pushIf(errors, typeof cv.value === "number" && !Number.isFinite(cv.value), `components[${i}].${field}.value is not finite.`);
      }
      if (component.investmentIllustration) {
        const illustration = component.investmentIllustration;
        pushIf(errors, illustration.status !== "illustrative", `components[${i}].investmentIllustration.status must be 'illustrative'.`);
        pushIf(errors, !Number.isFinite(illustration.contributionAmount), `components[${i}].investmentIllustration.contributionAmount is not finite.`);
        pushIf(errors, !Number.isFinite(illustration.projectedValue), `components[${i}].investmentIllustration.projectedValue is not finite.`);
        pushIf(errors, !Number.isFinite(illustration.ratePct), `components[${i}].investmentIllustration.ratePct is not finite.`);
        pushIf(errors, !Number.isFinite(illustration.years), `components[${i}].investmentIllustration.years is not finite.`);
      }
    }

    for (const field of ["protectionCoverage", "protectionGap", "goalGap", "guarantees"] as const) {
      const cv = strategy[field];
      if (cv && !isFiniteOrAbsent(cv.value)) errors.push(`selectedStrategy.${field}.value is not finite.`);
      if (cv && !isValueStatus(cv.status)) errors.push(`selectedStrategy.${field}.status is not a recognized status.`);
    }

    if (strategy.goalCoverage && strategy.goalCoverage.value != null) {
      const coverage = strategy.goalCoverage.value;
      for (const key of ["coveragePercent", "remainingGap", "surplus"] as const) {
        pushIf(errors, !Number.isFinite(coverage[key]), `selectedStrategy.goalCoverage.value.${key} is not finite.`);
      }
      // A goal can't simultaneously have a remaining gap AND a surplus —
      // that would be internally inconsistent goal-coverage maths.
      pushIf(
        errors,
        coverage.remainingGap > 0 && coverage.surplus > 0,
        "selectedStrategy.goalCoverage.value has both a remaining gap and a surplus."
      );
    }
  }

  if (plan.financialPicture) {
    const { goal, protection, budget } = plan.financialPicture;
    pushIf(errors, !!goal && !isFiniteOrAbsent(goal.targetAmount), "financialPicture.goal.targetAmount is not finite.");
    pushIf(errors, !!goal && !isFiniteOrAbsent(goal.remainingGoalGap), "financialPicture.goal.remainingGoalGap is not finite.");
    pushIf(errors, !!goal && !isFiniteOrAbsent(goal.structureValue), "financialPicture.goal.structureValue is not finite.");
    pushIf(errors, !!protection && !isFiniteOrAbsent(protection.requiredProtection), "financialPicture.protection.requiredProtection is not finite.");
    pushIf(errors, !!protection && !isFiniteOrAbsent(protection.remainingProtectionGap), "financialPicture.protection.remainingProtectionGap is not finite.");
    pushIf(
      errors,
      !!budget && budget.monthlyBudgetUsageStatus === "unavailable" && budget.monthlyBudgetVerifiedUsed != null,
      "financialPicture.budget marks usage unavailable but still carries a verified-used amount."
    );
    pushIf(errors, !!budget && !isFiniteOrAbsent(budget.monthlyBudgetVerifiedUsed), "financialPicture.budget.monthlyBudgetVerifiedUsed is not finite.");
  } else {
    errors.push("Missing financialPicture.");
  }

  return { valid: errors.length === 0, errors };
}
