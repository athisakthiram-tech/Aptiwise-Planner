# LIC Plan 876 (Digi Term) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Digi Term, Plan No. 876, UIN 512N356V02. A **Non-Par, Online-only pure risk term plan** — the first pure-protection (no maturity benefit, no savings) product implemented in this codebase. Uses the new shared pure-term engine (`lib/insurance/providers/lic/plans/pureTermShared.ts`), reused by Yuva Term (875) and New Tech-Term (954).

## Source document

`Digi_Term_-_Sales_Brochure_April_25.pdf` — fully readable, 20 pages, all read. Identity confirmed on page 2: "LIC's Digi Term (UIN: 512N356V02)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Entry age | 18–45 years (last birthday) | §2.a-b, p.2 | Implemented |
| Maturity age | 33–75 years (last birthday) | §2.c-d, p.2 | Implemented |
| Minimum Sum Assured | Rs.50,00,000 | §2.e, p.2 | Implemented |
| Maximum Sum Assured | Rs.5,00,00,000 (higher considered case-by-case) | §2.f, p.3 | Recorded — no engine-level cap enforced above this |
| Sum Assured increments | 4-tier band: 50L-75L→1L; 75L-1.5Cr→25L; 1.5Cr-4Cr→50L; above 4Cr→1Cr | §2.f, p.3 | Implemented |
| Premium Paying Term | Regular (=Term); Limited 10 years; Limited 15 years (needs Policy Term ≥20); Single | §2.g, p.3 | Implemented |
| Policy Term | Min 15 years (20 for Limited-15); Max 40 years under Level SA (subject to max maturity age); Option-II-dependent under Increasing SA | §2.g, p.3-4 | Implemented, including the full published age×BSA max-term table for Option II |
| Death Benefit | Regular/Limited: highest of 7x annualised premium, 105% of Total Premiums Paid, or the Absolute Amount. Single: higher of 125% of Single Premium or the Absolute Amount | §3.A, p.5 | 105%-premiums-paid floor recorded only (needs payment history); 7x-premium/125%-premium and the Absolute Amount are both implemented |
| **Absolute Amount — Option I (Level)** | Flat, equal to Basic Sum Assured for the whole term | §3.A, p.5 | Implemented |
| **Absolute Amount — Option II (Increasing)** | Level at BSA through year 5; +10% of BSA per year from year 6 to year 15 (reaching 2x BSA); flat at 2x BSA from year 16 onward | §3.A, p.5-6 | Implemented at its two defining checkpoints (inception and post-year-16 cap) — see "What is deliberately NOT implemented" |
| Maturity Benefit | None — "on survival... no maturity benefit is payable" | §3.B, p.6 | Correctly modeled as `undefined`, never a fabricated figure |
| Sample premium | BSA Rs.50,00,000, Non-Smoker Male standard lives, term 20 years, 3 ages, both Options, all 4 premium modes | §7, p.8 | Implemented as exact lookup only |
| High Sum Assured rebate | Percentage of tabular premium, banded by age and BSA | §8, p.9-10 | Recorded only — not applied to the exact-lookup premium (see below) |
| Loan | None — "No loan will be available under this plan" | §12, p.12 | Implemented as a verified `false` |
| Surrender | None for Regular Premium; Unexpired Risk Premium Value only for Single/Limited (Limited needs ≥3 consecutive years paid) | §11, p.12 | Availability implemented (mode-dependent); amount not computed |
| Tax/GST | No rate stated | §15, p.13 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The 105%-of-premiums-paid (or 125%-of-single-premium) death-benefit floor — needs cumulative premium history.
- The High Sum Assured rebate — the sample premium table already reflects standard (non-rebated) rates for its exact points; applying a rebate on top would require a complete pre-rebate rate table this brochure doesn't publish.
- The Option II Absolute Amount's intermediate policy-year values (years 6-15) — only the inception value (=BSA) and the final capped value (=2x BSA, from year 16) are reported, since the generic engine interface has no "which policy year" parameter.
- Any premium for an age/term/mode combination outside the published sample (3 ages, term 20 only).
- Exact Unexpired Risk Premium Value amounts (only availability is modeled).
