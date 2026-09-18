# LIC Plan 859 (Saral Jeevan Bima) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Saral Jeevan Bima, Plan No. 859, UIN 512N341V01. A **Non-Par pure risk term plan** with no Level/Increasing Sum Assured choice (like Jeevan Raksha/894) and a **10x** (not 7x) annualised-premium multiple in its Death Benefit formula — this is the sector-standard "Saral" (simple/standardized) term plan IRDAI mandates every life insurer offer in a common format.

## Source document

`LIC_Saral_Jeevan_Bima_Sales_Brochure_30032026-ENG.pdf` — fully readable, 16 pages, all read. Identity confirmed on page 2: "LIC's Saral Jeevan Bima (UIN:512N341V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Entry age | 18–65 years (last birthday) | §2, p.4 | Implemented |
| Maturity age | Max 70 years (last birthday); **no minimum age at maturity is published** — never assumed | §2, p.4 | Implemented (max only) |
| Minimum Sum Assured | Rs.5,00,000 | §2, p.4 | Implemented |
| Maximum Sum Assured | Rs.25,00,000 per life basis (not engine-enforced — no hard ceiling stated as a rejection rule, only as an underwriting note) | §2, p.4 | Recorded only |
| Sum Assured increments | Flat multiples of Rs.50,000 (single-tier, no banding) | §2, p.4 | Implemented |
| Premium Paying Term | Regular (=Term); Limited 5 or 10 years (fixed, independent of Policy Term); Single | §2, p.4 | Implemented |
| Policy Term | 5–40 years | §2, p.4 | Implemented |
| **45-day waiting period** | Non-accidental death within 45 days of risk commencement pays only a refund of 100% of premiums received (excl. tax), NOT the Sum Assured. Accidental death in the window, or ANY death after it, pays the normal Sum Assured on Death | §1.A, p.2-3 | **Not implemented** — needs "was death accidental" and "days since commencement of risk" facts this engine's single-call context can never carry. This engine always computes the POST-waiting-period (normal) formula |
| Death Benefit (post-waiting-period) | Highest of **10x** annualised premium / 105% of Total Premiums Paid / Basic Sum Assured (Regular/Limited); higher of 125% Single Premium / Basic Sum Assured (Single). **10x, not 7x** — the only plan in this codebase with this multiple | §1.A.ii, p.3 | Implemented — no Level/Increasing choice, Absolute Amount always flat BSA (`hasIncreasingOption: false`) |
| Maturity Benefit | None | §1.B, p.3 | Correctly modeled as `undefined` |
| Sample premium | Two independent published points: (1) BSA Rs.5,00,000, age 30, term 20 — the only point with published Limited (PPT 5/10) premiums; (2) BSA Rs.10,00,000, term 25, 5 ages — Regular/Single only, kept as a separate `PLAN_859_ALT_SAMPLE_PREMIUM` export rather than merged, since the shared engine only ever matches one Basic Sum Assured per lookup | §5, p.5 | Implemented as exact lookup only, for point (1) |
| High Sum Assured rebate | Rs.5-9.5L→Nil; 10-14.5L→0.10%; 15-19.5L→0.20%; 20L+→0.25% of BSA | §6.ii, p.6 | Recorded only — not applied |
| Loan | None | §10, p.10 | Implemented as verified `false` |
| Surrender | None — instead, a distinct, explicitly-formulaed **"Policy Cancellation Value"** (70% × premiums-paid-or-single-premium × unexpired/original term ratio) replaces the usual Unexpired Risk Premium Value concept | §8-9, p.7-8 | Availability implemented (mode-dependent, same as URPV elsewhere); the exact proportional value is not computed — this engine has no "elapsed policy years" input |
| Tax/GST | No rate stated | §13, p.8 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The 45-day waiting-period reduced death benefit — needs cause-of-death and elapsed-time facts.
- The 105%-of-premiums-paid (or 125%-of-single-premium) death-benefit floor — needs cumulative premium history.
- The High Sum Assured rebate — not applied to the exact-lookup premium.
- The exact Policy Cancellation Value (though its formula is simple and published, it needs an elapsed-policy-years input this engine doesn't carry).
- Any premium for an age/term/mode combination outside the two published sample points.
