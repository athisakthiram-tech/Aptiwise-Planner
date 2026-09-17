# LIC Plan 734 (Jeevan Tarun) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Jeevan Tarun, Plan No. 734, UIN 512N299V03. A **Par** child plan — like plan733.ts/plan736.ts, its maturity benefit is guaranteed Basic Sum Assured (or a fixed % of it) plus an undisclosed participating bonus (never fabricated). Its Premium Paying Term and Policy Term are entirely **derived from entry age**, not chosen.

## Source document

`Lic_Jeevan_Tarun_2024` sales brochure (UIN 512N299V03) — fully readable, 9 pages. Identity confirmed on page 2: "LIC's JEEVAN TARUN (UIN:512N299V03)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 30 days (modeled as age 0) | §1, p.2 | Implemented |
| Maximum entry age | 12 years (last birthday) | §1, p.2 | Implemented |
| Premium Paying Term | [20 - Age at entry] years — DERIVED, never chosen | §1(e)(f), p.2 | Implemented |
| Policy Term | [25 - Age at entry] years — DERIVED, never chosen | §1(g)(h), p.2 | Implemented |
| Minimum Sum Assured | Rs.2,00,000 | §1(i), p.2 | Implemented |
| Sum Assured increments | 2L-4.5L → 5,000; 4.5L-9L → 50,000; above 9L → 1,00,000 | §1, p.2 | Implemented |
| Death benefit | Higher of 7x annualised premium or 125% of BSA; floor 105% premiums paid | §2.A, p.3 | 125%-BSA side always computable (no premium needed); 7x-premium side only when premium verified. 105% floor recorded only |
| Survival Benefit | Fixed % of BSA at each of policy years coinciding with ages 20-24, by chosen Option (1: Nil, 2: 5%/yr, 3: 10%/yr, 4: 15%/yr) | §2.B, p.3 | Implemented exactly — Option chosen once, never altered |
| Maturity Benefit | Fixed % of BSA at age 25, complementing the Survival Benefits already paid (Option 1: 100%, 2: 75%, 3: 50%, 4: 25%) | §2.C, p.4 | Implemented (guaranteed) |
| Simple Reversionary Bonus / FAB | Participating, no rate published | §2.D, p.4 | Recorded only — never fabricated |
| Sample premium | 4 ages (0/4/8/12, BSA Rs.2L) x 4 Options | §6, p.7 | Implemented as exact lookup only |
| High Sum Assured rebate | Per-mille scale | §7, p.7 | Recorded only — no complete base-rate table to scale from |
| Loan | Available, amount not stated in extracted pages | — | Not implemented |
| Surrender | GSV/SSV, higher of the two, after 1-2 full years' premiums | §10, p.9 | Availability implemented; value not implemented |
| Tax/GST | No rate stated | — | Not implemented — `unavailable` |
| Riders | 1 (Premium Waiver Benefit Rider) | §3.I, p.4 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The 105%-of-premiums-paid death-benefit floor — needs cumulative premium history.
- High Sum Assured rebate on premium — no complete base-rate table to scale it from.
- Any premium for an age outside the 4 published sample points.
- Exact loan/surrender amounts (only availability is modeled).
