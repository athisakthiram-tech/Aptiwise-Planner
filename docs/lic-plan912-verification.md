# LIC Plan 912 (Nav Jeevan Shree) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Nav Jeevan Shree, Plan No. 912, UIN 512N387V02. A **Non-Par** plan — same "guaranteed and fixed irrespective of actual experience" structure as Amritbaal (Plan 774).

## Source document

`LIC_Nav_Jeevan_Shree_Sales_Brochure_Eng_912_151025.pdf` — fully readable, 22 pages. Identity confirmed on page 2: "LIC's Nav Jeevan Shree (UIN: 512N387V02)... Plan No.: 912". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 30 days (modeled as age 0) | §2(i), p.3 | Implemented |
| Maximum entry age | Depends on PPT: 60y (PPT 6/8/10), 59y (PPT 12), 57y (PPT 15) | §2(ii), p.3 | Implemented, PPT-dependent |
| Maturity age | 18–75y | §2(iii)(iv), p.3 | Implemented |
| Premium Paying Term | 6, 8, 10, 12 or 15 years | §2(v), p.3 | Implemented |
| Policy term (per PPT) | PPT6→10-20y; PPT8→15-20y; PPT10→15-20y; PPT12→16-20y; PPT15→18-20y | §2(vi)(vii), p.3 | Implemented, PPT-dependent range |
| Minimum Sum Assured | Rs.5,00,000 | §2(viii), p.3 | Implemented |
| Sum Assured increments | Flat multiples of Rs.10,000 | §2(x), p.3 | Implemented |
| Sum Assured on Death | 2 Options, chosen once at inception, never altered: **I** higher(7×Tabular Annual Premium×modal factor, BSA); **II** higher(10×..., BSA) | §3.A, p.4-5 | Implemented exactly when premium verified (annual mode only, modal factor = 1.0); BSA floor otherwise |
| 105%-of-premiums-paid floor | Stated for both Options | §3.A, p.5 | Recorded only — needs premium-paid history |
| Maturity benefit | Sum Assured on Maturity = BSA + accrued Guaranteed Additions | §3.B-C, p.5 | Implemented — but unlike Amritbaal, the rate applies to the **Tabular Annual Premium**, so it needs a verified premium (not BSA-only) |
| **Guaranteed Addition rate** | % of Total Tabular Annual Premium, banded by policy term: 10-13y→8.5%, 14-17y→9.0%, 18-20y→9.5% | §3.C, p.5-6 | Only the **base** rate is implemented. Incentives for high Basic Sum Assured / online sale / existing-policyholder relationship (§9, p.12-14) are recorded but **not** stacked in — they require business-relationship context this engine doesn't verify |
| Sample premium | BSA Rs.5,00,000, age 35, 9 published PPT×term combinations × 2 Options | §7, p.11-12 | Implemented as exact lookup only |
| Loan | Available after 1 full year's premium; up to 50/80% (before/after 2 years) of SV | §14, p.20 | Availability implemented; amount not |
| Surrender | GSV/SSV, higher of the two, after 1-2 full years' premiums | §13, p.18 | Availability implemented; value not |
| Tax/GST | No rate stated | §17, p.21 | Not implemented — `unavailable` |
| Riders | 4 (same set as Plan 736) | §4.I, p.6-8 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The 105%-of-premiums-paid death-benefit floor — needs cumulative premium history.
- Guaranteed Addition rate incentives (high BSA / online sale / existing policyholder) — needs business-relationship context beyond a single calculation call.
- Any premium/benefit for age/PPT/term/BSA combinations outside the 9 published sample points.
