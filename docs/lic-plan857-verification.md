# LIC Plan 857 (Jeevan Akshay-VII) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Jeevan Akshay-VII, Plan No. 857, UIN 512N337V07. A **Non-Par, Non-Linked, Individual, Savings, Immediate Annuity** plan.

## Why this product needed the shared annuity engine, not buildStandardEngine

There is no Basic Sum Assured and no premium rate table. The customer pays a Purchase Price (mapped from the existing `annualPremium` context field) and picks one of 10 Annuity Options; the annuity amount is looked up only for the exact Purchase Price/age/mode/option combination the brochure publishes (one illustration point) — see `lib/insurance/providers/lic/plans/annuityShared.ts` for the shared conventions this and the other 3 annuity products reuse.

## Source document

`LIC_Jeevan_Akshay_VII_Sales_Brochure_4_inch_x_9_inch_Eng__20082025.pdf` — full 20-page document read in its entirety. Identity confirmed on page 2: "LIC's Jeevan Akshay-VII (UIN: 512N337V07)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 25 years (completed), subject to min Purchase Price | §4.ii, p.5 | Implemented |
| Maximum entry age | 85 years (completed); 100 years for Option F only | §4.iii, p.5 | Implemented (general 85 only — Option F's extended ceiling not modeled) |
| Minimum Purchase Price | ₹10,00,000 for ages 25-29; ₹1,00,000 (subject to min annuity) from age 30 | §4.i, p.5 | Implemented (age-banded) |
| Minimum Annuity by mode | ₹12,000/yr, ₹6,000/half-yr, ₹3,000/qtr, ₹1,000/month | §4.iv, p.6 | Not enforced — deriving it for arbitrary Purchase Price/age needs the full rate table this codebase doesn't have |
| Annuity Options A-J | 10 options (life-only, 4 guaranteed-period bands, return-of-PP, increasing 3%, 2 joint-life continuation, joint-life + return-of-PP) | §2, p.3-4 | All 10 modeled; death benefit classified per option (see below) |
| Death Benefit — Option A/G | Nothing payable, annuity ceases | §2.a, p.3 | Implemented — verified zero |
| Death Benefit — Options B/C/D/E | Nominee receives remainder of the 5/10/15/20-year guaranteed period | §2.a, p.3 | Implemented **at inception only** (full period), and only when the annuity amount itself matches the published sample |
| Death Benefit — Option F/J | 100% of Purchase Price to nominee | §2.a, p.3-4 | Implemented — always known, no lookup needed |
| Death Benefit — Options H/I | Continuation to surviving joint annuitant, not a lump sum | §2.a, p.4 | Not computed — needs "who survives" state |
| Loan | Available only under Options F and J | §13, p.14 | Implemented, per-option |
| Surrender | Available only under Options F and J | §12, p.13 | Implemented, per-option |
| Maturity Benefit | None under this plan | §3.b, p.5 | Deliberately never set |
| Tax/GST | No rate stated | §16, p.15 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: not_applicable · benefits: partial · familyProtection: partial · tax: unavailable · costs: not_applicable · liquidity: partial`

## What is deliberately NOT implemented

- Minimum Annuity-by-mode eligibility for arbitrary Purchase Price/age — needs the full rate table, which only has one published point.
- Option F's extended maximum entry age (100 vs. the general 85).
- Any annuity amount for a Purchase Price/age/mode/option combination other than the one published illustration point (₹10,00,000, age 60/55, yearly) — never interpolated or estimated.
- Joint-life continuation-to-survivor death benefit (Options H/I) — needs "who died first" state.
- Incentive-rate additions for higher Purchase Price / existing policyholders / direct sale — real and published, but they modify the base rate the engine can't otherwise compute for arbitrary inputs, so they're not layered on top of the one verified sample point.
