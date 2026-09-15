// Registry mapping a specific plan version (provider + plan number + UIN)
// to its calculation engines. Looking up a plan that has no verified
// engine — which today is every plan, Plan 733 included — must return
// unavailable safely rather than fabricating a calculator.

import { InsuranceProduct } from "@/types/insurance";
import {
  LicBenefitCalculator,
  LicEligibilityEngine,
  LicPremiumCalculator,
} from "@/lib/insurance/futureEngines";
import * as plan733 from "@/lib/insurance/providers/lic/plans/plan733";

export interface PlanEngineBundle {
  eligibility: LicEligibilityEngine | null;
  premium: LicPremiumCalculator | null;
  benefit: LicBenefitCalculator | null;
}

const UNAVAILABLE_BUNDLE: PlanEngineBundle = {
  eligibility: null,
  premium: null,
  benefit: null,
};

function registryKey(provider: string, planNumber: string, uin: string): string {
  return `${provider}::${planNumber}::${uin}`;
}

// Plan 733 (LIC's Jeevan Lakshya) has a verified eligibility/benefit/
// premium engine — see plans/plan733.ts for the underlying rules and its
// sources. Every other plan number/UIN combination stays unregistered and
// must never resolve here.
const REGISTRY = new Map<string, PlanEngineBundle>([
  [
    registryKey("LIC", "733", plan733.PLAN_733_UIN),
    {
      eligibility: { evaluateEligibility: plan733.evaluateEligibility },
      premium: { calculatePremium: plan733.calculatePremium },
      benefit: { calculateBenefits: plan733.calculateBenefits },
    },
  ],
]);

export function getPlanEngine(
  provider: string,
  planNumber: string,
  uin: string
): PlanEngineBundle {
  return REGISTRY.get(registryKey(provider, planNumber, uin)) ?? UNAVAILABLE_BUNDLE;
}

export function getPlanEngineForProduct(product: InsuranceProduct): PlanEngineBundle {
  return getPlanEngine(product.provider, product.planNumber, product.uin);
}
