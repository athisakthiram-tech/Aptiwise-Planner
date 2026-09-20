// Premium & Product Calculation Foundation V2.
//
// This module answers a question the existing per-dimension
// ProductCapabilities (types/insurance.ts) deliberately does NOT answer:
// not "was THIS specific calculation verified" (that's ValueStatus —
// verified/partial/unavailable/...), but "what CLASS of calculation
// power does this engine have in general, independent of any one
// input". Two engines can both report `capabilities.premium: "partial"`
// while having very different real reach — one might cover 4 ages x 3
// terms, another exactly 1 age x 1 term. Conflating the two loses
// information a solver needs to search efficiently and safely.
//
// This is a PURE DATA/CLASSIFICATION layer over the audit already
// performed on every registered engine's own plan file (see each
// lib/insurance/providers/lic/plans/plan<N>.ts and its
// docs/lic-plan<N>-verification.md). It reimplements no formula and
// invents no new premium/BSA/rate data — every field here is read off
// what that plan file's own sampleIllustrativePremium/RULES already
// declare.
//
// Do NOT duplicate ProductCapabilities/ValueStatus: this module is
// additive and orthogonal, consumed by the Goal Orchestrator's budget
// solver (lib/planning/goalOrchestrator/budgetSolver.ts) and goal
// structure generator to avoid probing configurations that can never
// resolve, never to gate eligibility or replace any existing status.

export type EngineCalculationCapability =
  | "FULL_CALCULATION" // formula/complete rate table covers the declared domain
  | "PARTIAL_CALCULATION" // formula/table covers a defined, non-trivial subset
  | "SAMPLE_ONLY" // only exact brochure sample-illustration points resolve
  | "STRUCTURAL_ONLY"; // eligibility/mechanics known; premium/benefit calc not defensible

export type ConfigurationDimensionSupport =
  | "SUPPORTED" // an independent customer choice this engine can calculate for
  | "FIXED" // determined by another input (e.g. PPT = Term - 5); not a free choice
  | "NOT_APPLICABLE" // this dimension does not exist for this product
  | "UNSUPPORTED"; // exists in principle, but this engine has no data to calculate it

export interface PremiumCalculationDimensions {
  age: ConfigurationDimensionSupport;
  basicSumAssured: ConfigurationDimensionSupport;
  policyTerm: ConfigurationDimensionSupport;
  premiumPayingTerm: ConfigurationDimensionSupport;
  premiumMode: ConfigurationDimensionSupport;
}

export interface PremiumCalculationDomain {
  planNumber: string;
  uin: string;
  premiumCapability: EngineCalculationCapability;
  benefitCapability: EngineCalculationCapability;
  dimensions: PremiumCalculationDimensions;
  // Only meaningful for SAMPLE_ONLY/PARTIAL_CALCULATION premium engines —
  // the EXACT ages/policy terms/Basic Sum Assured values a published
  // sample table actually covers, so a solver can search only these
  // instead of probing values that can never match. Absent when the
  // dimension is FIXED/NOT_APPLICABLE/UNSUPPORTED, or when the engine's
  // premium capability doesn't depend on a bounded table (annuities/
  // ULIPs, where premium is a direct customer input).
  supportedAges?: readonly number[];
  supportedPolicyTerms?: readonly number[];
  supportedBasicSumAssuredValues?: readonly number[];
  // Set only when premiumPayingTerm is FIXED — lets a caller compute the
  // one legitimate PPT for a chosen policy term instead of guessing from
  // a generic candidate list. Returns null when no PPT is defined for
  // that term at all (e.g. an out-of-range term).
  derivePremiumPayingTermYears?: (policyTermYears: number) => number | null;
  // One-line, human-readable summary of what specifically limits this
  // engine — cited directly in the audit report, not decorative.
  limitation: string;
}

function key(planNumber: string, uin: string): string {
  return `${planNumber}::${uin}`;
}

const REGISTRY = new Map<string, PremiumCalculationDomain>();

