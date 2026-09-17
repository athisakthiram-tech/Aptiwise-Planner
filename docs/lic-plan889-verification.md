# LIC Plan 889 (New Jeevan Sathi - Limited Premium) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's New Jeevan Sathi - Limited Premium, Plan No. 889, UIN 512N394V01. A **Non-Par JOINT LIFE** plan covering a married individual and spouse in one policy, with 3 death-benefit tiers (first death / second death / simultaneous death) and a fully guaranteed, premium-based Guaranteed Addition.

**Modeling limitation (documented, not an invented value):** this engine models both lives as the SAME age, because the shared `LicCalculationContext` this codebase uses for every LIC product carries only a single `age` field. This is exactly the simplification the brochure's own Sample Illustrative Premium tables and Benefit Illustrations use ("for standard lives considering the same age for both lives").

## Source document

`LIC's New Jeevan Sathi - Limited Premium Sales Brochure (14-April-2026)` — fully readable, 32 pages (pages 1-26 read). Identity confirmed on page 2: "LIC's New Jeevan Sathi - Limited Premium (UIN: 512N394V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age (both lives) | 18 years (completed) | §2.a, p.3 | Implemented |
| Maximum entry age | By (PPT, Term, Option) — 8 offered combinations, each with its own max entry age for Option I and a stricter one for Option II | §2.b, p.3 | Implemented as an exact table lookup — never interpolated |
| Minimum age at maturity | 28 years (completed), both Options | §2.c, p.3 | Implemented |
| Maximum age at maturity | Option I: 75 years; Option II: 60 years (nearer birthday) | §2.d, p.3 | Implemented, Option-dependent |
| Policy Term / Premium Paying Term | 8 valid combinations: PPT5→Term{10,15,20}; PPT10→Term{15,20,25}; PPT15→Term{20,25} | §2.e-f, p.3 | Implemented as an exact combination table — never a free range |
| Minimum Sum Assured | Rs.3,00,000 | §2.g, p.3 | Implemented |
| Sum Assured increments | Flat multiples of Rs.10,000 | §2.j, p.3 | Implemented |
| Death Benefit Options | Option I: higher of 7x Tabular Annual Premium or BSA; Option II: higher of 10.5x Tabular Annual Premium or BSA — chosen once at inception, never altered | §3.A, p.4 | Implemented exactly when premium verified; BSA floor otherwise |
| **First death** | Sum Assured on Death (per chosen Option) payable; policy CONTINUES for the surviving life; future base-plan premiums waived | §3.A.i, p.5 | Implemented — reported as `sumAssuredOnDeath` / `sumAssuredOnDeathMinimum` (the headline family-protection figure) |
| **Second death** | Sum Assured on Death + accrued Guaranteed Additions; policy terminates; floor 105% of Total Premiums Paid | §3.A.ii, p.5 | The Sum-Assured-on-Death portion is reported (`sumAssuredOnSecondDeathMinimum`); the accrued-GA addition is timing-dependent and not projected forward. 105% floor recorded only |
| **Simultaneous death** | Sum of the first-death and second-death benefits above | §3.A.iii, p.5 | Implemented as `sumAssuredOnSimultaneousDeathMinimum` = 2x the first-death figure |
| Maturity Benefit | Sum Assured on Maturity = BSA + accrued Guaranteed Additions, payable if at least one life survives to maturity | §3.B, p.6 | Implemented |
| **Guaranteed Addition** | 7.00% of Total Tabular Annual Premium Paid, accruing for the FULL Policy Term (continues to accrue after PPT ends, on the premium already paid) | §4, p.6 | Implemented. Cross-checked against BOTH of the brochure's own Benefit Illustrations (Option I, age 35/35, PPT15/Term25, premium 83,650 → GA reconciles exactly year-by-year; Option II, age 35/35, PPT10/Term20, premium 1,31,750 → GA reconciles exactly) — see `tests/lic-plan889.test.ts` |
| Incentive for High Basic Sum Assured | Additive to the base rate, banded by BSA and Policy Term — this is the piece needed to reconcile the two Benefit Illustrations exactly (7.8% and 7.45% effective rates respectively) | §9.a, p.12 | Implemented — deterministic from BSA + Policy Term alone |
| Incentive for online sale / existing policyholder | Additive, needs unverifiable business-relationship context | §9.b-c, p.12-13 | Recorded only — not stacked in |
| Sample premium | BSA Rs.3,00,000, 3 ages x 3 sampled (PPT, Term) combinations, split by Option | §19, p.22 | Implemented as exact lookup only |
| Loan | Available after completion of first policy year, up to 75%/50% of Surrender Value (in-force/paid-up) | §13, p.19 | Availability implemented; amount not |
| Surrender | GSV/SSV, higher of the two, after 1-2 full years' premiums; separate GSV tables for premiums paid and accrued Guaranteed Additions | §12, p.17-18 | Availability implemented; value not |
| Tax/GST | No rate stated | §16, p.20 | Not implemented — `unavailable` |
| Riders | 3 (Accident Benefit, New Term Assurance, Critical Illness Health) | §5.I, p.6-8 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- Both lives are assumed to be the same age (documented modeling limitation, matching the brochure's own illustrations — not an invented value).
- Accrued Guaranteed Addition at the moment of second death — timing-dependent, not projected.
- The 105%-of-premiums-paid death-benefit floor — needs cumulative premium history.
- Guaranteed Addition rate incentives for online sale / existing policyholder — need unverifiable business-relationship context.
- Any premium for an age/PPT/Term combination outside the published sample.
- Exact loan/surrender amounts (only availability is modeled).
