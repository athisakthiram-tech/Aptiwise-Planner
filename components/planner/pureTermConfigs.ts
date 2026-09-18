// Small, data-only config objects that drive PureTermConfigurator for
// each of the 3 Level/Increasing Sum Assured pure-risk term plans — the
// plan-specific "shape" lives here, the shared rendering logic lives in
// the component (mirroring standardEndowmentConfigs.ts's pattern).

import { PLAN_876_RULES, PLAN_876_UIN } from "@/lib/insurance/providers/lic/plans/plan876";
import { PLAN_875_RULES, PLAN_875_UIN } from "@/lib/insurance/providers/lic/plans/plan875";
import { PLAN_954_RULES, PLAN_954_UIN } from "@/lib/insurance/providers/lic/plans/plan954";
import { PLAN_887_RULES, PLAN_887_UIN } from "@/lib/insurance/providers/lic/plans/plan887";
import { PLAN_894_RULES, PLAN_894_UIN } from "@/lib/insurance/providers/lic/plans/plan894";
import { PLAN_859_RULES, PLAN_859_UIN } from "@/lib/insurance/providers/lic/plans/plan859";
import { PLAN_955_RULES, PLAN_955_UIN } from "@/lib/insurance/providers/lic/plans/plan955";
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

export const PLAN_887_CONFIG: PureTermConfig = {
  planNumber: "887",
  uin: PLAN_887_UIN,
  minBasicSumAssured: PLAN_887_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_887_RULES.sumAssuredBands],
  sumAssuredSliderMax: 100000000,
  minPolicyTermYears: PLAN_887_RULES.minPolicyTermYears,
  maxPolicyTermYears: PLAN_887_RULES.levelMaxPolicyTermYears,
  limitedPptOptionsForTerm: PLAN_887_RULES.limitedPptOptionsForTerm,
};

export const PLAN_894_CONFIG: PureTermConfig = {
  planNumber: "894",
  uin: PLAN_894_UIN,
  minBasicSumAssured: PLAN_894_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_894_RULES.sumAssuredBands],
  sumAssuredSliderMax: 2400000,
  minPolicyTermYears: PLAN_894_RULES.minPolicyTermYears,
  maxPolicyTermYears: PLAN_894_RULES.levelMaxPolicyTermYears,
  limitedPptOptionsForTerm: PLAN_894_RULES.limitedPptOptionsForTerm,
  hasIncreasingOption: false,
};

export const PLAN_859_CONFIG: PureTermConfig = {
  planNumber: "859",
  uin: PLAN_859_UIN,
  minBasicSumAssured: PLAN_859_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_859_RULES.sumAssuredBands],
  sumAssuredSliderMax: 5000000,
  minPolicyTermYears: PLAN_859_RULES.minPolicyTermYears,
  maxPolicyTermYears: PLAN_859_RULES.levelMaxPolicyTermYears,
  limitedPptOptionsForTerm: PLAN_859_RULES.limitedPptOptionsForTerm,
  hasIncreasingOption: false,
};

export const PLAN_955_CONFIG: PureTermConfig = {
  planNumber: "955",
  uin: PLAN_955_UIN,
  minBasicSumAssured: PLAN_955_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_955_RULES.sumAssuredBands],
  sumAssuredSliderMax: 100000000,
  minPolicyTermYears: PLAN_955_RULES.minPolicyTermYears,
  maxPolicyTermYears: PLAN_955_RULES.levelMaxPolicyTermYears,
  limitedPptOptionsForTerm: PLAN_955_RULES.limitedPptOptionsForTerm,
};
