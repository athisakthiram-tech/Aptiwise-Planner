# LIC Plan 886 (Protection Plus) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Protection Plus, Plan No. 886, UIN 512L361V01. A **Non-Par, Linked (unit-linked/ULIP), Life, Individual, Savings** plan.

## Why this product needed a bespoke engine, not the shared frameworks

Same paramount guardrail as Plans 867/873/749: the maturity/vesting benefit is the Unit Fund Value, which depends entirely on NAV performance — `calculateBenefits` never sets `maturityBenefit`.

Two things make this product's shape different from the other three ULIPs already in this codebase:
1. **No Guaranteed Additions feature at all** — a structural absence (the brochure's numbered sections go straight from Benefits to Optional Benefits with nothing in between), not a documentation gap.
2. **The Basic Sum Assured Multiple is a continuous customer choice within a published [min, max] band**, not a discrete pick between 2 named options like Plans 873 (7x/10x) and 749 (1.25x/10x). The band itself depends on age, Premium Paying Term (PPT) and whether Annualized Premium is above or below ₹60,000.

## Source document

`LIC_Protection_plus_Sales_brochure_English_05122025.pdf` — full 40-page document read in its entirety (the tail from p.30 onward is boilerplate: grievance/Section 45/rebates, consistent with every other brochure in this codebase). Identity confirmed on page 2: "LIC's Protection Plus (UIN: 512L361V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| PPT / Policy Term combinations | PPT 5/7/10 → Term ∈ {10,15,20,25}; PPT 15 → Term ∈ {15,20,25} | §2.i, p.3 | Implemented exactly |
| Minimum Premium by PPT/mode | PPT 5/7/10: ₹60,000/yr, ₹30,000/half-yr, ₹15,000/qtr, ₹5,000/month; PPT 15: ₹36,000/₹18,000/₹9,000/₹3,000 | §2.ii, p.3 | Implemented |
| Maximum Premium | No limit, subject to underwriting | §2.iii, p.4 | Not enforced (no ceiling to reject against) |
| Minimum Age at entry | 18 years (completed), flat for every PPT | §2.iv, p.4 | Implemented |
| Maximum Age at entry | PPT 5 → 50 years; PPT 7/10/15 → 65 years | §2.v, p.4 | Implemented per-PPT |
| Maximum Maturity Age | By Policy Term: 10→75, 15→80, 20→85, 25→90 | §2.vi, p.4 | Implemented per-term |
| Minimum Basic Sum Assured Multiple | Age < 50: 7x Annualized Premium; Age ≥ 50: 5x | §2.vii, p.4 | Implemented |
| Maximum Basic Sum Assured Multiple | Full 2D table (age band × PPT) for Annualized Premium ≥ ₹60,000; **only the PPT-15 column published** for Annualized Premium < ₹60,000 | §2.viii, p.4 | Implemented as an exact-lookup table; the upper bound is honestly left unenforced for any PPT ≠ 15 below the ₹60,000 threshold, since no figure is published for those combinations |
| Death Benefit (after risk commencement) | Highest of [BSA less Partial Withdrawals] or [Base Premium Fund Value] or [105% of Total Base Premiums paid] — plus an equivalent, separately-computed Top-up component if Top-up Premium(s) have been paid | §3.A, p.5 | Only the BSA and 105%-of-premium-at-inception floors of the BASE benefit are computed — both always known directly. Unit Fund Value is NAV-dependent and never computed. The optional Top-up component is not modeled at all |
| Guaranteed Additions | **None** — this plan has no such feature | (absent from the brochure's own section numbering) | N/A — never reported, by design |
| Fund Management Charge | 1.35% p.a. (all 6 funds); 0.50% p.a. (Discontinued Fund) | §9.D, p.19 | Implemented — the flat rate for the 6 available funds |
| Mortality Charge | Per ₹1000 Sum at Risk, by age (5 published points: 25/35/45/50/60 — this product's own rates, distinct from Plans 873/749) | §9.B, p.17-18 | Implemented as an exact-lookup-only table |
| Premium Allocation / Policy Administration / Discontinuance / Switching / Partial Withdrawal / Top-up / Misc. Charges | Tiered by policy year, premium band and/or channel | §9.A/C/E/F/H/J, p.16-21 | Recorded only — genuinely conditional, can't be represented as one number |
| Loan | None — "No loan facility shall be allowed under this plan" | §17, p.29 | Implemented as verified `false` |
| Surrender | Locked for the first 5 years (lock-in period); available after | §10, p.22-23 | Availability reported as `conditional` — no "years elapsed" input |
| Tax/GST | No rate stated | §20, p.30 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: not_applicable · benefits: partial · familyProtection: partial · tax: unavailable · costs: partial · liquidity: partial`

## What is deliberately NOT implemented

- **Any projection, prediction, or assumption of investment return, NAV performance, or maturity/vesting Unit Fund Value** — the paramount, non-negotiable limitation, same as Plans 867/873/749.
- The Maximum Basic Sum Assured Multiple for any PPT other than 15 when Annualized Premium is below ₹60,000 — no figure is published for those combinations.
- The entire Top-up Premium feature (separate fund, separate 1.25x Sum Assured, its own death-benefit component) — real and published, but a fully separate parallel structure this engine doesn't track.
- Premium Allocation / Policy Administration / Discontinuance / Switching / Partial Withdrawal / Miscellaneous Charges — real and published, but conditional on policy year, premium band and/or channel.
- Partial withdrawal mechanics and the resulting temporary BSA reduction — need ongoing policy state this engine's single-call context can't carry.
