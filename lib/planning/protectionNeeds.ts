// Protection Need engine: a transparent, deterministic calculation of how
// much life cover a family's stated circumstances call for — NOT a
// single industry-standard "income multiple" formula. Every component is
// computed only from inputs the customer has actually provided; a
// missing input skips that component rather than inventing a number for
// it, and the overall `status` says honestly whether the result is
// complete, partial, or unavailable.
//
// Customer-facing terminology for this result is "Family Protection" /
// "Protection Need" / "Protection Gap" — never fear-based wording like
// "if you die" or "risk your life". This module only produces the
// numbers and machine-readable status; wording lives in the UI/i18n
// layer, not here.

import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";

export type ProtectionNeedStatus = "calculated" | "partial" | "unavailable";

export interface ProtectionNeedComponents {
  // Debts that would otherwise fall on the family — a direct pass-through
  // of the customer's own stated figure.
  outstandingLiabilities: number | null;
  // annualFamilyExpenses x the caller-supplied incomeReplacementYears
  // (see ProtectionNeedInput below) — never computed with an internally
  // invented number of years.
  futureFamilySupport: number | null;
  // The unfunded portion of the customer's stated goal (targetGoalAmount
  // less whatever existing investments are already earmarked for it) —
  // the idea being that a stated goal (a child's education, a home)
  // still needs funding even if the earning member is no longer able to
  // contribute toward it.
  goalObligations: number | null;
}

export interface ProtectionNeedResult {
  requiredProtection: number | null;
  existingProtection: number | null;
  protectionGap: number | null;
  // A stable identifier for which components were combined — visible and
  // testable, never a hidden formula.
  methodology: "liabilities_plus_family_support_plus_goal_obligations";
  components: ProtectionNeedComponents;
  // Machine-readable notes about a documented choice this calculation
  // made (e.g. "goal obligations assumed zero existing investments
  // because none were stated") — never a silently-injected number.
  assumptions: string[];
  missingInputs: string[];
  status: ProtectionNeedStatus;
}

export interface ProtectionNeedInput {
  profile: CustomerFinancialProfile;
  // How many years of annualFamilyExpenses to fund, if the
  // futureFamilySupport component should be included at all. This is a
  // deliberate, explicit, caller-supplied assumption — never an
  // internally-invented "10x income" style multiple. Omit it entirely to
  // skip this component (that is a legitimate choice, not a missing
  // input).
  incomeReplacementYears?: number;
}

export function calculateProtectionNeed(input: ProtectionNeedInput): ProtectionNeedResult {
  const { profile, incomeReplacementYears } = input;
  const missingInputs: string[] = [];
  const assumptions: string[] = [];

  const outstandingLiabilities = profile.outstandingLiabilities;
  if (outstandingLiabilities == null) missingInputs.push("outstandingLiabilities");

  let futureFamilySupport: number | null = null;
  if (incomeReplacementYears != null) {
    if (profile.annualFamilyExpenses != null) {
      futureFamilySupport = Math.round(profile.annualFamilyExpenses * incomeReplacementYears);
      assumptions.push("future_family_support_uses_caller_supplied_income_replacement_years");
    } else {
      missingInputs.push("annualFamilyExpenses");
    }
  }

  let goalObligations: number | null = null;
  if (profile.goalType == null) missingInputs.push("goalType");
  if (profile.targetGoalAmount == null) missingInputs.push("targetGoalAmount");
  if (profile.goalType != null && profile.targetGoalAmount != null && profile.targetGoalAmount > 0) {
    const resources = profile.existingInvestments ?? 0;
    goalObligations = Math.max(0, Math.round(profile.targetGoalAmount - resources));
    if (profile.existingInvestments == null) {
      assumptions.push("goal_obligations_assumes_zero_existing_investments_when_unstated");
    }
  }

  const components: ProtectionNeedComponents = {
    outstandingLiabilities,
    futureFamilySupport,
    goalObligations,
  };

  const computedComponents = [outstandingLiabilities, futureFamilySupport, goalObligations].filter(
    (value): value is number => value != null
  );

  let requiredProtection: number | null = null;
  let status: ProtectionNeedStatus;
  if (computedComponents.length === 0) {
    status = "unavailable";
  } else {
    requiredProtection = computedComponents.reduce((sum, value) => sum + value, 0);
    const liabilitiesMissing = outstandingLiabilities == null;
    const familySupportMissing = incomeReplacementYears != null && futureFamilySupport == null;
    // Goal obligations are always a "wanted" component (like liabilities)
    // — unlike future family support, there is no opt-in flag for it, so
    // a missing goalType/targetGoalAmount always keeps the result partial
    // rather than silently treating "no stated goal" as "fully known".
    const goalMissing = goalObligations == null;
    status = liabilitiesMissing || familySupportMissing || goalMissing ? "partial" : "calculated";
  }

  const existingProtection = profile.existingLifeCover;
  let protectionGap: number | null = null;
  if (requiredProtection != null) {
    if (existingProtection != null) {
      protectionGap = Math.max(0, Math.round(requiredProtection - existingProtection));
    } else {
      // Existing cover unknown — never treated as zero. The gap stays
      // unknown too, since "requiredProtection minus an unknown" is
      // itself unknown, not requiredProtection itself.
      missingInputs.push("existingLifeCover");
    }
  }

  return {
    requiredProtection,
    existingProtection: existingProtection ?? null,
    protectionGap,
    methodology: "liabilities_plus_family_support_plus_goal_obligations",
    components,
    assumptions,
    missingInputs,
    status,
  };
}
