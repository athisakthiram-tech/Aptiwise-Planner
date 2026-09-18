# LIC Plan 879 (Smart Pension) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Smart Pension, Plan No. 879, UIN 512N386V01. A **Non-Par, Non-Linked, Individual, Savings, Immediate Annuity** plan — the widest option set of the four annuity products (22 options).

## Why this product needed the shared annuity engine

Same shape as Plan 857 — see `lib/insurance/providers/lic/plans/annuityShared.ts`. Smart Pension additionally needed the shared module's `maxEntryAgeOverride` field: three option groups (E1/E2, E3/E4/E5, F) publish a different maximum entry age than the general 85-year ceiling.

## Source document

`Smart_Pension_Individual_Sales_Brochure_Eng.pdf` — full 36-page document read in its entirety. Identity confirmed on page 2: "LIC's Smart Pension (UIN: 512N386V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 18 years (completed), same for every option | §3.f, p.4-5 | Implemented |
| Maximum entry age | 85 years general; 65 for Options E1/E2; 70 for E3/E4/E5; 100 for Option F | §3.f, p.5 | Implemented per-option |
| Minimum Purchase Price | ₹1,00,000 flat, no age band | §3.a, p.4 | Implemented |
| Annuity Options A, B1-B4, C1-C2, D, E1-E5, F, G1-G2, H1-H2, I1-I2, J | 22 options (life-only, guaranteed-period, increasing, balance-of-PP, %-early-return, return-of-PP, joint-life continuation, joint-life increasing, joint-life + return-of-PP) | §2, p.3-4 | All 22 modeled; death benefit classified per option (see below) |
| Death Benefit — Options A/C1/C2 | Nothing payable, annuity ceases (incl. increasing options) | §4.a, p.6-7 | Implemented — verified zero |
| Death Benefit — Options B1-B4 | Nominee receives remainder of the 5/10/15/20-year guaranteed period | §4.a, p.6-7 | Implemented at inception only, sample-match dependent |
| Death Benefit — Option D | Balance of Purchase Price (PP less annuities paid); at inception = full PP | §4.a, p.7 | Implemented at inception only (0 paid yet) — same "at inception" convention as Plan 867 |
| Death Benefit — Option F/J | 100%/Return of Purchase Price to nominee | §4.a, p.9-10 | Implemented — always known |
| Death Benefit — Options E1-E5 | %-of-PP early return at a milestone age, reducing the on-death benefit thereafter | §4.a, p.8-9 | Not computed — needs "how much early return already paid" state |
| Death Benefit — Options G1-G2/H1-H2/I1-I2 | Continuation to surviving joint annuitant, not a lump sum | §4.a, p.10-11 | Not computed |
| Loan | Available only under Options E1-E5, F, J (not D) | §11, p.24 | Implemented per-option |
| Surrender | Available only under Options D, E1-E5, F, J | §10, p.22-23 | Implemented per-option |
| Maturity Benefit | None under this plan | §4.b, p.12 | Deliberately never set |
| Tax/GST | No rate stated | §15, p.14 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: not_applicable · benefits: partial · familyProtection: partial · tax: unavailable · costs: not_applicable · liquidity: partial`

## What is deliberately NOT implemented

- Any annuity amount other than the one published illustration point (₹10,00,000, age 60/55, yearly, agent channel, new customer) — never interpolated.
- Options E1-E5's post-milestone reduced death benefit — genuinely state-dependent.
- Joint-life continuation death benefits (G/H/I series).
- Liquidity/Advanced Annuity/Annuity Accumulation Options (§8(b)-(d)) — real, published, but each needs ongoing elapsed-time policy state this engine's single-call context can't carry.
- Incentive-rate additions for higher Purchase Price / existing policyholders / online sale / NPS subscribers.
