# LIC Plan 890 (New Bima Jyoti) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's New Bima Jyoti, Plan No. 890, UIN 512N395V01. A **Non-Par** Limited Premium plan — same "guaranteed and fixed irrespective of actual experience" structure as Amritbaal (774)/Nav Jeevan Shree (912), with a fixed offset (Policy Term − 5) setting the Premium Paying Term.

## Source document

`New_Bima_Jyoti_Sales_Brochure_English.pdf` — fully readable, 36 pages (pages 1-28 read). Identity confirmed on page 2: "LIC's NEW BIMA JYOTI (UIN: 512N395V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 30 days (modeled as age 0) | §2.a, p.3 | Implemented |
| Maximum entry age | 60 years (nearer birthday) | §2.b, p.3 | Implemented (standard channel only; POS-LI/CPSC-SPV uses a different formula, not modeled) |
| Minimum age at maturity | 18 years (completed) | §2.c, p.3 | Implemented |
| Maximum age at maturity | 75 years (nearer birthday); 65 for POS-LI/CPSC-SPV (not modeled) | §2.d, p.3 | Implemented (standard channel only) |
| Policy Term | 15 to 20 years | §2.e-f, p.3 | Implemented |
| Premium Paying Term | Policy Term − 5 years — DERIVED, never chosen independently | §2.g, p.3 | Implemented |
| Minimum Sum Assured | Rs.1,25,000 | §2.h, p.3 | Implemented |
| Sum Assured increments | 1,25,000-2,75,000 → 5,000; above 2,75,000 → 25,000 | §2.j, p.4 | Implemented |
| Death Benefit | Higher of 125% BSA or 7x annualised premium; floor 105% premiums paid | §3.A, p.4 | 125%-BSA side always computable (no premium needed); 7x-premium side only when premium verified. 105% floor recorded only |
| Maturity Benefit | Sum Assured on Maturity = BSA + accrued Guaranteed Additions | §3.B, p.5 | Implemented |
| **Guaranteed Addition** | 6% of Total Annualized Premiums in respect of Premiums Paid, accruing for the FULL Policy Term (continues to accrue after PPT ends, on the premium already paid) | §4, p.5-6 | Implemented. Cross-checked exactly against the brochure's own Sample Benefit Illustration (age 35, PPT 15, term 20, BSA Rs.10,00,000, premium 84,700 → GA reconciles exactly year-by-year including the post-PPT years) — see `tests/lic-plan890.test.ts` |
| Incentive for High Basic Sum Assured | Additive to the base rate, banded by BSA and a 2-way PPT bucket ("10 to 14" / "15") | §10.I, p.14-15 | Implemented — deterministic from BSA + PPT alone; this is the piece needed to reconcile the illustration exactly (7.25% effective rate) |
| Incentive for online sale | Additive, needs unverifiable business-relationship context | §10.II, p.15 | Recorded only — not stacked in |
| Sample premium | BSA Rs.10,00,000, 4 ages (20/30/40/50) x 3 policy terms | §8, p.13 | Implemented as exact lookup only |
| Loan | Available after completion of first policy year | §15, p.22-23 | Availability implemented; amount not |
| Surrender | GSV/SSV, higher of the two, after 1-2 full years' premiums; separate GSV tables for premiums paid and accrued Guaranteed Additions | §14, p.20-22 | Availability implemented; value not |
| Tax/GST | No rate stated | §18, p.24 | Not implemented — `unavailable` |
| Riders | 5 (incl. Critical Illness Health Rider) | §5.I, p.6-9 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The 105%-of-premiums-paid death-benefit floor — needs cumulative premium history.
- The online-sale Guaranteed Addition incentive — needs unverifiable business-relationship context.
- Any premium for an age/term combination outside the published sample (4 ages x 3 terms).
- Exact loan/surrender amounts (only availability is modeled).
