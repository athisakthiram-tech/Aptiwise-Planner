// Verified rule implementation for LIC's Amritbaal (Plan 774, UIN
// 512N365V02). Non-Par child plan — structurally different from
// plan733.ts/plan736.ts (a fixed, GUARANTEED "Guaranteed Addition" rate
// replaces the undisclosed participating bonus, and the customer chooses
// one of 4 Sum-Assured-on-Death options at inception).
//
// SOURCE OF TRUTH (supplied directly by the user as an official LIC
// document): 774_Amritbaal_Sales_Brochure_141025.pdf — the ONLY source
// for every rule below. See docs/lic-plan774-verification.md.

import {
  BenefitCalculationResult,
  EligibilityReason,
  EligibilityResult,
  InsuranceProduct,
  LicCalculatorInput,
  PremiumCalculationResult,
} from "@/types/insurance";
import { isValidSumAssuredIncrement } from "./shared";

export const PLAN_774_UIN = "512N365V02";

const SOURCE_VERSION = "LIC's Amritbaal Sales Brochure, UIN 512N365V02";

const UNDERWRITING_DISCLAIMER =
  "Product-level eligibility does not constitute LIC underwriting approval.";

const PREMIUM_UNAVAILABLE_REASON =
  "Exact premium calculation requires verified LIC premium rate data.";

export type Plan774DeathBenefitOption = "I" | "II" | "III" | "IV";

// ---- Phase 1: verified rules (brochure §2, pages 2-3; §3, pages 3-5) ----
export const PLAN_774_RULES = {
  minEntryAge: 0, // "0 years (30 days completed)"
  maxEntryAge: 13, // "13 years (last birthday)"
  minMaturityAge: 18, // "18 years (last birthday)"
  maxMaturityAge: 25, // "25 years (last birthday)"
  limitedPremium: {
    minPolicyTermYears: 10,
    maxPolicyTermYears: 25,
    pptOptions: [5, 6, 7] as const,
  },
  singlePremium: {
    minPolicyTermYears: 5,
    maxPolicyTermYears: 25,
  },
  minBasicSumAssured: 200000,
  sumAssuredBands: [
    { maxInclusive: 2400000, multiple: 25000 },
    { maxInclusive: null, multiple: 50000 },
  ],
  // Guaranteed Addition (§3.C, page 5): a fixed, GUARANTEED rate — this
  // is a Non-Par product ("not entitled to any discretionary benefits
  // like bonus... benefits payable on death or survival are guaranteed
  // and fixed irrespective of actual experience"), unlike Plan 733/736's
  // undisclosed participating bonus. Cross-checked against the brochure's
  // own illustration (BSA Rs.5,00,000 -> Rs.40,000/year accrual).
  guaranteedAddition: { ratePerThousandBasicSumAssuredPerYear: 80 },
  // Sum Assured on Death options (§3.A, pages 3-4) — chosen once at
  // inception and never altered. Options I/II require Limited Premium
  // Payment; Options III/IV require Single Premium.
  deathBenefitOptions: {
    I: { requiresMode: "limited", multiple: 7, premiumBasis: "annualized", hasBsaFloor: true },
    II: { requiresMode: "limited", multiple: 10, premiumBasis: "annualized", hasBsaFloor: true },
    III: { requiresMode: "single", multiple: 1.25, premiumBasis: "single", hasBsaFloor: true },
    // Option IV is a flat multiple with NO "higher of Basic Sum Assured"
    // wording in the brochure — never assume a BSA floor for it.
    IV: { requiresMode: "single", multiple: 10, premiumBasis: "single", hasBsaFloor: false },
  } as const,
  // 105%-of-premiums-paid floor is stated ONLY for Limited Premium
  // (Options I & II) — needs premium-paid history, not modeled here.
  // Sample Illustrative Premium (§7, page 10): the brochure publishes
  // exactly one age/term/BSA combination (age 5, term 20, BSA Rs.5,00,000).
  sampleIllustrativePremium: {
    basicSumAssured: 500000,
    age: 5,
    policyTermYears: 20,
    limitedRows: [
      { premiumPaymentTermYears: 5, optionI: 99625, optionII: 100100 },
      { premiumPaymentTermYears: 6, optionI: 84275, optionII: 84625 },
      { premiumPaymentTermYears: 7, optionI: 73625, optionII: 73900 },
    ],
    single: { optionIII: 389225, optionIV: 412600 },
  },
  riders: [{ name: "LIC's Premium Waiver Benefit Rider", uin: "512B204V04" }],
} as const;

