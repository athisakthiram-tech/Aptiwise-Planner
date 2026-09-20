import { GoalType } from "@/types";
import {
  InsuranceCategory,
  InsuranceProduct,
  OfficialProductSource,
  ProductStatus,
} from "@/types/insurance";

// Canonical LIC catalogue. Product identity/category metadata only —
// deliberately excludes premium, maturity value, bonus, IRR, sum assured,
// surrender value, loan value, tax benefit, and age/term eligibility
// limits — none of that has been verified against official LIC documents
// for the products added in this audit. Do not add such fields here
// without a verified source.
//
// Audit: 2026-09-16. See docs/lic-catalogue-audit.md for the full
// reconciliation against LIC's official category pages, the
// homepage-count discrepancy, and withdrawn/replaced version notes.
const PROVIDER = "LIC";
const AUDIT_DATE = "2026-09-16";
const ROOT_SOURCE_URL = "https://licindia.in/";
const WITHDRAWN_PAGE_URL = "https://licindia.in/en/web/guest/withdrawn-plans";

// Official current category pages (2026-09-16 audit).
const CATEGORY_SOURCE_URL: Record<InsuranceCategory, string> = {
  savings_endowment: "https://www.licindia.in/en/web/guest/endowment-plans",
  whole_life: "https://www.licindia.in/en/web/guest/whole-life-plans",
  money_back_child: "https://www.licindia.in/en/web/guest/money-back-plans",
  term_protection: "https://licindia.in/term-assurance-plans",
  pension: "https://licindia.in/en/web/guest/pension-plan",
  market_linked_ulip: "https://www.licindia.in/en/web/guest/unit-linked-plans",
  micro_insurance: "https://www.licindia.in/en/web/guest/micro-insurance-plans",
};

// Reflects the goal → category mapping used by the matching engine, kept
// here so each catalogue entry can declare which goals it is relevant to.
// whole_life/pension/micro_insurance are tagged for future matching-engine
// wiring but are not yet referenced by any GOAL_CATEGORY_ORDER entry in
// lib/insurance/matching.ts (out of scope for this identity/status audit).
const GOAL_TAGS_BY_CATEGORY: Record<InsuranceCategory, GoalType[]> = {
  term_protection: ["family_protection"],
  savings_endowment: ["wealth", "home", "marriage", "child_education"],
  whole_life: ["family_protection", "wealth"],
  market_linked_ulip: ["wealth"],
  money_back_child: ["child_education", "marriage"],
  pension: ["retirement"],
  micro_insurance: ["family_protection"],
};

interface LicProductOptions {
  marketLinked?: boolean;
  status?: ProductStatus;
  /** Appended to the id (e.g. "912-v01") when a plan number is reused across versions. */
  idSuffix?: string;
}

function licProduct(
  planNumber: string,
  productName: string,
  uin: string,
  category: InsuranceCategory,
  options: LicProductOptions = {}
): InsuranceProduct {
  const status = options.status ?? "ACTIVE";
  const isWithdrawn = status !== "ACTIVE";
  const id = `lic-${planNumber}${options.idSuffix ? `-${options.idSuffix}` : ""}`;

  const source: OfficialProductSource = isWithdrawn
    ? { sourceType: "withdrawn_page", url: WITHDRAWN_PAGE_URL, checkedAt: AUDIT_DATE }
    : { sourceType: "product_category_page", url: CATEGORY_SOURCE_URL[category], checkedAt: AUDIT_DATE };

  return {
    id,
    provider: PROVIDER,
    productName,
    planNumber,
    uin,
    category,
    goalTags: isWithdrawn ? [] : GOAL_TAGS_BY_CATEGORY[category],
    marketLinked: options.marketLinked ?? false,
    protectionAvailable: true,
    status,
    officialSourceUrl: source.url,
    sourceCheckedDate: AUDIT_DATE,
    officialSources: [source],
    // Category-page presence verifies identity and current active/
    // withdrawn status only — no financial field is verified merely by
    // appearing in the catalogue. Plan 733's real eligibility/benefit
    // engine (see providers/lic/plans/plan733.ts + engineRegistry.ts)
    // is a separate, already-verified capability layered on top of this
    // catalogue entry, not reflected in these flags (see that module for
    // why the generic per-goal match list intentionally doesn't surface
    // it as "verified" without per-customer inputs).
    verification: {
      identityVerified: true,
      activeStatusVerified: !isWithdrawn,
      eligibilityRulesVerified: false,
      premiumEngineAvailable: false,
      benefitEngineAvailable: false,
      familyProtectionVerified: false,
      taxTreatmentVerified: false,
      costStructureVerified: false,
      liquidityVerified: false,
    },
  };
}

