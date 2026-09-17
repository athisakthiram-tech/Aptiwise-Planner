# LIC Plan 888 (New Jeevan Sathi - Single Premium) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's New Jeevan Sathi - Single Premium, Plan No. 888, UIN 512N393V01. A **Non-Par JOINT LIFE** plan (sibling to the Limited Premium version, Plan 889) covering a married individual and spouse in one policy, paid as a single, one-time premium.

**Modeling limitation (documented, not an invented value):** this engine models both lives as the SAME age, for the same reason as plan889.ts — the shared `LicCalculationContext` this codebase uses for every LIC product carries only a single `age` field, matching the brochure's own Sample Illustrative Premium tables and Benefit Illustrations.

## Source document

`LIC_New_Jeevan_Sathi_Single_Premium_Sales_Brochure.pdf` — fully readable, 23 pages, all read. Identity confirmed on page 2: "LIC's New Jeevan Sathi - Single Premium (UIN: 512N393V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age (both lives) | 18 years (completed) | §2.a, p.3 | Implemented |
| Maximum entry age | Option I: 60 years; Option II: 35 years (nearer birthday) | §2.b, p.3 | Implemented, Option-dependent |
| Policy Term | Option I: 10, 15, 20, 25 years; Option II: 10, 15 years only | §2.c, p.3 | Implemented as an exact set per Option — never a free range |
| Minimum age at maturity | 28 years (completed), both Options | §2.d, p.3 | Implemented |
| Maximum age at maturity | Option I: 75 years; Option II: 50 years (nearer birthday) | §2.e, p.3 | Implemented, Option-dependent |
| Minimum Sum Assured | Rs.3,00,000 | §2.g, p.3 | Implemented |
| Sum Assured increments | Flat multiples of Rs.25,000 | §2.i, p.3 | Implemented |
| Death Benefit Options | Option I: higher of 1.25x Tabular Single Premium or BSA; Option II: 10x Tabular Single Premium, **no BSA floor stated** — never assumed | §3.A, p.4 | Implemented exactly when premium verified; BSA floor for Option I only when not |
| **Sum-Assured-on-Death premium basis** | Both Options are defined on the "Tabular Single Premium" — the PRE-rebate premium, not the quoted (post-rebate) one | §3.A note, p.4 | This engine reconstructs the Tabular premium by adding back the published High-Sum-Assured rebate (§6.a) to the quoted sample premium. Cross-checked EXACTLY against both of the brochure's own Benefit Illustrations: Option I (BSA Rs.10L, term 20, quoted premium 8,12,750, rebate 29/1000 → Tabular 8,41,750 → 1.25x = 10,52,187.5, rounds to 10,52,188, matching the illustration's SAD exactly); Option II (BSA Rs.10L, term 15, quoted premium 17,62,250, rebate 26/1000 → Tabular 17,88,250 → 10x = 1,78,82,500, matching exactly) — see `tests/lic-plan888.test.ts` |
| First death | Sum Assured on Death payable; policy continues on the surviving life | §3.A.i, p.4 | Implemented — reported as `sumAssuredOnDeath` / `sumAssuredOnDeathMinimum` |
| Second death | Sum Assured on Death + accrued Guaranteed Additions; policy terminates | §3.A.ii, p.4 | The Sum-Assured-on-Death portion is reported (`sumAssuredOnSecondDeathMinimum`); the accrued-GA addition is timing-dependent and not projected forward |
| Simultaneous death | Sum of the first-death and second-death benefits above | §3.A.iii, p.4 | Implemented as `sumAssuredOnSimultaneousDeathMinimum` = 2x the first-death figure |
| Maturity Benefit | Sum Assured on Maturity = BSA + accrued Guaranteed Additions | §3.B, p.5 | Implemented |
| **Guaranteed Addition** | Rs.70 per Rs.1,000 Basic Sum Assured, per policy year — a genuinely guaranteed, BSA-only rate (no premium dependency, unlike Plan 889) | §4, p.5 | Implemented exactly. Cross-checked against BOTH Benefit Illustrations (BSA Rs.10,00,000 → Rs.70,000/year accrual, linear) — see `tests/lic-plan888.test.ts` |
| High Sum Assured rebate | Per-mille reduction on the Tabular Single Premium, banded by BSA and term | §6.a, p.9 | Implemented — deterministic from BSA + term alone; used to reconstruct the Tabular premium for the SAD formula above |
| Rebate for online sale / existing policyholder | Additive, needs unverifiable business-relationship context | §6.b-c, p.9-10 | Recorded only — not applied |
| Sample premium | BSA Rs.3,00,000, 3 ages x up to 4 terms, split by Option | §14, p.14-15 | Implemented as exact lookup only |
| Loan | Available after 3 months from issuance or free-look expiry, up to 50-80% of Surrender Value (in-force/paid-up, by policy year) | §8, p.11-12 | Availability implemented; amount not |
| Surrender | GSV/SSV, higher of the two, available any time during the Policy Term; separate GSV tables for premiums paid and accrued Guaranteed Additions | §7, p.10-11 | Availability implemented; value not |
| Tax/GST | No rate stated | §11, p.13 | Not implemented — `unavailable` |
| Riders | 2 (Accidental Death and Disability, New Term Assurance) | §5.I, p.5-6 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- Both lives are assumed to be the same age (documented modeling limitation, matching the brochure's own illustrations — not an invented value).
- Accrued Guaranteed Addition at the moment of second death — timing-dependent, not projected.
- The online-sale / existing-policyholder premium rebates — need unverifiable business-relationship context.
- Any premium for an age/term/Option combination outside the published sample.
- Exact loan/surrender amounts (only availability is modeled).
