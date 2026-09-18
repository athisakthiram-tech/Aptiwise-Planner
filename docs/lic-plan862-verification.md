# LIC Plan 862 (Saral Pension) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Saral Pension, Plan No. 862, UIN 512N342V05. A **Non-Par, Non-Linked, Single Premium, Individual, Immediate Annuity** plan — one of IRDAI's "Saral" (standardised) products, so its terms are identical across every life insurer offering it.

## Why this product needed the shared annuity engine

Same shape as Plan 857 — see `lib/insurance/providers/lic/plans/annuityShared.ts`. Saral Pension is the simplest of the four annuity products: only 2 options, both Return-of-100%-Purchase-Price.

## Source document

`LIC_Saral_Pension_Sales_Brochure_4_inch_x_9_inch_Eng_1_1.pdf` — full 10-page document read in its entirety. Identity confirmed on page 2: "LIC's Saral Pension (UIN: 512N342V05)... Plan No.: 862". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 40 years (completed) | §4.i, p.3 | Implemented |
| Maximum entry age | 80 years (completed) | §4.ii, p.3 | Implemented |
| Minimum Purchase Price | "Depends on the Minimum Annuity, Option chosen and age of the Annuitant" — no flat figure published | §4.iv, p.3 | Not enforced — no flat minimum exists to check against |
| Minimum Annuity by mode | ₹12,000/yr, ₹6,000/half-yr, ₹3,000/qtr, ₹1,000/month | §4.iii, p.3 | Not enforced (same reason as 857) |
| Option I: Life Annuity with Return of 100% Purchase Price | 100% PP to nominee on death | §2/§3, p.2-3 | Implemented — always known, no lookup needed |
| Option II: Joint Life Last Survivor Annuity with Return of 100% Purchase Price | 100% PP to nominee on death of last survivor | §2/§3, p.2-3 | Implemented — same |
| Loan | Available after 6 months, general (not option-restricted) | §9, p.5 | Implemented, verified true for both options |
| Surrender | Available after 6 months, **only if the Annuitant/spouse/child is diagnosed with a specified critical illness** | §8, p.4 | Implemented as `conditional`, never a flat "yes" — this is a real-world gate beyond just the chosen option |
| Maturity Benefit | None under this plan | (no maturity section exists) | Deliberately never set |
| Tax/GST | No rate stated | §10, p.5 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: not_applicable · benefits: partial · familyProtection: partial · tax: unavailable · costs: not_applicable · liquidity: partial`

## What is deliberately NOT implemented

- Minimum Purchase Price / Minimum Annuity eligibility — no flat figure is published; only the full rate table (not available) could derive one for arbitrary inputs.
- Any annuity amount other than the one published illustration point (₹10,00,000, age 60/55, yearly) — never interpolated.
- The critical-illness diagnosis condition itself is not modeled beyond flagging surrender as conditional — this app has no medical-condition input.
- Incentive-rate additions for higher Purchase Price / online sale.