export const LIC_CATALOGUE: InsuranceProduct[] = [
  // ---- Endowment (12 active) ----
  licProduct("717", "LIC's Single Premium Endowment Plan", "512N283V03", "savings_endowment"),
  licProduct("714", "LIC's New Endowment Plan", "512N277V03", "savings_endowment"),
  licProduct("715", "LIC's New Jeevan Anand", "512N279V03", "savings_endowment"),
  licProduct("733", "LIC's Jeevan Lakshya", "512N297V03", "savings_endowment"),
  licProduct("736", "LIC's Jeevan Labh", "512N304V03", "savings_endowment"),
  licProduct("774", "LIC's Amritbaal", "512N365V02", "savings_endowment"),
  licProduct("912", "LIC's Nav Jeevan Shree", "512N387V02", "savings_endowment"),
  licProduct("881", "LIC's Bima Lakshmi", "512N389V01", "savings_endowment"),
  licProduct("888", "LIC's New Jeevan Sathi - Single Premium", "512N393V01", "savings_endowment"),
  licProduct("889", "LIC's New Jeevan Sathi - Limited Premium", "512N394V01", "savings_endowment"),
  licProduct("890", "LIC's New Bima Jyoti", "512N395V01", "savings_endowment"),
  licProduct("770", "LIC's Bima Platinum", "512N397V01", "savings_endowment"),

  // ---- Whole Life (3 active) ----
  licProduct("745", "LIC's Jeevan Umang", "512N312V03", "whole_life"),
  licProduct("771", "LIC's Jeevan Utsav", "512N363V02", "whole_life"),
  licProduct("883", "LIC's Jeevan Utsav Single Premium", "512N392V01", "whole_life"),

  // ---- Money Back (5 active) ----
  licProduct("748", "LIC's Bima Shree", "512N316V03", "money_back_child"),
  licProduct("720", "LIC's New Money Back Plan - 20 Years", "512N280V03", "money_back_child"),
  licProduct("721", "LIC's New Money Back Plan - 25 Years", "512N278V03", "money_back_child"),
  licProduct("732", "LIC's New Children's Money Back Plan", "512N296V03", "money_back_child"),
  licProduct("734", "LIC's Jeevan Tarun", "512N299V03", "money_back_child"),

  // ---- Term Assurance (9 active) ----
  licProduct("876", "LIC's Digi Term", "512N356V02", "term_protection"),
  licProduct("878", "LIC's Digi Credit Life", "512N358V01", "term_protection"),
  licProduct("877", "LIC's Yuva Credit Life", "512N357V01", "term_protection"),
  licProduct("875", "LIC's Yuva Term", "512N355V02", "term_protection"),
  licProduct("954", "LIC's New Tech-Term", "512N351V02", "term_protection"),
  licProduct("955", "LIC's New Jeevan Amar", "512N350V02", "term_protection"),
  licProduct("859", "LIC's Saral Jeevan Bima", "512N341V01", "term_protection"),
  licProduct("887", "LIC's Bima Kavach", "512N360V01", "term_protection"),
  licProduct("894", "LIC's Jeevan Raksha", "512N368V01", "term_protection"),

  // ---- Pension (5 active) ----
  // New Pension Plus is unit-linked — category stays PENSION per LIC's
  // own site structure, but marketLinked reflects the true product type.
  licProduct("867", "LIC's New Pension Plus", "512L347V01", "pension", { marketLinked: true }),
  licProduct("857", "LIC's Jeevan Akshay-VII", "512N337V07", "pension"),
  licProduct("758", "LIC's New Jeevan Shanti", "512N338V08", "pension"),
  licProduct("862", "LIC's Saral Pension", "512N342V05", "pension"),
  licProduct("879", "LIC's Smart Pension", "512N386V01", "pension"),

  // ---- Unit Linked / ULIP (4 active) ----
  licProduct("873", "LIC's Index Plus", "512L354V01", "market_linked_ulip", { marketLinked: true }),
  // Phase 4: corrected from "749" to "849" — multiple independent
  // official licindia.in page titles confirm "LIC's Nivesh Plus (Plan
  // No. 849, UIN No. 512L317V01)"/UIN 512L317V02 for the current
  // revision; "749" was this repository's own transcription error (see
  // docs/lic-financial-knowledge-v2.md's now-resolved identity flag).
  // The engine file/exported symbols keep their historical "749" naming
  // (lib/insurance/providers/lic/plans/plan749.ts, PLAN_749_UIN, etc.)
  // — only the actual plan-number VALUE used for registration/lookup
  // changed, to avoid a much larger, purely-cosmetic rename.
  licProduct("849", "LIC's Nivesh Plus", "512L317V02", "market_linked_ulip", { marketLinked: true }),
  licProduct("752", "LIC's SIIP", "512L334V02", "market_linked_ulip", { marketLinked: true }),
  licProduct("886", "LIC's Protection Plus", "512L361V01", "market_linked_ulip", { marketLinked: true }),

  // ---- Micro Insurance (2 active) ----
  licProduct("751", "LIC's Micro Bachat", "512N329V03", "micro_insurance"),
  licProduct("880", "LIC's Jan Suraksha", "512N388V01", "micro_insurance"),

  // ---- Withdrawn/replaced versions (version-safety fixtures) ----
  // A small, targeted set corresponding to plan numbers we also carry as
  // ACTIVE under a different UIN — not an import of all historical LIC
  // products. These exist so the active matcher and identity lookup are
  // provably safe against "same plan number, older UIN" confusion.
  licProduct("912", "LIC's Nav Jeevan Shree", "512N387V01", "savings_endowment", {
    status: "WITHDRAWN",
    idSuffix: "v01",
  }),
  licProduct("857", "LIC's Jeevan Akshay-VII", "512N337V06", "pension", {
    status: "WITHDRAWN",
    idSuffix: "v06",
  }),
  licProduct("758", "LIC's New Jeevan Shanti", "512N338V07", "pension", {
    status: "WITHDRAWN",
    idSuffix: "v07",
  }),
];

// Exact identity lookup — both planNumber AND uin must match. LIC reuses
// plan numbers across versions, so plan number alone must never be
// treated as a unique key; a stale/incorrect UIN returns undefined
// rather than silently falling back to the same-named/same-numbered
// product.
export function getLicProductByIdentity(
  planNumber: string,
  uin: string
): InsuranceProduct | undefined {
  return LIC_CATALOGUE.find((p) => p.planNumber === planNumber && p.uin === uin);
}