function register(domain: PremiumCalculationDomain): void {
  REGISTRY.set(key(domain.planNumber, domain.uin), domain);
}

export function getPremiumCalculationDomain(planNumber: string, uin: string): PremiumCalculationDomain | undefined {
  return REGISTRY.get(key(planNumber, uin));
}

export function listPremiumCalculationDomains(): PremiumCalculationDomain[] {
  return Array.from(REGISTRY.values());
}

// A domain with every dimension left at its safest, most conservative
// default (fully UNSUPPORTED) — used only as a documentation base, never
// registered as-is.
const SAMPLE_ONLY_LIMITATION =
  "Only exact (age, term[, PPT], Basic Sum Assured) points published in the brochure's sample illustration table resolve a premium — no interpolation, extrapolation or rate-table generalisation.";

// ---- Section 1 audit: all 31 registered engines ----
// Grouped exactly as engines.ts registers them. Only the 14
// savings_endowment/money_back_child engines whose premium capability is
// "partial" (i.e. table/sample-driven, not a direct customer choice) get
// full supportedAges/Terms/BSA + PPT-derivation wiring — those are the
// only engines the Goal Orchestrator's budget solver ever probes across
// multiple Basic Sum Assured candidates. The other 17 (pure-term,
// annuities, ULIPs, New Pension Plus) are still classified for the audit
// but have no BSA-probing behaviour to constrain, since their premium is
// either sample-table-driven-but-BSA-fixed-by-role (pure term, excluded
// from goal-funding roles entirely) or a direct customer input.

// Jeevan Lakshya (733) — PPT = Term - 3 (FIXED), one canonical BSA.
register({
  planNumber: "733",
  uin: "512N297V03",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "FIXED",
    premiumMode: "FIXED",
  },
  supportedAges: [20, 30, 40, 50],
  supportedPolicyTerms: [13, 15, 20, 25],
  supportedBasicSumAssuredValues: [200000],
  derivePremiumPayingTermYears: (term) => (
    [13, 15, 20, 25].includes(term) ? term - 3 : null
  ),
  limitation: SAMPLE_ONLY_LIMITATION + " Covers exactly 4 ages x 4 terms x 1 Basic Sum Assured (Rs.2,00,000), yearly mode only.",
});

// Jeevan Labh (736) — PPT determined by an explicit term->PPT pairing table.
register({
  planNumber: "736",
  uin: "512N304V03",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "FIXED",
    premiumMode: "FIXED",
  },
  supportedAges: [20, 30, 40, 50],
  supportedPolicyTerms: [16, 21, 25],
  supportedBasicSumAssuredValues: [200000],
  derivePremiumPayingTermYears: (term) => ({ 16: 10, 21: 15, 25: 16 } as Record<number, number>)[term] ?? null,
  limitation: SAMPLE_ONLY_LIMITATION + " Covers exactly 4 ages x 3 terms x 1 Basic Sum Assured (Rs.2,00,000), yearly mode only.",
});

// Single Premium Endowment (717) — single premium; PPT not applicable.
register({
  planNumber: "717",
  uin: "512N283V03",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "NOT_APPLICABLE",
    premiumMode: "FIXED",
  },
  supportedAges: [10, 20, 30, 40, 50, 60],
  supportedPolicyTerms: [10, 15, 25],
  supportedBasicSumAssuredValues: [100000],
  limitation: SAMPLE_ONLY_LIMITATION + " Single-premium only (no Premium Paying Term); a monthly/yearly-mode budget search can never resolve this product's premium.",
});

// New Endowment Plan (714) — Regular Pay only, PPT must equal Term.
register({
  planNumber: "714",
  uin: "512N277V03",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "FIXED",
    premiumMode: "FIXED",
  },
  supportedAges: [20, 30, 40],
  supportedPolicyTerms: [15, 25, 35],
  supportedBasicSumAssuredValues: [200000],
  derivePremiumPayingTermYears: (term) => ([15, 25, 35].includes(term) ? term : null),
  limitation: SAMPLE_ONLY_LIMITATION + " Regular Pay only (PPT always equals Policy Term). Covers exactly 3 ages x 3 terms x 1 Basic Sum Assured (Rs.2,00,000).",
});

