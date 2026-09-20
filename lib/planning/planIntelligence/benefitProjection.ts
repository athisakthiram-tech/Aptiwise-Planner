// Phase 3 — Quantified Benefit Projection. Traditional products must
// NOT be modeled as "premium -> Basic Sum Assured" alone (Phase 3's own
// instruction) — this module separates every benefit into individually
// labeled components and keeps TWO layers strictly apart:
//
//   CONTRACTUAL / GUARANTEED         (totalGuaranteed)
//   PARTICIPATING / NON-GUARANTEED   (totalParticipatingEstimate)
//
// totalPlanningEstimate = the two combined, and is NEVER itself
// presented as guaranteed — it stays ESTIMATED/HISTORICAL-based even
// when every individual component is confidently sourced.
//
// This is a sibling to premiumModel.ts's estimatePremium(), not a
// change to PlanIntelligenceProfile's own shape — it reads a plan's
// already-registered benefitModel/premiumModel via planProfiles.ts and
// adds quantified amounts on top, per plan mechanics. Where a plan has
// no dedicated case below, projectDefaultGuaranteedMaturity() applies —
// exactly the guaranteed-BSA-only behavior Phase 2 already had, so
// nothing regresses for a product this phase didn't enrich.

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
  policyTermYears: number;
  premiumPayingTermYears: number | null;
  basicSumAssured: number;
}

export interface BenefitProjection {
  components: BenefitComponentProjection[];
  totalGuaranteed: ProvenancedValue;
  totalParticipatingEstimate: ProvenancedValue;
  totalPlanningEstimate: ProvenancedValue;
  method: string;
}

const SECONDARY_VERIFIED_NOTE =
  "cross-verified this session via LIC's official sales brochure reference plus multiple independent secondary sources describing identical mechanics; the primary PDF could not be directly fetched in this sandbox (licindia.in egress is blocked)";

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

