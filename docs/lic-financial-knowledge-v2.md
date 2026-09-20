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

## Addendum — Phase 3B ("Close Critical LIC Data Gaps Before UI")

### 1. Source verification audit

Every fact added in Phase 3 and 3B falls into one of these buckets. No
fact is tagged `PRIMARY_OFFICIAL` (the `sourceQuality` field, new this
phase — see `types.ts`'s `SourceQuality`) anywhere in this repository:
`licindia.in` and, in Phase 3B, essentially every other external domain
tried via `WebFetch` were blocked by this sandbox's network egress
policy in every session. All facts came from `WebSearch`'s own
server-side summarization (which is not subject to this sandbox's
egress block) of official brochures and independent secondary sources.

| Plan | Plan # | UIN | Rule/value | Source type | Applicable version | Confidence |
|---|---|---|---|---|---|---|
| Jeevan Umang | 745 | 512N312V03 | 8% of BSA annual Survival Benefit, no waiting period after PPT | SECONDARY_CORROBORATED (3+ sources, one directly quoting the official brochure) | V03 (current) | estimationConfidence MEDIUM |
| Jeevan Umang | 745 | 512N312V03 | Entry age 0-55, PPT options 15/20/25/30 | SECONDARY_CORROBORATED | V03 | ESTIMATED (structural) |
| Jeevan Umang | 745 | 512N312V03 | Premium (any age/BSA/PPT) | 3 CONFLICTING secondary figures found (Rs.49,000 / ~Rs.25,000 / Rs.54,036 for the same age-30/PPT-20/BSA-10L config) | — | **NOT USED — no defensible value** |
| Jeevan Utsav | 771 | 512N363V02 | 10% of BSA Regular Income, starting 2 years after PPT ends | SECONDARY_CORROBORATED | V02 (current) | estimationConfidence MEDIUM |
| Jeevan Utsav | 771 | 512N363V02 | Rs.40/1,000 BSA Guaranteed Addition during PPT | SECONDARY_CORROBORATED | V02 | estimationConfidence MEDIUM |
| Jeevan Utsav | 771 | 512N363V02 | Flexi Income: 5.5% p.a. compounding accumulation | SECONDARY_CORROBORATED (2 independent sources this session — Phase 3 had only 1 and declined to use it; Phase 3B's 2nd corroboration crossed that bar) | V02 | estimationConfidence LOW |
| Jeevan Utsav | 771 | 512N363V02 | Product is non-participating (corrects Phase 3's `TRADITIONAL_PARTICIPATING` tag) | SECONDARY_CORROBORATED | V02 | ESTIMATED (structural) |
| New Endowment | 714 | 512N277V03 | SRB Rs.39 (12-15yr) / Rs.42 (16-20yr) / Rs.48 (21+yr) per 1,000 SA, SA>=5L, 2024-25 | SECONDARY_CORROBORATED (third-party bonus-rate aggregators, not LIC's own circular) | 2024-25 valuation | estimationConfidence LOW |
| New Jeevan Anand | 715 | 512N279V03 | SRB Rs.45/1,000 flat across terms, SA>=5L, 2024-25 | SECONDARY_CORROBORATED | 2024-25 valuation | estimationConfidence LOW |
| Jeevan Lakshya | 733 | 512N297V03 | SRB Rs.49/1,000, SA>=5L, maturity age<=55, 2024-25 | SECONDARY_CORROBORATED | 2024-25 valuation | estimationConfidence LOW |
| New Money Back 20yr | 720 | 512N280V03 | 20% BSA at years 5/10/15, 40% at maturity | SECONDARY_CORROBORATED | current | estimationConfidence MEDIUM |
| New Money Back 25yr | 721 | 512N278V03 | 15% BSA at years 5/10/15/20, 40% at maturity | SECONDARY_CORROBORATED | current | estimationConfidence MEDIUM |
| New Children's Money Back | 732 | 512N296V03 | 20% BSA at child ages 18/20/22, 40% at age 25 (descriptive only — see Configuration Coverage) | SECONDARY_CORROBORATED | current | ESTIMATED (structural) |
| Jeevan Tarun | 734 | 512N299V03 | 4 survival-benefit options (0/5/10/15% of BSA, ages 20-24) (descriptive only) | SECONDARY_CORROBORATED | current | ESTIMATED (structural) |
| SIIP | 752 | 512L334V02 | Official illustration [4%, 8%]; funds Bond/Secured/Balanced/Growth | SECONDARY_CORROBORATED, directly naming the product | current | estimationConfidence MEDIUM |
| Index Plus | 873 | 512L354V01 | Official illustration [4%, 8%] (inferred uniform); funds Flexi Growth (Nifty 100) / Flexi Smart Growth (Nifty 50) | SECONDARY_CORROBORATED (illustration rate INTERNAL_DERIVATION/inferred, not product-specific) | current | ESTIMATED |
| Protection Plus | 886 | 512L361V01 | Official illustration [4%, 8%] (inferred uniform); 6 funds (Bond/Secured/Balanced/Growth/Flexi Growth/Flexi Smart Growth) | SECONDARY_CORROBORATED (illustration rate inferred) | current | ESTIMATED |
| Nivesh Plus | 749 | 512L317V02 | Official illustration [4%, 8%] (inferred uniform) | SECONDARY_CORROBORATED (inferred) | see identity flag below | ESTIMATED |

### 2. Identity/version issues

**Nivesh Plus (749):**
- OLD PROJECT VALUE: Plan Number 749, UIN 512L317V02.
- CURRENT VERIFIED VALUE (multiple official `licindia.in` page TITLES found via search this session): "LIC's Nivesh Plus (Plan No. 849, UIN No. 512L317V01)", with UIN 512L317V02 for the current/latest revision.
- WHY THEY DIFFER: most likely a **plan-number transcription error** in this repository (not a version change) — a secondary training document titled "INTRODUCTION OF LIC's Nivesh Plus (Plan No. 749)" was also found, plausibly this repository's original (incorrect) source. The UIN itself is independently corroborated as this product either way.
- WHETHER CHANGED: **NOT changed.** The minimal correction would rename `planNumber` throughout `lib/insurance/providers/lic/catalogue.ts`, `engines.ts`, `planProfiles.ts`, and — critically — pre-existing UI-owning files (`components/planner/Plan749Configurator.tsx`, `tests/lic-plan749.test.ts`) that predate this phase and that Phase 3B is explicitly not authorized to touch ("no UI work"). Documented instead, as a real data string inside `PLAN_749`'s own `eligibility.notes` (queryable/testable — see `tests/phase3bDataFoundation.test.ts`'s "canary" test), not just a code comment.
- A secondary source also claims this UIN was withdrawn 2024-10-14 — not independently confirmed, not acted on (active status unchanged).

**Index Plus (873):** a secondary source states this plan was "launched 06.02.2024 and withdrawn 01.10.2024." Not independently confirmed, not acted on — flagged the same way, in `PLAN_873`'s own `eligibility.notes`.

**SIIP (752):** one secondary source stated "LIC SIIP Plan 852 has been repackaged under Plan 752" — this is CONSISTENT with (not a conflict against) this repository's existing identity, and is noted as a confirming cross-check in the profile's own comment.

### 3. Configuration coverage gaps traced (Section 16)

Using the new `debugPlanForCustomer` diagnostic, every product that
generates zero configurations now has a traced, honest reason instead of
a silent gap:

| Plan | Eliminated? | Configs generated | Reason |
|---|---|---|---|
| Jeevan Umang (745) | No | 0 | `calculationReadiness: NOT_YET_ESTIMATABLE` — no defensible premium source found (3-way conflict) |
| Jeevan Utsav (771) | No | 0 | Same — no defensible premium source found |
| New Money Back 20yr (720) | No | 0 | Same — `NOT_YET_ESTIMATABLE`, benefit schedule now quantified but premium is not |
| New Money Back 25yr (721) | No | 0 | Same |
| New Children's Money Back (732) | No | 0 | Same, plus a distinct architecture gap: this plan's benefit ages (18/20/22/25) are CHILD ages, and `PlanningRequest` only carries the proposer/parent's own age — even a premium fix would need a new child-age input to model correctly |
| New Endowment (714) / New Jeevan Anand (715) / Jeevan Lakshya (733) | No | Sometimes 0 | `SAMPLE_ONLY` engines only cover specific published (age, term) sample rows — a term/age outside those rows (e.g. this repository's 16-year regression case for 714) still yields zero configurations even with richer bonus data now available (a real, pre-existing Foundation V2 engine-coverage limitation, not a Phase 3B regression) |

Per Section 17's own instruction, **no code was added to force any of
these into the search** — they simply were not modeled with a usable
premium, and the search correctly and transparently excludes them.

### 4. Whole-life truncation fix (Section 5/6)

Phase 3 originally computed Jeevan Umang/Jeevan Utsav's income and
terminal-benefit events only up to the customer's SEARCH horizon
(`policyTermYears`, e.g. a 16 or 20-year goal), silently treating that as
the product's entire economic life. Phase 3B fixes this:
`benefitProjection.ts`'s `wholeLifeTerminalYear()` now computes
`Math.max(100 - age, policyTermYears)` and both products' income/terminal
events run to that true end. `StructureGoalAnalysis.goalYearValue` still
correctly reports only what's available AT the goal year;
`incomeReceivedBeforeGoal`/`incomeReceivedAfterGoal` (fields that already
existed in Phase 2's schema but had never been exercised, since no
income product had reached this code path before) now correctly separate
what's received by the goal year from what continues after it.

### 5. Utsav waiting-period correction (Section 6)

Phase 3 assumed Regular Income begins immediately at PPT end. Phase 3B's
research found this is wrong: income begins **2 years after** PPT ends.
Fixed in `projectJeevanUtsavRegularIncome`.

### 6. New Provenance dimensions (Section 24)

`estimationConfidence` (Phase 3) and `sourceQuality` (Phase 3B, new) are
now both present on every Phase 3/3B-added figure, and are kept
deliberately distinct: `sourceQuality` says how the fact was OBTAINED
(`PRIMARY_OFFICIAL` / `SECONDARY_CORROBORATED` / `SECONDARY_SINGLE_SOURCE`
/ `INTERNAL_DERIVATION`); `estimationConfidence` says how good the
resulting NUMBER is (`HIGH`/`MEDIUM`/`LOW`). Neither is exposed
prominently to any UI — both exist for the planning engine's own
reasoning.
