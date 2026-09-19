# LIC Plan 749 (Nivesh Plus) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Nivesh Plus, Plan No. 749, UIN 512L317V02. A **Non-Par, Linked (unit-linked/ULIP), Single Premium, Life, Individual Savings** plan.

## Why this product needed a bespoke engine, not the shared frameworks

Same paramount guardrail as Plans 867/873: the maturity/vesting benefit is the Unit Fund Value, which depends entirely on NAV performance — `calculateBenefits` never sets `maturityBenefit`. Like Plan 873, this product has a genuine Basic Sum Assured that's a multiple of premium the customer chooses (1.25x or 10x Single Premium, always directly computable — no rate-table lookup needed). It is kept as its own file rather than sharing code with `plan873.ts`: the two differ enough (Single Premium only vs. all 4 payment modes; different multiples/age bands/term tables; and — unlike Plan 873 — this product's own Death Benefit formula has no 105%-of-premiums floor component at all) that a shared abstraction would cost more than it saves for just two products.

## Source document

`LIC_Nivesh_Plus__Sales_Brochure_Eng.pdf` — full 27-page document read in its entirety (the tail from p.22 onward is boilerplate: grievance/Section 45/rebates, consistent with every other brochure in this codebase). Identity confirmed on page 2: "LIC's Nivesh Plus (UIN:512L317V02)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Basic Sum Assured | Option 1: 1.25x Single Premium; Option 2: 10x Single Premium | §1.a, p.3 | Implemented — always known directly, no lookup needed |
| Minimum Age at entry | 90 days (completed), both options | §1.b, p.3 | Not enforced below whole years (this engine works in whole years) |
| Maximum Age at entry | Option 1: 70 years; Option 2: 35 years | §1.c, p.3 | Implemented per-option |
| Minimum/Maximum Maturity Age | 18 years / 85 years (Option 1) or 50 years (Option 2) | §1.d/e, p.3 | Implemented per-option |
| Policy Term | Option 1: flat 10-25 years regardless of age; Option 2: age-banded (≤25: 10-25y; 26-30: 10-20y; 31-35: fixed 10y) | §1.f, p.3 | Implemented exactly as published |
| Premium Paying Mode | Single Premium only | §1.g, p.3 | Implemented (no mode picker needed) |
| Minimum Premium | ₹1,25,000, multiples of ₹5,000 | §1.h, p.3 | Implemented |
| Maximum Premium | No limit, subject to underwriting | §1.h, p.3 | Not enforced (no ceiling to reject against) |
| Death Benefit (after risk commencement) | Higher of [Basic Sum Assured less Partial Withdrawals] or [Unit Fund Value] — **no 105%-of-premiums component at all** (unlike Plans 867/873) | §2.A, p.4 | The BSA floor is computed — always known directly. Unit Fund Value is NAV-dependent and never computed |
| Guaranteed Additions | Flat % of Single Premium, credited once at end of policy years 6/10/15/20/25 (3/4/5/6/7%) — one schedule, no premium-band branching | §3, p.4-5 | Implemented exactly — fully guaranteed, no market dependency |
| Fund Management Charge | 1.35% p.a. (all 4 funds); 0.50% p.a. (Discontinued Fund) | §7.D, p.14 | Implemented — the flat rate for the 4 available funds |
| Mortality Charge | Per ₹1000 Sum at Risk, by age (4 published points: 25/35/45/50 — no age-60 point in this brochure, unlike Plan 873's table) | §7.B, p.13-14 | Implemented as an exact-lookup-only table |
| Premium Allocation Charge | Offline 3.30%, Online 1.50% (flat, not tiered by year) | §7.A, p.13 | Recorded only — doesn't map cleanly onto any `CostStructureResult` field |
| Discontinuance / Switching / Partial Withdrawal / Misc. Charges | Tiered by policy year and/or premium band, or flat ₹100 | §7.D.ii-vi, p.14-16 | Recorded only |
| Loan | None — "No loan shall be allowed under this plan" | §14, p.19 | Implemented as verified `false` |
| Surrender | Locked for the first 5 years (lock-in period); available after | §8, p.16-17 | Availability reported as `conditional` — no "years elapsed" input |
| Tax/GST | No rate stated | §18, p.20 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: not_applicable · benefits: partial · familyProtection: partial · tax: unavailable · costs: partial · liquidity: partial`

## What is deliberately NOT implemented

- **Any projection, prediction, or assumption of investment return, NAV performance, or maturity/vesting Unit Fund Value** — the paramount, non-negotiable limitation, same as Plans 867/873.
- Premium Allocation / Discontinuance / Switching / Partial Withdrawal / Miscellaneous Charges — real and published, but conditional on policy year, premium band and/or channel.
- Mortality Charge for any age outside the 4 published points (25/35/45/50) — never interpolated.
- Partial withdrawal mechanics and the resulting temporary BSA reduction — need ongoing policy state this engine's single-call context can't carry.