type Plan774Input = LicCalculatorInput & { product: InsuranceProduct };

function isSinglePremium(input: Plan774Input): boolean {
  return input.premiumFrequency === "single";
}

function readOption(input: Plan774Input): Plan774DeathBenefitOption | undefined {
  const option = input.productSpecificInputs?.deathBenefitOption;
  return option === "I" || option === "II" || option === "III" || option === "IV"
    ? option
    : undefined;
}

// ---- Phase 2: eligibility engine ----
export function evaluateEligibility(input: Plan774Input): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;
  const single = isSinglePremium(input);

  if (input.age < PLAN_774_RULES.minEntryAge || input.age > PLAN_774_RULES.maxEntryAge) {
    eligible = false;
    reasons.push(
      `Age ${input.age} is outside the eligible entry range of ${PLAN_774_RULES.minEntryAge}-${PLAN_774_RULES.maxEntryAge}.`
    );
    reasonCodes.push({
      code: "age_out_of_range",
      params: { min: PLAN_774_RULES.minEntryAge, max: PLAN_774_RULES.maxEntryAge, actual: input.age },
    });
  }

  if (input.policyTermYears == null) {
    missingInputs.push("policyTermYears");
  } else {
    const { minPolicyTermYears, maxPolicyTermYears } = single
      ? PLAN_774_RULES.singlePremium
      : PLAN_774_RULES.limitedPremium;
    if (input.policyTermYears < minPolicyTermYears || input.policyTermYears > maxPolicyTermYears) {
      eligible = false;
      reasons.push(
        `Policy term ${input.policyTermYears} years is outside the allowed range of ${minPolicyTermYears}-${maxPolicyTermYears} years.`
      );
      reasonCodes.push({
        code: "term_out_of_range",
        params: { min: minPolicyTermYears, max: maxPolicyTermYears, actual: input.policyTermYears },
      });
    }

    const maturityAge = input.age + input.policyTermYears;
    if (maturityAge > PLAN_774_RULES.maxMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would exceed the maximum maturity age of ${PLAN_774_RULES.maxMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_high",
        params: { max: PLAN_774_RULES.maxMaturityAge, actual: maturityAge },
      });
    } else if (maturityAge < PLAN_774_RULES.minMaturityAge) {
      eligible = false;
      reasons.push(
        `Age at maturity (${maturityAge}) would be below the minimum maturity age of ${PLAN_774_RULES.minMaturityAge}.`
      );
      reasonCodes.push({
        code: "maturity_age_too_low",
        params: { min: PLAN_774_RULES.minMaturityAge, actual: maturityAge },
      });
    }

    if (
      !single &&
      input.premiumPaymentTermYears != null &&
      !(PLAN_774_RULES.limitedPremium.pptOptions as readonly number[]).includes(
        input.premiumPaymentTermYears
      )
    ) {
      eligible = false;
      reasons.push("Premium Paying Term must be 5, 6 or 7 years for Limited Premium payment.");
      reasonCodes.push({
        code: "invalid_premium_paying_term",
        params: { actual: input.premiumPaymentTermYears },
      });
    }
  }

  if (input.sumAssured == null) {
    missingInputs.push("sumAssured");
  } else if (input.sumAssured < PLAN_774_RULES.minBasicSumAssured) {
    eligible = false;
    reasons.push(
      `Basic Sum Assured of ${input.sumAssured} is below the minimum of ${PLAN_774_RULES.minBasicSumAssured}.`
    );
    reasonCodes.push({
      code: "sum_assured_below_min",
      params: { min: PLAN_774_RULES.minBasicSumAssured, actual: input.sumAssured },
    });
  } else if (!isValidSumAssuredIncrement(input.sumAssured, [...PLAN_774_RULES.sumAssuredBands])) {
    eligible = false;
    reasons.push("Basic Sum Assured is not a valid increment for its range.");
    reasonCodes.push({ code: "sum_assured_invalid_increment" });
  }

  const option = readOption(input);
  if (option != null) {
    const optionRule = PLAN_774_RULES.deathBenefitOptions[option];
    const requiredMode = optionRule.requiresMode === "single";
    if (requiredMode !== single) {
      eligible = false;
      reasons.push(`Option ${option} requires ${optionRule.requiresMode} premium payment.`);
      reasonCodes.push({
        code: "death_benefit_option_mode_mismatch",
        params: {},
      });
    }
  }

  if (eligible === true && missingInputs.length > 0) {
    eligible = null;
  }

  reasons.push(UNDERWRITING_DISCLAIMER);
  return { eligible, reasons, reasonCodes, missingInputs, sourceVersion: SOURCE_VERSION };
}

