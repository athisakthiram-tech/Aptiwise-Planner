// Phase 3/3B — Quantified Benefit Projection. Traditional products must
// NOT be modeled as "premium -> Basic Sum Assured" alone — this module
// separates every benefit into individually labeled components and
// keeps TWO layers strictly apart:
//
//   CONTRACTUAL / GUARANTEED         (totalGuaranteed)
//   PARTICIPATING / NON-GUARANTEED   (totalParticipatingEstimate)
//
// totalPlanningEstimate = the two combined, and is NEVER itself
// presented as guaranteed — it stays ESTIMATED/HISTORICAL-based even
// when every individual component is confidently sourced.
//
// For whole-life income products (Jeevan Umang/Jeevan Utsav), benefit
// events run to the product's OWN true contractual end (age 100), never
// truncated at the customer's goal year — Phase 3B's own instruction:
// "do not truncate a whole-life product at the goal year and call that
// its total return." `input.policyTermYears` here is the SEARCH
// horizon (the customer's goal year, as Phase 2's configurationGenerator
// sets it); this module computes the product's real terminal year
// (`Math.max(100 - age, policyTermYears)`) separately and uses THAT for
// the income/terminal-benefit window. Callers (structureAnalysis.ts)
// then split "received by the goal year" from "received after" using
// their own already-existing incomeReceivedBeforeGoal/AfterGoal fields.
//
// This is a sibling to premiumModel.ts's estimatePremium(), not a
// change to PlanIntelligenceProfile's own shape — it reads a plan's
// already-registered benefitModel/premiumModel via planProfiles.ts and
// adds quantified amounts on top, per plan mechanics. Where a plan has
// no dedicated case below, projectWithHistoricalBonus() applies —
// guaranteed-BSA-plus-any-verified-historical-bonus, the safe fallback
// for any plan this phase did not specifically enrich.

import { getPlanIntelligenceProfile } from "@/lib/planning/planIntelligence/planProfiles";
import { getHistoricalBonusEstimate } from "@/lib/planning/planIntelligence/historicalBonusData";
import { BenefitCharacter, BenefitType, ProvenancedValue } from "@/lib/planning/planIntelligence/types";
import { combineProvenance } from "@/lib/planning/planIntelligence/confidence";

export interface BenefitComponentProjection {
  label: string;
  type: BenefitType;
  character: BenefitCharacter;
  amount: ProvenancedValue; // amount at each occurrence
  yearFromStart: number; // first occurrence
  recurring?: { untilYear: number }; // present => the same amount recurs annually through untilYear inclusive
}

export interface BenefitProjectionInput {
  planNumber: string;
  uin: string;
  age: number;
  policyTermYears: number; // the SEARCH horizon (e.g. the customer's goal year) — see module header
  premiumPayingTermYears: number | null;
  basicSumAssured: number;
}

export type JeevanUtsavVariant = "REGULAR_INCOME" | "FLEXI_INCOME";

export interface BenefitProjection {
  components: BenefitComponentProjection[];
  totalGuaranteed: ProvenancedValue;
  totalParticipatingEstimate: ProvenancedValue;
  totalPlanningEstimate: ProvenancedValue;
  method: string;
}

const SECONDARY_VERIFIED_NOTE =
  "cross-verified this session via LIC's official sales brochure reference plus multiple independent secondary sources describing identical mechanics; the primary PDF could not be directly fetched in this sandbox (licindia.in and other external domains are blocked by this sandbox's network egress policy)";

function sumComponentTotals(components: BenefitComponentProjection[], character: BenefitCharacter | BenefitCharacter[]): ProvenancedValue {
  const characters = Array.isArray(character) ? character : [character];
  const matching = components.filter((c) => characters.includes(c.character));
  if (matching.length === 0) return { value: 0, provenance: { status: "VERIFIED", sourceReferences: [] } };
  if (matching.some((c) => c.amount.value == null)) {
    return { value: null, provenance: combineProvenance(matching.map((c) => c.amount)) };
  }
  const total = matching.reduce((sum, c) => {
    const occurrences = c.recurring ? c.recurring.untilYear - c.yearFromStart + 1 : 1;
    return sum + (c.amount.value as number) * occurrences;
  }, 0);
  return { value: total, provenance: combineProvenance(matching.map((c) => c.amount)) };
}

