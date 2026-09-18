# LIC Plan 878 (Digi Credit Life) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Digi Credit Life, Plan No. 878, UIN 512N358V01. A **Non-Par, Online-only decreasing (credit life) pure risk term plan** — identical eligibility/term/Sum-Assured-on-Death structure to Yuva Credit Life (877), confirmed by comparing both brochures' published tables line-for-line, with its own (cheaper, Online) premium figures. Uses the shared credit-life engine (`creditLifeShared.ts`).

## Source document

`LIC_Digi_Credit_Sales_Brochure_4_inch_x_9_inch_Eng.pdf` — fully readable, 10 pages, all read. Identity confirmed on page 2: "LIC's Digi Credit Life (512N358V01)". Only source used.

## Rule audit

Every structural rule (entry/maturity age range, Sum Assured bands, the cumulative-threshold Premium Paying Term rule, and — most importantly — the Risk Cover Schedule amortisation formula and its published 25-row sample table for interest rate 8%/term 25) is **identical, row-for-row**, to Yuva Credit Life (877) — this document's own published Risk Cover Schedule table (§7, p.4) reproduces the exact same 25 values (1000.00, 986.32, 971.55, ..., 86.74) as Yuva Credit Life's, confirming both plans share the same underlying LIC amortisation mechanics, just sold through different channels. See `docs/lic-plan877-verification.md` for the full rule-by-rule citation table and the formula's cross-check.

The only differences are:

| Rule | Yuva Credit Life (877) | Digi Credit Life (878) |
|---|---|---|
| Sales channel | Offline through agents/brokers/corporate agents | Online only |
| Sample premium (age 20, term 25, Single, interest 8%) | Rs.40,900 | Rs.34,550 |
| High Sum Assured rebate (Limited, ≤30y, 5Cr+ band) | 37% | 33% |

## Rule audit (this plan's own figures)

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Entry age | 18–45 years (last birthday) | §2.a-b, p.2 | Implemented |
| Maturity age | 23–75 years (last birthday) | §2.c-d, p.2 | Implemented |
| Minimum Sum Assured | Rs.50,00,000 | §2.e, p.2 | Implemented |
| Sum Assured on Death | Same amortisation-schedule formula as Yuva Credit Life | §"Key Features"/§3.A, p.2-3 | Implemented and cross-checked against this plan's own published 25-row schedule — exact match |
| Maturity Benefit | None | §3.B, p.3 | Correctly modeled as `undefined` |
| Sample premium | BSA Rs.50,00,000, Male, Non-Smoker, term 25, interest 8%, 3 ages, Single + 3 Limited PPTs | §7, p.4 | Implemented as exact lookup only |
| Loan | None | §12, p.6 | Implemented as verified `false` |
| Surrender | Mode-dependent | §11, p.5 | Availability implemented; amount not |
| Tax/GST | No rate stated | §15, p.6 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

Same list as Yuva Credit Life (877) — see `docs/lic-plan877-verification.md`.
