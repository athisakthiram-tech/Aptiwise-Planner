// Small, data-only config objects that drive PureTermConfigurator for
// each of the 3 Level/Increasing Sum Assured pure-risk term plans — the
// plan-specific "shape" lives here, the shared rendering logic lives in
// the component (mirroring standardEndowmentConfigs.ts's pattern).

import { PLAN_876_RULES, PLAN_876_UIN } from "@/lib/insurance/providers/lic/plans/plan876";
import { PLAN_875_RULES, PLAN_875_UIN } from "@/lib/insurance/providers/lic/plans/plan875";
import { PLAN_954_RULES, PLAN_954_UIN } from "@/lib/insurance/providers/lic/plans/plan954";
import { PureTermConfig } from "@/components/planner/PureTermConfigurator";

export const PLAN_876_CONFIG: PureTermConfig = {
  planNumber: "876",
  uin: PLAN_876_UIN,
  minBasicSumAssured: PLAN_876_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_876_RULES.sumAssuredBands],
  sumAssuredSliderMax: 50000000,
  minPolicyTermYears: PLAN_876_RULES.minPolicyTermYears,
  maxPolicyTermYears: PLAN_876_RULES.levelMaxPolicyTermYears,
  limitedPptOptionsForTerm: PLAN_876_RULES.limitedPptOptionsForTerm,
};

export const PLAN_875_CONFIG: PureTermConfig = {
  planNumber: "875",
  uin: PLAN_875_UIN,
  minBasicSumAssured: PLAN_875_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_875_RULES.sumAssuredBands],
  sumAssuredSliderMax: 50000000,
  minPolicyTermYears: PLAN_875_RULES.minPolicyTermYears,
  maxPolicyTermYears: PLAN_875_RULES.levelMaxPolicyTermYears,
  limitedPptOptionsForTerm: PLAN_875_RULES.limitedPptOptionsForTerm,
};

export const PLAN_954_CONFIG: PureTermConfig = {
  planNumber: "954",
  uin: PLAN_954_UIN,
  minBasicSumAssured: PLAN_954_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_954_RULES.sumAssuredBands],
  sumAssuredSliderMax: 100000000,
  minPolicyTermYears: PLAN_954_RULES.minPolicyTermYears,
  maxPolicyTermYears: PLAN_954_RULES.levelMaxPolicyTermYears,
  limitedPptOptionsForTerm: PLAN_954_RULES.limitedPptOptionsForTerm,
};
