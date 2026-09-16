# LIC Plan 715 (New Jeevan Anand) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's New Jeevan Anand, Plan No. 715, UIN 512N279V03.

## Source document

`LICs_New_Jeevan_Anand_Sales_Brochure_Eng_141025.pdf` — fully readable, 32 pages. Identity confirmed on page 2: "LIC's NEW JEEVAN ANAND (UIN: 512N279V03)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 18y (completed) | §1(a), p.2 | Implemented |
| Maximum entry age | 50y (nearer birthday) | §1(b), p.2 | Implemented |
| Maximum maturity age | 75y — **no minimum maturity age is stated** (unlike Plan 714) | §1(c), p.2 | Implemented (max only) |
| Policy term | 15–35 years | §1(d)(e), p.2 | Implemented |
| Premium Paying Term | Always equals Policy Term | §4, p.9 | Implemented (`ppt_must_equal_term`) |
| Minimum Sum Assured | Rs.2,00,000 | §1(f), p.2 | Implemented |
| Sum Assured increments | 2L–4.5L → 5,000; 4.5L–9L → 50,000; above 9L → 1,00,000 | §1, p.2 | Implemented |
| Death benefit (in-term) | Higher of 125% BSA or 7× annualised premium; floor 105% premiums paid | §2.A, p.3 | 7×-premium/125%-BSA formula implemented when possible; 105% floor recorded only |
| Death benefit (post-maturity) | Flat BSA, payable if death occurs **after** the stipulated Date of Maturity ("protection throughout your lifetime") | §2.A, p.3 | **Deliberately not implemented** — requires modeling whether the policy has already reached maturity, a state this engine's single-call context doesn't carry |
| Maturity benefit | Sum Assured on Maturity = BSA | §2.B, p.3 | Implemented (guaranteed) |
| Simple Reversionary Bonus / FAB | Participating, no rate published | §2.C, p.3-4 | Recorded only |
| Sample premium | 4 ages × 3 terms (BSA Rs.2L, yearly) | §6, p.9 | Implemented as exact lookup only |
| Loan | Available after 1 full year's premium; up to 50/75% of SV | §11, p.16 | Availability implemented; amount not |
| Surrender | GSV/SSV, higher of the two | §10, p.11 | Availability implemented; value not |
| Tax/GST | No rate stated | §14, p.17 | Not implemented — `unavailable` |
| Riders | 4 (incl. Critical Illness Health Rider) | §3.I, p.4-6 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`
