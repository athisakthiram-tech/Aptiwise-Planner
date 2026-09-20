// Premium model + estimation support (Sections 4/5). Reuses the already-
// registered engines (lib/insurance/providers/lic/engines.ts) and their
// declared calculation domain (lib/insurance/premiumCalculationCapability.ts)
// exactly as-is — this module adds exactly one new capability those two
// don't have: a bounded, explainable ESTIMATE when the exact published
// sample table doesn't cover the requested configuration, instead of
// leaving the product entirely unusable for planning purposes.

import { LicCalculationContext } from "@/types/insurance";
import { getLicProductEngine } from "@/lib/insurance/providers/lic/engines";
import { getPremiumCalculationDomain, PremiumCalculationDomain } from "@/lib/insurance/premiumCalculationCapability";
import { EstimatePremiumInput, EstimatePremiumResult, Provenance } from "@/lib/planning/planIntelligence/types";

function annualToMonthly(annual: number): number {
  return Math.round(annual / 12);
}

function nearestValue(candidates: readonly number[], target: number): number | null {
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
}

function tryExactCalculation(
  planNumber: string,
  uin: string,
  input: EstimatePremiumInput
): { annualPremium: number; frequency: string } | null {
  const engine = getLicProductEngine(planNumber, uin);
  if (!engine?.calculatePremium) return null;
  const context: LicCalculationContext = {
    age: input.age,
    policyTermYears: input.policyTermYears,
    premiumPayingTermYears: input.premiumPayingTermYears,
    basicSumAssured: input.targetBasicSumAssured,
    premiumMode: input.premiumMode ?? "yearly",
  };
  const result = engine.calculatePremium(context);
  if (result.available && result.premium != null) {
    return { annualPremium: result.premium, frequency: result.premiumFrequency ?? "yearly" };
  }
  return null;
}

// Method 1 (Section 5): the requested age isn't published, but a nearby
// published sample age is, at the SAME term/BSA — reuse that sample as a
// bounded, explainable approximation. Never interpolated (no averaging
// between two ages); always the single nearest published point, so the
// method stays a simple, auditable substitution rather than a curve fit.
//
// Bounded to a maximum age distance: without a cap, "nearest" could pick
// an age dozens of years away (e.g. reusing an age-50 sample for a
// requested age of 999) — an indefensible extrapolation, not a bounded
// approximation. Beyond this distance the configuration is honestly
// not-yet-estimatable rather than silently stretched.
const MAX_DEFENSIBLE_AGE_DISTANCE_YEARS = 10;

function estimateViaNearestPublishedAge(
  planNumber: string,
  uin: string,
  domain: PremiumCalculationDomain,
  input: EstimatePremiumInput
): EstimatePremiumResult | null {
  if (!domain.supportedAges || domain.supportedAges.length === 0) return null;
  const nearestAge = nearestValue(domain.supportedAges, input.age);
  if (nearestAge == null || nearestAge === input.age) return null;
  if (Math.abs(nearestAge - input.age) > MAX_DEFENSIBLE_AGE_DISTANCE_YEARS) return null;
  const exact = tryExactCalculation(planNumber, uin, { ...input, age: nearestAge });
  if (!exact) return null;
  return {
    amountMonthly: annualToMonthly(exact.annualPremium),
    amountAnnual: exact.annualPremium,
    provenance: {
      status: "ESTIMATED",
      method: `nearest_published_sample_age (used age ${nearestAge} in place of requested age ${input.age}; same term/PPT/Basic Sum Assured)`,
      sourceReferences: [`lic-${planNumber}-sales-brochure-current`],
    },
  };
}

// Method 2 (Section 5): the requested Basic Sum Assured differs from the
// one published sample amount, but LIC's own tabular-premium convention
// (rate per Rs.1,000 of Basic Sum Assured) makes premium approximately
// LINEAR in Basic Sum Assured for a fixed age/term/PPT — a well-
// documented mechanic, not a guess. This ignores High-Sum-Assured
// rebates (which only ever reduce the true premium below this linear
// estimate), so the result is clearly labeled as an approximation that
// may overstate premium at high Basic Sum Assured.
function estimateViaLinearBsaScaling(
  planNumber: string,
  uin: string,
  domain: PremiumCalculationDomain,
  input: EstimatePremiumInput
): EstimatePremiumResult | null {
  const canonicalBsa = domain.supportedBasicSumAssuredValues?.[0];
  if (canonicalBsa == null || input.targetBasicSumAssured == null || input.targetBasicSumAssured === canonicalBsa) return null;
  const exactAtCanonical = tryExactCalculation(planNumber, uin, { ...input, targetBasicSumAssured: canonicalBsa });
  if (!exactAtCanonical) return null;
  const scaled = Math.round(exactAtCanonical.annualPremium * (input.targetBasicSumAssured / canonicalBsa));
  return {
    amountMonthly: annualToMonthly(scaled),
    amountAnnual: scaled,
    provenance: {
      status: "ESTIMATED",
      method: `linear_scaling_from_published_bsa_sample (scaled the published Rs.${canonicalBsa} premium linearly to the requested Rs.${input.targetBasicSumAssured}; ignores any High Sum Assured rebate, so this may overstate the true premium)`,
      sourceReferences: [`lic-${planNumber}-sales-brochure-current`],
    },
  };
}

export function estimatePremium(input: EstimatePremiumInput): EstimatePremiumResult {
  const [planNumber, uin] = input.planKey.split("::");
  const domain = getPremiumCalculationDomain(planNumber, uin);

  const exact = tryExactCalculation(planNumber, uin, input);
  if (exact) {
    return {
      amountMonthly: annualToMonthly(exact.annualPremium),
      amountAnnual: exact.annualPremium,
      provenance: { status: "VERIFIED", sourceReferences: [`lic-${planNumber}-sales-brochure-current`] },
    };
  }

  if (domain) {
    const byAge = estimateViaNearestPublishedAge(planNumber, uin, domain, input);
    if (byAge) return byAge;

    const byBsa = estimateViaLinearBsaScaling(planNumber, uin, domain, input);
    if (byBsa) return byBsa;
  }

  const notEstimatable: Provenance = {
    status: "ESTIMATED",
    method: domain
      ? "not_yet_estimatable: no published sample point is close enough to the requested configuration to defensibly reuse or scale"
      : "not_yet_estimatable: no registered engine or published sample data is available for this product",
    sourceReferences: [],
  };
  return { amountMonthly: null, amountAnnual: null, provenance: notEstimatable };
}
