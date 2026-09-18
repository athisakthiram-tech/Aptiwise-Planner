# LIC Plan 894 (Jeevan Raksha) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Jeevan Raksha, Plan No. 894, UIN 512N368V01. A **Non-Par pure risk term plan** with **no Level/Increasing Sum Assured choice** — the simplest structure in this term-protection family, using the shared pure-term engine with `hasIncreasingOption: false` (forced Option I always).

## Source document

`LIC_Jeevan_Raksha_English_Sales_brochure.pdf` — fully readable, 17 pages, all read. Identity confirmed on page 2: "LIC's Jeevan Raksha (UIN: 512N368V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Entry age | 18–45 years (last birthday) | §2, p.2 | Implemented |
| Maturity age | 33–60 years (last birthday) | §2, p.2 | Implemented |
| Minimum Sum Assured | Rs.5,00,000 | §2, p.3 | Implemented |
| Maximum Sum Assured | Rs.24,00,000 per life (aggregate across all policies with this plan for one individual) — the per-policy cap is engine-enforced only via the increment bands; the aggregate-across-policies cap is **not modeled** (needs a customer's full policy history) | §2, p.3 | Partially implemented — see limitation |
| Sum Assured increments | 5L-7L → 50,000; above 7L → 1,00,000 | §2, p.3 | Implemented |
| Premium Paying Term | Regular (=Term); Limited 10 years (Term≥15) or 15 years (Term≥20); Single | §2, p.3 | Implemented |
| Policy Term | Min 15 years; Max 42 years (subject to maximum maturity age of 60) | §2, p.3 | Implemented |
| Death Benefit | Highest of 7x annualised premium / 105% of Total Premiums Paid / Basic Sum Assured (Regular/Limited); higher of 125% Single Premium / Basic Sum Assured (Single) — **no** Level/Increasing choice, the Absolute Amount is always flat BSA | §3.A, p.4 | Implemented — `hasIncreasingOption: false` forces Option I behavior regardless of any `deathBenefitOption` supplied |
| Maturity Benefit | None | §3.B, p.4 | Correctly modeled as `undefined` |
| Sample premium | BSA Rs.5,00,000, Non-Smoker Male, term 20, 3 ages, Regular/Limited(10/15)/Single | §7, p.7 | Implemented as exact lookup only |
| High Sum Assured rebate | Percentage of tabular premium, banded by age and BSA | §8, p.7 | Recorded only — not applied |
| Loan | None | §12, p.10 | Implemented as verified `false` |
| Surrender | Mode-dependent Unexpired Risk Premium Value | §11, p.9-10 | Availability implemented; amount not |
| Tax/GST | No rate stated | §15, p.10 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The Rs.24,00,000 aggregate-across-all-policies Basic Sum Assured cap — needs a customer's full policy history with this plan.
- The 105%-of-premiums-paid (or 125%-of-single-premium) death-benefit floor — needs cumulative premium history.
- The High Sum Assured rebate — not applied to the exact-lookup premium.
- Any premium for an age/term/mode combination outside the published sample.
- Exact Unexpired Risk Premium Value amounts (only availability is modeled).
