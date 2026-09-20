# LIC ULIP Performance Audit (Phase 3)

Covers all 4 of this catalogue's active ULIPs. See
`docs/lic-financial-knowledge-v2.md` for the full cross-product audit;
this doc focuses specifically on fund/historical/illustration/charge
data, per the Phase 3 task's own required format.

Research method: `licindia.in` direct fetches were blocked by this
sandbox's network egress policy. Every figure below was obtained via the
`WebSearch` tool's own summarization of official LIC brochures plus
independent secondary sources quoting matching figures — never a
directly-opened primary PDF in this session.

| Product (Plan/UIN) | Fund(s) | Available history | 1Y | 3Y | 5Y | 10Y | Official illustration rates | Charges modeled | Projection capability | Source / as-of |
|---|---|---|---|---|---|---|---|---|---|---|
| Index Plus (873 / 512L354V01) | "Available Fund(s)" — exact fund names/asset-allocation bands not itemized in this repository | None | — | — | — | — | **[4%, 8%]** (NEW this phase; not independently confirmed by product name — inferred from the industry/regulatorily-uniform IRDAI standard applied to LIC's current ULIP shelf) | Fund Management Charge 1.35% p.a. (VERIFIED); Mortality Charge, per-mille band by age (VERIFIED) | Charge-aware SIP projection: net rate = lower official rate − FMC = 4% − 1.35% = 2.65% p.a. | This session, secondary sources; see `lib/planning/planIntelligence/planProfiles.ts` PLAN_873 |
| Nivesh Plus (749 / 512L317V02) | "Available Fund(s)" — not itemized | None | — | — | — | — | **[4%, 8%]**, same uniform-standard caveat | FMC 1.35% p.a. (VERIFIED); Mortality Charge per-mille band (VERIFIED) | Net rate = 4% − 1.35% = 2.65% p.a. | This session; **version flag**: a "Plan No. 849" reference for "Nivesh Plus" was also found and NOT reconciled — see gap note below |
| **SIIP (752 / 512L334V02)** | "Available Fund(s)" — not itemized | None | — | — | — | — | **[4%, 8%] — directly confirmed by product name and UIN this session**, multiple independent sources | FMC 1.35% p.a. (NEW this phase — the profile previously had an empty `charges: []` array; now populated, `ESTIMATED`-tier confidence since assumed uniform with the other 3 ULIPs rather than independently re-confirmed for SIIP specifically in a directly-fetched document) | Net rate = 4% − 1.35% = 2.65% p.a. | This session; most confidently-sourced illustration rate of the 4 |
| Protection Plus (886 / 512L361V01) | "Available Fund(s)" — not itemized | None | — | — | — | — | **[4%, 8%]**, uniform-standard caveat | FMC 1.35% p.a. (VERIFIED); Mortality Charge per-mille band (VERIFIED) | Net rate = 4% − 1.35% = 2.65% p.a. | This session |

## What changed from Phase 2

Before Phase 3, every ULIP's illustrative maturity/goal-year value was
computed from a **generic, product-agnostic** rate — the midpoint of a
global `[6, 8, 10, 12]` list used everywhere in this codebase (also used
by the advisor 4-screen MVP's SIP illustration) — with **zero** charge
deduction, i.e. "as though every rupee enters a zero-charge mutual-fund
SIP." Phase 3 replaces this, wherever a product-specific rate now
exists, with:

1. The product's **own** official illustration rates (`[4, 8]`, stored
   in `planProfiles.ts`'s `ulip.officialIllustration`), never the
   generic list.
2. The **lower** of the two rates, chosen as the conservative planning
   scenario (never the higher, more optimistic one).
3. That rate **net of the product's own published Fund Management
   Charge** (1.35% p.a.), approximating LIC's own net-of-charge
   illustrated value without needing the full per-duration illustration
   table — this matches independent secondary commentary found this
   session ("once policy charges are considered, the illustrative net
   returns are closer to around 2% and 6%" for the 4%/8% gross rates,
   which lines up closely with this model's own 2.65%/6.65% net-of-FMC
   approximation).

Mortality charge is **not** deducted (a documented simplification — real
net values would be marginally lower still). A component with no
verified product-specific rate (any future/unenriched ULIP) still falls
back to the old generic-rate behavior rather than crashing or going
blank — see `structureSimulator.ts`'s own fallback branch, covered by
`tests/financialKnowledgeV2.test.ts`.

## Historical performance rule (explicitly enforced)

Every `historicalPerformance` array in this catalogue's 4 ULIP profiles
remains empty — this session found no independently-verifiable,
LIC-sourced fund-level NAV history for any of them (a fund-by-fund NAV
series requires either LIC's own NAV disclosure pages, which could not
be fetched, or a third-party financial-data provider this task's
"official source first" instruction does not sanction as a primary
source). **No CAGR figures were fabricated to fill this gap.** Per this
phase's own instruction, historical performance (when it exists) is
information for the planning model, never automatically the projection
rate — this repository's architecture already keeps `historicalPerformance`
(status `HISTORICAL`) structurally separate from `officialIllustration`
(status `ILLUSTRATIVE`) and from a future `PLANNING_SCENARIO` tag,
verified by `tests/financialKnowledgeV2.test.ts`'s "ULIP data model"
suite.

## Data still missing

- Fund-level historical NAV/CAGR data (1Y/3Y/5Y/10Y/since-inception) for
  all 4 ULIPs — genuinely not sourced this session, not fabricated.
- Fund identity/objective/asset-allocation detail beyond the generic
  "Available Fund(s)" placeholder already present since Phase 1.
- SIIP's Fund Management Charge is *assumed* uniform with the other 3
  ULIPs (all independently verified at 1.35%) rather than
  independently re-confirmed in a directly-fetched SIIP-specific
  document this session — flagged at `ESTIMATED` confidence, not
  `VERIFIED`.
- Premium allocation charge / policy administration charge: this
  catalogue's existing data (Phase 1) never lists either for any of the
  4 ULIPs, consistent with these being LIC's well-known "zero allocation
  charge" ULIP generation — treated as investable amount = 100% of
  premium; not independently re-confirmed as a zero rate in a
  directly-fetched document this session.
- Mortality charge is not deducted from the fund-value projection (see
  above) — a documented, not hidden, simplification.
- The Nivesh Plus (749) vs. "Plan 849" identity discrepancy (see
  `docs/lic-financial-knowledge-v2.md`) was not resolved.

## Addendum — Phase 3B

### Real fund identities (Section 10)

Found via `WebSearch` this session (secondary sources; every direct
`WebFetch` attempt, including to non-`licindia.in` domains such as
`bharatsaver.com`, `licplancalculator.com` and `asymmetrica.in`, was
blocked by this sandbox's network egress policy — only `WebSearch`'s own
server-side summarization succeeded):

| Product | Funds found | Asset class assigned | Confidence |
|---|---|---|---|
| SIIP (752) | Bond Fund, Secured Fund, Balanced Fund, Growth Fund | DEBT, DEBT, BALANCED, EQUITY | SECONDARY_CORROBORATED |
| Index Plus (873) | Flexi Growth Fund (Nifty 100), Flexi Smart Growth Fund (Nifty 50) | INDEX, INDEX | SECONDARY_CORROBORATED |
| Protection Plus (886) | Bond, Secured, Balanced, Growth, Flexi Growth, Flexi Smart Growth (6 funds — the broadest shelf of the 4) | DEBT/DEBT/BALANCED/EQUITY/INDEX/INDEX | SECONDARY_CORROBORATED |
| Nivesh Plus (749) | Not found this session | — | still the generic "Available Fund(s)" placeholder |

These replace the generic "Available Fund(s)" placeholder each profile
carried since Phase 1 — a real, named fund now appears in
`ulip.funds` wherever found, never a fabricated generic "Growth Fund" of
this repository's own invention.

### NAV history (Sections 11/12)

Exactly ONE dated NAV point was found this session: SIIP's Growth Fund
at Rs.21.7091 as of 2026-04-27 (secondary source). A single point cannot
produce any 1Y/3Y/5Y/10Y return or CAGR — this is stored only as a note
on the fund entry, never as a fabricated `historicalPerformance` record.
`historicalPerformance` stays an empty array for all 4 ULIPs.

Per Section 11's own "do not manually type thousands of NAV records"
instruction, this phase instead built the CAPABILITY —
`lib/planning/planIntelligence/ulipModel.ts`'s `calculateSimpleReturnFromNav`,
`calculateCagrFromNav`, and `buildHistoricalPerformancePoint` (a
NavSnapshot-pair-to-HistoricalPerformancePoint builder) — with full
mathematical test coverage (`tests/phase3bDataFoundation.test.ts`'s "ULIP
NAV return/CAGR calculation" suite), verified against known cases (e.g.
100→200 over 5 years = 14.87% CAGR). When a genuine multi-dated NAV
series is found in a future session, populating real
`historicalPerformance` data becomes a call to an already-tested
function, not a new implementation.
