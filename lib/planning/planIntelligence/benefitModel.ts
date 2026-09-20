// Benefit model helpers (Section 6). Thin, typed constructors only —
// the actual per-plan benefit lists live in planProfiles.ts, built from
// each plan's own verified brochure mechanics. Keeping constructors here
// (rather than plain object literals everywhere) guarantees every
// BenefitDescriptor states its character explicitly, so a guaranteed and
// a non-guaranteed benefit can never be silently merged into one number.

import { BenefitCharacter, BenefitDescriptor, BenefitType } from "@/lib/planning/planIntelligence/types";

function benefit(type: BenefitType, character: BenefitCharacter, description: string, timing: BenefitDescriptor["timing"]): BenefitDescriptor {
  return { type, character, description, timing };
}

export const guaranteedMaturity = (description: string) => benefit("MATURITY", "GUARANTEED", description, "AT_MATURITY");
export const guaranteedSurvival = (description: string) => benefit("SURVIVAL", "GUARANTEED", description, "SCHEDULED_INTERVALS");
export const guaranteedIncome = (description: string) => benefit("INCOME", "GUARANTEED", description, "DEFERRED_THEN_RECURRING");
export const guaranteedAddition = (description: string) => benefit("GUARANTEED_ADDITION", "GUARANTEED", description, "AT_MATURITY");
export const guaranteedProtection = (description: string) => benefit("LIFE_PROTECTION", "GUARANTEED", description, "ON_DEATH");
export const nonGuaranteedLoyaltyAddition = (description: string) => benefit("LOYALTY_ADDITION", "NON_GUARANTEED", description, "AT_MATURITY");
export const nonGuaranteedReversionaryBonus = (description: string) => benefit("SIMPLE_REVERSIONARY_BONUS", "NON_GUARANTEED", description, "AT_MATURITY");
export const nonGuaranteedFinalBonus = (description: string) => benefit("FINAL_ADDITIONAL_BONUS", "NON_GUARANTEED", description, "AT_MATURITY");
export const marketLinkedFundValue = (description: string) => benefit("MARKET_LINKED_FUND_VALUE", "MARKET_LINKED", description, "CONTINUOUS_ACCUMULATION");
export const annuityBenefit = (description: string) => benefit("ANNUITY", "GUARANTEED", description, "DEFERRED_THEN_RECURRING");
export const otherContractual = (description: string, character: BenefitCharacter = "GUARANTEED") => benefit("OTHER_CONTRACTUAL_BENEFIT", character, description, "AT_MATURITY");