function addProvenancedValues(values: ProvenancedValue[]): ProvenancedValue {
  if (values.some((v) => v.value == null)) return { value: null, provenance: combineProvenance(values) };
  return { value: values.reduce((s, v) => s + (v.value as number), 0), provenance: combineProvenance(values) };
}

// The product's own true contractual end (age 100 for a whole-life
// plan) is never earlier than the search horizon it was configured
// against, but is very often much LATER — that later value is what
// must be used so post-goal benefits are never silently discarded.
function wholeLifeTerminalYear(input: BenefitProjectionInput): number {
  return Math.max(100 - input.age, input.policyTermYears);
}

// ---- Default: guaranteed maturity plus any verified historical bonus ----
// (the safe fallback for any plan this phase did not specifically
// enrich beyond bonus data, e.g. New Endowment (714), New Jeevan Anand
// (715), Jeevan Lakshya (733), Jeevan Labh (736): each stays honestly
// guaranteed-only unless historicalBonusData.ts has a matching record
// for the configured Sum Assured band/term-or-maturity-age.)
function projectWithHistoricalBonus(input: BenefitProjectionInput, maturityLabel: string): BenefitProjection {
  const components: BenefitComponentProjection[] = [
    {
      label: maturityLabel,
      type: "MATURITY",
      character: "GUARANTEED",
      amount: { value: input.basicSumAssured, provenance: { status: "DERIVED", method: "Sum Assured on Maturity equals the configured Basic Sum Assured, guaranteed by policy contract", sourceReferences: [], estimationConfidence: "HIGH", sourceQuality: "INTERNAL_DERIVATION" } },
      yearFromStart: input.policyTermYears,
    },
  ];

  const maturityAge = input.age + input.policyTermYears;
  const historical = getHistoricalBonusEstimate(input.planNumber, input.uin, input.basicSumAssured, input.policyTermYears, maturityAge);
  let method = "Guaranteed maturity (Basic Sum Assured) only — no verified historical bonus rate applies to this Sum Assured band/term in this repository.";
  if (historical) {
    const bonusAmount = historical.ratePerThousandSumAssured * (input.basicSumAssured / 1000) * input.policyTermYears;
    components.push({
      label: `Simple Reversionary Bonus (historical-based estimate, ${historical.provenance.method})`,
      type: "SIMPLE_REVERSIONARY_BONUS",
      character: "NON_GUARANTEED",
      amount: { value: bonusAmount, provenance: historical.provenance },
      yearFromStart: input.policyTermYears,
    });
    method = `Guaranteed maturity (Basic Sum Assured) plus a historical-based Simple Reversionary Bonus estimate (Rs.${historical.ratePerThousandSumAssured}/1000 SA/year x ${input.policyTermYears} years) — NOT a guaranteed figure, and not LIC's own bonus declaration for any future year.`;
  }

  const totalGuaranteed = sumComponentTotals(components, "GUARANTEED");
  const totalParticipatingEstimate = sumComponentTotals(components, ["NON_GUARANTEED", "HISTORICAL", "ESTIMATED"]);
  const totalPlanningEstimate = addProvenancedValues([totalGuaranteed, totalParticipatingEstimate]);

  return { components, totalGuaranteed, totalParticipatingEstimate, totalPlanningEstimate, method };
}

