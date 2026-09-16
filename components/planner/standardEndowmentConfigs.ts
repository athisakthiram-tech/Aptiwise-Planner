// Small, data-only config objects that drive StandardEndowmentConfigurator
// for each Stage 4D plan — the plan-specific "shape" lives here, the
// shared rendering logic lives in the component.

import { PLAN_717_RULES, PLAN_717_UIN } from "@/lib/insurance/providers/lic/plans/plan717";
import { PLAN_714_RULES, PLAN_714_UIN } from "@/lib/insurance/providers/lic/plans/plan714";
import { PLAN_715_RULES, PLAN_715_UIN } from "@/lib/insurance/providers/lic/plans/plan715";
import { PLAN_912_RULES, PLAN_912_UIN } from "@/lib/insurance/providers/lic/plans/plan912";
import { StandardEndowmentConfig } from "@/components/planner/StandardEndowmentConfigurator";

// UI convenience caps only (none of these plans state a maximum Basic
// Sum Assured) — they bound the slider, they are not product rules.
const SUM_ASSURED_SLIDER_MAX = 5000000;

export const PLAN_717_CONFIG: StandardEndowmentConfig = {
  planNumber: "717",
  uin: PLAN_717_UIN,
  minBasicSumAssured: PLAN_717_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_717_RULES.sumAssuredBands],
  sumAssuredSliderMax: SUM_ASSURED_SLIDER_MAX,
  premiumMode: "single",
  hasIndependentPpt: false,
  validPolicyTerms(age) {
    const terms: number[] = [];
    for (let term = PLAN_717_RULES.minPolicyTermYears; term <= PLAN_717_RULES.maxPolicyTermYears; term++) {
      const maturityAge = age + term;
      if (maturityAge >= PLAN_717_RULES.minMaturityAge && maturityAge <= PLAN_717_RULES.maxMaturityAge) {
        terms.push(term);
      }
    }
    return terms;
  },
};

export const PLAN_714_CONFIG: StandardEndowmentConfig = {
  planNumber: "714",
  uin: PLAN_714_UIN,
  minBasicSumAssured: PLAN_714_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_714_RULES.sumAssuredBands],
  sumAssuredSliderMax: SUM_ASSURED_SLIDER_MAX,
  premiumMode: "yearly",
  hasIndependentPpt: false,
  validPolicyTerms(age) {
    const terms: number[] = [];
    for (let term = PLAN_714_RULES.minPolicyTermYears; term <= PLAN_714_RULES.maxPolicyTermYears; term++) {
      const maturityAge = age + term;
      if (maturityAge >= PLAN_714_RULES.minMaturityAge && maturityAge <= PLAN_714_RULES.maxMaturityAge) {
        terms.push(term);
      }
    }
    return terms;
  },
  pptForTerm: (term) => term,
};

export const PLAN_715_CONFIG: StandardEndowmentConfig = {
  planNumber: "715",
  uin: PLAN_715_UIN,
  minBasicSumAssured: PLAN_715_RULES.minBasicSumAssured,
  sumAssuredBands: [...PLAN_715_RULES.sumAssuredBands],
  sumAssuredSliderMax: SUM_ASSURED_SLIDER_MAX,
  premiumMode: "yearly",
  hasIndependentPpt: false,
  validPolicyTerms(age) {
    const terms: number[] = [];
    for (let term = PLAN_715_RULES.minPolicyTermYears; term <= PLAN_715_RULES.maxPolicyTermYears; term++) {
      if (age + term <= PLAN_715_RULES.maxMaturityAge) {
        terms.push(term);
      }
    }
    return terms;
  },
  pptForTerm: (term) => term,
};

export const PLAN_912_CONFIG: StandardEndowmentConfig = {
  planNumber: "912",
  uin: PLAN_912_UIN,
  minBasicSumAssured: PLAN_912_RULES.minBasicSumAssured,
  sumAssuredBands: [{ maxInclusive: null, multiple: PLAN_912_RULES.sumAssuredMultiple }],
  sumAssuredSliderMax: SUM_ASSURED_SLIDER_MAX,
  premiumMode: "yearly",
  hasIndependentPpt: true,
  pptOptions: PLAN_912_RULES.pptOptions,
  validPolicyTerms(age, ppt) {
    if (ppt == null) return [];
    const maxEntryAge = PLAN_912_RULES.maxEntryAgeByPpt[ppt];
    const termRange = PLAN_912_RULES.termRangeByPpt[ppt];
    if (maxEntryAge == null || termRange == null || age > maxEntryAge) return [];
    const terms: number[] = [];
    for (let term = termRange.min; term <= termRange.max; term++) {
      const maturityAge = age + term;
      if (maturityAge >= PLAN_912_RULES.minMaturityAge && maturityAge <= PLAN_912_RULES.maxMaturityAge) {
        terms.push(term);
      }
    }
    return terms;
  },
  deathBenefitOptions: ["I", "II"],
};
