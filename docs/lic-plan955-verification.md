# LIC Plan 955 (New Jeevan Amar) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's New Jeevan Amar, Plan No. 955, UIN 512N350V02. A **Non-Par pure risk term plan** — same Level/Increasing Sum Assured shape as Digi Term/Yuva Term/New Tech-Term/Bima Kavach, with an offset-based Limited Premium Paying Term (like New Tech-Term) and a higher minimum Basic Sum Assured of Rs.25,00,000.

## Source document

`LIC_Jeevan_amar_Sales_Brochure_4_inch_x_9_inch_Eng_1.pdf` — fully readable, 16 pages, all read. Identity confirmed on page 2: "LIC's New Jeevan Amar (UIN: 512N350V02)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Entry age | 18–65 years (last birthday) | §2, p.4 | Implemented |
| Maturity age | Max 80 years (last birthday); **no minimum age at maturity is published** — never assumed | §2, p.4 | Implemented (max only) |
| Minimum Sum Assured | Rs.25,00,000 | §2, p.4 | Implemented |
| Sum Assured increments | 25L-40L → 1L; above 40L → 10L | §2, p.4 | Implemented |
| Premium Paying Term | Regular (=Term); Limited = Term−5 (Term 10-40) or Term−10 (Term 15-40); Single = NA | §2.g, p.5-6 | Implemented as an offset function |
| Policy Term | Min 10 years; Max 40 years under Level SA (subject to max maturity age); Option-II-dependent under Increasing SA (4-tier BSA band × age band) | §2, p.4-5 | Implemented, including the published age×BSA max-term table |
| Death Benefit | Same formula shape as Digi Term (highest of 7x AP / 105% premiums paid / Absolute Amount for Regular/Limited; higher of 125% SP / Absolute Amount for Single) | §1.A, p.2-3 | Same implementation and caveats as Digi Term |
| Absolute Amount (Option I/II) | Same structure as Digi Term/Yuva Term | §1.A, p.3 | Implemented at inception and post-year-16 cap |
| Maturity Benefit | None | §1.B, p.4 | Correctly modeled as `undefined` |
| Sample premium | BSA Rs.50,00,000, Non-Smoker Male, term 20, 3 ages, both Options, all 4 modes | §6, p.8 | Implemented as exact lookup only |
| High Sum Assured rebate | Simpler 3-column table (<50L / 50L-1Cr / 1Cr+), by age band | §7, p.8-9 | Recorded only — not applied |
| Loan | None | — | Implemented as verified `false` (structural fact consistent with the rest of this term-protection family) |
| Surrender | Mode-dependent Unexpired Risk Premium Value | §10, p.10 | Availability implemented; amount not |
| Tax/GST | No rate stated | §14, p.11 | Not implemented — `unavailable` |
| Optional Rider | LIC's Accident Benefit Rider | §3.I, p.6 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The 105%-of-premiums-paid (or 125%-of-single-premium) death-benefit floor — needs cumulative premium history.
- The High Sum Assured rebate — not applied to the exact-lookup premium.
- The Option II Absolute Amount's intermediate policy-year values (years 6-15) — only inception and the post-year-16 cap are reported.
- Any premium for an age/term/mode combination outside the published sample.
- Exact Unexpired Risk Premium Value amounts (only availability is modeled).
