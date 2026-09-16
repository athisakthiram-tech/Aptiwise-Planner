// Pure, framework-independent LIC category/goal matching. This is NOT an
// advice engine: it never ranks a product as "best" and never derives
// premium, returns, or maturity figures. See providers/lic/catalogue.ts
// for what "ACTIVE" means and where the data comes from.

import { GoalInput, GoalType } from "@/types";
import { InsuranceCategory, InsuranceProduct } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";

export const MAX_PRIMARY_MATCHES = 3;

// Four independent verification levels — a product appearing here only
// ever guarantees categoryMatch. The others must stay false until the
// specific verified check they name has actually been performed.
export interface MatchQuality {
  categoryMatch: boolean;
  eligibilityVerified: boolean;
  budgetVerified: boolean;
  benefitsVerified: boolean;
}

export interface ProductMatch {
  product: InsuranceProduct;
  reasons: string[];
  quality: MatchQuality;
}

function buildMatchQuality(product: InsuranceProduct): MatchQuality {
  return {
    categoryMatch: true,
    eligibilityVerified: product.verification.eligibilityRulesVerified,
    // Category matching never checks affordability, regardless of the
    // monthlyBudget supplied — this can only become true once a verified
    // premium engine actually confirms it for this product.
    budgetVerified: false,
    benefitsVerified: product.verification.benefitEngineAvailable,
  };
}

export interface LicMatchResult {
  potentialMatches: ProductMatch[];
  warnings: LicWarningCode[];
  missingVerification: string[];
}

// Mirrors the goal → category guidance: category lists are ordered by
// relevance for that goal, not ranked as "the best" option.
const GOAL_CATEGORY_ORDER: Record<GoalType, InsuranceCategory[]> = {
  family_protection: ["term_protection"],
  child_education: ["money_back_child", "savings_endowment"],
  marriage: ["savings_endowment", "money_back_child"],
  home: ["savings_endowment"],
  wealth: ["savings_endowment", "market_linked_ulip"],
  retirement: [],
};

const CATEGORY_REASONS: Record<InsuranceCategory, string[]> = {
  term_protection: [
    "🛡️ Includes a protection component",
    "❤️ Aligns with a family protection goal",
  ],
  savings_endowment: [
    "🎯 Relevant to long-term goal planning",
    "🛡️ Includes a protection component",
  ],
  money_back_child: [
    "🎓 Structured around periodic payouts / child-oriented goals",
    "🛡️ Includes a protection component",
  ],
  market_linked_ulip: [
    "📈 Offers market-linked growth potential",
    "🛡️ Includes a protection component",
  ],
};

// Internal/dev-facing only — never rendered to the customer, so this
// stays in English rather than becoming translation-key codes.
export const MISSING_VERIFICATION_ITEMS = [
  "Premium has not been calculated",
  "Maturity/benefit amounts require an official LIC illustration",
  "Age and policy-term eligibility have not been verified",
  "Guaranteed and non-guaranteed benefits are not yet available",
];

// Customer-facing warnings are stable codes, not English text, so the UI
// layer can translate them (see lib/i18n/translations.ts, "lic.warning.*").
export type LicWarningCode = "retirement_expansion_required" | "no_active_matches";

export const RETIREMENT_CATALOGUE_WARNING: LicWarningCode = "retirement_expansion_required";
const NO_ACTIVE_MATCHES_WARNING: LicWarningCode = "no_active_matches";

export function matchLicProducts(
  input: GoalInput,
  catalogue: InsuranceProduct[] = LIC_CATALOGUE
): LicMatchResult {
  const warnings: LicWarningCode[] = [];
  const categoryOrder = GOAL_CATEGORY_ORDER[input.goalType];

  if (input.goalType === "retirement") {
    warnings.push(RETIREMENT_CATALOGUE_WARNING);
  }

  const candidates = catalogue
    .filter((p) => p.status === "ACTIVE")
    .filter((p) => categoryOrder.includes(p.category))
    .sort(
      (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
    );

  // Risk comfort only reorders exploration priority — this is never
  // investment advice.
  if (input.riskComfort === "low") {
    candidates.sort((a, b) => Number(a.marketLinked) - Number(b.marketLinked));
  } else if (input.riskComfort === "high") {
    candidates.sort((a, b) => Number(b.marketLinked) - Number(a.marketLinked));
  }

  const potentialMatches: ProductMatch[] = candidates.map((product) => ({
    product,
    reasons: CATEGORY_REASONS[product.category],
    quality: buildMatchQuality(product),
  }));

  if (potentialMatches.length === 0 && input.goalType !== "retirement") {
    warnings.push(NO_ACTIVE_MATCHES_WARNING);
  }

  return {
    potentialMatches,
    warnings,
    missingVerification: MISSING_VERIFICATION_ITEMS,
  };
}