// ---- Default: guaranteed maturity == Basic Sum Assured only ----
// (identical to Phase 2's original behavior — the safe fallback for any
// plan this phase did not specifically enrich, e.g. New Endowment (714),
// New Jeevan Anand (715), Jeevan Lakshya (733): all three have a real,
// unpublished participating bonus this repository still cannot quote,
// so this stays honestly guaranteed-only unless historicalBonusData has
// a matching record.)
function projectWithHistoricalBonus(input: BenefitProjectionInput, maturityLabel: string): BenefitProjection {
  const components: BenefitComponentProjection[] = [
    {
      label: maturityLabel,
      type: "MATURITY",
      character: "GUARANTEED",
      amount: { value: input.basicSumAssured, provenance: { status: "DERIVED", method: "Sum Assured on Maturity equals the configured Basic Sum Assured, guaranteed by policy contract", sourceReferences: [], estimationConfidence: "HIGH" } },
      yearFromStart: input.policyTermYears,
    },
  ];

  const historical = getHistoricalBonusEstimate(input.planNumber, input.uin, input.basicSumAssured, input.policyTermYears);
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
// substantially a long recurring income stream (Phase 3's own required
// validation). 8% of Basic Sum Assured is confirmed via LIC's own
// official sales brochure (cross-checked via multiple independent
// secondary sources this session) as a GUARANTEED, contractual annual
// Survival Benefit — not a participating bonus. ----
function projectJeevanUmang(input: BenefitProjectionInput): BenefitProjection {
  const pptEnd = input.premiumPayingTermYears ?? input.policyTermYears;
  const incomeAnnual = input.basicSumAssured * 0.08;
  const components: BenefitComponentProjection[] = [
    {
      label: "Survival Benefit — 8% of Basic Sum Assured, payable every year from the end of the Premium Paying Term",
      type: "SURVIVAL",
      character: "GUARANTEED",
      amount: { value: incomeAnnual, provenance: { status: "DERIVED", method: `8% of Basic Sum Assured, ${SECONDARY_VERIFIED_NOTE}`, sourceReferences: ["lic-745-jeevan-umang-sales-brochure-secondary-verified"], estimationConfidence: "MEDIUM" } },
      yearFromStart: pptEnd,
      recurring: { untilYear: input.policyTermYears },
    },
    {
      label: "Whole-life terminal benefit — Basic Sum Assured, payable at the end of cover",
      type: "MATURITY",
      character: "GUARANTEED",
      amount: { value: input.basicSumAssured, provenance: { status: "DERIVED", method: "Basic Sum Assured payable at the end of whole-life cover, per this plan's own published design", sourceReferences: ["lic-745-jeevan-umang-sales-brochure-secondary-verified"], estimationConfidence: "HIGH" } },
      yearFromStart: input.policyTermYears,
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
    method:
      "Guaranteed 8%-of-Basic-Sum-Assured annual Survival Benefit from end of Premium Paying Term through the end of cover, plus a guaranteed whole-life terminal benefit equal to Basic Sum Assured. This is a recurring-income product, not a single maturity corpus — its economic value comes substantially from the income stream, not a one-time payout.",
  };
}

// ---- Jeevan Utsav (771), Regular Income variant: Guaranteed Additions
// during the Premium Paying Term (guaranteed, not bonus-dependent) plus
// a 10%-of-Basic-Sum-Assured guaranteed annual income thereafter. The
// Flexi Income variant's accumulation rate could not be confirmed by
// more than one independent source this session, so it is deliberately
// NOT quantified here (see the audit doc's data-gap note) — this
// projects the Regular Income variant only. ----
function projectJeevanUtsavRegularIncome(input: BenefitProjectionInput): BenefitProjection {
  const pptEnd = input.premiumPayingTermYears ?? input.policyTermYears;
  const incomeAnnual = input.basicSumAssured * 0.1;
  const guaranteedAdditionTotal = 40 * (input.basicSumAssured / 1000) * pptEnd; // Rs.40 per Rs.1,000 BSA per year of PPT

  const components: BenefitComponentProjection[] = [
    {
      label: "Guaranteed Additions — Rs.40 per Rs.1,000 Basic Sum Assured, accrued each year of the Premium Paying Term, paid out with the terminal/death benefit",
      type: "GUARANTEED_ADDITION",
      character: "GUARANTEED",
      amount: { value: guaranteedAdditionTotal, provenance: { status: "DERIVED", method: `Rs.40/1,000 BSA x ${pptEnd} PPT years, ${SECONDARY_VERIFIED_NOTE}`, sourceReferences: ["lic-771-jeevan-utsav-sales-brochure-secondary-verified"], estimationConfidence: "MEDIUM" } },
      yearFromStart: pptEnd,
    },
    {
      label: "Regular Income — 10% of Basic Sum Assured, payable every year from the end of the Premium Paying Term (Regular Income option)",
      type: "INCOME",
      character: "GUARANTEED",
      amount: { value: incomeAnnual, provenance: { status: "DERIVED", method: `10% of Basic Sum Assured under the Regular Income option, ${SECONDARY_VERIFIED_NOTE}`, sourceReferences: ["lic-771-jeevan-utsav-sales-brochure-secondary-verified"], estimationConfidence: "MEDIUM" } },
      yearFromStart: pptEnd,
      recurring: { untilYear: input.policyTermYears },
    },
  ];

  const totalGuaranteed = sumComponentTotals(components, "GUARANTEED");

  return {
    components,
    totalGuaranteed,
    totalParticipatingEstimate: { value: 0, provenance: { status: "VERIFIED", sourceReferences: [] } }, // non-participating plan — no bonus layer exists at all
    totalPlanningEstimate: totalGuaranteed,
    method:
      "Regular Income option: a guaranteed Rs.40/1,000 BSA Guaranteed Addition accrued during the Premium Paying Term, plus a guaranteed 10%-of-Basic-Sum-Assured annual income from the end of the Premium Paying Term through the end of cover. This plan is non-participating — there is no bonus layer to estimate (unlike Jeevan Labh/New Endowment). The Flexi Income variant is not quantified here (its accumulation rate could not be corroborated by more than one independent source this session).",
  };
}

export function projectBenefits(input: BenefitProjectionInput): BenefitProjection {
  const profile = getPlanIntelligenceProfile(input.planNumber, input.uin);
  const maturityLabel = profile ? `Sum Assured on Maturity (${profile.identity.productName})` : "Sum Assured on Maturity";

  switch (input.planNumber) {
    case "745":
      return projectJeevanUmang(input);
    case "771":
      return projectJeevanUtsavRegularIncome(input);
    case "736":
    case "714":
    case "715":
    case "733":
    default:
      return projectWithHistoricalBonus(input, maturityLabel);
  }
}
