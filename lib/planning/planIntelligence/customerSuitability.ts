// Customer suitability (Section 16). Builds broad, reusable
// characteristics (horizon/capacity/lump-sum-vs-income/risk posture/
// liquidity need) from EXPLICIT customer data first; profession-derived
// hints (professionModel.ts) fill in only what the customer didn't
// already state, and never override an explicit answer. No arbitrary
// wealth judgment is ever made from profession alone.

import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import {
  CapacityBand,
  CustomerSuitabilityProfile,
  HorizonBand,
  LiquidityNeedBand,
  ProfessionProfile,
  RiskPostureBand,
} from "@/lib/planning/planIntelligence/types";
import { getProfessionCashFlowHints } from "@/lib/planning/planIntelligence/professionModel";

function horizonBand(years: number | null): HorizonBand {
  if (years == null) return "MEDIUM"; // a neutral default, never a guessed extreme
  if (years <= 7) return "SHORT";
  if (years <= 15) return "MEDIUM";
  return "LONG";
}

function capacityBand(monthlyBudget: number | null): CapacityBand {
  if (monthlyBudget == null) return "MEDIUM";
  if (monthlyBudget < 5000) return "LOW";
  if (monthlyBudget < 25000) return "MEDIUM";
  return "HIGH";
}

function riskPostureBand(riskComfort: CustomerFinancialProfile["riskComfort"], professionProfile: ProfessionProfile | null): RiskPostureBand {
  // Explicit customer risk comfort always wins.
  if (riskComfort === "low") return "PREFERS_STABILITY";
  if (riskComfort === "medium") return "BALANCED";
  if (riskComfort === "high") return "ACCEPTS_MARKET_RISK";
  // Only when the customer gave no risk preference at all does a
  // profession-derived hint fill the gap, and only as a soft "UNKNOWN"
  // fallback — never a confident guess.
  if (professionProfile == null) return "UNKNOWN";
  return "UNKNOWN";
}

function liquidityNeedBand(liquidityPreference: CustomerFinancialProfile["liquidityPreference"], professionProfile: ProfessionProfile | null): LiquidityNeedBand {
  if (liquidityPreference === "high") return "REQUIRES_LIQUIDITY";
  if (liquidityPreference === "low") return "CAN_ACCEPT_LOCK_IN";
  if (professionProfile != null) {
    const hints = getProfessionCashFlowHints(professionProfile);
    if (hints.liquidityImportance === "HIGH") return "REQUIRES_LIQUIDITY";
    if (hints.liquidityImportance === "LOW") return "CAN_ACCEPT_LOCK_IN";
  }
  return "UNKNOWN";
}

export function buildCustomerSuitabilityProfile(
  profile: CustomerFinancialProfile,
  professionProfile: ProfessionProfile | null = null
): CustomerSuitabilityProfile {
  return {
    horizon: horizonBand(profile.yearsToGoal),
    capacity: capacityBand(profile.monthlyBudget),
    needsLumpSum: profile.goalType != null && profile.goalType !== "retirement",
    needsRecurringIncome: profile.goalType === "retirement",
    riskPosture: riskPostureBand(profile.riskComfort, professionProfile),
    liquidityNeed: liquidityNeedBand(profile.liquidityPreference, professionProfile),
  };
}
