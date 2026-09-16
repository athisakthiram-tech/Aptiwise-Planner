# LIC Plan 774 (Amritbaal) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Amritbaal, Plan No. 774, UIN 512N365V02. A **Non-Par** child plan — "benefits payable on death or survival are guaranteed and fixed irrespective of actual experience... not entitled to any discretionary benefits like bonus."

## Source document

`774_Amritbaal_Sales_Brochure_141025.pdf` — fully readable, 22 pages. Identity confirmed on page 1/2: "LIC's Amritbaal, UIN: 512N365V02, Plan No. 774". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Entry age | 0 (30 days) to 13y (last birthday) | §2, p.2 | Implemented |
| Maturity age | 18–25y (last birthday) | §2, p.2 | Implemented |
| Policy term | Limited Premium: 10–25y; Single Premium: 5–25y | §2, p.2-3 | Implemented, mode-dependent |
| Premium Paying Term | Limited: 5, 6 or 7 years (independent of policy term); Single: single pay | §2, p.3 | Implemented |
| Minimum Sum Assured | Rs.2,00,000 | §2, p.3 | Implemented |
| Sum Assured increments | 2L–24L → 25,000; above 24L → 50,000 | §2, p.3 | Implemented |
| Sum Assured on Death | 4 Options, chosen once at inception, never altered: **I** higher(7×AP, BSA); **II** higher(10×AP, BSA); **III** higher(1.25×SP, BSA); **IV** flat 10×SP (no BSA floor stated) | §3.A, p.3-4 | Implemented exactly when premium verified; BSA floor for I-III when not (Option IV has no floor — never assumed) |
| 105%-of-premiums-paid floor | Stated **only** for Options I & II (Limited Premium) | §3.A, p.4 | Recorded only — needs premium-paid history |
| Maturity benefit | Sum Assured on Maturity = BSA + accrued Guaranteed Additions | §3.B-C, p.5 | Implemented (fully guaranteed) |
| **Guaranteed Addition** | Fixed rate: **Rs.80 per Rs.1,000 Basic Sum Assured, per policy year** — a genuinely guaranteed, non-participating rate (unlike every other plan in this codebase, where only BSA itself is guaranteed) | §3.C, p.5; Key Features, p.2 | Implemented exactly. Cross-checked against the brochure's own illustration (BSA Rs.5,00,000 → Rs.40,000/year, 20-year maturity total Rs.13,00,000 = BSA + Rs.8,00,000) |
| Riders | 1 (Premium Waiver Benefit Rider, Limited Premium only) | §4.I, p.5-6 | Identity recorded only |
| Sample premium | Exactly ONE age/term/BSA combination (age 5, term 20, BSA Rs.5,00,000), 3 PPTs × 2 Options (Limited) + 2 Options (Single) | §7, p.10 | Implemented as exact lookup only — cross-checked: age5/term20/PPT7/OptionI = Rs.73,625 matches the brochure's own Illustration 1 exactly |
| Loan | Limited: after 1yr, up to 90%/80% of SV; Single: after 3mo, up to 75% of SV | §14, p.18 | Availability implemented; amount not |
| Surrender | Limited: after 1yr; Single: any time | §13, p.14 | Availability implemented; value not |
| Tax/GST | No rate stated (illustration's "Nil" GST is a snapshot, not a guaranteed rate) | §17, p.19 | Not implemented — `unavailable` |
| Suicide exclusion, waiting period (POS channel) | Recorded | §19-20, p.20-21 | Not implemented — not a calculation |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The 105%-of-premiums-paid death-benefit floor (Options I/II) — needs cumulative premium history.
- Rebate for High Basic Sum Assured / Online Sale — needs a complete base-rate table this brochure doesn't publish beyond the single sample point.
- Any premium/benefit for age/term/BSA combinations outside the one published sample point.