// New Jeevan Anand (715) — Regular Pay only, PPT must equal Term.
register({
  planNumber: "715",
  uin: "512N279V03",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "FIXED",
    premiumMode: "FIXED",
  },
  supportedAges: [20, 30, 40, 50],
  supportedPolicyTerms: [15, 25, 35],
  supportedBasicSumAssuredValues: [200000],
  derivePremiumPayingTermYears: (term) => ([15, 25, 35].includes(term) ? term : null),
  limitation: SAMPLE_ONLY_LIMITATION + " Regular Pay only (PPT always equals Policy Term). Covers exactly 4 ages x 3 terms x 1 Basic Sum Assured (Rs.2,00,000).",
});

// Amritbaal (774) — a SINGLE exact sample point.
register({
  planNumber: "774",
  uin: "512N365V02",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "UNSUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "UNSUPPORTED",
    premiumPayingTerm: "UNSUPPORTED",
    premiumMode: "FIXED",
  },
  supportedAges: [5],
  supportedPolicyTerms: [20],
  supportedBasicSumAssuredValues: [500000],
  limitation: "Only ONE exact (age=5, term=20, BSA=Rs.5,00,000) sample point is published — every other age/term this product otherwise allows is honestly unavailable, never generalised from this single point.",
});

// Nav Jeevan Shree (912) — age fixed at 35; PPT/Term pairs explicit and
// already correctly matched (both read in the row lookup).
register({
  planNumber: "912",
  uin: "512N387V02",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "UNSUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "SUPPORTED",
    premiumMode: "FIXED",
  },
  supportedAges: [35],
  supportedPolicyTerms: [10, 15, 20],
  supportedBasicSumAssuredValues: [500000],
  limitation: "Sample table published at a single reference age (35) only — every other age is honestly unavailable. PPT/Term pairs are limited to 9 published combinations.",
});

// Jeevan Tarun (734) — Policy Term/PPT fully derived from age; the
// engine never even reads a requested term/PPT.
register({
  planNumber: "734",
  uin: "512N299V03",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "FIXED",
    premiumPayingTerm: "FIXED",
    premiumMode: "FIXED",
  },
  supportedAges: [0, 4, 8, 12],
  supportedBasicSumAssuredValues: [200000],
  limitation: "Policy Term (25 - age) and Premium Paying Term (20 - age) are fully derived from age, never independently chosen. Only 4 published entry ages resolve a premium.",
});

// Bima Lakshmi (881) — age fixed at 35; PPT explicit and already
// correctly matched.
register({
  planNumber: "881",
  uin: "512N389V01",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "UNSUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "NOT_APPLICABLE",
    premiumPayingTerm: "SUPPORTED",
    premiumMode: "FIXED",
  },
  supportedAges: [35],
  supportedBasicSumAssuredValues: [200000],
  limitation: "Sample table published at a single reference age (35) only. Premium Paying Term is independently choosable (7-15 years) and already correctly matched by this engine.",
});

// Bima Shree (748) — PPT = Term - 4 (FIXED), discrete term set.
register({
  planNumber: "748",
  uin: "512N316V03",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "FIXED",
    premiumMode: "FIXED",
  },
  supportedAges: [20, 30, 40, 50],
  supportedPolicyTerms: [14, 16, 18, 20, 24, 28],
  supportedBasicSumAssuredValues: [1000000],
  derivePremiumPayingTermYears: (term) => ([14, 16, 18, 20, 24, 28].includes(term) ? term - 4 : null),
  limitation: SAMPLE_ONLY_LIMITATION + " Some age/term cells are blank in the brochure and are absent from the sample table, never guessed.",
});

