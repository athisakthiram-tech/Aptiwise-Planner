# LIC Plan 954 (New Tech-Term) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's New Tech-Term, Plan No. 954, UIN 512N351V02. A **Non-Par, Online-only pure risk term plan** with broader eligibility (entry age up to 65, maturity up to 80) and a simpler 2-tier Basic Sum Assured band than Digi Term/Yuva Term, and an **offset-based** Limited Premium Paying Term (Policy Term − 5 or − 10) rather than a fixed 10/15-year pair. Uses the shared pure-term engine (`pureTermShared.ts`).

## Source document

`LIC_New_Tech_Term_Sales_Brochure_4_inch_x_9_inch_Eng_2.pdf` — fully readable, 11 pages, all read. Identity confirmed on page 2: "LIC's New Tech-Term (UIN: 512N351V02)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 18 years (last birthday) | §2.a, p.3 | Implemented |
| Maximum entry age | 65 years (last birthday) | §2.b, p.3 | Implemented |
| Maximum age at maturity | 80 years (last birthday); **no minimum age at maturity is published** for this plan (unlike Digi Term/Yuva Term's 33) — never assumed | §2.c, p.3 | Implemented (max only) |
| Minimum Sum Assured | Rs.50,00,000 | §2.d, p.3 | Implemented |
| Sum Assured increments | 2-tier: Rs.50L-75L → Rs.5,00,000; above Rs.75L → Rs.25,00,000 | §2.e, p.3 | Implemented — simpler than Digi Term/Yuva Term's 4-tier band |
| Premium Paying Term | Regular (=Term); Limited = Term−5 (Term 10-40) or Term−10 (Term 15-40); Single = NA | §2.g, p.3 | Implemented as an offset function, not a fixed pair |
| Policy Term | Min 10 years (lower than Digi Term/Yuva Term's 15); Max 40 years under Level SA (subject to max maturity age); Option-II-dependent under Increasing SA | §2.f, p.3 | Implemented, including the published age×BSA max-term table — only the lowest BSA band (<Rs.1Cr) has extra age-based caps; higher bands are simply "40 years, subject to maximum Age at Maturity" |
| Death Benefit | Same formula shape as Digi Term/Yuva Term (highest of 7x AP / 105% premiums paid / Absolute Amount for Regular/Limited; higher of 125% SP / Absolute Amount for Single) | §1.A, p.2-3 | Same implementation and caveats as Digi Term |
| Absolute Amount (Option I/II) | Same structure as Digi Term/Yuva Term | §1.A, p.2-3 | Implemented at inception and post-year-16 cap |
| Maturity Benefit | None | §1.B, p.3 | Correctly modeled as `undefined` |
| Sample premium | BSA Rs.1,00,00,000 (Rs.1 Crore), Non-Smoker Male, term 20, 3 ages, both Options, all 4 modes | §6, p.5 | Implemented as exact lookup only |
| High Sum Assured rebate | Simpler 3-column table (<1Cr / 1-2Cr / 2Cr+), unlike Digi Term/Yuva Term's 4-column table | §7, p.6 | Recorded only — not applied |
| Loan | None | §11, p.7 | Implemented as verified `false` |
| Surrender | Mode-dependent | §10, p.7 | Availability implemented; amount not |
| Tax/GST | No rate stated | §14, p.8 | Not implemented — `unavailable` |
| Optional Rider | LIC's Accident Benefit Rider — the only one of the 5 pure-term/credit-life plans in this batch to offer a rider | §3.I, p.4 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

Same list as Digi Term (876), plus: the Accident Benefit Rider's own terms (identity recorded only).