// ---- Jeevan Umang (745): NOT a maturity-corpus product — its value is
// substantially a long recurring income stream. 8% of Basic Sum Assured
// is confirmed via LIC's official sales brochure (cross-checked via
// multiple independent secondary sources this session, all agreeing on
// 8% and on "income starts at end of PPT with no further waiting
// period" — one source explicitly: "there is no waiting period within
// the PPT for these benefits to begin — they commence as soon as the
// last premium is paid") as a GUARANTEED, contractual annual Survival
// Benefit — not a participating bonus. Income and the terminal benefit
// both run to the plan's real whole-life end (age 100), not truncated
// at the search horizon. ----
function projectJeevanUmang(input: BenefitProjectionInput): BenefitProjection {
  const pptEnd = input.premiumPayingTermYears ?? input.policyTermYears;
  const terminalYear = wholeLifeTerminalYear(input);
  const incomeAnnual = input.basicSumAssured * 0.08;
  const components: BenefitComponentProjection[] = [
    {
      label: "Survival Benefit — 8% of Basic Sum Assured, payable every year from the end of the Premium Paying Term (no further waiting period) until age 100 or earlier death",
      type: "SURVIVAL",
      character: "GUARANTEED",
      amount: { value: incomeAnnual, provenance: { status: "DERIVED", method: `8% of Basic Sum Assured, income starts immediately at PPT end (no waiting period), ${SECONDARY_VERIFIED_NOTE}`, sourceReferences: ["lic-745-jeevan-umang-sales-brochure-secondary-verified"], estimationConfidence: "MEDIUM", sourceQuality: "SECONDARY_CORROBORATED" } },
      yearFromStart: pptEnd,
      recurring: { untilYear: terminalYear },
    },
    {
      label: "Whole-life terminal benefit — Basic Sum Assured, payable at the end of cover (age 100)",
      type: "MATURITY",
      character: "GUARANTEED",
      amount: { value: input.basicSumAssured, provenance: { status: "DERIVED", method: "Basic Sum Assured payable at the end of whole-life cover (age 100), per this plan's own published design", sourceReferences: ["lic-745-jeevan-umang-sales-brochure-secondary-verified"], estimationConfidence: "HIGH", sourceQuality: "SECONDARY_CORROBORATED" } },
      yearFromStart: terminalYear,
    },
  ];

  const totalGuaranteed = sumComponentTotals(components, "GUARANTEED");
  const totalParticipatingEstimate: ProvenancedValue = {
    value: null,
    provenance: { status: "ESTIMATED", method: "not_yet_estimatable: Jeevan Umang's Simple Reversionary Bonus rate is not verified in this repository", sourceReferences: [] },
  };
  const totalPlanningEstimate = totalGuaranteed; // no defensible participating add-on to combine

  return {
    components,
    totalGuaranteed,
    totalParticipatingEstimate,
    totalPlanningEstimate,
    method: `Guaranteed 8%-of-Basic-Sum-Assured annual Survival Benefit from end of Premium Paying Term through age 100 (terminal year modeled at ${terminalYear}, i.e. age 100, not the shorter search horizon), plus a guaranteed whole-life terminal benefit equal to Basic Sum Assured at that same true end year. This is a recurring-income product, not a single maturity corpus — its economic value comes substantially from the income stream, and much of that stream and the terminal benefit fall AFTER a typical mid-life goal year (see StructureGoalAnalysis's incomeReceivedAfterGoal field).`,
  };
}

// ---- Jeevan Utsav (771): Regular Income option pays a guaranteed 10%
// of Basic Sum Assured per year, confirmed this session to begin 2
// YEARS AFTER the Premium Paying Term ends (a genuine waiting period,
// corrected from Phase 3's incorrect assumption that income began
// immediately at PPT end) — one source explicitly: "Starting 2 years
// after the premium payment term ends, LIC pays an annual income equal
// to exactly 10% of the Basic Sum Assured." Guaranteed Additions of
// Rs.40/1,000 BSA accrue during the PPT regardless of which income
// option is chosen. Flexi Income lets the customer accumulate that same
// entitlement instead, at a guaranteed 5.5% p.a. compounding rate — now
// corroborated by 2 independent sources this session (a stronger bar
// than Phase 3's single-source non-corroboration), modeled at
// ESTIMATED/MEDIUM confidence as a deferred lump sum rather than a
// recurring payment; this is a genuinely different cash-flow shape from
// Regular Income, never the same cash flow under a different name. ----
const UTSAV_INCOME_WAITING_YEARS = 2;
const UTSAV_FLEXI_ACCUMULATION_RATE_PCT = 5.5;

