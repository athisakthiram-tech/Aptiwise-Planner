// Budget-to-BSA solver: given a monthly capacity ceiling, tries to find
// a Basic Sum Assured this SAME registered product's OWN engine can
// resolve a genuinely verified Planning Premium for, at or under that
// ceiling. This is a bounded, deterministic PROBE — it calls the real
// engine (via buildComponent, which calls calculatePremium/
// calculateBenefits exactly like strategyGenerator.ts already does) at
// a small, fixed set of candidate amounts and accepts only what the
// engine itself reports as verified. It never fabricates a premium and
// never invents a BSA the engine didn't actually confirm.
//
// Many registered engines can only resolve an exact premium when the
// requested Basic Sum Assured matches one of that product's own
// published sample-illustration amounts (see e.g. plan894.ts's
// sampleIllustrativePremium) — a true continuous "solve for any budget"
// is not something this codebase's verified engines support, and this
// module does not pretend otherwise. When no candidate resolves, the
// result is honestly "unavailable", exactly like every other
// unverified premium in this codebase.

import { LicCalculationContext } from "@/types/insurance";
import { ProductEligibilityAssessment } from "@/lib/planning/productEligibility";
import { buildComponent } from "@/lib/planning/strategyGenerator";
import { StrategyComponent, StrategyComponentRole, StrategyReasonCode } from "@/lib/planning/strategyTypes";
import { getPremiumCalculationDomain } from "@/lib/insurance/premiumCalculationCapability";

export interface BudgetSolverInput {
  assessment: ProductEligibilityAssessment;
  role: StrategyComponentRole;
  baseContext: LicCalculationContext;
  policyTermYears: number;
  premiumPayingTermYears?: number;
  // The goal amount (or a caller-chosen target) used as the FIRST
  // candidate — Section 6/8: the goal amount only ever SEEDS the
  // search, it is never treated as a solved Basic Sum Assured.
  initialBsaCandidate: number;
  maxMonthlyBudget: number;
  reasonCodes: StrategyReasonCode[];
}

export interface BudgetSolverResult {
  component: StrategyComponent;
  basicSumAssured: number | null;
  policyTermYears: number;
  premiumPayingTermYears: number | null;
  // True only when the engine returned a verified premium at or under
  // maxMonthlyBudget. False means the component is still returned (so
  // the UI can show "Requires verification" with real product identity)
  // but must never be treated as fitting the customer's stated capacity.
  fits: boolean;
}

// A small, fixed set of round Basic Sum Assured amounts — never an
// unbounded search, and always tried smallest-effort-first (the caller's
// own target, then progressively more conservative round amounts).
// LIC's own published sample tables overwhelmingly use round-lakh
// amounts, which is why these particular steps were chosen — not
// because they are guaranteed to work for any given product. Used only
// as a fallback for a product with no registered
// PremiumCalculationDomain (see below) — every classified product
// searches its OWN actually-supported Basic Sum Assured values instead.
const CANDIDATE_STEPS = [5_000_000, 2_500_000, 2_000_000, 1_500_000, 1_000_000, 750_000, 500_000, 300_000, 200_000, 100_000, 50_000];

// Foundation V2: most registered engines can only ever resolve a premium
// at ONE exact published Basic Sum Assured (a brochure sample table is
// not a rate table — see premiumCalculationCapability.ts's header
// comment). Probing the generic CANDIDATE_STEPS against such a product
// wastes calls on amounts that can never match. When the product's own
// supported values are known, search ONLY those — still smallest-
// effort-first (the caller's target first, if it happens to already be
// supported, then the product's own values in descending order).
function buildCandidateList(initial: number, planNumber: string, uin: string): number[] {
  const domain = getPremiumCalculationDomain(planNumber, uin);
  const supported = domain?.supportedBasicSumAssuredValues;
  if (supported && supported.length > 0) {
    const descending = [...supported].sort((a, b) => b - a);
    // The caller's own target is tried first (it may already be one of
    // the supported values); every genuinely supported value is tried
    // after it, largest first — nothing outside this product's own
    // published set is ever probed.
    return Array.from(new Set([initial, ...descending]));
  }

  const candidates = [initial];
  for (const step of CANDIDATE_STEPS) {
    if (step < initial) candidates.push(step);
  }
  return Array.from(new Set(candidates));
}

function buildContext(input: BudgetSolverInput, basicSumAssured: number): LicCalculationContext {
  const context: LicCalculationContext = {
    ...input.baseContext,
    basicSumAssured,
    policyTermYears: input.policyTermYears,
  };
  if (input.premiumPayingTermYears != null) context.premiumPayingTermYears = input.premiumPayingTermYears;
  return context;
}

export function solveBudgetFit(input: BudgetSolverInput): BudgetSolverResult {
  const candidates = buildCandidateList(input.initialBsaCandidate, input.assessment.product.planNumber, input.assessment.product.uin);

  for (const bsa of candidates) {
    const context = buildContext(input, bsa);
    const component = buildComponent(input.assessment, input.role, context, input.reasonCodes);
    const premium = component.monthlyPremium;
    if (premium.status === "verified" && premium.value != null && premium.value <= input.maxMonthlyBudget) {
      return {
        component,
        basicSumAssured: bsa,
        policyTermYears: input.policyTermYears,
        premiumPayingTermYears: input.premiumPayingTermYears ?? null,
        fits: true,
      };
    }
  }

  // Nothing resolved within budget — report the attempt at the ORIGINAL
  // (goal-derived) candidate so the UI shows real product identity with
  // an honest "Requires verification", never a fabricated fit.
  const fallbackContext = buildContext(input, input.initialBsaCandidate);
  const fallbackComponent = buildComponent(input.assessment, input.role, fallbackContext, input.reasonCodes);
  return {
    component: fallbackComponent,
    basicSumAssured:
      fallbackComponent.monthlyPremium.status === "verified" || fallbackComponent.deathBenefit.status === "verified"
        ? input.initialBsaCandidate
        : null,
    policyTermYears: input.policyTermYears,
    premiumPayingTermYears: input.premiumPayingTermYears ?? null,
    fits: false,
  };
}
