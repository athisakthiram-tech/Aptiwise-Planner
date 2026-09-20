// The Plan Intelligence registry — one PlanIntelligenceProfile per
// ACTIVE, non-term LIC product in the canonical catalogue
// (lib/insurance/providers/lic/catalogue.ts). Pure data + composition:
// every eligibility figure quoted here is copied from that plan's own
// verified RULES export (lib/insurance/providers/lic/plans/plan<N>.ts)
// where a registered engine exists; every qualitative mechanics
// description is drawn from LIC's own publicly documented product
// design and is deliberately free of exact unverified numbers.
//
// EXCLUDED from this file entirely (Phase 1 scope, Section: SCOPE —
// PRODUCTS): the 9 pure term/protection-only products (876, 878, 877,
// 875, 954, 955, 859, 887, 894) — see productRoles.ts's PROTECTION_ONLY
// gate, unchanged, for why they stay out of any goal-accumulation
// universe.

import { getLicProductByIdentity } from "@/lib/insurance/providers/lic/catalogue";
import { assessNeedFit, PlanMechanicsForNeedFit } from "@/lib/planning/planIntelligence/needSuitability";
import { describeCashFlowPattern } from "@/lib/planning/planIntelligence/cashFlowModel";
import { weakestConfidence } from "@/lib/planning/planIntelligence/confidence";
import { buildUlipIntelligence, officialIllustration, ulipFund } from "@/lib/planning/planIntelligence/ulipModel";
import {
  annuityBenefit,
  guaranteedAddition,
  guaranteedIncome,
  guaranteedMaturity,
  guaranteedProtection,
  guaranteedSurvival,
  marketLinkedFundValue,
  nonGuaranteedFinalBonus,
  nonGuaranteedLoyaltyAddition,
  nonGuaranteedReversionaryBonus,
  otherContractual,
} from "@/lib/planning/planIntelligence/benefitModel";
import {
  BenefitDescriptor,
  CashFlowPattern,
  ComplementaryCharacteristic,
  DataConfidence,
  EligibilitySummary,
  ExtendedProductRole,
  FactualCharacteristic,
  NeedTag,
  PlanIntelligenceProfile,
  PremiumModel,
  ProductNature,
  UlipIntelligence,
} from "@/lib/planning/planIntelligence/types";

const ALL_NEED_TAGS: NeedTag[] = [
  "CHILD_EDUCATION",
  "CHILD_MARRIAGE",
  "RETIREMENT",
  "WEALTH_ACCUMULATION",
  "REGULAR_INCOME",
  "LONG_TERM_SAVINGS",
  "LEGACY",
  "HOME_GOAL",
  "SCHEDULED_LIQUIDITY",
  "MARKET_LINKED_GROWTH",
  "CAPITAL_PRESERVATION",
  "LIFELONG_INCOME",
];

interface BuildProfileParams {
  planNumber: string;
  uin: string;
  hasRegisteredEngine: boolean;
  productNature: ProductNature[];
  eligibility: EligibilitySummary;
  premiumModel: PremiumModel;
  benefitModel: BenefitDescriptor[];
  hasLifeProtection: boolean;
  protectionDescription: string;
  cashFlowPattern: CashFlowPattern;
  marketRisk: "NONE" | "MARKET_LINKED";
  isSinglePremium: boolean;
  irrCalculable: boolean;
  returnNotes: string[];
  liquidity: { surrenderAvailable: DataConfidence | "NOT_APPLICABLE"; loanAvailable: DataConfidence | "NOT_APPLICABLE"; lockInYears: number | null; notes: string[] };
  ulip: UlipIntelligence | null;
  professionSuitability: string[];
  combinationRoles: ExtendedProductRole[];
  complementaryCharacteristics: ComplementaryCharacteristic[];
  strengths: FactualCharacteristic[];
  tradeoffs: FactualCharacteristic[];
  usefulWhen: string[];
  lessUsefulWhen: string[];
  overallConfidence: DataConfidence;
  sources: string[];
}

function buildProfile(p: BuildProfileParams): PlanIntelligenceProfile {
  const product = getLicProductByIdentity(p.planNumber, p.uin);
  if (!product) {
    throw new Error(`Plan Intelligence: catalogue is missing plan ${p.planNumber}/${p.uin} — registration is inconsistent.`);
  }
  const mechanics: PlanMechanicsForNeedFit = {
    cashFlowPattern: p.cashFlowPattern,
    marketRisk: p.marketRisk,
    hasLifeProtection: p.hasLifeProtection,
    isSinglePremium: p.isSinglePremium,
  };
  const needSuitability = ALL_NEED_TAGS.map((need) => assessNeedFit(need, mechanics));

  const benefitConfidences = p.benefitModel.map((b) =>
    b.character === "GUARANTEED" ? ("VERIFIED" as DataConfidence) : b.character === "MARKET_LINKED" ? ("ILLUSTRATIVE" as DataConfidence) : ("ESTIMATED" as DataConfidence)
  );
  const dataConfidence = weakestConfidence([p.overallConfidence, ...benefitConfidences]);

  return {
    identity: {
      productName: product.productName,
      planNumber: p.planNumber,
      uin: p.uin,
      version: p.uin.slice(-3),
      active: product.status === "ACTIVE",
      category: product.category,
      hasRegisteredEngine: p.hasRegisteredEngine,
    },
    productNature: p.productNature,
    eligibility: p.eligibility,
    premiumModel: p.premiumModel,
    benefitModel: p.benefitModel,
    protectionModel: { hasLifeProtection: p.hasLifeProtection, description: p.protectionDescription },
    cashFlowPattern: p.cashFlowPattern,
    returnCharacteristics: { calculationReadiness: p.premiumModel.calculationReadiness, irrCalculable: p.irrCalculable, notes: p.returnNotes },
    liquidityCharacteristics: p.liquidity,
    marketRisk: p.marketRisk,
    ulip: p.ulip,
    needSuitability,
    professionSuitability: p.professionSuitability,
    combinationRoles: p.combinationRoles,
    complementaryCharacteristics: p.complementaryCharacteristics,
    strengths: p.strengths,
    tradeoffs: p.tradeoffs,
    usefulWhen: p.usefulWhen,
    lessUsefulWhen: p.lessUsefulWhen,
    dataConfidence,
    sources: p.sources,
  };
}

function src(planNumber: string): string[] {
  return [`lic-${planNumber}-sales-brochure-current`];
}

// ==========================================================================
// ENDOWMENT (12 active)
// ==========================================================================