function jeevanUtsavGuaranteedAddition(input: BenefitProjectionInput, pptEnd: number): BenefitComponentProjection {
  const guaranteedAdditionTotal = 40 * (input.basicSumAssured / 1000) * pptEnd;
  return {
    label: "Guaranteed Additions — Rs.40 per Rs.1,000 Basic Sum Assured, accrued each year of the Premium Paying Term, paid out with the terminal/death benefit",
    type: "GUARANTEED_ADDITION",
    character: "GUARANTEED",
    amount: { value: guaranteedAdditionTotal, provenance: { status: "DERIVED", method: `Rs.40/1,000 BSA x ${pptEnd} PPT years, ${SECONDARY_VERIFIED_NOTE}`, sourceReferences: ["lic-771-jeevan-utsav-sales-brochure-secondary-verified"], estimationConfidence: "MEDIUM", sourceQuality: "SECONDARY_CORROBORATED" } },
    yearFromStart: pptEnd,
  };
}

function projectJeevanUtsavRegularIncome(input: BenefitProjectionInput): BenefitProjection {
  const pptEnd = input.premiumPayingTermYears ?? input.policyTermYears;
  const incomeStart = pptEnd + UTSAV_INCOME_WAITING_YEARS;
  const terminalYear = wholeLifeTerminalYear(input);
  const incomeAnnual = input.basicSumAssured * 0.1;

  const components: BenefitComponentProjection[] = [
    jeevanUtsavGuaranteedAddition(input, pptEnd),
    {
      label: `Regular Income — 10% of Basic Sum Assured, payable every year starting ${UTSAV_INCOME_WAITING_YEARS} years after the Premium Paying Term ends (Regular Income option)`,
      type: "INCOME",
      character: "GUARANTEED",
      amount: { value: incomeAnnual, provenance: { status: "DERIVED", method: `10% of Basic Sum Assured under the Regular Income option, starting ${UTSAV_INCOME_WAITING_YEARS} years after PPT end (a genuine waiting period, not immediate), ${SECONDARY_VERIFIED_NOTE}`, sourceReferences: ["lic-771-jeevan-utsav-sales-brochure-secondary-verified"], estimationConfidence: "MEDIUM", sourceQuality: "SECONDARY_CORROBORATED" } },
      yearFromStart: incomeStart,
      recurring: { untilYear: Math.max(incomeStart, terminalYear) },
    },
  ];

  const totalGuaranteed = sumComponentTotals(components, "GUARANTEED");

  return {
    components,
    totalGuaranteed,
    totalParticipatingEstimate: { value: 0, provenance: { status: "VERIFIED", sourceReferences: [] } }, // non-participating plan — no bonus layer exists at all
    totalPlanningEstimate: totalGuaranteed,
    method: `Regular Income option: a guaranteed Rs.40/1,000 BSA Guaranteed Addition accrued during the Premium Paying Term (${pptEnd} years), plus a guaranteed 10%-of-Basic-Sum-Assured annual income starting ${UTSAV_INCOME_WAITING_YEARS} years after PPT end and continuing through age 100 (terminal year ${terminalYear}). This plan is non-participating — there is no bonus layer to estimate.`,
  };
}

