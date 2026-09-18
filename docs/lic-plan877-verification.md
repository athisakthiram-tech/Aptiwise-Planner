# LIC Plan 877 (Yuva Credit Life) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Yuva Credit Life, Plan No. 877, UIN 512N357V01. A **Non-Par, decreasing (credit life) pure risk term plan** — the Sum Assured on Death follows a chosen-interest-rate loan-amortisation schedule rather than being level or increasing. Uses the new shared credit-life engine (`lib/insurance/providers/lic/plans/creditLifeShared.ts`), reused by Digi Credit Life (878).

## Source document

`Lic_leaflet_Yuva_Credit_4x9_inches_wxh.pdf` — fully readable, 12 pages, all read. Identity confirmed on page 2: "LIC's Yuva Credit Life (UIN: 512N357V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Entry age | 18–45 years (last birthday) | §2.a-b, p.2 | Implemented |
| Maturity age | 23–75 years (last birthday) | §2.c-d, p.2 | Implemented |
| Minimum Sum Assured | Rs.50,00,000 (a relaxed Rs.20,00,000 minimum with differential premium rates applies for housing-loan-linked purchases below Rs.50,00,000 — no differential rate table published for that band, so **not modeled**, never fabricated) | §2.e, p.2-3 | Implemented at the primary Rs.50,00,000 floor only |
| Sum Assured increments | 4-tier band: 50L-75L→1L; 75L-1.5Cr→25L; 1.5Cr-4Cr→50L; above4Cr→1Cr | §2.e, p.3 | Implemented |
| Policy Term / Premium Paying Term | A longer Policy Term unlocks progressively longer PPT choices: PPT 5 needs Term≥10; PPT 10 needs Term≥15; PPT 15 needs Term≥25; Single Premium available for Term 5-30 | §2.g, p.3 | Implemented as a cumulative-threshold function |
| **Sum Assured on Death** | Equals Basic Sum Assured at inception; thereafter follows a Risk Cover Schedule computed "on an equated yearly repayment basis" at the Policyholder's chosen interest rate (6/7/8/9/10/11/12%) | §"Key Features"/§3.A, p.2-3 | Implemented via the standard, universally-defined loan-amortisation formula: `BSA x [(1+r)^N - (1+r)^(k-1)] / [(1+r)^N - 1]` at policy year k. **Cross-checked EXACTLY against the brochure's own full 25-row published Risk Cover Schedule** (interest rate 8%, term 25 years) — every single row matches to 2 decimal places; see `tests/lic-plan877.test.ts` |
| 105%-of-premiums-paid floor | Stated for Limited Premium | §3.A, p.3 | Recorded only — needs premium-paid history |
| Maturity Benefit | None | §3.B, p.4 | Correctly modeled as `undefined` |
| Sample premium | BSA Rs.50,00,000, Male, Non-Smoker, term 25 years, interest rate 8%, 3 ages, Single + 3 Limited PPTs | §7, p.5 | Implemented as exact lookup only — at the ONE published interest rate; a different chosen rate has no matching premium and is reported unavailable |
| Early loan repayment options | Surrender cover, or continue to end of term | §4, p.4 | Recorded only — not a calculation |
| High Sum Assured rebate | Percentage of tabular premium, banded by age and BSA | §8, p.6 | Recorded only — not applied |
| Loan | None — "No loan will be available under this plan" | §12, p.7 | Implemented as verified `false` |
| Surrender | None for Limited Premium under 2-3 years paid; Unexpired Risk Premium Value otherwise | §11, p.7 | Availability implemented (mode-dependent); amount not computed |
| Tax/GST | No rate stated | §15, p.7 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The relaxed Rs.20,00,000 minimum Basic Sum Assured for housing-loan-linked purchases — no differential rate table published.
- The 105%-of-premiums-paid death-benefit floor — needs cumulative premium history.
- The High Sum Assured rebate — not applied to the exact-lookup premium.
- Any premium at an interest rate other than the ONE the sample table itself is computed at (8%) — the Sum Assured on Death schedule is fully computable at any of the 7 published rates, but the PREMIUM for a different rate is never re-derived, per this project's exact-match-only rule for premiums.
- Exact Unexpired Risk Premium Value amounts (only availability is modeled).