// Bima Platinum (770) — term fixed at 30; PPT explicit and already
// correctly matched.
register({
  planNumber: "770",
  uin: "512N397V01",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "UNSUPPORTED",
    premiumPayingTerm: "SUPPORTED",
    premiumMode: "FIXED",
  },
  supportedAges: [15, 25, 35, 45],
  supportedPolicyTerms: [30],
  supportedBasicSumAssuredValues: [300000],
  limitation: "Sample table published at a single Policy Term (30 years) only. Premium Paying Term is independently choosable (7/10/12/15/18 years) and already correctly matched by this engine.",
});

// New Jeevan Sathi - Limited Premium (889) — PPT/Term pairs explicit and
// already correctly matched (both read in the row lookup, PPT required).
register({
  planNumber: "889",
  uin: "512N394V01",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "SUPPORTED",
    premiumMode: "FIXED",
  },
  supportedAges: [20, 25, 35, 45],
  supportedPolicyTerms: [15, 20, 25],
  supportedBasicSumAssuredValues: [300000],
  limitation: SAMPLE_ONLY_LIMITATION + " PPT/Term are limited to 3 published pairs (5/15, 10/20, 15/25 years); a PPT not supplied at all never silently defaults.",
});

// New Bima Jyoti (890) — PPT = Term - 5 (FIXED).
register({
  planNumber: "890",
  uin: "512N395V01",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "FIXED",
    premiumMode: "FIXED",
  },
  supportedAges: [20, 30, 40, 50],
  supportedPolicyTerms: [15, 18, 20],
  supportedBasicSumAssuredValues: [1000000],
  derivePremiumPayingTermYears: (term) => ([15, 18, 20].includes(term) ? term - 5 : null),
  limitation: SAMPLE_ONLY_LIMITATION + " Covers exactly 4 ages x 3 terms x 1 Basic Sum Assured (Rs.10,00,000).",
});

// New Jeevan Sathi - Single Premium (888) — single premium; PPT not applicable.
register({
  planNumber: "888",
  uin: "512N393V01",
  premiumCapability: "SAMPLE_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "FIXED",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "NOT_APPLICABLE",
    premiumMode: "FIXED",
  },
  supportedAges: [20, 25, 35, 50],
  supportedPolicyTerms: [10, 15, 20, 25],
  supportedBasicSumAssuredValues: [300000],
  limitation: SAMPLE_ONLY_LIMITATION + " Single-premium only (no Premium Paying Term); a monthly/yearly-mode budget search can never resolve this product's premium.",
});

// ---- Pure-risk term plans (876/875/954/877/878/887/894/859/955) ----
// pureTermShared.ts already correctly reads Limited-Pay PPT per term
// (row.limitedByPpt[ppt]) — no PPT bug exists here. Classified for
// completeness; PROTECTION_ONLY role means the Goal Orchestrator never
// routes a goal-funding search through these.
const PURE_TERM_PLANS: { planNumber: string; uin: string; ages: number[]; term: number; name: string }[] = [
  { planNumber: "876", uin: "512N356V02", ages: [20, 30, 40], term: 20, name: "Digi Term" },
  { planNumber: "875", uin: "512N355V02", ages: [20, 30, 40], term: 20, name: "Yuva Term" },
  { planNumber: "954", uin: "512N351V02", ages: [20, 30, 40], term: 20, name: "New Tech-Term" },
  { planNumber: "877", uin: "512N357V01", ages: [20, 30, 40], term: 25, name: "Yuva Credit Life" },
  { planNumber: "878", uin: "512N358V01", ages: [20, 30, 40], term: 25, name: "Digi Credit Life" },
  { planNumber: "887", uin: "512N360V01", ages: [20, 30, 40], term: 20, name: "Bima Kavach" },
  { planNumber: "894", uin: "512N368V01", ages: [20, 30, 40], term: 20, name: "Jeevan Raksha" },
  { planNumber: "859", uin: "512N341V01", ages: [25, 30, 35, 40, 45], term: 20, name: "Saral Jeevan Bima (20/25yr terms)" },
  { planNumber: "955", uin: "512N350V02", ages: [20, 30, 40], term: 20, name: "New Jeevan Amar" },
];
for (const plan of PURE_TERM_PLANS) {
  register({
    planNumber: plan.planNumber,
    uin: plan.uin,
    premiumCapability: "SAMPLE_ONLY",
    benefitCapability: "PARTIAL_CALCULATION",
    dimensions: {
      age: "SUPPORTED",
      basicSumAssured: "FIXED",
      policyTerm: "SUPPORTED",
      premiumPayingTerm: "SUPPORTED",
      premiumMode: "SUPPORTED",
    },
    supportedAges: plan.ages,
    supportedPolicyTerms: [plan.term],
    limitation: `${plan.name}: ${SAMPLE_ONLY_LIMITATION} Limited-Pay PPT is correctly read per-term from the brochure's own published columns (pureTermShared.ts) — not a defect requiring this pass's fix.`,
  });
}