// Flexi Income modeled as a single deferred lump sum: each year's
// would-be 10%-of-BSA income instead compounds at the guaranteed 5.5%
// p.a. rate from when it would have been paid until the reporting
// horizon (input.policyTermYears) — a defensible approximation of
// "accumulate with LIC" for planning purposes, not an exact actuarial
// replication, and explicitly NOT presented as the same cash flow as
// Regular Income.
function projectJeevanUtsavFlexiIncome(input: BenefitProjectionInput): BenefitProjection {
  const pptEnd = input.premiumPayingTermYears ?? input.policyTermYears;
  const incomeStart = pptEnd + UTSAV_INCOME_WAITING_YEARS;
  const withdrawalYear = Math.max(incomeStart, input.policyTermYears);
  const annualEntitlement = input.basicSumAssured * 0.1;
  const rate = UTSAV_FLEXI_ACCUMULATION_RATE_PCT / 100;

  const yearsAccumulated = withdrawalYear - incomeStart + 1;
  const accumulatedValue = yearsAccumulated > 0 ? annualEntitlement * ((Math.pow(1 + rate, yearsAccumulated) - 1) / rate) : 0;

  const components: BenefitComponentProjection[] = [
    jeevanUtsavGuaranteedAddition(input, pptEnd),
    {
      label: `Flexi Income — the same 10%-of-Basic-Sum-Assured entitlement accumulated (not drawn) at a guaranteed ${UTSAV_FLEXI_ACCUMULATION_RATE_PCT}% p.a. compounding rate from ${incomeStart} years, available as a lump sum from that point`,
      type: "OTHER_CONTRACTUAL_BENEFIT",
      character: "GUARANTEED",
      amount: {
        value: yearsAccumulated > 0 ? accumulatedValue : null,
        provenance: {
          status: "DERIVED",
          method: `Deferred accumulation of the 10%-of-BSA entitlement at ${UTSAV_FLEXI_ACCUMULATION_RATE_PCT}% p.a. compounding (2 independent secondary sources this session agree on this rate) from year ${incomeStart} to year ${withdrawalYear} — a planning approximation of "accumulate with LIC," not this plan's own exact accumulation formula`,
          sourceReferences: ["lic-771-jeevan-utsav-flexi-income-secondary-corroborated"],
          estimationConfidence: "LOW",
          sourceQuality: "SECONDARY_CORROBORATED",
        },
      },
      yearFromStart: withdrawalYear,
    },
  ];

  const totalGuaranteed = sumComponentTotals(components, "GUARANTEED");

  return {
    components,
    totalGuaranteed,
    totalParticipatingEstimate: { value: 0, provenance: { status: "VERIFIED", sourceReferences: [] } },
    totalPlanningEstimate: totalGuaranteed,
    method: `Flexi Income option: the same Guaranteed Addition as Regular Income, but the 10%-of-BSA annual entitlement is accumulated (never drawn) at a guaranteed ${UTSAV_FLEXI_ACCUMULATION_RATE_PCT}% p.a. compounding rate from ${incomeStart} years, modeled as a single lump sum available from year ${withdrawalYear} — a genuinely different cash-flow shape from Regular Income, never the same cash flow under a different name.`,
  };
}

// ---- Money-back schedules: New Money Back 20yr (720) and 25yr (721) —
// scheduled survival-benefit installments plus a REDUCED maturity
// payment (never double-counting the Basic Sum Assured: installments +
// remaining maturity percentage always sum to exactly 100% of BSA). ----
interface MoneyBackSchedule {
  installments: { atPolicyYear: number; percentOfBsa: number }[];
  maturityPercentOfBsa: number;
  sourceLabel: string;
}

const MONEY_BACK_SCHEDULES: Record<string, MoneyBackSchedule> = {
  "720": {
    installments: [
      { atPolicyYear: 5, percentOfBsa: 20 },
      { atPolicyYear: 10, percentOfBsa: 20 },
      { atPolicyYear: 15, percentOfBsa: 20 },
    ],
    maturityPercentOfBsa: 40,
    sourceLabel: "lic-720-new-money-back-20-years-secondary-corroborated",
  },
  "721": {
    installments: [
      { atPolicyYear: 5, percentOfBsa: 15 },
      { atPolicyYear: 10, percentOfBsa: 15 },
      { atPolicyYear: 15, percentOfBsa: 15 },
      { atPolicyYear: 20, percentOfBsa: 15 },
    ],
    maturityPercentOfBsa: 40,
    sourceLabel: "lic-721-new-money-back-25-years-secondary-corroborated",
  },
};

