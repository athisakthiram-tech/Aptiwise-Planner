// Small, data-only config objects that drive CreditLifeConfigurator for
// each of the 2 decreasing Credit Life plans — mirrors the pattern
// already used by pureTermConfigs.ts/standardEndowmentConfigs.ts.

import { PLAN_877_RULES, PLAN_877_UIN } from "@/lib/insurance/providers/lic/plans/plan877";
import { PLAN_878_RULES, PLAN_878_UIN } from "@/lib/insurance/providers/lic/plans/plan878";
import { CreditLifeConfig } from "@/components/planner/CreditLifeConfigurator";

export const PLAN_877_CONFIG: CreditLifeConfig = {
  planNumber: "877",
  uin: PLAN_877_UIN,
  minBasicSumAssured: PLAN_877_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_877_RULES.sumAssuredBands],
  sumAssuredSliderMax: 50000000,
  minPolicyTermYears: PLAN_877_RULES.minPolicyTermYears,
  maxPolicyTermYears: PLAN_877_RULES.maxPolicyTermYears,
  limitedPptOptionsForTerm: PLAN_877_RULES.limitedPptOptionsForTerm,
};

export const PLAN_878_CONFIG: CreditLifeConfig = {
  planNumber: "878",
  uin: PLAN_878_UIN,
  minBasicSumAssured: PLAN_878_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_878_RULES.sumAssuredBands],
  sumAssuredSliderMax: 50000000,
  minPolicyTermYears: PLAN_878_RULES.minPolicyTermYears,
  maxPolicyTermYears: PLAN_878_RULES.maxPolicyTermYears,
  limitedPptOptionsForTerm: PLAN_878_RULES.limitedPptOptionsForTerm,
};
