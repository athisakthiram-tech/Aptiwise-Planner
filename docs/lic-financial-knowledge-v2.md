# LIC Financial Knowledge Model — v2 (Phase 3 Audit)

This audit covers the products enriched in Phase 3 ("Financial Knowledge
Enrichment"). Products not listed here are unchanged from the Phase 1
audit (`docs/lic-plan-intelligence-audit.md`) — their models did not
regress, but they also did not receive new quantified data this phase.

## Research method (read this before the table)

Research happened during development, not at runtime — the application
never browses LIC's website. This session used `WebSearch`/`WebFetch` to
research current LIC product mechanics; **direct fetches of
`licindia.in` were blocked by this sandbox's network egress policy**, so
every fact below that traces to an official LIC brochure was obtained
through the search tool's own summarization of that brochure plus
independent secondary sources quoting matching figures, never a
directly-opened primary PDF in this session. This is disclosed inline in
every affected profile's own source citations (see
`lib/planning/planIntelligence/planProfiles.ts`) and is why several
figures below are conservatively tagged `ESTIMATED` overall confidence
rather than `VERIFIED`, even where the underlying number is a stable
contractual plan feature (e.g. Jeevan Umang's 8% Survival Benefit) that
the model treats as a **guaranteed benefit character** independent of
that sourcing caveat.

## Per-product audit

| Product | UIN | Premium capability | Benefit capability | Guaranteed model | Participating model | Income model | Historical data | Official illustration | Est. return capability | Guaranteed XIRR | Estimated XIRR | Confidence | Remaining gaps |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| New Endowment (714) | 512N277V03 | SAMPLE_ONLY (registered engine, 3 ages × 3 terms) | Maturity = BSA only | BSA at maturity | No verified historical bonus record — stays 0, not fabricated | N/A | None | N/A (not a ULIP) | Guaranteed-only | Yes, via `calculateXirr` (now robust — see below) | No (no participating data) | VERIFIED (structure) / no participating estimate | Bonus rate for this specific plan/band not sourced this session |
| New Jeevan Anand (715) | 512N279V03 | SAMPLE_ONLY | Maturity = BSA + enhanced death benefit multiple | BSA at maturity | Same as 714 — no record, no fabrication | N/A | None | N/A | Guaranteed-only | Yes | No | VERIFIED (structure) | Same as 714 |
| Jeevan Lakshya (733) | 512N297V03 | SAMPLE_ONLY | Maturity = BSA; death-triggered 10% income to nominee (not modeled in goal cash flow — a death scenario, out of scope for a "customer survives to goal" projection) | BSA at maturity | No record, no fabrication | N/A (income is death-triggered only) | None | N/A | Guaranteed-only | Yes | No | VERIFIED (structure) | Bonus rate not sourced; "110% of BSA" figure seen in one secondary source for the *death* benefit was NOT applied to maturity without independent confirmation (flagged, not guessed) |
| **Jeevan Labh (736)** | 512N304V03 | SAMPLE_ONLY | Maturity = BSA **+ historical-based Simple Reversionary Bonus estimate where the configured Sum Assured ≥ Rs.5,00,000 and term ∈ {16,21,25}** | BSA at maturity (DERIVED) | **NEW: quantified two-layer model** — see `historicalBonusData.ts` (Rs.35/37/39 per Rs.1,000 SA for 16/21/25-year terms, 2024-25 valuation) | N/A | 3 records (SRB only, one plan) | N/A | Guaranteed-only AND historical-based planning estimate, separately reported | Yes, now numerically robust | **Yes, when SA/term match a record** | ESTIMATED overall; bonus records tagged HISTORICAL, `estimationConfidence: LOW` (third-party sourced, not LIC's own circular) | Rate does NOT apply below Rs.5L SA — this repository's own registered engine is capped at a Rs.2,00,000 sample point, so the regression case's actual BSA never benefits from this enrichment (see Regression A) |
| **Jeevan Umang (745)** | 512N312V03 | Still NOT_YET_ESTIMATABLE (no registered engine; two independently-found secondary premium samples for the same config **disagreed** — Rs.49,000 vs Rs.54,036/year — reported as a conflict, neither used) | **NEW: full recurring-income cash-flow model** — 8% of BSA/year from PPT-end to age 100 (GUARANTEED), plus a whole-life terminal benefit = BSA (GUARANTEED) | Both components GUARANTEED, `estimationConfidence: MEDIUM/HIGH` | SRB exists per plan design but no verified rate — stays unestimated | **NEW**: recurring `SURVIVAL_BENEFIT` events, one per year of the income window | None | N/A | Structural/benefit only — no premium means no full return capability yet | Conceptually yes (via `analyzeReturn`) once a premium exists | N/A | ESTIMATED overall (premium gap remains) | **Still cannot enter Phase 2's combination search** — no configuration is ever generated without a defensible premium. The richer benefit model is real and tested (`tests/financialKnowledgeV2.test.ts`) but not yet reachable through the live regression until a premium source is found |
| **Jeevan Utsav (771)** | 512N363V02 | Still NOT_YET_ESTIMATABLE (same reason — no registered engine, no verified premium sample found) | **NEW: quantified Regular Income model** — Rs.40/Rs.1,000 BSA/year Guaranteed Addition during PPT + 10% of BSA/year income from PPT-end to age 100, both GUARANTEED | Both components GUARANTEED | **Corrected**: this plan is **non-participating** (confirmed via official brochure language this session — the earlier Phase 1 profile incorrectly tagged it `TRADITIONAL_PARTICIPATING`; fixed to `TRADITIONAL_NON_PARTICIPATING`) — participating layer is always exactly 0, never estimated | **NEW**: recurring `INCOME_PAYMENT` events | None | N/A | Structural/benefit only | N/A | N/A | ESTIMATED overall (premium gap remains) | Same combination-search gap as Jeevan Umang. Flexi Income variant's accrual rate NOT quantified — only one, uncorroborated secondary source reported a figure |
| Index Plus (873) | 512L354V01 | ESTIMABLE (direct customer premium choice — `CUSTOMER_CHOSEN`, unchanged from the Phase 2 data-bug fix) | Market-linked fund value + BSA-multiple formula | N/A | N/A | N/A | Empty (no verified NAV history in this repository) | **NEW: [4%, 8%] product-shelf-uniform rate** (not independently confirmed by product name — inferred from the regulatorily-uniform standard, flagged) | Illustrative, charge-aware | N/A | Illustrative | VERIFIED (structure), illustration rate ESTIMATED-tier confidence | Fund-level historical NAV data not sourced this session |
| Nivesh Plus (749) | 512L317V02 | ESTIMABLE (single premium — correctly excluded from Phase 2's monthly-only search) | Market-linked fund value + BSA-multiple formula | N/A | N/A | N/A | Empty | **NEW: [4%, 8%]**, same uniform-standard caveat | Illustrative, charge-aware | N/A | Illustrative | VERIFIED (structure) | **Version flag**: secondary sources also referenced a "Nivesh Plus Plan No. 849" — possibly a newer relaunch not yet reconciled with this repository's Plan 749/UIN 512L317V02 identity. Reported, not silently changed. |
| **SIIP (752)** | 512L334V02 | ESTIMABLE (`CUSTOMER_CHOSEN`) | Market-linked fund value | N/A | N/A | N/A | Empty | **NEW: [4%, 8%], directly confirmed by product name and UIN this session** (multiple independent sources) | Illustrative, charge-aware (also newly given its own FMC entry — was previously an empty `charges: []` array) | N/A | Illustrative | VERIFIED (structure), illustration rate the most confidently-sourced of the four ULIPs | Fund-level historical NAV data not sourced this session |
| Protection Plus (886) | 512L361V01 | ESTIMABLE (`CUSTOMER_CHOSEN`, unchanged from the Phase 2 data-bug fix) | Market-linked fund value + continuous BSA-multiple formula | N/A | N/A | N/A | Empty | **NEW: [4%, 8%]**, uniform-standard caveat | Illustrative, charge-aware | N/A | Illustrative | VERIFIED (structure) | Fund-level historical NAV data not sourced this session |

## Traditional model improvements (cross-cutting)

Every traditional product's benefit projection now runs through
`lib/planning/planIntelligence/benefitProjection.ts` rather than the old
"premium → Basic Sum Assured, full stop" shortcut. Concretely:

- **Guaranteed layer** (`totalGuaranteed`) and **participating layer**
  (`totalParticipatingEstimate`) are always separate `ProvenancedValue`s,
  never merged into one number until `totalPlanningEstimate` — which
  itself is never presented as guaranteed.
- A historical-based participating estimate (`historicalBonusData.ts`)
  is applied **only** when the configured Sum Assured/term genuinely
  falls inside a verified record's band — never scaled or extrapolated
  outside it.
- Where no historical record exists, the participating layer is exactly
  `0` with `ESTIMATED`/`HISTORICAL` provenance explaining why — never
  silently dropped to looking identical to "no bonus benefit exists at
  all" and never guessed.

## Bug found and fixed: `calculateXirr` numerical-solver artifact

While validating the enriched benefit model against the Phase 3
regression scenarios (Age 40 retirement and Age 30 wealth cases),
`calculateXirr` (`lib/planning/planIntelligence/returnAnalysis.ts`)
produced results like `5,472,501,773.92%` and `9,429,795,988,310,712%`
for a real, common cash-flow shape: many years of level premium outflows
followed by one distant guaranteed-maturity inflow (Jeevan Lakshya,
Bima Shree at a 20-year horizon). Root cause: Newton-Raphson's
derivative collapsed toward zero far from the true root, and the
function returned whatever value the iteration had wandered to, with no
check that it actually zeroed the cash flows' NPV. Fixed by (1)
verifying every candidate root's NPV is genuinely near zero before
returning it, and (2) adding a bounded bisection fallback over a wide
rate grid for the (now more common than assumed) cases where Newton
alone doesn't converge to a genuine root. After the fix, the same cases
now report `-0.5%`, `-1.4%`, `-0.06%` etc. — small, economically
sensible guaranteed-only returns, or `null` when no real root is found
in range, never a fabricated number. All 1,513 previously-passing tests
still pass unchanged.

## Data still missing (Phase 3)

- Jeevan Umang/Jeevan Utsav premium tables — this session found either
  no data or **conflicting** secondary-sourced figures; neither
  fabricated. Both plans' rich benefit model exists and is tested but
  is not reachable through Phase 2's live combination search until a
  defensible premium source is found.
- Historical bonus records exist for exactly one plan (Jeevan Labh,
  736) and one Sum Assured band (≥ Rs.5,00,000). New Endowment (714),
  New Jeevan Anand (715), and Jeevan Lakshya (733) — all Tier 1 —
  still have no historical bonus data; this session found no
  independently-verifiable source for them.
- ULIP fund-level historical NAV/CAGR data (1Y/3Y/5Y/10Y) was not
  sourced this session for any of the 4 active ULIPs — see
  `docs/lic-ulip-performance-audit.md`'s own gap note.
- Jeevan Utsav's Flexi Income accrual rate is not quantified (one
  uncorroborated secondary source only).
- Money-back product survival-benefit schedules (Tier 2, e.g. New Money
  Back 20/25-year plans) were not enriched this phase — out of the
  Tier 1 priority scope given the time available.
- The Nivesh Plus (749) vs. a possible newer "Plan 849" identity was
  flagged as an unconfirmed version discrepancy, not resolved.
