// Shared engine for LIC's Immediate/Deferred Annuity ("Pension") products
// (Jeevan Akshay-VII/857, Saral Pension/862, Smart Pension/879, New Jeevan
// Shanti/758). These plans have a genuinely different shape from every
// other product family in this codebase:
//
//  - The customer pays a Purchase Price (a single premium) and chooses an
//    Annuity Option; there is no Basic Sum Assured and no premium rate
//    table — `purchasePrice` is a direct customer input, same reasoning as
//    Plan 867's premium (capability: not_applicable, not unavailable).
//  - Each brochure publishes exactly ONE sample illustration point (one
//    Purchase Price + age [+ secondary age for Joint Life] + mode), giving
//    the exact annuity amount for every option at that single point. There
//    is no rate table for arbitrary ages/Purchase Prices, so — following
//    this codebase's "exact lookup only, never interpolate/extrapolate"
//    rule — the annuity amount is only ever reported when the customer's
//    inputs match that published point exactly; every other combination
//    stays unavailable rather than being guessed at.
//  - Every one of these brochures states plainly "There is no maturity
//    benefit under this plan" — `calculateBenefits` never sets
//    `maturityBenefit`, matching the established pure-risk-plan
//    convention (pureTermShared.ts) of leaving it undefined rather than
//    reporting an explicit 0.
//  - Death benefit is classified per option into what's HONESTLY
//    computable without any elapsed-time tracking:
//      - "none": the brochure states nothing is payable on death (Option
//        A style) — a genuine, verified zero.
//      - "full_purchase_price": Return-of-Purchase-Price options — the
//        Purchase Price is the customer's own input, so this is always
//        exactly known, no lookup needed.
//      - "guaranteed_period": Annuity-Certain-for-N-years options — the
//        full remaining guaranteed period is exactly the whole period AT
//        INCEPTION (same "at inception only" convention as Plan 867's
//        Assured Death Benefit), so it's reported only when the exact
//        annuity amount is itself known from the published sample.
//      - "not_computed": joint-life continuation-to-survivor options and
//        the %-early-return options — these need ongoing policy state
//        (who has died, how much has already been paid) this engine's
//        single-call context can't carry.

import { EligibilityReason, EligibilityResult, LiquidityResult } from "@/types/insurance";

export type AnnuityMode = "yearly" | "half_yearly" | "quarterly" | "monthly";

export type AnnuityDeathBenefitType =
  | "none"
  | "full_purchase_price"
  | "guaranteed_period"
  | "not_computed";

export interface AnnuityOption {
  code: string;
  isJointLife?: boolean;
  deathBenefitType: AnnuityDeathBenefitType;
  guaranteedPeriodYears?: number;
  allowsSurrender?: boolean;
  allowsLoan?: boolean;
  // Overrides rules.maxEntryAge for products where a handful of options
  // publish a different age ceiling than every other option (e.g. Smart
  // Pension's Option F: 100 years vs. 85 for most options).
  maxEntryAgeOverride?: number;
  // Only meaningful for deathBenefitType "full_purchase_price"; defaults
  // to 100. New Jeevan Shanti's Death Benefit floor is 105% of Purchase
  // Price, not a plain Return-of-Purchase-Price option.
  deathBenefitPercentOfPurchasePrice?: number;
}

export interface AnnuitySampleIllustration {
  purchasePrice: number;
  age: number;
  secondaryAge?: number;
  // Deferred-annuity products only (e.g. New Jeevan Shanti) — the number
  // of years between purchase and the first annuity payment.
  defermentPeriodYears?: number;
  mode: AnnuityMode;
  amounts: Partial<Record<string, number>>;
}

export interface AnnuityRules {
  minEntryAge: number;
  maxEntryAge: number;
  // Optional because at least one product (Saral Pension) publishes no
  // flat minimum — its Minimum Purchase Price is defined only as "whatever
  // meets the Minimum Annuity criterion for the chosen option/age", which
  // needs a full rate table this codebase doesn't have. When omitted, this
  // check is honestly left unenforced rather than guessed at.
  minPurchasePriceForAge?: (age: number) => number;
  options: readonly AnnuityOption[];
  sampleIllustrations: readonly AnnuitySampleIllustration[];
  // Set only when surrender is gated by a real-world condition (e.g.
  // Saral Pension's "critical illness" trigger) beyond just the chosen
  // option — forces `surrenderAvailable` to stay "conditional" even for
  // options that otherwise allow surrender, rather than overclaiming a
  // flat "yes".
  surrenderConditionReasonCode?: string;
}

export interface AnnuityInput {
  age: number;
  secondaryAge?: number;
  purchasePrice?: number;
  defermentPeriodYears?: number;
  mode?: AnnuityMode;
  optionCode?: string;
}

