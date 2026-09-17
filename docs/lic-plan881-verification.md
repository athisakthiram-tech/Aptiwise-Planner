# LIC Plan 881 (Bima Lakshmi) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Bima Lakshmi, Plan No. 881, UIN 512N389V01. A **Non-Par**, women-only Limited Premium savings plan — same "guaranteed and fixed irrespective of actual experience" structure as Amritbaal (Plan 774) and Nav Jeevan Shree (Plan 912).

## Source document

`LIC_Bima_Lakshmi_Sales_Brochure_Eng.pdf` — fully readable, 36 pages (pages 1-20 read). Identity confirmed on page 2: "LIC's BIMA LAKSHMI (UIN: 512N389V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 18 years (last birthday) | §2.a, p.3 | Implemented |
| Maximum entry age | 50 years (nearer birthday) | §2.b, p.3 | Implemented |
| Policy Term | Fixed at 25 years | §2.c, p.3 | Implemented |
| Premium Paying Term | 7 to 15 years (any integer) | §2.d, p.3 | Implemented |
| Minimum Sum Assured | Rs.2,00,000 | §2.e, p.3 | Implemented |
| Sum Assured increments | Flat multiples of Rs.10,000 | §2.g, p.3 | Implemented |
| Death Benefit | Higher of BSA or (10 x Tabular Annual Premium x modal factor); floor 105% premiums paid | §3.A, p.3 | Implemented exactly when premium verified (annual mode only, modal factor = 1.0); BSA floor otherwise |
| Maturity Benefit | Sum Assured on Maturity = BSA + accrued Guaranteed Additions | §3.B, p.4 | Implemented |
| Survival Benefit | Option A: 50% BSA at end of PPT; Option B: 7.5% BSA at each even policy year 2-24; Option C: 15% BSA at every 4th policy year 4-24 | §3.C, p.4 | Implemented exactly — Option chosen once, never altered |
| **Guaranteed Addition** | 7% of Total Tabular Annual Premium in respect of Premiums Paid, accruing for the FULL 25-year Policy Term (continues to accrue after PPT ends, on the premium already paid) | §3.D, p.5 | Implemented. Cross-checked against the brochure's own accrual description; the same additive year-by-year formula was independently verified against Plan 889's Benefit Illustration (identical wording) |
| Incentive for High Basic Sum Assured | Additive to the base rate, banded by BSA and PPT(7-9 / 10-15) | §9.I, p.13 | Implemented — deterministic from BSA + PPT alone |
| Incentive for online sale / existing policyholder | Additive, needs unverifiable business-relationship context | §9.II-III, p.13-14 | Recorded only — not stacked in |
| Sample premium | Age 35, BSA Rs.2,00,000, 9 PPTs (7-15) x 3 Options | §7, p.12 | Implemented as exact lookup only |
| Loan | Available after completion of first policy year (>= 1 full year's premium) | §11 (from paid-up/surrender sequence, pages 15-16) | Availability implemented; amount not |
| Surrender | GSV/SSV, higher of the two, after 1-2 full years' premiums | pages 15-16 | Availability implemented; value not |
| Tax/GST | No rate stated | — | Not implemented — `unavailable` |
| Riders | 4 (incl. Female Critical Illness Benefit Rider) | §4.I, p.6-7 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The 105%-of-premiums-paid death-benefit floor — needs cumulative premium history.
- Guaranteed Addition rate incentives for online sale / existing policyholder — need unverifiable business-relationship context.
- Any premium for a PPT/Option combination outside the published sample (age 35, BSA Rs.2,00,000 only).
- Exact loan/surrender amounts (only availability is modeled).