// ---- New Pension Plus (867) — premium is a direct customer input ----
register({
  planNumber: "867",
  uin: "512L347V01",
  premiumCapability: "STRUCTURAL_ONLY",
  benefitCapability: "PARTIAL_CALCULATION",
  dimensions: {
    age: "SUPPORTED",
    basicSumAssured: "NOT_APPLICABLE",
    policyTerm: "SUPPORTED",
    premiumPayingTerm: "NOT_APPLICABLE",
    premiumMode: "SUPPORTED",
  },
  limitation: "No premium rate table exists — the customer chooses the premium directly. Guaranteed Additions/Assured Death Benefit floor are fully formula-computable from a chosen premium (FULL_CALCULATION for that direction); the Unit Fund Value is NAV-dependent and never projected.",
});

// ---- Annuity products (857/862/879/758) — Purchase Price is a direct
// customer input, not a calculated output. ----
const ANNUITY_PLANS: { planNumber: string; uin: string; name: string }[] = [
  { planNumber: "857", uin: "512N337V07", name: "Jeevan Akshay-VII" },
  { planNumber: "862", uin: "512N342V05", name: "Saral Pension" },
  { planNumber: "879", uin: "512N386V01", name: "Smart Pension" },
  { planNumber: "758", uin: "512N338V08", name: "New Jeevan Shanti" },
];
for (const plan of ANNUITY_PLANS) {
  register({
    planNumber: plan.planNumber,
    uin: plan.uin,
    premiumCapability: "STRUCTURAL_ONLY",
    benefitCapability: "PARTIAL_CALCULATION",
    dimensions: {
      age: "SUPPORTED",
      basicSumAssured: "NOT_APPLICABLE",
      policyTerm: "NOT_APPLICABLE",
      premiumPayingTerm: "NOT_APPLICABLE",
      premiumMode: "SUPPORTED",
    },
    limitation: `${plan.name}: no premium is calculated — the customer chooses the Purchase Price directly, and annuity payout per the published rate for the chosen option is computed from it.`,
  });
}

// ---- Market-linked ULIPs (873/749/886) — Annualized/Single Premium is
// a direct customer input; Basic Sum Assured is a formula-computed
// multiple of it (FULL_CALCULATION for that specific direction). ----
const ULIP_PLANS: { planNumber: string; uin: string; name: string }[] = [
  { planNumber: "873", uin: "512L354V01", name: "Index Plus" },
  { planNumber: "749", uin: "512L317V02", name: "Nivesh Plus" },
  { planNumber: "886", uin: "512L361V01", name: "Protection Plus" },
];
for (const plan of ULIP_PLANS) {
  register({
    planNumber: plan.planNumber,
    uin: plan.uin,
    premiumCapability: "STRUCTURAL_ONLY",
    benefitCapability: "PARTIAL_CALCULATION",
    dimensions: {
      age: "SUPPORTED",
      basicSumAssured: "FIXED",
      policyTerm: "SUPPORTED",
      premiumPayingTerm: "SUPPORTED",
      premiumMode: "SUPPORTED",
    },
    limitation: `${plan.name}: premium is a direct customer choice, not solved for. Basic Sum Assured is always a formula-computed multiple of that premium (FULL_CALCULATION for that direction). NAV-dependent fund value is never projected as a return.`,
  });
}