export function evaluateAnnuityEligibility(
  rules: AnnuityRules,
  input: AnnuityInput,
  sourceVersion: string,
  underwritingDisclaimer: string
): EligibilityResult {
  const reasons: string[] = [];
  const reasonCodes: EligibilityReason[] = [];
  const missingInputs: string[] = [];
  let eligible: boolean | null = true;

  const option = input.optionCode ? rules.options.find((o) => o.code === input.optionCode) : undefined;
  const maxEntryAge = option?.maxEntryAgeOverride ?? rules.maxEntryAge;

  if (input.age < rules.minEntryAge || input.age > maxEntryAge) {
    eligible = false;
    reasons.push(
      `Age ${input.age} is outside the eligible entry range of ${rules.minEntryAge}-${maxEntryAge}.`
    );
    reasonCodes.push({
      code: "age_out_of_range",
      params: { min: rules.minEntryAge, max: maxEntryAge, actual: input.age },
    });
  }

  if (input.optionCode == null) {
    missingInputs.push("optionCode");
  } else if (option?.isJointLife) {
    if (input.secondaryAge == null) {
      missingInputs.push("secondaryAge");
    } else if (input.secondaryAge < rules.minEntryAge || input.secondaryAge > rules.maxEntryAge) {
      eligible = false;
      reasons.push(
        `Secondary Annuitant age ${input.secondaryAge} is outside the eligible range of ${rules.minEntryAge}-${rules.maxEntryAge}.`
      );
      reasonCodes.push({
        code: "age_out_of_range",
        params: { min: rules.minEntryAge, max: rules.maxEntryAge, actual: input.secondaryAge },
      });
    }
  }

  if (input.purchasePrice == null) {
    missingInputs.push("purchasePrice");
  } else if (rules.minPurchasePriceForAge) {
    const minPurchasePrice = rules.minPurchasePriceForAge(input.age);
    if (input.purchasePrice < minPurchasePrice) {
      eligible = false;
      reasons.push(
        `Purchase Price of ${input.purchasePrice} is below the minimum of ${minPurchasePrice}.`
      );
      reasonCodes.push({
        code: "sum_assured_below_min",
        params: { min: minPurchasePrice, actual: input.purchasePrice },
      });
    }
  }

  if (eligible === true && missingInputs.length > 0) eligible = null;
  reasons.push(underwritingDisclaimer);
  return { eligible, reasons, reasonCodes, missingInputs, sourceVersion };
}

// Exact-match only — never the nearest row, never interpolated. Each
// brochure publishes exactly one illustration point; every other
// combination of purchasePrice/age/secondaryAge/mode stays unavailable.
export function findAnnuitySample(
  rules: AnnuityRules,
  input: AnnuityInput
): AnnuitySampleIllustration | undefined {
  const mode = input.mode ?? "yearly";
  // A brochure's single illustration point publishes one secondary age
  // for the whole table (used by whichever options are Joint Life) — it
  // is irrelevant to every non-Joint-Life option, so only require it to
  // match when the chosen option actually is Joint Life.
  const option = input.optionCode ? rules.options.find((o) => o.code === input.optionCode) : undefined;
  return rules.sampleIllustrations.find(
    (s) =>
      s.purchasePrice === input.purchasePrice &&
      s.age === input.age &&
      s.mode === mode &&
      (!option?.isJointLife || (s.secondaryAge ?? null) === (input.secondaryAge ?? null)) &&
      (s.defermentPeriodYears ?? null) === (input.defermentPeriodYears ?? null)
  );
}

export function calculateAnnuityBenefits(
  rules: AnnuityRules,
  input: AnnuityInput,
  sourceVersion: string
) {
  const missingInputs: string[] = [];
  if (input.purchasePrice == null) missingInputs.push("purchasePrice");
  if (input.optionCode == null) missingInputs.push("optionCode");
  if (missingInputs.length > 0) {
    return { available: false as const, missingInputs };
  }

  const option = rules.options.find((o) => o.code === input.optionCode);
  if (!option) {
    return { available: false as const, missingInputs: ["optionCode"] };
  }

  const purchasePrice = input.purchasePrice as number;
  const guaranteedBenefits: Record<string, number> = {};
  let deathBenefit: number | undefined;

  if (option.deathBenefitType === "none") {
    deathBenefit = 0;
    guaranteedBenefits.deathBenefitOnDeath = 0;
  } else if (option.deathBenefitType === "full_purchase_price") {
    const pct = option.deathBenefitPercentOfPurchasePrice ?? 100;
    deathBenefit = Math.round((pct / 100) * purchasePrice);
    guaranteedBenefits.deathBenefitOnDeath = deathBenefit;
  }

  const sample = findAnnuitySample(rules, input);
  if (sample) {
    const amount = sample.amounts[option.code];
    if (amount != null) {
      guaranteedBenefits.annuityAmountPerPayment = amount;
      if (
        option.deathBenefitType === "guaranteed_period" &&
        option.guaranteedPeriodYears != null &&
        sample.mode === "yearly"
      ) {
        const total = amount * option.guaranteedPeriodYears;
        guaranteedBenefits.deathBenefitGuaranteedPeriodTotalAtInception = total;
        deathBenefit = total;
      }
    }
  }

  return {
    available: true as const,
    guaranteedBenefits,
    nonGuaranteedIllustrations: undefined,
    deathBenefit,
    // Every one of these brochures states plainly "There is no maturity
    // benefit under this plan" — deliberately never set, matching the
    // pureTermShared.ts convention of leaving this undefined.
    maturityBenefit: undefined,
    missingInputs: [],
    sourceVersion,
  };
}

export function evaluateAnnuityLiquidity(
  rules: AnnuityRules,
  input: AnnuityInput,
  sourceId: string
): LiquidityResult {
  const option = input.optionCode ? rules.options.find((o) => o.code === input.optionCode) : undefined;
  if (!option) {
    return {
      surrenderAvailable: { status: "conditional", value: null, sourceIds: [sourceId] },
      loanAvailable: { status: "conditional", value: null, sourceIds: [sourceId] },
    };
  }
  return {
    surrenderAvailable: rules.surrenderConditionReasonCode
      ? {
          status: "conditional",
          value: null,
          sourceIds: [sourceId],
          reasonCodes: [{ code: rules.surrenderConditionReasonCode }],
        }
      : { status: "verified", value: option.allowsSurrender ?? false, sourceIds: [sourceId] },
    loanAvailable: { status: "verified", value: option.allowsLoan ?? false, sourceIds: [sourceId] },
  };
}