// ---- Phase 4: premium engine safety ----
// The brochure publishes exact premiums for exactly one age/term/BSA
// combination (age 5, term 20, BSA Rs.5,00,000), split by chosen Option.
// Only an exact match is ever returned.
export function calculatePremium(input: Plan774Input): PremiumCalculationResult {
  const missingInputs: string[] = [];
  if (input.policyTermYears == null) missingInputs.push("policyTermYears");
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  const option = readOption(input);
  if (option == null) missingInputs.push("productSpecificInputs.deathBenefitOption");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const sample = PLAN_774_RULES.sampleIllustrativePremium;
  const identityMatches =
    input.age === sample.age &&
    input.policyTermYears === sample.policyTermYears &&
    input.sumAssured === sample.basicSumAssured;

  if (!identityMatches) {
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  if (isSinglePremium(input)) {
    if (option === "III" || option === "IV") {
      const premium = option === "III" ? sample.single.optionIII : sample.single.optionIV;
      return {
        available: true,
        premium,
        premiumFrequency: "single",
        sumAssured: input.sumAssured,
        missingInputs: [],
        sourceVersion: SOURCE_VERSION,
      };
    }
    return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
  }

  if (option === "I" || option === "II") {
    const row = sample.limitedRows.find((r) => r.premiumPaymentTermYears === input.premiumPaymentTermYears);
    if (row) {
      return {
        available: true,
        premium: option === "I" ? row.optionI : row.optionII,
        premiumFrequency: "yearly",
        sumAssured: input.sumAssured,
        missingInputs: [],
        sourceVersion: SOURCE_VERSION,
      };
    }
  }

  return { available: false, missingInputs: [PREMIUM_UNAVAILABLE_REASON] };
}

// ---- Phase 3: benefit engine ----
export function calculateBenefits(input: Plan774Input): BenefitCalculationResult {
  const missingInputs: string[] = [];
  if (input.sumAssured == null) missingInputs.push("sumAssured");
  if (missingInputs.length > 0) {
    return { available: false, missingInputs };
  }

  const basicSumAssured = input.sumAssured as number;
  const guaranteedBenefits: Record<string, number> = { maturitySumAssured: basicSumAssured };
  let maturityBenefit = basicSumAssured;

  // Guaranteed Addition is a fixed, guaranteed rate — computable from BSA
  // and term alone, with no premium dependency (unlike every other plan
  // in this codebase, where only the Basic Sum Assured is guaranteed at
  // maturity and any bonus is undisclosed).
  if (input.policyTermYears != null) {
    const gaPerYear =
      (PLAN_774_RULES.guaranteedAddition.ratePerThousandBasicSumAssuredPerYear / 1000) *
      basicSumAssured;
    const gaAtMaturity = Math.round(gaPerYear * input.policyTermYears);
    guaranteedBenefits.guaranteedAdditionAtMaturity = gaAtMaturity;
    maturityBenefit = basicSumAssured + gaAtMaturity;
  }

  let deathBenefit: number | undefined;
  const option = readOption(input);
  if (option != null) {
    const optionRule = PLAN_774_RULES.deathBenefitOptions[option];
    const premiumLookup = calculatePremium(input);
    if (premiumLookup.available && premiumLookup.premium != null) {
      const multipleOfPremium = optionRule.multiple * premiumLookup.premium;
      const sumAssuredOnDeath = optionRule.hasBsaFloor
        ? Math.max(basicSumAssured, multipleOfPremium)
        : multipleOfPremium;
      guaranteedBenefits.sumAssuredOnDeath = sumAssuredOnDeath;
      deathBenefit = sumAssuredOnDeath;
    } else if (optionRule.hasBsaFloor) {
      guaranteedBenefits.sumAssuredOnDeathMinimum = basicSumAssured;
    }
    // Option IV has no BSA floor — with no verified premium there is
    // nothing guaranteed to report, so neither field is set.
  }

  return {
    available: true,
    guaranteedBenefits,
    // Non-Par product — there is no discretionary bonus to omit here,
    // but no non-guaranteed illustration is fabricated either.
    nonGuaranteedIllustrations: undefined,
    deathBenefit,
    maturityBenefit,
    missingInputs: [],
    sourceVersion: SOURCE_VERSION,
  };
}