const PLAN_717 = buildProfile({
  planNumber: "717",
  uin: "512N283V03",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_NON_PARTICIPATING", "ENDOWMENT", "SINGLE_PREMIUM"],
  eligibility: {
    minEntryAge: 0,
    maxEntryAge: 65,
    minMaturityAge: 18,
    maxMaturityAge: 75,
    minPolicyTermYears: 10,
    maxPolicyTermYears: 25,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: 100000, minPremium: null },
    premiumModes: ["single"],
    notes: ["Single premium only — no Premium Paying Term."],
  },
  premiumModel: {
    structure: "SINGLE",
    pptRelationship: { kind: "NOT_APPLICABLE" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 100000, provenance: { status: "VERIFIED", sourceReferences: src("717") } },
    notes: ["One lump-sum premium at inception; the registered engine resolves it only for the exact published sample age/term rows."],
  },
  benefitModel: [guaranteedMaturity("Sum Assured on Maturity is a guaranteed, fixed multiple of the single premium paid."), guaranteedProtection("Guaranteed death benefit at a fixed multiple of the single premium, at least equal to 125% of it.")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit throughout the policy term, funded entirely by the single premium.",
  cashFlowPattern: "LUMP_SUM_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: true,
  irrCalculable: true,
  returnNotes: ["Both the outflow and the guaranteed maturity value are known once a sample premium resolves, so an IRR is calculable and would itself be VERIFIED (every contributing cash flow is guaranteed)."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Loan/surrender documented as available; amounts require Surrender Value tables not modeled here."] },
  ulip: null,
  professionSuitability: ["A single lump-sum premium suits a customer with a one-time surplus (e.g. a bonus, sale proceeds, or maturity from another policy) rather than someone funding a goal from ongoing income."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [],
  strengths: [{ label: "single, one-time premium obligation", detail: "No ongoing premium commitment after inception." }, { label: "guaranteed maturity value", detail: "The Sum Assured on Maturity is fixed and known once the premium is paid." }],
  tradeoffs: [{ label: "requires a lump sum upfront", detail: "Not fundable from ongoing monthly/yearly income the way a regular-pay product is." }, { label: "no participating bonus", detail: "Non-participating — the maturity value does not grow with LIC's bonus declarations." }],
  usefulWhen: ["The customer has a one-time lump sum (bonus, inheritance, sale proceeds) to deploy toward a future goal."],
  lessUsefulWhen: ["The customer wants to fund a goal from ongoing monthly/annual savings rather than a lump sum."],
  overallConfidence: "VERIFIED",
  sources: src("717"),
});

const PLAN_714 = buildProfile({
  planNumber: "714",
  uin: "512N277V03",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_PARTICIPATING", "ENDOWMENT", "REGULAR_PREMIUM"],
  eligibility: {
    minEntryAge: 8,
    maxEntryAge: 50,
    minMaturityAge: 20,
    maxMaturityAge: 75,
    minPolicyTermYears: 12,
    maxPolicyTermYears: 35,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: 200000, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: ["Regular Pay only — Premium Paying Term always equals Policy Term."],
  },
  premiumModel: {
    structure: "REGULAR",
    pptRelationship: { kind: "EQUALS_TERM" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 200000, provenance: { status: "VERIFIED", sourceReferences: src("714") } },
    notes: ["Level premiums for the full policy term; the registered engine resolves them only at published sample age/term rows."],
  },
  benefitModel: [guaranteedMaturity("Sum Assured on Maturity equals the Basic Sum Assured, guaranteed."), guaranteedProtection("Guaranteed death benefit, at least the Basic Sum Assured."), nonGuaranteedReversionaryBonus("Simple Reversionary Bonus, declared annually by LIC — not guaranteed, no rate published in this repository's verified data."), nonGuaranteedFinalBonus("Final Additional Bonus, payable on a claim in later years — not guaranteed, no rate published.")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit throughout the full policy term, level premiums.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["An IRR using only the guaranteed BSA-at-maturity figure would understate the true return (bonuses are real but unpublished); an IRR including an assumed bonus would be fabricated. Not currently calculable without inventing a bonus rate."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts require Surrender Value tables not modeled here."] },
  ulip: null,
  professionSuitability: ["A long, level Premium Paying Term (equal to the full policy term, up to 35 years) is easiest to sustain with a stable, predictable income."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [],
  strengths: [{ label: "long, flexible term range", detail: "Policy terms from 12 to 35 years accommodate a wide range of horizons." }, { label: "guaranteed maturity floor", detail: "Sum Assured on Maturity is guaranteed independent of any bonus." }],
  tradeoffs: [{ label: "premiums payable for the entire policy term", detail: "No limited-pay option — the full commitment runs the whole term." }, { label: "bonus rate not published", detail: "The true total return depends on non-guaranteed bonuses this repository cannot quote." }],
  usefulWhen: ["The customer wants a long-horizon, level-premium guaranteed-floor savings vehicle with participating upside."],
  lessUsefulWhen: ["The customer wants premium payments to stop before the goal horizon (no limited-pay option here)."],
  overallConfidence: "VERIFIED",
  sources: src("714"),
});

const PLAN_715 = buildProfile({
  planNumber: "715",
  uin: "512N279V03",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_PARTICIPATING", "ENDOWMENT", "REGULAR_PREMIUM"],
  eligibility: {
    minEntryAge: 18,
    maxEntryAge: 50,
    minMaturityAge: null,
    maxMaturityAge: 75,
    minPolicyTermYears: 15,
    maxPolicyTermYears: 35,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: 200000, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: ["Regular Pay only — Premium Paying Term always equals Policy Term."],
  },
  premiumModel: {
    structure: "REGULAR",
    pptRelationship: { kind: "EQUALS_TERM" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 200000, provenance: { status: "VERIFIED", sourceReferences: src("715") } },
    notes: ["Level premiums for the full policy term; the registered engine resolves them only at published sample age/term rows."],
  },
  benefitModel: [guaranteedMaturity("Sum Assured on Maturity equals the Basic Sum Assured, guaranteed."), guaranteedProtection("An enhanced death benefit — a multiple of Basic Sum Assured — payable on death, a distinguishing feature of this plan versus a plain endowment."), nonGuaranteedReversionaryBonus("Simple Reversionary Bonus, declared annually — not guaranteed."), nonGuaranteedFinalBonus("Final Additional Bonus in later policy years — not guaranteed.")],
  hasLifeProtection: true,
  protectionDescription: "An enhanced (multiple-of-BSA) guaranteed death benefit, distinguishing this plan from a plain endowment's flat death benefit.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["Same bonus-rate limitation as Plan 714 — total return depends on unpublished non-guaranteed bonuses."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts require Surrender Value tables not modeled here."] },
  ulip: null,
  professionSuitability: ["Same long, level-pay commitment profile as Plan 714 — best sustained with stable, predictable income."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [],
  strengths: [{ label: "enhanced death benefit multiple", detail: "Death benefit is a multiple of BSA, higher than a plain endowment's flat BSA payout." }, { label: "guaranteed maturity floor", detail: "Sum Assured on Maturity is guaranteed." }],
  tradeoffs: [{ label: "premiums payable for the entire policy term", detail: "No limited-pay option." }, { label: "bonus rate not published", detail: "Total return depends on non-guaranteed bonuses this repository cannot quote." }],
  usefulWhen: ["The customer values a higher guaranteed death benefit multiple alongside long-horizon savings."],
  lessUsefulWhen: ["The customer wants premiums to stop before the goal horizon."],
  overallConfidence: "VERIFIED",
  sources: src("715"),
});

const PLAN_733 = buildProfile({
  planNumber: "733",
  uin: "512N297V03",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_PARTICIPATING", "ENDOWMENT", "LIMITED_PREMIUM"],
  eligibility: {
    minEntryAge: 18,
    maxEntryAge: 50,
    minMaturityAge: 31,
    maxMaturityAge: 65,
    minPolicyTermYears: 13,
    maxPolicyTermYears: 25,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: 200000, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: ["Premium Paying Term = Policy Term - 3 years (fixed offset)."],
  },
  premiumModel: {
    structure: "LIMITED",
    pptRelationship: { kind: "FIXED_OFFSET", offsetYears: 3 },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 200000, provenance: { status: "VERIFIED", sourceReferences: src("733") } },
    notes: ["Premiums stop 3 years before the policy term ends — a genuine limited-pay structure aimed at goal-horizon planning (Jeevan Lakshya is explicitly marketed for child-goal planning, though this model reasons from its mechanics, not that marketing)."],
  },
  benefitModel: [guaranteedMaturity("Sum Assured on Maturity equals the Basic Sum Assured, guaranteed."), guaranteedIncome("On death during the policy term, in addition to the death benefit, an annual income equal to 10% of Sum Assured is paid to the nominee from the date of death until the end of the policy term — a distinguishing income-continuation feature."), guaranteedProtection("Guaranteed death benefit, at least the Basic Sum Assured."), nonGuaranteedReversionaryBonus("Simple Reversionary Bonus — not guaranteed."), nonGuaranteedFinalBonus("Final Additional Bonus in later years — not guaranteed.")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit PLUS a guaranteed continuing annual income (10% of Sum Assured) to the nominee until the policy term ends — a distinguishing family-income-continuation mechanic on death, not present in a plain endowment.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["Bonus rate unpublished, same limitation as other participating endowments."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts require Surrender Value tables not modeled here."] },
  ulip: null,
  professionSuitability: ["A fixed 3-year-shorter Premium Paying Term (vs. Policy Term) suits a customer who wants premium obligations to end meaningfully before the goal date, giving a predictable few debt-free years before the goal."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [{ characteristic: "guaranteed floor plus post-death income continuation", complementsRolesWith: ["MARKET_LINKED_ACCUMULATION"], reasoning: "The guaranteed maturity floor and death-linked income continuation can anchor a combination whose other component targets growth." }],
  strengths: [{ label: "premiums stop before the goal horizon", detail: "PPT = Term - 3, freeing capacity in the final years before maturity." }, { label: "income continuation on death", detail: "A guaranteed 10%-of-BSA annual income to the nominee if the life assured dies during the term." }],
  tradeoffs: [{ label: "narrower age/term eligibility band", detail: "Entry age capped at 50, maturity age capped at 65 — tighter than some peer endowments." }, { label: "bonus rate not published", detail: "Total return depends on non-guaranteed bonuses." }],
  usefulWhen: ["The customer wants premium payments to end a few years before the goal date while retaining a family-income-continuation protection feature."],
  lessUsefulWhen: ["The customer is older than the entry-age ceiling (50) or needs a term shorter than 13 years."],
  overallConfidence: "VERIFIED",
  sources: src("733"),
});

const PLAN_736 = buildProfile({
  planNumber: "736",
  uin: "512N304V03",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_PARTICIPATING", "ENDOWMENT", "LIMITED_PREMIUM"],
  eligibility: {
    minEntryAge: 8,
    maxEntryAge: 59,
    minMaturityAge: null,
    maxMaturityAge: 75,
    minPolicyTermYears: 16,
    maxPolicyTermYears: 25,
    validTermOptions: [16, 21, 25],
    minPremiumOrBsa: { minBasicSumAssured: 200000, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: ["Only 3 discrete (Term, PPT) pairs: (16,10), (21,15), (25,16). Max entry age varies by term."],
  },
  premiumModel: {
    structure: "LIMITED",
    pptRelationship: { kind: "FIXED_PAIRING" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 200000, provenance: { status: "VERIFIED", sourceReferences: src("736") } },
    notes: ["Premiums payable for a meaningfully shorter period than the policy term (10/15/16 years vs. 16/21/25), freeing capacity in the later years before maturity."],
  },
  benefitModel: [guaranteedMaturity("Sum Assured on Maturity equals the Basic Sum Assured, guaranteed."), guaranteedProtection("Death benefit is the higher of Basic Sum Assured or 7x annualised premium, plus vested bonuses; never less than the BSA floor."), nonGuaranteedReversionaryBonus("Simple Reversionary Bonus — not guaranteed."), nonGuaranteedFinalBonus("Final Additional Bonus — not guaranteed.")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit, the higher of BSA or 7x annualised premium.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["Bonus rate unpublished."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts require Surrender Value tables not modeled here."] },
  ulip: null,
  professionSuitability: ["A meaningfully shorter fixed PPT (10 of 16 years, 15 of 21, or 16 of 25) suits a customer who wants a clear, sizeable post-PPT period of freed monthly capacity before the goal date."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [{ characteristic: "guaranteed floor with a large post-PPT freed-capacity window", complementsRolesWith: ["MARKET_LINKED_ACCUMULATION"], reasoning: "The multi-year gap between PPT completion and maturity is capacity a second, market-linked component can productively use." }],
  strengths: [{ label: "wide entry age range", detail: "8 to 59 years, one of the widest in this catalogue." }, { label: "no limit on maximum Basic Sum Assured", detail: "Unlike several peers with modest minimums, no published ceiling." }],
  tradeoffs: [{ label: "only 3 discrete term/PPT pairs", detail: "Less configuration flexibility than a plan with an independent term range." }, { label: "bonus rate not published", detail: "Total return depends on non-guaranteed bonuses." }],
  usefulWhen: ["The customer's goal horizon is close to 16, 21 or 25 years and wants premiums to stop well before the goal date."],
  lessUsefulWhen: ["The customer's horizon doesn't align with one of the 3 fixed term options."],
  overallConfidence: "VERIFIED",
  sources: src("736"),
});

const PLAN_774 = buildProfile({
  planNumber: "774",
  uin: "512N365V02",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_NON_PARTICIPATING", "ENDOWMENT", "REGULAR_PREMIUM", "LIMITED_PREMIUM"],
  eligibility: {
    minEntryAge: 0,
    maxEntryAge: 13,
    minMaturityAge: 18,
    maxMaturityAge: 25,
    minPolicyTermYears: 5,
    maxPolicyTermYears: 25,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "single"],
    notes: ["A child-specific plan (entry age 0-13); the customer being underwritten is the child, the premium payer is the proposer/parent."],
  },
  premiumModel: {
    structure: "REGULAR",
    pptRelationship: { kind: "INDEPENDENT_CHOICE" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: only a single (age=5, term=20, BSA=Rs.5,00,000) sample point is published", sourceReferences: [] } },
    notes: ["Only ONE exact brochure sample point is published in this repository's verified data — every other configuration is honestly unresolved, not estimated by scaling (a single point can't defensibly support nearby-age or nearby-BSA scaling with confidence)."],
  },
  benefitModel: [guaranteedMaturity("Sum Assured on Maturity, guaranteed, chosen from one of several death-benefit options."), guaranteedProtection("Guaranteed death benefit per the chosen option (I-IV).")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit on the child per the chosen Sum Assured on Death option — cover typically continues/varies around the child's minority per the plan's own option design.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["Only one published sample premium point exists in this repository's verified data — not enough coverage to build a reliable cash-flow/IRR analysis for arbitrary customer ages."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts not modeled here."] },
  ulip: null,
  professionSuitability: ["A children's plan funded by the parent/guardian — profession hints apply to the PAYER, not the child life assured."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [],
  strengths: [{ label: "designed around a child's minority", detail: "Entry age 0-13, maturity age 18-25 — structurally aligned to a child-goal horizon." }],
  tradeoffs: [{ label: "very limited published premium data", detail: "Only one sample point is verified in this repository, so premium calculation is unavailable for most real customer configurations today." }],
  usefulWhen: ["A parent/guardian wants a child-specific plan and the specific published sample configuration (age 5 child, 20-year term, Rs.5,00,000 BSA) is close to their actual need."],
  lessUsefulWhen: ["The required configuration differs meaningfully from the one published sample point — premium cannot yet be defensibly estimated."],
  overallConfidence: "ESTIMATED",
  sources: src("774"),
});

const PLAN_912 = buildProfile({
  planNumber: "912",
  uin: "512N387V02",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_NON_PARTICIPATING", "ENDOWMENT", "LIMITED_PREMIUM"],
  eligibility: {
    minEntryAge: 0,
    maxEntryAge: null,
    minMaturityAge: 18,
    maxMaturityAge: 75,
    minPolicyTermYears: 10,
    maxPolicyTermYears: 20,
    validTermOptions: [10, 15, 20],
    minPremiumOrBsa: { minBasicSumAssured: 500000, minPremium: null },
    premiumModes: ["yearly"],
    notes: ["Sample data is published at a single reference age (35) with 9 published PPT/term pairs; two death-benefit options (I/II)."],
  },
  premiumModel: {
    structure: "LIMITED",
    pptRelationship: { kind: "INDEPENDENT_CHOICE" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 500000, provenance: { status: "VERIFIED", sourceReferences: src("912") } },
    notes: ["PPT is a genuine, independently-priced choice among several published options (6/8/10/12/15 years) for a given term — already correctly matched by the registered engine."],
  },
  benefitModel: [guaranteedMaturity("Sum Assured on Maturity equals the Basic Sum Assured, guaranteed."), guaranteedAddition("A fixed, guaranteed rate-per-thousand-BSA Guaranteed Addition, distinct from the participating bonus other endowments in this list carry."), guaranteedProtection("Guaranteed death benefit per the chosen option (I/II).")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit under a chosen option, non-participating (no dependency on LIC's annual bonus declarations).",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: true,
  returnNotes: ["Because the Guaranteed Addition is itself GUARANTEED (unlike a participating plan's bonus), the total maturity value is fully known once a premium resolves — an IRR here would be VERIFIED, not illustrative, unlike Plans 714/715/733/736."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts not modeled here."] },
  ulip: null,
  professionSuitability: ["Several independent PPT choices (6 to 15 years) for the same term make this adaptable to a customer who wants a specific, shorter premium-paying commitment regardless of income stability."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [{ characteristic: "fully guaranteed total maturity value (no unpublished bonus dependency)", complementsRolesWith: ["MARKET_LINKED_ACCUMULATION"], reasoning: "A non-participating plan whose ENTIRE maturity value is guaranteed and known makes an unusually clean stability anchor for a combination with a growth-oriented component." }],
  strengths: [{ label: "fully guaranteed maturity value including Guaranteed Addition", detail: "Non-participating design means no unpublished bonus dependency — the total is knowable in advance." }, { label: "independent PPT choice", detail: "Several PPT options per term, not a single fixed pairing." }],
  tradeoffs: [{ label: "sample data published at one reference age only", detail: "Age 35 in this repository's verified data — other ages are unresolved without an estimate." }, { label: "higher minimum Basic Sum Assured", detail: "Rs.5,00,000 minimum, higher than several peers." }],
  usefulWhen: ["The customer wants a fully guaranteed (non-participating) maturity value with independent PPT choice."],
  lessUsefulWhen: ["The customer's age is far from the one published reference age and an estimate's confidence matters."],
  overallConfidence: "VERIFIED",
  sources: src("912"),
});

const PLAN_881 = buildProfile({
  planNumber: "881",
  uin: "512N389V01",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_NON_PARTICIPATING", "ENDOWMENT", "LIMITED_PREMIUM"],
  eligibility: {
    minEntryAge: 18,
    maxEntryAge: 50,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: 200000, minPremium: null },
    premiumModes: ["yearly"],
    notes: ["A women-oriented savings plan; sample data published at a single reference age (35) with PPT options 7-15 years."],
  },
  premiumModel: {
    structure: "LIMITED",
    pptRelationship: { kind: "INDEPENDENT_CHOICE" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 200000, provenance: { status: "VERIFIED", sourceReferences: src("881") } },
    notes: ["PPT is an independent choice (7-15 years), already correctly matched by the registered engine."],
  },
  benefitModel: [guaranteedMaturity("Guaranteed maturity benefit under a chosen survival-benefit option."), guaranteedProtection("Guaranteed death benefit under the chosen option.")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit under the chosen option, non-participating.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_SCHEDULED_SURVIVAL_PAYMENTS",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: true,
  returnNotes: ["Non-participating with guaranteed benefits under each option — an IRR would be VERIFIED once a sample premium resolves."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts not modeled here."] },
  ulip: null,
  professionSuitability: ["Independent PPT choice (7-15 years) suits customers wanting a specific shorter commitment."],
  combinationRoles: ["GOAL_ACCUMULATION", "SCHEDULED_LIQUIDITY", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [],
  strengths: [{ label: "guaranteed, non-participating benefits", detail: "No dependency on unpublished bonus rates." }, { label: "scheduled survival-benefit option available", detail: "Can provide interim liquidity, not purely a lump-sum-at-maturity design." }],
  tradeoffs: [{ label: "sample data published at one reference age only", detail: "Age 35 in this repository's verified data." }],
  usefulWhen: ["The customer wants guaranteed benefits with an option for interim scheduled liquidity."],
  lessUsefulWhen: ["The customer's age is far from the published reference age."],
  overallConfidence: "VERIFIED",
  sources: src("881"),
});

const PLAN_888 = buildProfile({
  planNumber: "888",
  uin: "512N393V01",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_PARTICIPATING", "ENDOWMENT", "SINGLE_PREMIUM"],
  eligibility: {
    minEntryAge: 18,
    maxEntryAge: null,
    minMaturityAge: 28,
    maxMaturityAge: null,
    minPolicyTermYears: 10,
    maxPolicyTermYears: 25,
    validTermOptions: [10, 15, 20, 25],
    minPremiumOrBsa: { minBasicSumAssured: 300000, minPremium: null },
    premiumModes: ["single"],
    notes: ["Joint-life plan (New Jeevan Sathi) — Option I (individual/wider term range) or Option II (joint, narrower term range) change max entry/maturity age."],
  },
  premiumModel: {
    structure: "SINGLE",
    pptRelationship: { kind: "NOT_APPLICABLE" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 300000, provenance: { status: "VERIFIED", sourceReferences: src("888") } },
    notes: ["Single premium; no ongoing Premium Paying Term."],
  },
  benefitModel: [guaranteedMaturity("Guaranteed maturity benefit."), guaranteedProtection("Guaranteed death benefit."), nonGuaranteedReversionaryBonus("Simple Reversionary Bonus — not guaranteed."), nonGuaranteedFinalBonus("Final Additional Bonus — not guaranteed.")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit, joint-life (two lives insured) option available.",
  cashFlowPattern: "LUMP_SUM_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: true,
  irrCalculable: false,
  returnNotes: ["Bonus rate unpublished for the non-guaranteed portion; the guaranteed-only IRR would understate true return."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts not modeled here."] },
  ulip: null,
  professionSuitability: ["Single premium suits a one-time lump sum rather than ongoing income-funded savings."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [],
  strengths: [{ label: "joint-life cover in one policy", detail: "Two lives insured under a single policy (Option II)." }, { label: "no ongoing premium obligation", detail: "Single premium only." }],
  tradeoffs: [{ label: "requires a lump sum", detail: "Not fundable from ongoing income." }, { label: "narrower term range under joint-life Option II", detail: "10 or 15 years only, versus 10-25 under Option I." }],
  usefulWhen: ["A couple/two related lives want joint cover funded by a single lump sum."],
  lessUsefulWhen: ["The customer wants to fund the goal from ongoing income rather than a lump sum."],
  overallConfidence: "VERIFIED",
  sources: src("888"),
});

const PLAN_889 = buildProfile({
  planNumber: "889",
  uin: "512N394V01",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_PARTICIPATING", "ENDOWMENT", "LIMITED_PREMIUM"],
  eligibility: {
    minEntryAge: 20,
    maxEntryAge: 50,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: 15,
    maxPolicyTermYears: 25,
    validTermOptions: [15, 20, 25],
    minPremiumOrBsa: { minBasicSumAssured: 300000, minPremium: null },
    premiumModes: ["yearly"],
    notes: ["Joint-life plan; only 3 published (PPT, Term) pairs: (5,15), (10,20), (15,25) — the registered engine already requires an exact PPT+term match, never defaulting a PPT silently."],
  },
  premiumModel: {
    structure: "LIMITED",
    pptRelationship: { kind: "FIXED_PAIRING" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 300000, provenance: { status: "VERIFIED", sourceReferences: src("889") } },
    notes: ["Premiums payable for meaningfully less than the full term (5 of 15, 10 of 20, or 15 of 25 years)."],
  },
  benefitModel: [guaranteedMaturity("Guaranteed maturity benefit under the chosen option."), guaranteedAddition("A guaranteed, premium-based Guaranteed Addition accruing for the full policy term."), guaranteedProtection("Guaranteed death benefit under the chosen option (I/II).")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit, joint-life option, plus a guaranteed Guaranteed Addition (distinct from a participating bonus).",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: true,
  returnNotes: ["The Guaranteed Addition is itself guaranteed, so total maturity value is fully known once premium resolves — an IRR would be VERIFIED."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts not modeled here."] },
  ulip: null,
  professionSuitability: ["A meaningfully shorter PPT than term suits customers wanting premiums to stop well before the goal date."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [{ characteristic: "guaranteed floor with a large post-PPT freed-capacity window", complementsRolesWith: ["MARKET_LINKED_ACCUMULATION"], reasoning: "The gap between PPT completion and maturity frees capacity a second component can use." }],
  strengths: [{ label: "joint-life cover with guaranteed additions", detail: "Two lives insured, with a fully guaranteed accrual mechanic." }],
  tradeoffs: [{ label: "only 3 discrete term/PPT pairs", detail: "Less flexible than an independent-PPT product." }],
  usefulWhen: ["Joint-life cover is wanted alongside a shorter, fully-guaranteed premium-paying commitment."],
  lessUsefulWhen: ["The customer's horizon doesn't align with one of the 3 fixed term options."],
  overallConfidence: "VERIFIED",
  sources: src("889"),
});

const PLAN_890 = buildProfile({
  planNumber: "890",
  uin: "512N395V01",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_NON_PARTICIPATING", "ENDOWMENT", "LIMITED_PREMIUM"],
  eligibility: {
    minEntryAge: 0,
    maxEntryAge: 60,
    minMaturityAge: 18,
    maxMaturityAge: 75,
    minPolicyTermYears: 15,
    maxPolicyTermYears: 20,
    validTermOptions: [15, 18, 20],
    minPremiumOrBsa: { minBasicSumAssured: 125000, minPremium: null },
    premiumModes: ["yearly"],
    notes: ["Premium Paying Term = Policy Term - 5 years (fixed offset)."],
  },
  premiumModel: {
    structure: "LIMITED",
    pptRelationship: { kind: "FIXED_OFFSET", offsetYears: 5 },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 125000, provenance: { status: "VERIFIED", sourceReferences: src("890") } },
    notes: ["Premiums stop 5 years before maturity, freeing capacity in the final years."],
  },
  benefitModel: [guaranteedMaturity("Sum Assured on Maturity equals the Basic Sum Assured plus a guaranteed Guaranteed Addition."), guaranteedAddition("A fixed, guaranteed base rate-per-thousand-BSA Guaranteed Addition, with a High-Sum-Assured incentive rate for larger BSA and longer PPT bands."), guaranteedProtection("Guaranteed death benefit — the higher of 125% BSA or 7x annualised premium.")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit, the higher of 125% BSA or 7x annualised premium — non-participating.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: true,
  returnNotes: ["Non-participating with a fully guaranteed Guaranteed Addition — an IRR would be VERIFIED once premium resolves."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts not modeled here."] },
  ulip: null,
  professionSuitability: ["A fixed 5-year-shorter PPT suits customers wanting a clear post-PPT freed-capacity window."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [{ characteristic: "guaranteed floor with a 5-year post-PPT freed-capacity window", complementsRolesWith: ["MARKET_LINKED_ACCUMULATION"], reasoning: "5 years of freed capacity before maturity is a natural window for a second, growth-oriented component." }],
  strengths: [{ label: "fully guaranteed total maturity value", detail: "Non-participating, with a published Guaranteed Addition rate (including High-Sum-Assured incentives)." }, { label: "low minimum entry age", detail: "From 30 days, one of the lowest in this catalogue." }],
  tradeoffs: [{ label: "narrower term range", detail: "Only 15, 18 or 20 years." }],
  usefulWhen: ["The customer's horizon is 15-20 years and wants a fully guaranteed, non-participating maturity value."],
  lessUsefulWhen: ["The goal horizon is well outside 15-20 years."],
  overallConfidence: "VERIFIED",
  sources: src("890"),
});

const PLAN_770 = buildProfile({
  planNumber: "770",
  uin: "512N397V01",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_PARTICIPATING", "ENDOWMENT", "LIMITED_PREMIUM"],
  eligibility: {
    minEntryAge: null,
    maxEntryAge: null,
    minMaturityAge: 28,
    maxMaturityAge: 75,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: [30],
    minPremiumOrBsa: { minBasicSumAssured: 300000, minPremium: null },
    premiumModes: ["yearly"],
    notes: ["Sample data published at a single fixed Policy Term (30 years); PPT is an independent choice (7/10/12/15/18 years), already correctly matched."],
  },
  premiumModel: {
    structure: "LIMITED",
    pptRelationship: { kind: "INDEPENDENT_CHOICE" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 300000, provenance: { status: "VERIFIED", sourceReferences: src("770") } },
    notes: ["5 independent PPT choices for the one published 30-year term."],
  },
  benefitModel: [guaranteedMaturity("Guaranteed maturity benefit."), guaranteedAddition("A guaranteed, premium-based Guaranteed Addition."), guaranteedProtection("Guaranteed death benefit."), nonGuaranteedReversionaryBonus("Simple Reversionary Bonus — not guaranteed."), nonGuaranteedFinalBonus("Final Additional Bonus — not guaranteed.")],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit over a long, 30-year policy term.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["A participating bonus applies alongside the guaranteed Guaranteed Addition; unpublished bonus rate limits full IRR confidence."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts not modeled here."] },
  ulip: null,
  professionSuitability: ["Independent PPT choice from 7 to 18 years, on a fixed 30-year term, suits a very-long-horizon goal (e.g. legacy/retirement-adjacent) funded over a shorter commitment window."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS", "LEGACY"],
  complementaryCharacteristics: [{ characteristic: "very long horizon with a large post-PPT freed-capacity window", complementsRolesWith: ["MARKET_LINKED_ACCUMULATION", "RETIREMENT"], reasoning: "A 30-year maturity with as little as 7-18 years of premium leaves a long freed-capacity period useful for a second component." }],
  strengths: [{ label: "very long, fixed 30-year horizon", detail: "Suits legacy/long-term goals rather than shorter-dated ones." }, { label: "5 independent PPT choices", detail: "7 to 18 years, more flexible than a fixed pairing." }],
  tradeoffs: [{ label: "only one published policy term", detail: "30 years only — not useful for a shorter-horizon goal." }],
  usefulWhen: ["The goal horizon is genuinely long (around 30 years) — e.g. legacy planning or a very early-started retirement corpus."],
  lessUsefulWhen: ["The goal horizon is shorter than roughly 25-30 years."],
  overallConfidence: "VERIFIED",
  sources: src("770"),
});

// ==========================================================================
// WHOLE LIFE (3 active) — catalogue-only, no registered engine.
// Mechanics described are LIC's own well-documented public product
// design (no exact premium/BSA/rate figures are stated — those remain
// genuinely unverified in this repository).
// ==========================================================================

const CATALOGUE_ONLY_NOTE = "No registered calculation engine exists in this repository for this product yet — mechanics below reflect LIC's publicly documented product design; no exact premium/benefit figures are quoted.";

const PLAN_745 = buildProfile({
  planNumber: "745",
  uin: "512N312V03",
  hasRegisteredEngine: false,
  productNature: ["TRADITIONAL_PARTICIPATING", "WHOLE_LIFE", "INCOME_ORIENTED", "LIMITED_PREMIUM"],
  eligibility: {
    // Phase 3: entry age and PPT options below were cross-verified this
    // session against LIC's official Jeevan Umang sales brochure
    // (UIN 512N312V03) via multiple independent secondary sources
    // quoting matching figures — the primary PDF could not be directly
    // fetched in this sandbox (licindia.in egress is blocked). Treated
    // as this repository's best current figures, not re-verified
    // against the raw PDF.
    minEntryAge: 0,
    maxEntryAge: 55,
    minMaturityAge: null,
    maxMaturityAge: 100,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: [15, 20, 25, 30],
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: [CATALOGUE_ONLY_NOTE, "A whole-life plan structured around cover to age 100, with the Premium Paying Term chosen from exactly 4 options: 15, 20, 25 or 30 years."],
  },
  premiumModel: {
    structure: "LIMITED",
    pptRelationship: { kind: "INDEPENDENT_CHOICE" },
    calculationReadiness: "NOT_YET_ESTIMATABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: no registered engine exists, and this session's web research found two independent secondary sources reporting DIFFERENT premiums (Rs.49,000 vs Rs.54,036 annually) for the identical age-30/PPT-20/BSA-10L configuration — a genuine conflict, so neither figure is used as a sample point (Phase 3's own 'report the conflict, do not silently pick one' rule)", sourceReferences: [] } },
    notes: ["Premiums are payable for the chosen Premium Paying Term (15/20/25/30 years), after which a recurring survival benefit begins — the defining income-orientation of this product."],
  },
  benefitModel: [
    guaranteedSurvival("An annual Survival Benefit equal to 8% of Basic Sum Assured, payable every year from the end of the Premium Paying Term until age 100 or earlier death — the product's central, quantified income mechanic (see lib/planning/planIntelligence/benefitProjection.ts for the cash-flow projection)."),
    guaranteedMaturity("A whole-life/maturity benefit equal to Basic Sum Assured, payable at the end of cover (age 100)."),
    guaranteedProtection("A guaranteed death benefit payable at any time during the whole-life cover period, in addition to (not instead of) the accumulated survival benefits already paid."),
    nonGuaranteedReversionaryBonus("A participating Simple Reversionary Bonus — not guaranteed; no verified historical rate for this specific plan exists in this repository (see historicalBonusData.ts's coverage note)."),
  ],
  hasLifeProtection: true,
  protectionDescription: "Life cover for the whole of life (to around age 100), paid on top of any survival benefits already received — distinguishing this from an endowment where maturity ends the cover.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_DEFERRED_RECURRING_INCOME",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["No registered engine exists to produce a verified premium, so a defensible cash-flow-based IRR cannot yet be built for this product."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "ESTIMATED", lockInYears: null, notes: ["Loan/surrender are LIC whole-life-plan norms, not verified against this repository's own data."] },
  ulip: null,
  professionSuitability: ["A limited Premium Paying Term followed by decades of recurring survival income suits a customer wanting income orientation rather than a single lump sum — best sustained by stable income during the paying phase."],
  combinationRoles: ["LONG_TERM_PROTECTION_SAVINGS", "INCOME_GENERATION", "LEGACY"],
  complementaryCharacteristics: [{ characteristic: "income orientation with lifelong protection", complementsRolesWith: ["GOAL_ACCUMULATION"], reasoning: "A recurring-income, lifelong-protection product can complement a separate lump-sum goal-accumulation component when the customer has both a lump-sum goal and a desire for later recurring income." }],
  strengths: [{ label: "cover continues for whole of life", detail: "Protection does not end at a fixed maturity date the way an endowment's does." }, { label: "recurring income after the paying term", detail: "Distinguishes it from a pure lump-sum-at-maturity design." }],
  tradeoffs: [{ label: "no registered premium calculator yet", detail: "This repository cannot yet produce even a sample-based premium for this product." }, { label: "not oriented to a single lump-sum goal", detail: "The recurring-income design is a mechanics mismatch for a need that wants one lump sum at a specific year." }],
  usefulWhen: ["The customer wants lifelong protection combined with a recurring income stream after a limited paying period — e.g. a legacy or supplementary-income objective."],
  lessUsefulWhen: ["The customer needs a single lump sum at a specific future year (e.g. a 16-year education goal) — the recurring-income shape is a mechanics mismatch."],
  overallConfidence: "ESTIMATED",
  sources: ["lic-catalogue-product-page-745", "lic-745-jeevan-umang-sales-brochure-secondary-verified"],
});

const PLAN_771 = buildProfile({
  planNumber: "771",
  uin: "512N363V02",
  hasRegisteredEngine: false,
  productNature: ["TRADITIONAL_NON_PARTICIPATING", "WHOLE_LIFE", "INCOME_ORIENTED", "LIMITED_PREMIUM"],
  eligibility: {
    // Phase 3: cross-verified this session against LIC's official
    // Jeevan Utsav sales brochure (UIN 512N363V02) via multiple
    // independent secondary sources quoting matching figures — the
    // primary PDF could not be directly fetched in this sandbox
    // (licindia.in egress is blocked).
    minEntryAge: 0,
    maxEntryAge: 65,
    minMaturityAge: null,
    maxMaturityAge: 100,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: 500000, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: [CATALOGUE_ONLY_NOTE, "Premium Paying Term ranges 5 to 16 years (a shorter, independently-choosable range than Jeevan Umang's 4 fixed options). Offers a choice between a Regular Income Benefit variant and a Flexi Income Benefit variant, selected at inception."],
  },
  premiumModel: {
    structure: "LIMITED",
    pptRelationship: { kind: "INDEPENDENT_CHOICE" },
    calculationReadiness: "NOT_YET_ESTIMATABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: no registered engine or published sample premium data available in this repository", sourceReferences: [] } },
    notes: ["A shorter limited Premium Paying Term than Jeevan Umang (5-16 years) is typical of this product's design, again followed by recurring benefits."],
  },
  benefitModel: [
    guaranteedIncome("Under the Regular Income Benefit variant, a guaranteed income equal to 10% of Basic Sum Assured per year begins at the end of the Premium Paying Term and continues to around age 100 (see lib/planning/planIntelligence/benefitProjection.ts for the cash-flow projection)."),
    otherContractual("Under the Flexi Income Benefit variant, the customer can choose to accumulate the income benefit at a stated accrual rate instead of drawing it immediately; this repository does not yet quantify that accrual rate (only one, uncorroborated secondary source reported a figure this session, so none is used)."),
    guaranteedAddition("Guaranteed Additions of Rs.40 per Rs.1,000 of Basic Sum Assured accrue for every year of the Premium Paying Term — a guaranteed (not participating-bonus-dependent) component; this plan is entirely non-participating (no Simple/Final Reversionary Bonus applies at all)."),
    guaranteedProtection("A guaranteed death benefit throughout the whole-life cover period, never less than 105% of total premiums paid, plus accrued Guaranteed Additions."),
  ],
  hasLifeProtection: true,
  protectionDescription: "Whole-life death benefit cover, with the specific death-benefit amount varying by the Regular/Flexi variant chosen and elapsed policy duration.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_DEFERRED_RECURRING_INCOME",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["No registered engine exists yet; the Flexi variant's accumulation-with-guaranteed-additions option is a genuinely guaranteed cash flow once premium data is verified, which could support a VERIFIED IRR in a future pass."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "ESTIMATED", lockInYears: null, notes: ["LIC whole-life-plan norms, not verified against this repository's own data."] },
  ulip: null,
  professionSuitability: ["The Flexi Income Benefit's option to defer/accumulate rather than draw income immediately may suit a customer with variable income who wants flexibility on when cash flow actually starts."],
  combinationRoles: ["LONG_TERM_PROTECTION_SAVINGS", "INCOME_GENERATION", "LEGACY"],
  complementaryCharacteristics: [{ characteristic: "flexible income timing with guaranteed accrual", complementsRolesWith: ["GOAL_ACCUMULATION"], reasoning: "The option to accumulate rather than draw income can complement a lump-sum goal component by deferring cash flow until it's actually needed." }],
  strengths: [{ label: "choice of income timing (Regular vs. Flexi)", detail: "More flexible than a single fixed-schedule income design." }, { label: "guaranteed (not bonus-dependent) accrual during the paying term", detail: "Guaranteed Additions do not depend on LIC's annual bonus declaration." }],
  tradeoffs: [{ label: "no registered premium calculator yet", detail: "This repository cannot yet produce even a sample-based premium." }, { label: "income-oriented shape mismatches a single lump-sum need", detail: "Same structural mismatch as Jeevan Umang for a one-time-lump-sum goal." }],
  usefulWhen: ["The customer wants flexible-timing recurring income with lifelong protection and values guaranteed (not bonus-dependent) accrual."],
  lessUsefulWhen: ["The customer needs one lump sum at a specific future year."],
  overallConfidence: "ESTIMATED",
  sources: ["lic-catalogue-product-page-771", "lic-771-jeevan-utsav-sales-brochure-secondary-verified"],
});

const PLAN_883 = buildProfile({
  planNumber: "883",
  uin: "512N392V01",
  hasRegisteredEngine: false,
  productNature: ["TRADITIONAL_PARTICIPATING", "WHOLE_LIFE", "INCOME_ORIENTED", "SINGLE_PREMIUM"],
  eligibility: {
    minEntryAge: null,
    maxEntryAge: null,
    minMaturityAge: null,
    maxMaturityAge: 100,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["single"],
    notes: [CATALOGUE_ONLY_NOTE, "The single-premium counterpart to Jeevan Utsav (Plan 771) — same Regular/Flexi income design, funded by one premium."],
  },
  premiumModel: {
    structure: "SINGLE",
    pptRelationship: { kind: "NOT_APPLICABLE" },
    calculationReadiness: "NOT_YET_ESTIMATABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: no registered engine or published sample data available", sourceReferences: [] } },
    notes: ["One premium at inception; income begins after a defined period, per the Regular/Flexi variant chosen."],
  },
  benefitModel: [
    guaranteedIncome("Under the Regular Income Benefit variant, guaranteed recurring income begins after a defined period from the single premium."),
    otherContractual("Under the Flexi Income Benefit variant, income can be accumulated instead of drawn, with guaranteed additions."),
    guaranteedProtection("A guaranteed whole-life death benefit, funded entirely by the single premium."),
  ],
  hasLifeProtection: true,
  protectionDescription: "Whole-life death benefit cover funded by a single premium.",
  cashFlowPattern: "LUMP_SUM_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: true,
  irrCalculable: false,
  returnNotes: ["No registered engine exists yet for this product."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "ESTIMATED", lockInYears: null, notes: ["LIC whole-life-plan norms, not verified against this repository's own data."] },
  ulip: null,
  professionSuitability: ["Single premium suits a customer with a one-time lump sum wanting lifelong protection plus eventual recurring income, rather than someone funding from ongoing income."],
  combinationRoles: ["LONG_TERM_PROTECTION_SAVINGS", "INCOME_GENERATION", "LEGACY"],
  complementaryCharacteristics: [],
  strengths: [{ label: "single premium, no ongoing commitment", detail: "Whole-life protection and eventual income from one upfront payment." }],
  tradeoffs: [{ label: "requires a lump sum upfront", detail: "Not fundable from ongoing income." }, { label: "no registered premium calculator yet", detail: "This repository cannot yet produce a sample-based premium." }],
  usefulWhen: ["The customer has a one-time lump sum and wants lifelong protection with eventual recurring income."],
  lessUsefulWhen: ["The customer wants to fund the goal from ongoing income rather than a lump sum."],
  overallConfidence: "ESTIMATED",
  sources: ["lic-catalogue-product-page-883"],
});

// ==========================================================================
// MONEY BACK (5 active)
// ==========================================================================

const PLAN_748 = buildProfile({
  planNumber: "748",
  uin: "512N316V03",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_PARTICIPATING", "MONEY_BACK", "LIMITED_PREMIUM"],
  eligibility: {
    minEntryAge: 8,
    maxEntryAge: null,
    minMaturityAge: null,
    maxMaturityAge: 69,
    minPolicyTermYears: 14,
    maxPolicyTermYears: 28,
    validTermOptions: [14, 16, 18, 20, 24, 28],
    minPremiumOrBsa: { minBasicSumAssured: 1000000, minPremium: null },
    premiumModes: ["yearly"],
    notes: ["Premium Paying Term = Policy Term - 4 years (fixed offset); a High-Net-Worth plan with a Rs.10,00,000 minimum Basic Sum Assured."],
  },
  premiumModel: {
    structure: "LIMITED",
    pptRelationship: { kind: "FIXED_OFFSET", offsetYears: 4 },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 1000000, provenance: { status: "VERIFIED", sourceReferences: src("748") } },
    notes: ["Premiums stop 4 years before the policy term ends."],
  },
  benefitModel: [
    guaranteedSurvival("Two scheduled survival benefit payments (a percentage of Basic Sum Assured) at fixed points during the policy term — the exact percentage/years vary by the chosen policy term."),
    guaranteedMaturity("A final maturity payment (the remaining percentage of Basic Sum Assured) at the end of the policy term, together with accrued Guaranteed Additions."),
    guaranteedAddition("A fixed, guaranteed rate-per-thousand-BSA Guaranteed Addition, computable from Basic Sum Assured and Premium Paying Term alone — no premium dependency, unlike this catalogue's premium-based Guaranteed Addition plans."),
    nonGuaranteedLoyaltyAddition("A discretionary, participating Loyalty Addition — rate never published, not modeled with any number."),
    guaranteedProtection("Guaranteed death benefit, the higher of 125% BSA or 7x annualised premium."),
  ],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit, the higher of 125% BSA or 7x annualised premium — throughout the policy term regardless of survival benefits already paid.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_SCHEDULED_SURVIVAL_PAYMENTS",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: true,
  returnNotes: ["The Guaranteed Addition is itself guaranteed and BSA/PPT-based (not premium-dependent), so the guaranteed portion of total value is knowable once BSA/PPT are fixed — an IRR using only guaranteed cash flows (excluding the discretionary Loyalty Addition) would be VERIFIED."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts not modeled here."] },
  ulip: null,
  professionSuitability: ["A high minimum Basic Sum Assured (Rs.10,00,000) and High-Net-Worth positioning suit a customer with substantial, reliable capacity to commit for a multi-year limited pay term."],
  combinationRoles: ["GOAL_ACCUMULATION", "SCHEDULED_LIQUIDITY", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [{ characteristic: "scheduled interim liquidity with a guaranteed floor", complementsRolesWith: ["GOAL_ACCUMULATION", "MARKET_LINKED_ACCUMULATION"], reasoning: "The scheduled survival payments can meet interim needs while a separate component accumulates toward a final lump-sum goal." }],
  strengths: [{ label: "scheduled interim survival payments", detail: "Provides liquidity before the final maturity date, unlike a pure endowment." }, { label: "BSA/PPT-based (not premium-dependent) Guaranteed Addition", detail: "A defensible guaranteed component independent of premium-table availability." }],
  tradeoffs: [{ label: "high minimum Basic Sum Assured", detail: "Rs.10,00,000 — a high entry bar versus most peers." }, { label: "discrete term set only", detail: "6 fixed policy term options, not a continuous range." }],
  usefulWhen: ["The customer has substantial capacity and wants scheduled interim liquidity plus a guaranteed accrual mechanic."],
  lessUsefulWhen: ["The customer's budget cannot reach the Rs.10,00,000 minimum Basic Sum Assured."],
  overallConfidence: "VERIFIED",
  sources: src("748"),
});

const PLAN_734 = buildProfile({
  planNumber: "734",
  uin: "512N299V03",
  hasRegisteredEngine: true,
  productNature: ["TRADITIONAL_PARTICIPATING", "MONEY_BACK", "REGULAR_PREMIUM"],
  eligibility: {
    minEntryAge: 0,
    maxEntryAge: 12,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: 200000, minPremium: null },
    premiumModes: ["yearly"],
    notes: ["A child-specific plan: Policy Term = 25 - entry age, Premium Paying Term = 20 - entry age, BOTH fully derived from the child's entry age — never independently chosen. 4 survival-benefit options (1-4) change the schedule/proportions of payments."],
  },
  premiumModel: {
    structure: "REGULAR",
    pptRelationship: { kind: "DERIVED_FROM_AGE" },
    calculationReadiness: "SAMPLE_ONLY",
    minimumContribution: { value: 200000, provenance: { status: "VERIFIED", sourceReferences: src("734") } },
    notes: ["Sample premiums are published for exactly 4 entry ages (0, 4, 8, 12) across 4 survival-benefit options — the registered engine never reads a customer-supplied term/PPT since neither is an independent choice for this plan."],
  },
  benefitModel: [
    // Phase 3B: quantified the 4 selectable options (cross-corroborated
    // this session, primary brochure not directly fetchable in this
    // sandbox). NOT wired into benefitProjection.ts's quantified
    // cash-flow projector — the payment ages (20-24) are CHILD ages, and
    // this repository's PlanningRequest/BenefitProjectionInput only
    // carries one "age" field (the proposer/parent who is actually
    // underwritten as Phase 2's customer for premium-capacity purposes),
    // so a correct year-from-policy-start conversion needs a distinct
    // child-age input this architecture does not yet collect — modeling
    // it against the wrong age would silently produce wrong cash-flow
    // years, which is worse than staying qualitative here.
    guaranteedSurvival("Scheduled survival benefit payments from child age 20 to 24 (5 annual payments), under one of 4 selectable options: Option 1 (none — full benefit at maturity instead), Option 2 (5% of Basic Sum Assured/year), Option 3 (10%/year), or Option 4 (15%/year). Not quantified in benefitProjection.ts — see that module's own comment for why (requires a distinct child-age input this architecture does not yet collect)."),
    guaranteedMaturity("A final maturity payment (the percentage of Basic Sum Assured determined by the chosen option), together with vested Simple Reversionary Bonus and Final Additional Bonus, at the end of the (age-derived) policy term."),
    guaranteedProtection("Guaranteed death benefit, at least the Basic Sum Assured, payable if the child life assured dies during the term."),
    nonGuaranteedReversionaryBonus("Simple Reversionary Bonus — not guaranteed."),
  ],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit on the child, funded by the parent/guardian's premiums.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_SCHEDULED_SURVIVAL_PAYMENTS",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["Bonus rate unpublished for the non-guaranteed portion; only 4 entry ages have published sample premiums, limiting broad IRR coverage today."],
  liquidity: { surrenderAvailable: "VERIFIED", loanAvailable: "VERIFIED", lockInYears: null, notes: ["Structural availability documented; amounts not modeled here."] },
  ulip: null,
  professionSuitability: ["Funded by the parent/guardian; profession hints apply to the payer, not the child life assured."],
  combinationRoles: ["GOAL_ACCUMULATION", "SCHEDULED_LIQUIDITY", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [{ characteristic: "scheduled payments during a child's later school/college years", complementsRolesWith: ["GOAL_ACCUMULATION"], reasoning: "Scheduled survival payments from age 20 onward can meet staggered education costs while a separate lump-sum component targets a single larger milestone." }],
  strengths: [{ label: "scheduled payments aligned to early adulthood", detail: "Survival benefits begin at age 20 — timed for early-adulthood/education-linked expenses." }, { label: "4 configurable survival-benefit options", detail: "Different schedules/proportions to match different family cash-flow needs." }],
  tradeoffs: [{ label: "term/PPT are not independently chosen", detail: "Both are fixed functions of the child's entry age — no flexibility to target a specific horizon." }, { label: "only 4 published sample ages", detail: "Premium is currently only verifiable at entry ages 0, 4, 8 and 12." }],
  usefulWhen: ["The customer is planning for a young child (entry age 0-12) and wants scheduled payments aligned to early-adulthood milestones."],
  lessUsefulWhen: ["The customer needs a specific, independently-chosen horizon rather than one derived from the child's age."],
  overallConfidence: "VERIFIED",
  sources: src("734"),
});

const PLAN_720 = buildProfile({
  planNumber: "720",
  uin: "512N280V03",
  hasRegisteredEngine: false,
  productNature: ["TRADITIONAL_PARTICIPATING", "MONEY_BACK", "REGULAR_PREMIUM"],
  eligibility: {
    minEntryAge: null,
    maxEntryAge: null,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: 20,
    maxPolicyTermYears: 20,
    validTermOptions: [20],
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: [CATALOGUE_ONLY_NOTE, "A fixed 20-year-term money-back plan; Premium Paying Term equals the Policy Term (Regular Pay)."],
  },
  premiumModel: {
    structure: "REGULAR",
    pptRelationship: { kind: "EQUALS_TERM" },
    calculationReadiness: "NOT_YET_ESTIMATABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: no registered engine or published sample data available", sourceReferences: [] } },
    notes: ["Level premiums for the full 20-year term."],
  },
  benefitModel: [
    // Phase 3B: quantified via lib/planning/planIntelligence/benefitProjection.ts's
    // MONEY_BACK_SCHEDULES — 20% of BSA at the end of policy years 5, 10
    // and 15 (cross-corroborated this session across multiple independent
    // secondary sources describing identical figures; the primary
    // brochure could not be directly fetched in this sandbox).
    guaranteedSurvival("Scheduled survival benefit payments of 20% of Basic Sum Assured each, at the end of policy years 5, 10 and 15 (60% of BSA in total) — see benefitProjection.ts for the quantified cash-flow projection."),
    guaranteedMaturity("A final maturity payment of the remaining 40% of Basic Sum Assured, plus vested bonuses, at the end of the 20-year term."),
    guaranteedProtection("Guaranteed death benefit — the full Basic Sum Assured, regardless of survival benefits already paid."),
    nonGuaranteedReversionaryBonus("Simple Reversionary Bonus — not guaranteed."),
  ],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed full-BSA death benefit throughout the term, unaffected by survival benefits already paid.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_SCHEDULED_SURVIVAL_PAYMENTS",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["No registered engine exists yet for this product."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "ESTIMATED", lockInYears: null, notes: ["LIC money-back-plan norms, not verified against this repository's own data."] },
  ulip: null,
  professionSuitability: ["Level premiums for the full 20-year term suit a customer with stable, predictable income."],
  combinationRoles: ["GOAL_ACCUMULATION", "SCHEDULED_LIQUIDITY", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [{ characteristic: "scheduled interim liquidity", complementsRolesWith: ["GOAL_ACCUMULATION"], reasoning: "Scheduled survival payments can meet interim needs while another component targets a single future lump sum." }],
  strengths: [{ label: "scheduled interim survival payments", detail: "Periodic liquidity across the 20-year term rather than only at the end." }, { label: "full-BSA death benefit regardless of survival payments received", detail: "Protection is not reduced by benefits already paid out." }],
  tradeoffs: [{ label: "fixed 20-year term only", detail: "No flexibility for a shorter or longer horizon." }, { label: "no registered premium calculator yet", detail: "This repository cannot yet produce a sample-based premium." }],
  usefulWhen: ["The goal horizon is close to 20 years and periodic interim liquidity is valued."],
  lessUsefulWhen: ["The goal horizon differs meaningfully from 20 years."],
  overallConfidence: "ESTIMATED",
  sources: ["lic-catalogue-product-page-720"],
});

const PLAN_721 = buildProfile({
  planNumber: "721",
  uin: "512N278V03",
  hasRegisteredEngine: false,
  productNature: ["TRADITIONAL_PARTICIPATING", "MONEY_BACK", "REGULAR_PREMIUM"],
  eligibility: {
    minEntryAge: null,
    maxEntryAge: null,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: 25,
    maxPolicyTermYears: 25,
    validTermOptions: [25],
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: [CATALOGUE_ONLY_NOTE, "A fixed 25-year-term money-back plan, with more scheduled survival installments than the 20-year variant (Plan 720)."],
  },
  premiumModel: {
    structure: "REGULAR",
    pptRelationship: { kind: "EQUALS_TERM" },
    calculationReadiness: "NOT_YET_ESTIMATABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: no registered engine or published sample data available", sourceReferences: [] } },
    notes: ["Level premiums for the full 25-year term."],
  },
  benefitModel: [
    // Phase 3B: quantified via benefitProjection.ts's MONEY_BACK_SCHEDULES
    // — 15% of BSA at the end of policy years 5, 10, 15 and 20.
    guaranteedSurvival("Scheduled survival benefit payments of 15% of Basic Sum Assured each, at the end of policy years 5, 10, 15 and 20 (60% of BSA in total) — see benefitProjection.ts for the quantified cash-flow projection."),
    guaranteedMaturity("A final maturity payment of the remaining 40% of Basic Sum Assured, plus vested bonuses, at the end of the 25-year term."),
    guaranteedProtection("Guaranteed full-BSA death benefit throughout the term, unaffected by survival benefits already paid."),
    nonGuaranteedReversionaryBonus("Simple Reversionary Bonus — not guaranteed."),
  ],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed full-BSA death benefit throughout the term, unaffected by survival benefits already paid.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_SCHEDULED_SURVIVAL_PAYMENTS",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["No registered engine exists yet for this product."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "ESTIMATED", lockInYears: null, notes: ["LIC money-back-plan norms, not verified against this repository's own data."] },
  ulip: null,
  professionSuitability: ["Level premiums for a full 25-year term suit a customer with stable, predictable income over a long horizon."],
  combinationRoles: ["GOAL_ACCUMULATION", "SCHEDULED_LIQUIDITY", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [{ characteristic: "scheduled interim liquidity over a long horizon", complementsRolesWith: ["GOAL_ACCUMULATION", "RETIREMENT"], reasoning: "More frequent interim payments over 25 years suit combining with a longer-horizon accumulation or retirement-adjacent component." }],
  strengths: [{ label: "more frequent scheduled interim payments", detail: "More installments than the 20-year variant, spread over a longer term." }],
  tradeoffs: [{ label: "fixed 25-year term only", detail: "No flexibility for a different horizon." }, { label: "no registered premium calculator yet", detail: "This repository cannot yet produce a sample-based premium." }],
  usefulWhen: ["The goal horizon is close to 25 years and frequent interim liquidity is valued."],
  lessUsefulWhen: ["The goal horizon differs meaningfully from 25 years."],
  overallConfidence: "ESTIMATED",
  sources: ["lic-catalogue-product-page-721"],
});

const PLAN_732 = buildProfile({
  planNumber: "732",
  uin: "512N296V03",
  hasRegisteredEngine: false,
  productNature: ["TRADITIONAL_PARTICIPATING", "MONEY_BACK", "REGULAR_PREMIUM"],
  eligibility: {
    minEntryAge: null,
    maxEntryAge: null,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: [CATALOGUE_ONLY_NOTE, "A child-specific money-back plan; commonly paired with a Premium Waiver Benefit rider (continues cover if the proposer/parent dies)."],
  },
  premiumModel: {
    structure: "REGULAR",
    pptRelationship: { kind: "INDEPENDENT_CHOICE" },
    calculationReadiness: "NOT_YET_ESTIMATABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: no registered engine or published sample data available", sourceReferences: [] } },
    notes: ["Funded by the parent/guardian on behalf of the child."],
  },
  benefitModel: [
    // Phase 3B: cross-corroborated this session (primary brochure not
    // directly fetchable). NOT wired into benefitProjection.ts's
    // quantified projector for the same reason as Plan 734 — ages 18/20/22
    // are CHILD ages, and this architecture's PlanningRequest carries only
    // the proposer/parent's own age, with no distinct child-age input to
    // correctly convert "child age 18/20/22/25" into years-from-policy-start.
    guaranteedSurvival("Scheduled survival benefit payments of 20% of Basic Sum Assured each at child ages 18, 20 and 22 (60% of BSA in total). Not quantified in benefitProjection.ts — see that module's own comment for why (requires a distinct child-age input this architecture does not yet collect)."),
    guaranteedMaturity("A final maturity payment of the remaining 40% of Basic Sum Assured plus vested bonuses at child age 25."),
    guaranteedProtection("Guaranteed death benefit on the child; commonly available alongside a Premium Waiver Benefit rider that continues the policy's benefits if the proposer/parent dies during the term."),
    nonGuaranteedReversionaryBonus("Simple Reversionary Bonus — not guaranteed."),
  ],
  hasLifeProtection: true,
  protectionDescription: "Guaranteed death benefit on the child, with an optional Premium Waiver Benefit rider protecting the plan itself if the paying parent/guardian dies.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_SCHEDULED_SURVIVAL_PAYMENTS",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["No registered engine exists yet for this product."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "ESTIMATED", lockInYears: null, notes: ["LIC money-back-plan norms, not verified against this repository's own data."] },
  ulip: null,
  professionSuitability: ["Funded by the parent/guardian; profession hints apply to the payer, not the child life assured."],
  combinationRoles: ["GOAL_ACCUMULATION", "SCHEDULED_LIQUIDITY", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [{ characteristic: "scheduled child-milestone payments with a premium-waiver safety net", complementsRolesWith: ["GOAL_ACCUMULATION"], reasoning: "Scheduled payments plus a waiver rider can complement a separate lump-sum component funding a single larger education/marriage milestone." }],
  strengths: [{ label: "child-milestone-aligned scheduled payments", detail: "A money-back design aimed specifically at a child's growing-up needs." }, { label: "Premium Waiver Benefit commonly available", detail: "Protects continuity of the plan if the paying parent dies." }],
  tradeoffs: [{ label: "no registered premium calculator yet", detail: "This repository cannot yet produce a sample-based premium." }],
  usefulWhen: ["The customer wants a child-specific money-back design with a premium-waiver safety net."],
  lessUsefulWhen: ["The customer wants a single lump sum at one specific year rather than staggered payments."],
  overallConfidence: "ESTIMATED",
  sources: ["lic-catalogue-product-page-732"],
});

// ==========================================================================
// PENSION (5 active)
// ==========================================================================

const PLAN_867 = buildProfile({
  planNumber: "867",
  uin: "512L347V01",
  hasRegisteredEngine: true,
  productNature: ["PENSION", "MARKET_LINKED", "REGULAR_PREMIUM", "LIMITED_PREMIUM", "SINGLE_PREMIUM"],
  eligibility: {
    minEntryAge: 25,
    maxEntryAge: 75,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: 10,
    maxPolicyTermYears: 42,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly", "single"],
    notes: ["A market-linked (ULIP) pension accumulation product with NO Basic Sum Assured at all — premium is a direct customer choice, not a calculated output."],
  },
  premiumModel: {
    structure: "CUSTOMER_CHOSEN",
    pptRelationship: { kind: "NOT_APPLICABLE" },
    calculationReadiness: "ESTIMABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: premium is a direct customer choice, not a table lookup — any amount the customer can sustain is valid", sourceReferences: [] } },
    notes: ["The customer chooses the premium directly; there is no rate table to consult."],
  },
  benefitModel: [otherContractual("Guaranteed Additions and an Assured Death Benefit floor are fully computable from the chosen premium via a published formula."), marketLinkedFundValue("The vesting/maturity Unit Fund Value depends on market performance and is never projected as a guaranteed figure.")],
  hasLifeProtection: true,
  protectionDescription: "An Assured Death Benefit floor, fully formula-computable from the chosen premium, on top of the market-linked Unit Fund Value.",
  cashFlowPattern: "PREMIUM_MINUS_CHARGES_INTO_MARKET_LINKED_FUND",
  marketRisk: "MARKET_LINKED",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["The Unit Fund Value component is inherently market-dependent — any IRR would have to include that non-guaranteed leg and could never be labeled VERIFIED."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "NOT_APPLICABLE", lockInYears: null, notes: ["No loan is ever available on a market-linked pension product (LIC norm); surrender/withdrawal availability depends on elapsed policy years not tracked here."] },
  ulip: buildUlipIntelligence({
    funds: [
      ulipFund("Fund 1", "OTHER", ["4 fund options are available; exact fund names/asset-allocation bands are not itemized in this repository's verified data."]),
    ],
    historicalPerformance: [],
    officialIllustration: null,
    charges: [
      { name: "Fund Management Charge", description: "1.35% p.a., the same rate across all 4 available funds.", provenance: { status: "VERIFIED", sourceReferences: src("867") } },
      { name: "Mortality Charge", description: "Nil — explicitly confirmed at 0% in the plan's own verified rules.", provenance: { status: "VERIFIED", sourceReferences: src("867") } },
    ],
    lockInYears: null,
  }),
  professionSuitability: ["A wide entry age range (25-75) and flexible premium modes (including single premium) make this adaptable to varied income patterns, though the market-linked nature means it best suits a customer who can tolerate NAV fluctuation."],
  combinationRoles: ["RETIREMENT", "MARKET_LINKED_ACCUMULATION"],
  complementaryCharacteristics: [{ characteristic: "market-linked retirement accumulation", complementsRolesWith: ["RETIREMENT"], reasoning: "Can complement a guaranteed annuity-oriented pension component by targeting growth on a portion of retirement savings while the annuity component anchors guaranteed income." }],
  strengths: [{ label: "no rate-table dependency", detail: "Premium is a direct customer choice — always achievable regardless of published sample coverage." }, { label: "wide entry age range", detail: "25 to 75 years, one of the widest pension entry ranges in this catalogue." }],
  tradeoffs: [{ label: "no guaranteed maturity/vesting value", detail: "The Unit Fund Value is entirely market-dependent." }, { label: "no loan facility", detail: "Unlike traditional endowments, a market-linked pension product never offers a policy loan." }],
  usefulWhen: ["The customer wants a market-linked retirement accumulation vehicle and accepts NAV-driven variability in the eventual corpus."],
  lessUsefulWhen: ["The customer wants a guaranteed retirement corpus with no market exposure."],
  overallConfidence: "VERIFIED",
  sources: src("867"),
});

const PLAN_857 = buildProfile({
  planNumber: "857",
  uin: "512N337V07",
  hasRegisteredEngine: true,
  productNature: ["ANNUITY", "PENSION", "SINGLE_PREMIUM"],
  eligibility: {
    minEntryAge: 25,
    maxEntryAge: 85,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["single"],
    notes: ["An IMMEDIATE annuity — a single Purchase Price is paid and annuity income begins right away, per the chosen annuity option."],
  },
  premiumModel: {
    structure: "SINGLE",
    pptRelationship: { kind: "NOT_APPLICABLE" },
    calculationReadiness: "ESTIMABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: Purchase Price is a direct customer choice; the resulting annuity rate table is not modeled in this repository", sourceReferences: [] } },
    notes: ["The customer chooses the Purchase Price directly; LIC then applies its own annuity rate for the chosen option to determine the recurring payout — that rate table is not verified in this repository."],
  },
  benefitModel: [annuityBenefit("A guaranteed recurring annuity payment, beginning immediately, at the rate LIC applies for the chosen option (Life Annuity, Life Annuity with Return of Purchase Price, Joint Life, etc.) — the exact per-option rate is not verified in this repository.")],
  hasLifeProtection: false,
  protectionDescription: "No separate life-protection death benefit distinct from the annuity mechanic itself; some options (Return of Purchase Price) return the Purchase Price to the nominee on death.",
  cashFlowPattern: "PURCHASE_PRICE_THEN_IMMEDIATE_RECURRING_ANNUITY",
  marketRisk: "NONE",
  isSinglePremium: true,
  irrCalculable: false,
  returnNotes: ["The annuity rate per option is not verified in this repository, so the recurring payment amount (and hence an IRR) cannot yet be defensibly calculated for an arbitrary Purchase Price."],
  liquidity: { surrenderAvailable: "NOT_APPLICABLE", loanAvailable: "NOT_APPLICABLE", lockInYears: null, notes: ["An immediate annuity has no surrender/loan facility in the endowment sense — the Purchase Price converts directly into income."] },
  ulip: null,
  professionSuitability: ["Suits a customer who already has a lump sum (e.g. at retirement) and wants it converted into guaranteed income immediately, regardless of profession — the relevant characteristic is having the lump sum available, not ongoing income."],
  combinationRoles: ["RETIREMENT", "INCOME_GENERATION"],
  complementaryCharacteristics: [{ characteristic: "immediate guaranteed income", complementsRolesWith: ["MARKET_LINKED_ACCUMULATION", "GOAL_ACCUMULATION"], reasoning: "An immediate annuity can complement an accumulation-phase component by converting part of an already-accumulated corpus into guaranteed income while the rest continues to grow." }],
  strengths: [{ label: "income begins immediately", detail: "No deferment period — suited to a customer who needs income now." }, { label: "wide age range", detail: "25 to 85 years." }],
  tradeoffs: [{ label: "irreversible conversion", detail: "The Purchase Price is converted to an income stream; typically no later access to the lump sum (except Return-of-Purchase-Price options, which return it only on death)." }, { label: "annuity rate table not verified", detail: "This repository cannot yet compute the actual payout for a given Purchase Price." }],
  usefulWhen: ["The customer has a lump sum at or near retirement and wants guaranteed income starting immediately."],
  lessUsefulWhen: ["The customer is still accumulating and not yet ready to convert a lump sum into income."],
  overallConfidence: "ESTIMATED",
  sources: src("857"),
});

const PLAN_758 = buildProfile({
  planNumber: "758",
  uin: "512N338V08",
  hasRegisteredEngine: true,
  productNature: ["ANNUITY", "PENSION", "SINGLE_PREMIUM"],
  eligibility: {
    minEntryAge: 30,
    maxEntryAge: 79,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["single"],
    notes: ["A DEFERRED annuity — a single Purchase Price is paid, income begins only after a chosen deferment period."],
  },
  premiumModel: {
    structure: "SINGLE",
    pptRelationship: { kind: "NOT_APPLICABLE" },
    calculationReadiness: "ESTIMABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: Purchase Price is a direct customer choice; the resulting deferred-annuity rate table is not modeled in this repository", sourceReferences: [] } },
    notes: ["The customer chooses the Purchase Price and the deferment period; the resulting recurring annuity rate is not verified in this repository."],
  },
  benefitModel: [annuityBenefit("A guaranteed recurring annuity payment beginning after the chosen deferment period, at the rate LIC applies for the chosen option — the exact rate is not verified in this repository.")],
  hasLifeProtection: false,
  protectionDescription: "No separate life-protection death benefit beyond the annuity mechanic; typically the Purchase Price (or a guaranteed addition to it) is payable to the nominee if death occurs during deferment.",
  cashFlowPattern: "PURCHASE_PRICE_THEN_DEFERRED_RECURRING_ANNUITY",
  marketRisk: "NONE",
  isSinglePremium: true,
  irrCalculable: false,
  returnNotes: ["The deferred-annuity rate table is not verified in this repository."],
  liquidity: { surrenderAvailable: "NOT_APPLICABLE", loanAvailable: "NOT_APPLICABLE", lockInYears: null, notes: ["A deferred annuity's Purchase Price is not accessible as a policy loan/surrender the way an endowment's premium is."] },
  ulip: null,
  professionSuitability: ["Suits a customer with a lump sum today who wants guaranteed income starting at a FUTURE date (e.g. planned retirement several years out) rather than immediately."],
  combinationRoles: ["RETIREMENT", "INCOME_GENERATION"],
  complementaryCharacteristics: [{ characteristic: "deferred guaranteed income", complementsRolesWith: ["MARKET_LINKED_ACCUMULATION", "GOAL_ACCUMULATION"], reasoning: "A deferred annuity can lock in future guaranteed income from part of a lump sum while another component continues to accumulate before retirement." }],
  strengths: [{ label: "deferment flexibility", detail: "The customer chooses when income should start, matching a planned future retirement date." }, { label: "wide age range", detail: "30 to 79 years." }],
  tradeoffs: [{ label: "irreversible conversion", detail: "The Purchase Price is committed to a future income stream." }, { label: "deferred-annuity rate table not verified", detail: "This repository cannot yet compute the actual future payout for a given Purchase Price/deferment." }],
  usefulWhen: ["The customer has a lump sum today and wants guaranteed income to begin at a specific future date."],
  lessUsefulWhen: ["The customer needs income immediately (an immediate annuity like Plan 857 fits better) or is still in the accumulation phase."],
  overallConfidence: "ESTIMATED",
  sources: src("758"),
});

const PLAN_862 = buildProfile({
  planNumber: "862",
  uin: "512N342V05",
  hasRegisteredEngine: true,
  productNature: ["ANNUITY", "PENSION", "SINGLE_PREMIUM"],
  eligibility: {
    minEntryAge: 40,
    maxEntryAge: 80,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["single"],
    notes: ["A simplified, standard immediate annuity plan (fewer options than Plan 857) with a narrower entry age band (40-80)."],
  },
  premiumModel: {
    structure: "SINGLE",
    pptRelationship: { kind: "NOT_APPLICABLE" },
    calculationReadiness: "ESTIMABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: Purchase Price is a direct customer choice; the annuity rate table is not modeled in this repository", sourceReferences: [] } },
    notes: ["The customer chooses the Purchase Price directly."],
  },
  benefitModel: [annuityBenefit("A guaranteed recurring annuity payment, beginning immediately, at the standard rate LIC applies for this simplified plan's options — the exact rate is not verified in this repository.")],
  hasLifeProtection: false,
  protectionDescription: "No separate life-protection death benefit beyond the annuity mechanic; Return-of-Purchase-Price options return it to the nominee on death.",
  cashFlowPattern: "PURCHASE_PRICE_THEN_IMMEDIATE_RECURRING_ANNUITY",
  marketRisk: "NONE",
  isSinglePremium: true,
  irrCalculable: false,
  returnNotes: ["Annuity rate table not verified in this repository."],
  liquidity: { surrenderAvailable: "NOT_APPLICABLE", loanAvailable: "NOT_APPLICABLE", lockInYears: null, notes: ["An immediate annuity converts the Purchase Price directly into income."] },
  ulip: null,
  professionSuitability: ["A simplified standard product suits a customer wanting a straightforward, no-frills immediate-annuity conversion of a lump sum."],
  combinationRoles: ["RETIREMENT", "INCOME_GENERATION"],
  complementaryCharacteristics: [],
  strengths: [{ label: "simplified, standard plan design", detail: "Fewer options than Plan 857, potentially simpler to explain." }],
  tradeoffs: [{ label: "narrower entry age band", detail: "40 to 80 years, versus 25-85 for Plan 857." }, { label: "annuity rate table not verified", detail: "This repository cannot yet compute the actual payout for a given Purchase Price." }],
  usefulWhen: ["The customer wants a straightforward immediate annuity without needing the fuller option set of Plan 857."],
  lessUsefulWhen: ["The customer is outside the 40-80 entry age band or wants a deferred (not immediate) start."],
  overallConfidence: "ESTIMATED",
  sources: src("862"),
});

const PLAN_879 = buildProfile({
  planNumber: "879",
  uin: "512N386V01",
  hasRegisteredEngine: true,
  productNature: ["ANNUITY", "PENSION", "SINGLE_PREMIUM"],
  eligibility: {
    minEntryAge: 18,
    maxEntryAge: 85,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["single"],
    notes: ["An immediate annuity with the widest entry age range in this catalogue's annuity group (18-85, with several options extending further via option-specific overrides)."],
  },
  premiumModel: {
    structure: "SINGLE",
    pptRelationship: { kind: "NOT_APPLICABLE" },
    calculationReadiness: "ESTIMABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: Purchase Price is a direct customer choice; the annuity rate table is not modeled in this repository", sourceReferences: [] } },
    notes: ["The customer chooses the Purchase Price directly; several annuity options have their own maximum-entry-age override."],
  },
  benefitModel: [annuityBenefit("A guaranteed recurring annuity payment, beginning immediately, at the rate LIC applies for the chosen option — the exact rate is not verified in this repository.")],
  hasLifeProtection: false,
  protectionDescription: "No separate life-protection death benefit beyond the annuity mechanic; Return-of-Purchase-Price options return it to the nominee on death.",
  cashFlowPattern: "PURCHASE_PRICE_THEN_IMMEDIATE_RECURRING_ANNUITY",
  marketRisk: "NONE",
  isSinglePremium: true,
  irrCalculable: false,
  returnNotes: ["Annuity rate table not verified in this repository."],
  liquidity: { surrenderAvailable: "NOT_APPLICABLE", loanAvailable: "NOT_APPLICABLE", lockInYears: null, notes: ["An immediate annuity converts the Purchase Price directly into income."] },
  ulip: null,
  professionSuitability: ["The widest entry age range of this catalogue's annuities makes this option-rich product broadly applicable whenever an immediate annuity is wanted."],
  combinationRoles: ["RETIREMENT", "INCOME_GENERATION"],
  complementaryCharacteristics: [],
  strengths: [{ label: "widest entry age range among this catalogue's annuities", detail: "18 to 85 years generally, with option-specific extensions." }, { label: "multiple annuity options", detail: "Several option-specific maximum-entry-age overrides suggest a richer option set than the simplified Plan 862." }],
  tradeoffs: [{ label: "annuity rate table not verified", detail: "This repository cannot yet compute the actual payout for a given Purchase Price/option." }],
  usefulWhen: ["The customer wants an immediate annuity with a broader choice of options than the simplified Plan 862."],
  lessUsefulWhen: ["The customer wants a deferred (not immediate) start."],
  overallConfidence: "ESTIMATED",
  sources: src("879"),
});

// ==========================================================================
// ULIP (4 active)
// ==========================================================================

const PLAN_873 = buildProfile({
  planNumber: "873",
  uin: "512L354V01",
  hasRegisteredEngine: true,
  productNature: ["MARKET_LINKED", "REGULAR_PREMIUM"],
  eligibility: {
    minEntryAge: null,
    maxEntryAge: 60,
    minMaturityAge: 18,
    maxMaturityAge: 85,
    minPolicyTermYears: 10,
    maxPolicyTermYears: 25,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: [
      "No fixed Basic Sum Assured — BSA is a chosen multiple (7x or 10x) of the customer's own Annualized Premium; maximum entry age and maximum maturity age both depend on which multiple is chosen (60/50 and 85/75 respectively).",
      "IDENTITY/VERSION FLAG (Phase 3B, not silently resolved): a secondary source found this session states Index Plus was launched on 2024-02-06 and withdrawn on 2024-10-01 — NOT independently confirmed against a directly-fetched primary document (licindia.in egress is blocked in this sandbox), and NOT acted on (this profile's active status is left unchanged) per 'report the conflict, do not silently overwrite'. See docs/lic-financial-knowledge-v2.md.",
    ],
  },
  premiumModel: {
    // CUSTOMER_CHOSEN, not REGULAR: this plan's own notes/minimumContribution
    // above already say premium is "a direct customer choice, not a table
    // lookup" — REGULAR would incorrectly imply a standard fixed/table-driven
    // premium structure.
    structure: "CUSTOMER_CHOSEN",
    pptRelationship: { kind: "EQUALS_TERM" },
    calculationReadiness: "ESTIMABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: premium is a direct customer choice, not a table lookup", sourceReferences: [] } },
    notes: ["The customer chooses the Annualized Premium directly; Basic Sum Assured is then always directly computable as a formula (7x or 10x) of that choice — no rate-table lookup is ever needed for this step."],
  },
  benefitModel: [marketLinkedFundValue("The Unit Fund Value depends on the performance of the customer's chosen fund(s) and is never projected as a guaranteed figure."), otherContractual("Basic Sum Assured is a customer-chosen multiple (7x or 10x) of Annualized Premium — always exactly computable, a formula not an estimate.")],
  hasLifeProtection: true,
  protectionDescription: "A guaranteed death benefit equal to the higher of the Basic Sum Assured or the Fund Value at the time of death (typical LIC ULIP design) — the BSA component is always exactly computable from the chosen premium/multiple.",
  cashFlowPattern: "PREMIUM_MINUS_CHARGES_INTO_MARKET_LINKED_FUND",
  marketRisk: "MARKET_LINKED",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["The Fund Value leg is inherently market-dependent; any IRR would be, at best, ILLUSTRATIVE (a what-if scenario), never VERIFIED."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "NOT_APPLICABLE", lockInYears: 5, notes: ["A standard 5-year lock-in is typical for LIC ULIPs sold under current IRDAI regulations; loan is never available on a market-linked product."] },
  ulip: buildUlipIntelligence({
    // Phase 3B: real fund identities found this session (secondary
    // sources, primary brochure not directly fetchable) — 2 index-linked
    // funds, distinguishing this product from the other 3 ULIPs' broader
    // fund shelves.
    funds: [
      ulipFund("Flexi Growth Fund", "INDEX", ["Tracks the Nifty 100 index — not independently confirmed against a directly-fetched primary document this session."]),
      ulipFund("Flexi Smart Growth Fund", "INDEX", ["Tracks the Nifty 50 index — not independently confirmed against a directly-fetched primary document this session."]),
    ],
    historicalPerformance: [],
    officialIllustration: officialIllustration(
      [4, 8],
      "IRDAI-mandated benefit-illustration rates applied uniformly across LIC's current ULIP shelf (directly confirmed this session for LIC's SIIP, Plan 752 — see that plan's own citation; applied here as the same regulatorily-uniform standard, not independently confirmed by product name for Index Plus specifically). Primary licindia.in brochure could not be directly fetched in this sandbox (egress blocked)."
    ),
    charges: [
      { name: "Fund Management Charge", description: "1.35% p.a., flat and unconditional.", provenance: { status: "VERIFIED", sourceReferences: src("873") } },
      { name: "Mortality Charge", description: "A published rate per Rs.1,000 of Sum at Risk, increasing by age band (e.g. Rs.1.26 at age 25 up to Rs.15.07 at age 60).", provenance: { status: "VERIFIED", sourceReferences: src("873") } },
    ],
    lockInYears: 5,
  }),
  professionSuitability: ["Regular premium (not single) suits a customer with ongoing income who wants market participation, rather than a one-time lump sum."],
  combinationRoles: ["MARKET_LINKED_ACCUMULATION"],
  complementaryCharacteristics: [{ characteristic: "market-linked growth potential", complementsRolesWith: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"], reasoning: "Growth potential from market participation complements a guaranteed-floor traditional component so the whole goal isn't dependent on markets alone." }],
  strengths: [{ label: "Basic Sum Assured always exactly computable", detail: "A direct formula (7x/10x of premium), unlike traditional plans' sample-table-only premium lookups." }, { label: "published, verified charge structure", detail: "Fund Management Charge and Mortality Charge are both known exactly." }],
  tradeoffs: [{ label: "Fund Value is never guaranteed", detail: "Market-dependent; can rise or fall." }, { label: "5-year lock-in", detail: "Reduced liquidity versus a traditional endowment's earlier (if reduced-value) surrender option." }],
  usefulWhen: ["The customer accepts market risk over a sufficient horizon and wants growth-oriented accumulation alongside life cover."],
  lessUsefulWhen: ["The customer needs capital preservation or has a horizon too short to absorb market volatility."],
  overallConfidence: "VERIFIED",
  sources: src("873"),
});

const PLAN_749 = buildProfile({
  planNumber: "749",
  uin: "512L317V02",
  hasRegisteredEngine: true,
  productNature: ["MARKET_LINKED", "SINGLE_PREMIUM"],
  eligibility: {
    minEntryAge: null,
    maxEntryAge: 70,
    minMaturityAge: 18,
    maxMaturityAge: 85,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["single"],
    notes: [
      "Single-premium-only ULIP — BSA is a chosen multiple (1.25x or 10x) of the Single Premium; maximum entry age depends on the option chosen (70 or 35).",
      // Phase 3B IDENTITY/VERSION FLAG — see docs/lic-financial-knowledge-v2.md
      // "IDENTITY/VERSION ISSUES" for the full writeup. Kept as an actual
      // data string (not just a code comment) so this conflict stays
      // discoverable/testable rather than living only in source history.
      "IDENTITY/VERSION FLAG (Phase 3B, not silently resolved): multiple independent official licindia.in page titles found this session read 'LIC's Nivesh Plus (Plan No. 849, UIN No. 512L317V01)', with UIN 512L317V02 for the current/latest revision — NOT 'Plan No. 749' as this repository's catalogue has it. A secondary training document titled 'INTRODUCTION OF LIC's Nivesh Plus (Plan No. 749)' was also found, plausibly the origin of '749' in this repository. This looks like a PLAN-NUMBER transcription error (not a version change) — the UIN (512L317V02) is independently corroborated as this product either way. NOT changed this phase: the planNumber field is read by pre-existing UI-owning files (components/planner/Plan749Configurator.tsx, tests/lic-plan749.test.ts) this phase is not authorized to touch (no UI work). A secondary source also states this UIN was formally withdrawn by LIC on 2024-10-14 — NOT independently confirmed, and NOT acted on (this profile's active status is left unchanged) per 'report the conflict, do not silently overwrite'.",
    ],
  },
  premiumModel: {
    structure: "SINGLE",
    pptRelationship: { kind: "NOT_APPLICABLE" },
    calculationReadiness: "ESTIMABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: premium is a direct customer choice, not a table lookup", sourceReferences: [] } },
    notes: ["The customer chooses the Single Premium directly; Basic Sum Assured is then always directly computable as a formula (1.25x or 10x) of that choice."],
  },
  benefitModel: [marketLinkedFundValue("The Unit Fund Value depends on fund performance and is never projected as guaranteed."), otherContractual("Basic Sum Assured is a customer-chosen multiple (1.25x or 10x) of the Single Premium — always exactly computable.")],
  hasLifeProtection: true,
  protectionDescription: "A guaranteed death benefit equal to the higher of Basic Sum Assured or Fund Value at death — the BSA component is always exactly computable from the chosen premium/multiple.",
  cashFlowPattern: "PREMIUM_MINUS_CHARGES_INTO_MARKET_LINKED_FUND",
  marketRisk: "MARKET_LINKED",
  isSinglePremium: true,
  irrCalculable: false,
  returnNotes: ["The Fund Value leg is inherently market-dependent; any IRR would be at best ILLUSTRATIVE."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "NOT_APPLICABLE", lockInYears: 5, notes: ["A standard 5-year lock-in is typical for LIC ULIPs; loan is never available on a market-linked product."] },
  ulip: buildUlipIntelligence({
    funds: [ulipFund("Available Fund(s)", "OTHER", ["Exact fund names/asset-allocation bands are not itemized in this repository's verified data."])],
    historicalPerformance: [],
    officialIllustration: officialIllustration(
      [4, 8],
      "IRDAI-mandated benefit-illustration rates applied uniformly across LIC's current ULIP shelf (directly confirmed this session for LIC's SIIP, Plan 752 — see that plan's own citation; applied here as the same regulatorily-uniform standard). Primary licindia.in brochure could not be directly fetched in this sandbox (egress blocked). Note: unconfirmed secondary references to a 'Nivesh Plus Plan No. 849' were also found this session — possibly a separate/newer relaunch not yet reconciled with this repository's Plan 749/UIN 512L317V02 identity; flagged for dedicated re-verification, not silently changed (see docs/lic-financial-knowledge-v2.md)."
    ),
    charges: [
      { name: "Fund Management Charge", description: "1.35% p.a., flat and unconditional.", provenance: { status: "VERIFIED", sourceReferences: src("749") } },
      { name: "Mortality Charge", description: "A published rate per Rs.1,000 of Sum at Risk, increasing by age band.", provenance: { status: "VERIFIED", sourceReferences: src("749") } },
    ],
    lockInYears: 5,
  }),
  professionSuitability: ["Single premium suits a customer with a one-time lump sum who wants market participation rather than ongoing income-funded contribution."],
  combinationRoles: ["MARKET_LINKED_ACCUMULATION"],
  complementaryCharacteristics: [{ characteristic: "single-premium market-linked growth", complementsRolesWith: ["GOAL_ACCUMULATION"], reasoning: "A one-time market-linked deployment can complement an ongoing regular-premium traditional component." }],
  strengths: [{ label: "Basic Sum Assured always exactly computable", detail: "A direct formula (1.25x/10x of the Single Premium)." }, { label: "published, verified charge structure", detail: "Fund Management Charge and Mortality Charge both known exactly." }],
  tradeoffs: [{ label: "Fund Value is never guaranteed", detail: "Market-dependent." }, { label: "5-year lock-in on a single lump sum", detail: "Less liquid than putting the same lump sum into a traditional single-premium endowment." }],
  usefulWhen: ["The customer has a lump sum, accepts market risk, and wants growth-oriented deployment alongside life cover."],
  lessUsefulWhen: ["The customer wants to fund the goal from ongoing income rather than a lump sum, or needs capital preservation."],
  overallConfidence: "VERIFIED",
  sources: src("749"),
});

const PLAN_886 = buildProfile({
  planNumber: "886",
  uin: "512L361V01",
  hasRegisteredEngine: true,
  productNature: ["MARKET_LINKED", "REGULAR_PREMIUM", "LIMITED_PREMIUM"],
  eligibility: {
    minEntryAge: 18,
    maxEntryAge: null,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: ["BSA is a chosen multiple of Annualized Premium within a published [min, max] band that itself depends on age/PPT/premium — a continuous customer choice, not a discrete option like Plans 873/749. Has NO Guaranteed Additions feature at all (a structural absence, not a data gap)."],
  },
  premiumModel: {
    // CUSTOMER_CHOSEN, not REGULAR — same correction as Plan 873 above:
    // this plan's own notes already describe a direct customer premium
    // choice, never a table lookup.
    structure: "CUSTOMER_CHOSEN",
    pptRelationship: { kind: "INDEPENDENT_CHOICE" },
    calculationReadiness: "ESTIMABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: premium is a direct customer choice, not a table lookup", sourceReferences: [] } },
    notes: ["The customer chooses the Annualized Premium and a BSA multiple within a published band; Basic Sum Assured is then always directly computable."],
  },
  benefitModel: [marketLinkedFundValue("The Unit Fund Value depends on fund performance and is never projected as guaranteed."), otherContractual("Basic Sum Assured is a customer-chosen multiple (within a published band) of Annualized Premium — always exactly computable.")],
  hasLifeProtection: true,
  protectionDescription: "A guaranteed death benefit equal to the higher of Basic Sum Assured or Fund Value at death.",
  cashFlowPattern: "PREMIUM_MINUS_CHARGES_INTO_MARKET_LINKED_FUND",
  marketRisk: "MARKET_LINKED",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["The Fund Value leg is inherently market-dependent; any IRR would be at best ILLUSTRATIVE. No Guaranteed Additions exist on this product to offset that (unlike some traditional plans' guaranteed accrual)."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "NOT_APPLICABLE", lockInYears: 5, notes: ["A standard 5-year lock-in is typical for LIC ULIPs; loan is never available on a market-linked product."] },
  ulip: buildUlipIntelligence({
    // Phase 3B: real fund identities found this session (secondary
    // sources, primary brochure not directly fetchable) — the broadest
    // fund shelf of this catalogue's 4 ULIPs (6 options).
    funds: [
      ulipFund("Bond Fund", "DEBT", []),
      ulipFund("Secured Fund", "DEBT", []),
      ulipFund("Balanced Fund", "BALANCED", []),
      ulipFund("Growth Fund", "EQUITY", []),
      ulipFund("Flexi Growth Fund", "INDEX", ["Index-linked (per Index Plus/873's own Nifty 100 fund of the same name) — not independently re-confirmed for this specific product this session."]),
      ulipFund("Flexi Smart Growth Fund", "INDEX", ["Index-linked (per Index Plus/873's own Nifty 50 fund of the same name) — not independently re-confirmed for this specific product this session."]),
    ],
    historicalPerformance: [],
    officialIllustration: officialIllustration(
      [4, 8],
      "IRDAI-mandated benefit-illustration rates applied uniformly across LIC's current ULIP shelf (directly confirmed this session for LIC's SIIP, Plan 752 — see that plan's own citation; applied here as the same regulatorily-uniform standard, not independently confirmed by product name for Protection Plus specifically). Primary licindia.in brochure could not be directly fetched in this sandbox (egress blocked)."
    ),
    charges: [
      { name: "Fund Management Charge", description: "1.35% p.a., flat and unconditional.", provenance: { status: "VERIFIED", sourceReferences: src("886") } },
      { name: "Mortality Charge", description: "A published rate per Rs.1,000 of Sum at Risk, increasing by age band (e.g. Rs.1.17 at age 25 up to Rs.13.95 at age 60).", provenance: { status: "VERIFIED", sourceReferences: src("886") } },
    ],
    lockInYears: 5,
  }),
  professionSuitability: ["A continuous (not fixed-option) BSA-multiple choice gives more configuration flexibility, suiting a customer who wants to fine-tune protection-vs-accumulation balance."],
  combinationRoles: ["MARKET_LINKED_ACCUMULATION"],
  complementaryCharacteristics: [{ characteristic: "market-linked growth with configurable protection weighting", complementsRolesWith: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"], reasoning: "The continuous BSA-multiple choice lets this product's protection-vs-accumulation balance be tuned to complement whatever a paired traditional component already provides." }],
  strengths: [{ label: "continuous BSA-multiple configuration", detail: "More flexible than the fixed discrete multiples of Plans 873/749." }, { label: "published, verified charge structure", detail: "Fund Management Charge and Mortality Charge both known exactly." }],
  tradeoffs: [{ label: "no Guaranteed Additions at all", detail: "A structural absence — unlike some traditional plans, there is no guaranteed accrual to offset market risk." }, { label: "Fund Value is never guaranteed", detail: "Market-dependent." }],
  usefulWhen: ["The customer wants a market-linked vehicle with fine-tunable protection-vs-accumulation weighting."],
  lessUsefulWhen: ["The customer wants any guaranteed accrual component — this product has none."],
  overallConfidence: "VERIFIED",
  sources: src("886"),
});

const PLAN_752 = buildProfile({
  planNumber: "752",
  uin: "512L334V02",
  hasRegisteredEngine: false,
  productNature: ["MARKET_LINKED", "REGULAR_PREMIUM", "LIMITED_PREMIUM", "SINGLE_PREMIUM"],
  eligibility: {
    minEntryAge: null,
    maxEntryAge: null,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly", "single"],
    notes: [CATALOGUE_ONLY_NOTE, "LIC's SIIP is a market-linked ULIP marketed for systematic/flexible investment; exact eligibility bands are not verified in this repository."],
  },
  premiumModel: {
    structure: "CUSTOMER_CHOSEN",
    pptRelationship: { kind: "NOT_APPLICABLE" },
    calculationReadiness: "ESTIMABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: premium is a direct customer choice on a ULIP; no registered engine exists yet to compute the resulting Basic Sum Assured formula", sourceReferences: [] } },
    notes: ["Like this catalogue's other ULIPs, premium is expected to be a direct customer choice, with Basic Sum Assured as a formula-derived multiple — the exact multiple/bands are not yet verified in this repository."],
  },
  benefitModel: [marketLinkedFundValue("The Unit Fund Value depends on fund performance and is never projected as guaranteed.")],
  hasLifeProtection: true,
  protectionDescription: "A market-linked plan typically provides a death benefit at least the Basic Sum Assured or Fund Value — the exact formula is not yet verified in this repository.",
  cashFlowPattern: "PREMIUM_MINUS_CHARGES_INTO_MARKET_LINKED_FUND",
  marketRisk: "MARKET_LINKED",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["No registered engine exists yet for this product; charges/fund mechanics are not verified in this repository."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "NOT_APPLICABLE", lockInYears: 5, notes: ["A standard 5-year lock-in is typical for LIC ULIPs sold under current IRDAI regulations."] },
  ulip: buildUlipIntelligence({
    // Phase 3B: real fund identities found this session, directly named
    // for SIIP (secondary sources; primary brochure not directly
    // fetchable). Also found this session: "LIC SIIP Plan 852 has been
    // repackaged under Plan 752" — CONSISTENT with (not a conflict
    // against) this repository's own Plan 752 identity for SIIP.
    funds: [
      ulipFund("Bond Fund", "DEBT", []),
      ulipFund("Secured Fund", "DEBT", []),
      ulipFund("Balanced Fund", "BALANCED", []),
      ulipFund("Growth Fund", "EQUITY", ["One secondary source reported this fund's NAV as Rs.21.7091 as of 2026-04-27 — a single data point, insufficient to compute any 1Y/3Y/5Y/10Y return (a genuine multi-dated NAV series was not found this session); not stored as historicalPerformance data per this phase's own 'no thousands of hand-typed NAV records, and no CAGR from a single point' guidance."]),
    ],
    historicalPerformance: [],
    officialIllustration: officialIllustration(
      [4, 8],
      "LIC's SIIP Sales Brochure (UIN: 512L334V02) benefit illustration, confirmed this session via multiple independent secondary sources describing an assumed Projected Investment Rate of Return of 4% p.a. or 8% p.a. — the current IRDAI-mandated illustration rates (post the industry-wide move from the older 6%/10% standard). Primary licindia.in brochure could not be directly fetched in this sandbox (egress blocked)."
    ),
    charges: [
      { name: "Fund Management Charge", description: "1.35% p.a., consistent with this catalogue's other active LIC ULIPs — not independently itemized in a directly-fetched SIIP-specific document this session (see officialIllustration's own caveat).", provenance: { status: "ESTIMATED", method: "assumed uniform with Plans 873/749/886, all independently verified at 1.35% p.a.", sourceReferences: src("752") } },
    ],
    lockInYears: 5,
  }),
  professionSuitability: ["A flexible-contribution ULIP design (regular, limited, or single premium) can suit varied income patterns, though exact mechanics are not yet verified."],
  combinationRoles: ["MARKET_LINKED_ACCUMULATION"],
  complementaryCharacteristics: [{ characteristic: "market-linked growth potential", complementsRolesWith: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"], reasoning: "Growth potential from market participation complements a guaranteed-floor traditional component." }],
  strengths: [{ label: "flexible premium mode choice", detail: "Supports regular, limited and single premium, unlike Plans 873 (regular-only) or 749 (single-only)." }],
  tradeoffs: [{ label: "no registered engine and no verified fund/charge data", detail: "This repository cannot yet compute even the Basic Sum Assured formula or quote charges for this product." }],
  usefulWhen: ["The customer wants a flexible-contribution market-linked vehicle — full mechanics verification is a data gap to close before relying on this product in a real recommendation."],
  lessUsefulWhen: ["Precise charge/fund/BSA-formula data is required before advising — not yet available in this repository."],
  overallConfidence: "ESTIMATED",
  sources: ["lic-catalogue-product-page-752"],
});

// ==========================================================================
// MICRO INSURANCE (2 active, "where useful" per scope)
// ==========================================================================
//
// The existing lib/planning/goalOrchestrator/productRoles.ts classifies
// the ENTIRE micro_insurance CATEGORY as PROTECTION_ONLY — a category-
// wide simplification that predates this Phase 1 model and is left
// unchanged there (it is still correct for goal-accumulation routing
// purposes, since neither micro product has a registered engine this
// codebase can verify a maturity benefit through). This Phase 1 model
// independently assesses these two products by their OWN publicly
// documented mechanics, per Section 12's instruction to reason from
// mechanics rather than deferring to a category label — and finds Micro
// Bachat is NOT purely protection-only (it has a documented maturity
// benefit), while Jan Suraksha's design is not verified in this
// repository at all. Both are flagged with reduced confidence pending
// verification.

const PLAN_751 = buildProfile({
  planNumber: "751",
  uin: "512N329V03",
  hasRegisteredEngine: false,
  productNature: ["TRADITIONAL_NON_PARTICIPATING", "ENDOWMENT", "REGULAR_PREMIUM"],
  eligibility: {
    minEntryAge: null,
    maxEntryAge: null,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: [CATALOGUE_ONLY_NOTE, "Micro Bachat ('micro savings') is a small-sum-assured ENDOWMENT-style micro-insurance product, not a pure-protection micro plan — its own name and public positioning describe a savings-cum-protection design, though exact figures are not verified in this repository. Flagged for re-verification against current official LIC micro-insurance pages (Section: RESEARCH RULE discrepancy)."],
  },
  premiumModel: {
    structure: "REGULAR",
    pptRelationship: { kind: "EQUALS_TERM" },
    calculationReadiness: "NOT_YET_ESTIMATABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: no registered engine or published sample data available", sourceReferences: [] } },
    notes: ["Designed for small, affordable premium amounts (the 'micro' segment), but exact minimums are not verified in this repository."],
  },
  benefitModel: [guaranteedMaturity("A maturity benefit at the end of the policy term — a savings component distinguishing this from a pure micro-protection plan, though the exact benefit formula is not verified in this repository."), guaranteedProtection("A guaranteed death benefit, sized for the micro-insurance segment (small Sum Assured).")],
  hasLifeProtection: true,
  protectionDescription: "A guaranteed, small-Sum-Assured death benefit alongside a maturity benefit — a savings-cum-protection design typical of LIC's micro-insurance endowment products.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["No registered engine exists yet; exact benefit formula not verified in this repository."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "ESTIMATED", lockInYears: null, notes: ["LIC micro-insurance endowment norms, not verified against this repository's own data."] },
  ulip: null,
  professionSuitability: ["Designed for small, affordable premiums — suits lower-income or irregular-income customers who need an accessible entry point, though exact affordability figures are not verified here."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [],
  strengths: [{ label: "designed for small, affordable contributions", detail: "Targets the micro-insurance segment, unlike this catalogue's higher-minimum endowments." }, { label: "has a genuine maturity/savings component", detail: "Not purely protection-only, unlike the catalogue's pure-term micro product." }],
  tradeoffs: [{ label: "no registered engine, mechanics not fully verified", detail: "This repository cannot yet quote exact figures for this product — treat as a data gap to close, not a settled fact." }],
  usefulWhen: ["The customer's capacity is very limited and a small-Sum-Assured savings-cum-protection design is appropriate."],
  lessUsefulWhen: ["The customer's goal amount is large — a micro-insurance product's small Sum Assured ceiling is a structural mismatch."],
  overallConfidence: "ESTIMATED",
  sources: ["lic-catalogue-product-page-751"],
});

const PLAN_880 = buildProfile({
  planNumber: "880",
  uin: "512N388V01",
  hasRegisteredEngine: false,
  productNature: ["TRADITIONAL_NON_PARTICIPATING", "REGULAR_PREMIUM"],
  eligibility: {
    minEntryAge: null,
    maxEntryAge: null,
    minMaturityAge: null,
    maxMaturityAge: null,
    minPolicyTermYears: null,
    maxPolicyTermYears: null,
    validTermOptions: null,
    minPremiumOrBsa: { minBasicSumAssured: null, minPremium: null },
    premiumModes: ["yearly", "half_yearly", "quarterly", "monthly"],
    notes: [CATALOGUE_ONLY_NOTE, "Jan Suraksha's exact benefit design (whether it includes a maturity/savings component or is protection-only) is NOT verified in this repository — flagged as a genuine data gap rather than assumed either way."],
  },
  premiumModel: {
    structure: "REGULAR",
    pptRelationship: { kind: "EQUALS_TERM" },
    calculationReadiness: "NOT_YET_ESTIMATABLE",
    minimumContribution: { value: null, provenance: { status: "ESTIMATED", method: "not_yet_estimatable: no registered engine or published sample data available; even the product's benefit design is unverified", sourceReferences: [] } },
    notes: ["Designed for the micro-insurance segment; exact mechanics not verified in this repository."],
  },
  benefitModel: [guaranteedProtection("A guaranteed death benefit sized for the micro-insurance segment. Whether a maturity/savings benefit also exists is NOT verified in this repository — do not assume either way.")],
  hasLifeProtection: true,
  protectionDescription: "A guaranteed, small-Sum-Assured death benefit; whether a maturity component exists is unverified.",
  cashFlowPattern: "LEVEL_OUTFLOW_THEN_LUMP_SUM_MATURITY",
  marketRisk: "NONE",
  isSinglePremium: false,
  irrCalculable: false,
  returnNotes: ["No registered engine exists; even the product's benefit design (savings vs. protection-only) is unverified in this repository — return analysis cannot yet be attempted."],
  liquidity: { surrenderAvailable: "ESTIMATED", loanAvailable: "ESTIMATED", lockInYears: null, notes: ["Not verified against this repository's own data."] },
  ulip: null,
  professionSuitability: ["Designed for the micro-insurance segment — likely small, affordable premiums, though not verified here."],
  combinationRoles: ["GOAL_ACCUMULATION", "LONG_TERM_PROTECTION_SAVINGS"],
  complementaryCharacteristics: [],
  strengths: [{ label: "designed for the micro-insurance segment", detail: "Likely small, affordable premiums." }],
  tradeoffs: [{ label: "benefit design not verified", detail: "This repository does not yet confirm whether this product has a maturity/savings component at all — the LOWEST-confidence entry in this analysis." }],
  usefulWhen: ["Verification against LIC's current official micro-insurance product page/brochure is completed and confirms a use case."],
  lessUsefulWhen: ["Any case requiring confidence in the exact benefit design — verify first."],
  overallConfidence: "ESTIMATED",
  sources: ["lic-catalogue-product-page-880"],
});

// ==========================================================================
// Registry export
// ==========================================================================

export const ALL_PLAN_INTELLIGENCE_PROFILES: PlanIntelligenceProfile[] = [
  // Endowment
  PLAN_717, PLAN_714, PLAN_715, PLAN_733, PLAN_736, PLAN_774, PLAN_912, PLAN_881, PLAN_888, PLAN_889, PLAN_890, PLAN_770,
  // Whole life
  PLAN_745, PLAN_771, PLAN_883,
  // Money back
  PLAN_748, PLAN_734, PLAN_720, PLAN_721, PLAN_732,
  // Pension
  PLAN_867, PLAN_857, PLAN_758, PLAN_862, PLAN_879,
  // ULIP
  PLAN_873, PLAN_749, PLAN_886, PLAN_752,
  // Micro
  PLAN_751, PLAN_880,
];

function planKey(planNumber: string, uin: string): string {
  return `${planNumber}::${uin}`;
}

const PROFILES_BY_KEY = new Map<string, PlanIntelligenceProfile>(
  ALL_PLAN_INTELLIGENCE_PROFILES.map((profile) => [planKey(profile.identity.planNumber, profile.identity.uin), profile])
);

export function getPlanIntelligenceProfile(planNumber: string, uin: string): PlanIntelligenceProfile | undefined {
  return PROFILES_BY_KEY.get(planKey(planNumber, uin));
}
