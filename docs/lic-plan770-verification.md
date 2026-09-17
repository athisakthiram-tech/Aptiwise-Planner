# LIC Plan 770 (Bima Platinum) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Bima Platinum, Plan No. 770, UIN 512N397V01. A **Non-Par**, Limited Premium income-benefit plan — like Amritbaal (774)/Nav Jeevan Shree (912), its Guaranteed Addition is a fixed, non-discretionary rate. After the Premium Paying Term ends, it additionally pays a Regular Income Benefit every year and a one-time Booster Income Benefit during the "Pay-out Period" (Policy Term − PPT).

## Source document

`LIC_Bima_platinum_Sales_brochure.pdf` — fully readable, 44 pages (pages 1-28 read). Identity confirmed on page 2: "LIC's BIMA PLATINUM (UIN: 512N397V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Premium Paying Term | 7, 10, 12, 15 or 18 years | §2.a, p.3 | Implemented |
| Entry age | By PPT: 7→11-55, 10→8-55, 12→6-53, 15→3-50, 18→30days-47 | §2.b, p.3 | Implemented, PPT-dependent |
| Minimum age at maturity | 28 years (completed) | §2.c, p.3 | Implemented |
| Maximum age at maturity | 75 years (nearer birthday); 65 for policies via POS-LI/CPSC-SPV (not modeled) | §2.d, p.3 | Implemented (standard channel only) |
| Policy Term | By PPT: 7→17-40, 10→20-40, 12→22-40, 15→25-40, 18→28-40 | §2.e, p.3 | Implemented, PPT-dependent |
| Pay-out Period | Policy Term − PPT | §2.f, p.3 | Implemented (drives Income Benefit timing) |
| Minimum Sum Assured | Rs.3,00,000 | §2.g, p.3 | Implemented |
| Sum Assured increments | Flat multiples of Rs.10,000 | §2.i, p.3 | Implemented |
| Death Benefit | Higher of 11x annualised premium or BSA; floor 105% premiums paid | §3.A, p.4 | Implemented exactly when premium verified; BSA floor otherwise. 105% floor recorded only |
| Maturity Benefit | Sum Assured on Maturity = BSA + accrued Guaranteed Additions | §3.C, p.6 | Implemented — needs a verified premium (rate applies to Total Annualized Premium, not BSA) |
| **Guaranteed Addition** | Rs.70 per thousand Total Annualized Premium in respect of Premiums Paid, accruing ONLY during the Premium Paying Term ("no further accrual of Guaranteed Additions after Premium Paying Term") | §4, p.6 | Implemented exactly |
| Incentive for High Basic Sum Assured | Additive per-thousand rate, banded by BSA and PPT | §10.I, p.16-17 | Implemented — deterministic from BSA + PPT alone |
| Incentive for online sale / existing policyholder | Additive, needs unverifiable business-relationship context | §10.II-III, p.17-18 | Recorded only — not stacked in |
| **Regular Income Benefit** | 10% of BSA, payable annually from the end of PPT through the Pay-out Period, needing no premium at all | §3.B.i, p.5 | Implemented exactly — fully guaranteed, BSA-only |
| **Booster Income Benefit** | 70% of BSA, paid once at a PPT-dependent policy anniversary (7→12th, 10→15th, 12→17th, 15→20th, 18→23rd) | §3.B.ii, p.5-6 | Implemented exactly — fully guaranteed, BSA-only |
| Sample premium | BSA Rs.3,00,000, Policy Term 30 years, 4 ages (15/25/35/45) x 5 PPTs | §8, p.15 | Implemented as exact lookup only |
| Loan | Available after completion of first policy year | §13, p.19 | Availability implemented; amount not |
| Surrender | GSV/SSV, higher of the two, after 1-2 full years' premiums; separate GSV tables for premiums paid and accrued Guaranteed Additions | §14, p.24-28 | Availability implemented; value not |
| Tax/GST | No rate stated | §16, p.20 | Not implemented — `unavailable` |
| Riders | 5 (incl. Critical Illness Health Rider) | §5.I, p.7-9 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The 105%-of-premiums-paid death-benefit floor — needs cumulative premium history.
- Guaranteed Addition rate incentives for online sale / existing policyholder — need unverifiable business-relationship context.
- The Option to defer Regular/Booster Income Benefit — a customer election this engine's single-call context doesn't carry.
- Any premium for an age/PPT combination outside the published sample (Policy Term 30 years only).
- Exact loan/surrender amounts (only availability is modeled).
