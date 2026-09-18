# LIC Plan 887 (Bima Kavach) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Bima Kavach, Plan No. 887, UIN 512N360V01. A **Non-Par pure risk term plan** offering lifetime risk cover (up to age 100) — same Level/Increasing Sum Assured shape as Digi Term (876)/Yuva Term (875)/New Tech-Term (954). Uses the shared pure-term engine (`pureTermShared.ts`).

## Source document

`LIC_Bima_Kavach_Sales_Brochure_Eng_03122025.pdf` — fully readable, 20 pages, all read. Identity confirmed on page 2: "LIC's Bima Kavach (UIN: 512N360V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Entry age | 18–65 years (last birthday); above 60 considered case-by-case — **not modeled**, engine enforces the hard 65 ceiling only | §2, p.3 | Implemented |
| Maturity age | 28–100 years (last birthday) — "Lifetime Risk Cover" | §2, p.3 | Implemented |
| Minimum Sum Assured | Rs.2,00,00,000 (Rs.2 Crore) — confirmed by the brochure's own sample premium table, which is computed at exactly this BSA | §2, p.3 | Implemented |
| Sum Assured increments | 2Cr-2.75Cr → 5L; above 2.75Cr → 25L | §2, p.3 | Implemented |
| Premium Paying Term | Regular (=Term); Limited 5, 10 or 15 years (needing Policy Term ≥10/15/20 respectively); Single | §2, p.3 | Implemented |
| Policy Term | Min 10 years; Max 82 years (subject to maximum maturity age of 100) | §2, p.3 | Implemented — no separate age×BSA term-cap table is published for Option II on this plan (unlike Digi Term/Yuva Term/New Jeevan Amar); the max term is 82 for both Options |
| Death Benefit | Same formula shape as Digi Term (highest of 7x AP / 105% premiums paid / Absolute Amount for Regular/Limited; higher of 125% SP / Absolute Amount for Single) | §3.A, p.4 | Same implementation and caveats as Digi Term |
| Absolute Amount (Option I/II) | Same structure as Digi Term/Yuva Term | §3.A, p.4-5 | Implemented at inception and post-year-16 cap |
| Maturity Benefit | None | §3.B, p.5 | Correctly modeled as `undefined` |
| **Life Stage Option** | Increase BSA on marriage (+50%, cap +Rs.2Cr), first child (+25%, cap +Rs.1Cr), second child (+25%, cap +Rs.1Cr) — Option I + Regular Premium only, entry age ≤40 | §4.II, p.6-8 | **Not implemented** — a customer-elected, life-event-triggered increase this engine's single-call context can't carry (needs marital/childbirth history over time) |
| Sample premium | BSA Rs.2,00,00,000, Non-Smoker Male, term 20, 3 ages, both Options, all 4 modes | §7, p.10 | Implemented as exact lookup only |
| High Sum Assured rebate | Percentage of tabular premium, banded by age and BSA | §8, p.11 | Recorded only — not applied |
| Loan | None | §12, p.14 | Implemented as verified `false` |
| Surrender | Mode-dependent Unexpired Risk Premium Value | §11, p.13 | Availability implemented; amount not |
| Tax/GST | No rate stated | §15, p.14 | Not implemented — `unavailable` |
| Optional Rider | LIC's Accident Benefit Rider | §4.I, p.5-6 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The Life Stage Option (BSA increase on marriage/childbirth) — needs life-event history beyond a single calculation call.
- The 105%-of-premiums-paid (or 125%-of-single-premium) death-benefit floor — needs cumulative premium history.
- The High Sum Assured rebate — not applied to the exact-lookup premium.
- The Option II Absolute Amount's intermediate policy-year values (years 6-15) — only inception and the post-year-16 cap are reported.
- Any premium for an age/term/mode combination outside the published sample.
- Exact Unexpired Risk Premium Value amounts (only availability is modeled).
