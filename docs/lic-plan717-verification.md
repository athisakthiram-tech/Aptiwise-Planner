# LIC Plan 717 (Single Premium Endowment) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Single Premium Endowment Plan, Plan No. 717, UIN 512N283V03.

## Source document

`717_LIC_Single_Premium_Endowment_plan_Eng_141025.pdf` — fully readable, 19 pages. Identity confirmed on page 2: "LIC's SINGLE PREMIUM ENDOWMENT PLAN (UIN: 512N283V03)... Plan 717" (title page). Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 30 days (modeled as age 0 — whole-year age model) | §1(a), p.2 | Implemented |
| Maximum entry age | 65y (nearer birthday) | §1(b), p.2 | Implemented |
| Maximum maturity age | 75y | §1(c), p.2 | Implemented |
| Minimum age at maturity | 18y (completed) | §1(e), p.2 | Implemented |
| Policy term | 10–25 years | §1(d)(f), p.2 | Implemented |
| Minimum Sum Assured | Rs.1,00,000 | §1(g), p.2 | Implemented |
| Sum Assured increments | 1L–2.5L → 10,000; above 2.5L → 25,000 | §1(h), p.2 | Implemented |
| Premium mode | Single Premium only | §1(i), p.2 | Implemented (`premiumFrequency: "single"`) |
| Death benefit | Higher of BSA or 1.25× Single Premium (age<50) / 1.10× (age≥50) | §2.A, p.3 | Implemented exactly when premium is verified; BSA floor otherwise. **No 105%-of-premiums-paid floor is stated for this product** (unlike 736/714/715) — none applied |
| Minor (<8y) pre-risk death | Refund of Single Premium | §2.A, p.3 | Recorded only |
| Maturity benefit | Sum Assured on Maturity = BSA | §2.B, p.4 | Implemented (guaranteed) |
| Simple Reversionary Bonus / FAB | Participating, no rate published | §2.C, p.4 | Recorded only — never fabricated |
| Sample premium | 6 ages × 3 terms (BSA Rs.1L) | §4, p.7 | Implemented as exact lookup only |
| High Sum Assured rebate | Per-mille scale | §5, p.8 | Recorded only — no complete base-rate table to scale from |
| Loan | Available after 3 months from issuance or free-look expiry; up to 50/60/80% of SV by policy year | §6, p.8 | Availability implemented as verified boolean; amount not implemented |
| Surrender | GSV 75% (yrs 1-3) / 90% (thereafter) of Single Premium + vested-bonus factor | §7, p.9 | Availability implemented; value not implemented (needs bonus history) |
| Tax/GST | No rate stated, "consult tax advisor" | §10, p.10 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`