function projectMoneyBack(input: BenefitProjectionInput, schedule: MoneyBackSchedule): BenefitProjection {
  const totalInstallmentPercent = schedule.installments.reduce((s, i) => s + i.percentOfBsa, 0);
  if (totalInstallmentPercent + schedule.maturityPercentOfBsa !== 100) {
    // Defensive: this schedule table is internal data, not user input —
    // a mismatch here is a data-entry bug, not a runtime condition to
    // recover from silently (Phase 3B's own sanity-check philosophy).
    throw new Error(`Money-back schedule for plan ${input.planNumber} does not sum to 100% of Basic Sum Assured (got ${totalInstallmentPercent + schedule.maturityPercentOfBsa}%)`);
  }

  const components: BenefitComponentProjection[] = schedule.installments.map((installment) => ({
    label: `Survival Benefit — ${installment.percentOfBsa}% of Basic Sum Assured at the end of policy year ${installment.atPolicyYear}`,
    type: "SURVIVAL",
    character: "GUARANTEED",
    amount: { value: input.basicSumAssured * (installment.percentOfBsa / 100), provenance: { status: "DERIVED", method: `${installment.percentOfBsa}% of Basic Sum Assured, ${SECONDARY_VERIFIED_NOTE}`, sourceReferences: [schedule.sourceLabel], estimationConfidence: "MEDIUM", sourceQuality: "SECONDARY_CORROBORATED" } },
    yearFromStart: installment.atPolicyYear,
  }));

  components.push({
    label: `Maturity Benefit — remaining ${schedule.maturityPercentOfBsa}% of Basic Sum Assured (never the full BSA — the installments above already paid the rest)`,
    type: "MATURITY",
    character: "GUARANTEED",
    amount: { value: input.basicSumAssured * (schedule.maturityPercentOfBsa / 100), provenance: { status: "DERIVED", method: `${schedule.maturityPercentOfBsa}% of Basic Sum Assured, ${SECONDARY_VERIFIED_NOTE}`, sourceReferences: [schedule.sourceLabel], estimationConfidence: "MEDIUM", sourceQuality: "SECONDARY_CORROBORATED" } },
    yearFromStart: input.policyTermYears,
  });

  const totalGuaranteed = sumComponentTotals(components, "GUARANTEED");
  const historical = getHistoricalBonusEstimate(input.planNumber, input.uin, input.basicSumAssured, input.policyTermYears, input.age + input.policyTermYears);
  const totalParticipatingEstimate = historical
    ? { value: historical.ratePerThousandSumAssured * (input.basicSumAssured / 1000) * input.policyTermYears, provenance: historical.provenance }
    : { value: 0, provenance: { status: "ESTIMATED" as const, method: "no verified historical bonus rate for this plan in this repository", sourceReferences: [] } };
  const totalPlanningEstimate = addProvenancedValues([totalGuaranteed, totalParticipatingEstimate]);

  return {
    components,
    totalGuaranteed,
    totalParticipatingEstimate,
    totalPlanningEstimate,
    method: `Scheduled survival-benefit installments (${schedule.installments.map((i) => `${i.percentOfBsa}% at year ${i.atPolicyYear}`).join(", ")}) plus a ${schedule.maturityPercentOfBsa}% maturity payment — together exactly 100% of Basic Sum Assured, never double-counted.`,
  };
}

export function projectBenefits(input: BenefitProjectionInput, utsavVariant: JeevanUtsavVariant = "REGULAR_INCOME"): BenefitProjection {
  const profile = getPlanIntelligenceProfile(input.planNumber, input.uin);
  const maturityLabel = profile ? `Sum Assured on Maturity (${profile.identity.productName})` : "Sum Assured on Maturity";

  if (input.planNumber === "745") return projectJeevanUmang(input);
  if (input.planNumber === "771") return utsavVariant === "FLEXI_INCOME" ? projectJeevanUtsavFlexiIncome(input) : projectJeevanUtsavRegularIncome(input);
  const moneyBackSchedule = MONEY_BACK_SCHEDULES[input.planNumber];
  if (moneyBackSchedule) return projectMoneyBack(input, moneyBackSchedule);
  return projectWithHistoricalBonus(input, maturityLabel);
}
