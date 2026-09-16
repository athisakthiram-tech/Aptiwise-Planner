# LIC Plan 714 (New Endowment Plan) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's New Endowment Plan, Plan No. 714, UIN 512N277V03.

## Source document

`LICs_NEW_ENDOWMENT_PLAN_714.pdf` — fully readable, 32 pages. Identity confirmed on page 2: "LIC's NEW ENDOWMENT PLAN (UIN:512N277V03)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 8y (completed) | §1(a), p.2 | Implemented |
| Maximum entry age | 50y (nearer birthday) | §1(b), p.2 | Implemented |
| Minimum maturity age | 20y (completed) | §1(c), p.2 | Implemented |
| Maximum maturity age | 75y | §1(d), p.2 | Implemented |
| Policy term | 12–35 years | §1(e)(f), p.2 | Implemented |
| Premium Paying Term | Always equals Policy Term — no separate limited-pay option offered | §4, p.10 | Implemented as a validation rule (`ppt_must_equal_term`) |
| Minimum Sum Assured | Rs.2,00,000 | §1(g), p.2 | Implemented |
| Sum Assured increments | 2L–4.5L → 5,000; 4.5L–9L → 50,000; above 9L → 1,00,000 | §1, p.3 | Implemented (3-tier band) |
| Death benefit | Higher of BSA or 7× annualised premium; floor 105% of premiums paid | §2.A, p.3 | 7×-premium formula implemented when premium verified; BSA floor otherwise. 105% premiums-paid floor recorded only (needs payment history) |
| Maturity benefit | Sum Assured on Maturity = BSA | §2.B, p.3 | Implemented (guaranteed) |
| Simple Reversionary Bonus / FAB | Participating, no rate published | §2.C, p.4 | Recorded only — never fabricated |
| Sample premium | 3 ages × 3 terms (BSA Rs.2L, yearly) | §6, p.11 | Implemented as exact lookup only |
| Loan | Available after 1 full year's premium; up to 50/75% (before/after 2 years) of SV | §11, p.18 | Availability implemented as verified boolean; amount not implemented |
| Surrender | GSV/SSV, higher of the two, after 1-2 full years' premiums | §10, p.13 | Availability implemented; value not implemented |
| Tax/GST | No rate stated | §14, p.20 | Not implemented — `unavailable` |
| Riders | 5 (incl. Critical Illness Health Rider) | §3.I, p.4-7 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`
