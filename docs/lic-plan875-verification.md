# LIC Plan 875 (Yuva Term) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Yuva Term, Plan No. 875, UIN 512N355V02. A **Non-Par pure risk term plan** sold Offline through agents (unlike Digi Term's Online-only channel) — identical eligibility/term-cap structure to Digi Term (876), confirmed by comparing both brochures' published tables line-for-line, with its own premium and rebate figures. Uses the shared pure-term engine (`pureTermShared.ts`).

## Source document

`Lic_leaflet_Yuva_Term_4x9_inches_wxh_single_pages.pdf` — fully readable, 16 pages, all read. Identity confirmed on page 2: "LIC's Yuva Term (UIN: 512N355V02)". Only source used.

## Rule audit

Every structural rule (entry/maturity age range, Sum Assured bands, Premium Paying Term structure, the full age×BSA max-term table under Option II, Death Benefit formula, absence of maturity benefit, loan and surrender facts) is **identical in shape** to Digi Term (876) — see `docs/lic-plan876-verification.md` for the full rule-by-rule citation table, all independently confirmed from this plan's own brochure pages (§1-2, p.2; §2.g, p.3 for the max-term table). The only differences are:

| Rule | Digi Term (876) | Yuva Term (875) |
|---|---|---|
| Sales channel | Online only | Offline through agents/brokers/corporate agents |
| Sample premium (age 20, term 20, Regular, Option I) | Rs.3,600/year | Rs.4,550/year |
| High Sum Assured rebate (Option I, Regular/Limited, ≤30y, 5Cr+ band) | 37% | 40% |

## Rule audit (this plan's own figures)

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Entry age | 18–45 years (last birthday) | §2.a-b, p.2 | Implemented |
| Maturity age | 33–75 years (last birthday) | §2.c-d, p.2 | Implemented |
| Minimum Sum Assured | Rs.50,00,000 | §2.e, p.2 | Implemented |
| Sum Assured increments | Same 4-tier band as Digi Term | §2, p.2 | Implemented |
| Death Benefit | Same formula as Digi Term | §3.A, p.3-4 | Implemented (same caveats as Digi Term) |
| Maturity Benefit | None | §3.B, p.4 | Correctly modeled as `undefined` |
| Sample premium | BSA Rs.50,00,000, Non-Smoker Male, term 20, 3 ages, both Options, all 4 modes | §7, p.6 | Implemented as exact lookup only |
| Loan | None | §12, p.9 | Implemented as verified `false` |
| Surrender | Mode-dependent (as Digi Term) | §11, p.8-9 | Availability implemented; amount not |
| Tax/GST | No rate stated | §15, p.9 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

Same list as Digi Term (876) — see `docs/lic-plan876-verification.md`.
