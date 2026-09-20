// Official-illustration fallback (Section "OFFICIAL ILLUSTRATION
// FALLBACK"). When a registered engine cannot defensibly calculate a
// component's premium/benefit for the exact configuration a structure
// needs, the advisor may enter the insurer's own official illustration
// numbers instead of Aptiwise showing a fabricated or missing value.
//
// This is a PURE, LOCAL transform over an already-built StrategyComponent
// — it never touches the Goal Orchestrator, never persists anywhere on
// its own, and every value it sets carries a noteCode identifying it as
// advisor-entered so no downstream consumer (CustomerPlan, PDF,
// WhatsApp) can mistake it for an Aptiwise-calculated figure.

import { ComparisonValue } from "@/lib/comparison/protectionAdjustedComparison";
import { StrategyComponent } from "@/lib/planning/strategyTypes";

export const ADVISOR_ILLUSTRATION_NOTE_CODE = "advisor_entered_official_illustration";

export interface AdvisorIllustrationOverrideInput {
  officialPremiumMonthly?: number;
  basicSumAssured?: number;
  guaranteedBenefit?: number;
  nonGuaranteedIllustration?: number;
  maturityOrGoalBenefit?: number;
}

function advisorValue(value: number, status: ComparisonValue<number>["status"]): ComparisonValue<number> {
  return { value, status, noteCode: ADVISOR_ILLUSTRATION_NOTE_CODE };
}

// Applies whichever fields the advisor actually filled in — every field
// is independent and optional ("depending on what is appropriate" per
// spec). Never invents a value for a field the advisor left blank.
export function applyAdvisorIllustrationOverride(
  component: StrategyComponent,
  override: AdvisorIllustrationOverrideInput
): StrategyComponent {
  const next: StrategyComponent = { ...component };

  if (override.officialPremiumMonthly != null) {
    next.monthlyPremium = advisorValue(override.officialPremiumMonthly, "verified");
  }

  if (override.basicSumAssured != null) {
    next.configuration = {
      basicSumAssured: override.basicSumAssured,
      policyTermYears: component.configuration?.policyTermYears ?? null,
      premiumPayingTermYears: component.configuration?.premiumPayingTermYears ?? null,
    };
  }

  if (override.guaranteedBenefit != null) {
    next.deathBenefit = advisorValue(override.guaranteedBenefit, "verified");
  }

  // A total illustrated maturity/goal figure is the sum of whichever of
  // the guaranteed and non-guaranteed pieces the advisor supplied —
  // never fabricating a bonus, only totalling what was actually entered.
  // The status stays "illustrative" the moment a non-guaranteed piece is
  // included, since the combined figure is then no longer purely
  // guaranteed.
  const hasMaturity = override.maturityOrGoalBenefit != null;
  const hasNonGuaranteed = override.nonGuaranteedIllustration != null;
  if (hasMaturity || hasNonGuaranteed) {
    const total = (override.maturityOrGoalBenefit ?? 0) + (override.nonGuaranteedIllustration ?? 0);
    next.maturityBenefit = advisorValue(total, hasNonGuaranteed ? "illustrative" : "verified");
  }

  return next;
}

export function isAdvisorEnteredValue(value: ComparisonValue<number>): boolean {
  return value.noteCode === ADVISOR_ILLUSTRATION_NOTE_CODE;
}
