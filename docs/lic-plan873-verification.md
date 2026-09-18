# LIC Plan 873 (Index Plus) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Index Plus, Plan No. 873, UIN 512L354V01. A **Non-Par, Linked (unit-linked/ULIP), Life, Individual Savings** plan.

## Why this product needed a bespoke engine, not the shared frameworks

Like Plan 867 (New Pension Plus), the maturity/vesting benefit is the Unit Fund Value, which depends entirely on NAV performance — the brochure itself states unit values "may increase or decrease" and that the plan name "does not in any way indicate the quality of the contract, its future prospects or returns." This engine **never** computes, projects, or assumes any investment return — `calculateBenefits` never sets `maturityBenefit`.

Unlike Plan 867, this product DOES have a genuine Basic Sum Assured — but it's a **multiple (7x or 10x) of Annualized Premium** the customer chooses, not a rate-table lookup, so it's always directly computable from the premium the customer already entered (`buildStandardEngine`'s BSA-driven mapping still doesn't fit, since there's no BSA rate table to look up — the multiple comes first, not the BSA).

## Source document

`LIC__Index_Plus_Sales_Brochure_141025.pdf` — full 36-page document read in its entirety (the tail from p.25 onward is boilerplate: grievance/Section 45/rebates, consistent with every other brochure in this codebase). Identity confirmed on page 2: "LIC's Index Plus (UIN: 512L354V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Basic Sum Assured | 7x or 10x Annualized Premium, subject to age (10x only up to age 50) | §1.i/v, p.3 | Implemented — always known directly, no lookup needed |
| Minimum Premium by mode | Yearly ₹30,000; Half-yearly ₹15,000; Quarterly ₹7,500; Monthly ₹2,500 | §1.ii, p.3 | Implemented |
| Maximum Premium | No limit, subject to underwriting | §1.iii, p.3 | Not enforced (no ceiling to reject against) |
| Minimum/Maximum Age at entry | [90 days] to 50 (10x BSA) or 60 (7x BSA) | §1.iv/v, p.3 | Implemented (min age not enforced below whole years — brochure states 90 days, this engine works in whole years) |
| Policy Term | 15-25 years if Annualized Premium < ₹48,000; 10-25 years if ≥ ₹48,000 | §1.vi, p.3 | Implemented |
| Minimum/Maximum Maturity Age | 18 / 85 (7x BSA) or 75 (10x BSA) | §1.ix/x, p.4 | Implemented |
| Death Benefit (after risk commencement) | Highest of [BSA less Partial Withdrawals], [Unit Fund Value], [105% of total premiums received less Partial Withdrawals] | §2.A, p.4-5 | Only the BSA and 105%-of-premiums-at-inception floors are computed — both always known directly, no lookup needed. Unit Fund Value is NAV-dependent and never computed |
| Guaranteed Additions | % of one Annualized Premium, credited once at end of policy years 6/10/15/20/25 (3/6/12/15/18% below ₹48,000 threshold; 5/10/20/25/30% at/above) | §3, p.5-6 | Implemented exactly — fully guaranteed, no market dependency |
| Fund Management Charge | 1.35% p.a. (both available funds); 0.50% p.a. (Discontinued Fund) | §9.D, p.15-16 | Implemented — the flat rate for the 2 available funds |
| Mortality Charge | Per ₹1000 Sum at Risk, by age (5 published points: 25/35/45/50/60) | §9.B, p.14 | Implemented as an exact-lookup-only table — every other age stays `unavailable` rather than interpolated |
| Premium Allocation / Policy Administration / Discontinuance / Switching / Partial Withdrawal / Misc. Charges | Tiered by policy year, premium band and/or channel | §9.A/C/H/F/G/J, p.14-17 | Recorded only — genuinely conditional, can't be represented as one number |
| Loan | None — "No loan facility shall be available under this plan" | §18, p.24 | Implemented as verified `false` |
| Surrender | Locked for the first 5 years (lock-in period); available after | §10, p.19-20 | Availability reported as `conditional` — no "years elapsed" input |
| Refund of Mortality Charges at maturity | Sum of Mortality Charges deducted, provided all premiums paid | §2.C, p.5 | Not implemented — depends on Sum at Risk each month, which is itself Unit-Fund-Value-dependent |
| Tax/GST | No rate stated | §21, p.27-28 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: not_applicable · benefits: partial · familyProtection: partial · tax: unavailable · costs: partial · liquidity: partial`

## What is deliberately NOT implemented

- **Any projection, prediction, or assumption of investment return, NAV performance, or maturity/vesting Unit Fund Value** — the paramount limitation, same as Plan 867.
- The 105%-of-premiums death benefit floor beyond inception (one premium paid) — needs cumulative premium history.
- Refund of Mortality Charges at maturity — depends on the Unit Fund Value each month, which can't be projected.
- Premium Allocation / Policy Administration / Discontinuance / Switching / Partial Withdrawal / Miscellaneous Charges — real and published, but conditional on policy year, premium band and/or channel.
- Mortality Charge for any age outside the 5 published points (25/35/45/50/60) — never interpolated.
- The Vesting/Revival mechanics and Partial Withdrawal eligibility — need ongoing policy state this engine's single-call context can't carry.
