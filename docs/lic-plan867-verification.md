# LIC Plan 867 (New Pension Plus) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's New Pension Plus, Plan No. 867, UIN 512L347V01. A **Non-Par, Linked (unit-linked/ULIP), Pension, Individual Savings Plan** — the first market-linked product implemented in this codebase (`marketLinked: true` in the catalogue), and structurally the most different from every other plan here.

## Why this product needed a bespoke engine, not the shared frameworks

Every other engine in this codebase is anchored on a **Basic Sum Assured** the customer chooses and a premium the engine looks up from a published rate table. This product has **neither**:

- There is **no Basic Sum Assured at all** — the brochure's own eligibility table states "Minimum/Maximum Basic Sum Assured: Not Applicable".
- The customer chooses a **premium amount directly** (subject only to a minimum floor by payment mode) — there is no rate table to look up, so `calculatePremium` is not implemented. Capability is declared `not_applicable` (not `unavailable`) — this dimension genuinely does not exist for this product, distinct from a dimension that exists but couldn't be verified.
- The maturity/vesting benefit is the **Unit Fund Value**, which depends entirely on the NAV performance of the customer's chosen fund. The brochure itself states: *"The value of units may increase or decrease... LIC's New Pension Plus is only the name of the unit linked pension contract and does not in any way indicate the quality of the contract, its future prospects or returns."* This engine **never** computes, projects, or assumes any investment return — `calculateBenefits` never sets `maturityBenefit`. This is the single most important guardrail in `plan867.ts`.

## Source document

`LICs_New_Pension_Plus_Eng_Brochure_171025.pdf` — pages 1-38 of 48 read (the unread tail is boilerplate: QROPS/nomination/taxes/grievance sections, consistent with the tail of every other brochure in this codebase). Identity confirmed on page 2: "LIC's New Pension Plus (UIN: 512L347V01)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 25 years (last birthday) | §5.iv, p.13 | Implemented |
| Maximum entry age | 75 years (last birthday) | §5.v, p.13 | Implemented |
| Minimum Vesting Age | 35 years (last birthday) | §5.viii, p.13 | Implemented |
| Maximum Vesting Age | 85 years (last birthday) | §5.ix, p.13 | Implemented |
| Policy Term | 10–42 years (single/regular); original + extended term must not exceed 42 years if the Vesting Date is extended | §5.vii, p.13; §4.b, p.9 | Min/max implemented; the extension mechanic itself is not modeled |
| Minimum Premium | Single Rs.1,00,000; Regular Yearly Rs.30,000, Half-Yearly Rs.16,000, Quarterly Rs.9,000, Monthly (NACH only) Rs.3,000 | §5.ii, p.12 | Implemented |
| Maximum Premium | No limit, subject to underwriting | §5.iii, p.12 | Not enforced (no upper bound to reject against) |
| Death Benefit (before Vesting) | Higher of Unit Fund Value (as on date of intimation of death) or Assured Death Benefit | §2.A.i, p.3-4 | Only the Assured Death Benefit floor is computed (Unit Fund Value is NAV-dependent, never projected) |
| **Assured Death Benefit** | 105% of Total Premiums received up to the date of death, reduced by Partial Withdrawals in the preceding 2 years | §2.A.i, p.4 | Implemented **at inception only** (one premium paid) — tracking premiums paid to date needs elapsed-time state this engine's single-call context can't carry |
| Vesting (Maturity) Benefit | Unit Fund Value as on the date of Vesting, then annuitised (or partly commuted, up to 60%) | §2.B, p.5 | **Deliberately never computed** — Unit Fund Value is NAV-dependent and can never be projected without inventing a return assumption |
| **Guaranteed Additions** | A fixed % of Annual/Single Premium, added to the Unit Fund at the end of the 6th, 10th, and EVERY policy year from the 11th onward (provided all due premiums have been paid and the policy is in-force): 6th→5.00%/4.00% (Annual/Single), 10th→10.00%/5.00%, 11th-15th→4.00%/1.25%, 16th-20th→5.50%/1.50%, 21st-25th→7.00%/2.00%, 26th-30th→8.75%/2.50%, 31st-35th→10.75%/3.00%, 36th-40th→13.00%/3.75%, 41st-42nd→15.50%/4.50% | §3, p.6 | Implemented exactly — fully guaranteed and computable from premium + term alone, with NO market/NAV dependency whatsoever. Reported separately as `guaranteedAdditionsCumulative`, never combined with an invented "total fund value" |
| Fund Management Charge | 1.35% p.a. for all 4 available funds (Pension Bond/Secured/Balanced/Growth); 0.50% p.a. for the Discontinued Fund | §9.d, p.22 | Implemented — the only flat, unconditional rate |
| Mortality Charge | Nil | §9.b, p.21 | Implemented — confirmed explicitly as zero |
| Premium Allocation Charge | Tiered by policy year, premium size and channel (Offline/Online); capped at 12.50% of Annualized Premium | §9.a, p.20-21; §9.k, p.25 | Recorded only — genuinely conditional on inputs a cost-structure snapshot can't represent honestly |
| Policy Administration Charge | Formula-based (rate × instalment premium × modal factor, capped Rs.500/month), Nil from year 6 | §9.c, p.21-22 | Recorded only — same reason |
| Discontinuance Charge | Tiered by policy year (1-5) and premium band, both Regular and Single | §9.g, p.23-24 | Recorded only — same reason |
| Switching / Partial Withdrawal / Miscellaneous Charges | Rs.100 flat each (after 4 free switches/year) | §9.e/h/j, p.25 | Recorded only |
| Loan | None — "No Loan facility shall be available under this plan" | §18, p.37 | Implemented as verified `false` |
| Surrender / Withdrawal | Locked for the first 5 years (lock-in period); available after, generally requiring annuitisation of proceeds | §11, p.27-28 | Availability reported as `conditional` (not a flat true/false) — this engine has no "years elapsed since inception" input, so it cannot honestly claim either state |
| Partial Withdrawal | Allowed after the 5-year lock-in, up to 3 times, capped at 10-25% of Unit Fund Value depending on premium size, only for specific stated reasons (education, marriage, house purchase, critical illness, etc.) | §4.a, p.8-9 | Recorded only — not modeled |
| Tax/GST | No rate stated (GST applies to charges) | §21, p.38 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: not_applicable · benefits: partial · familyProtection: partial · tax: unavailable · costs: partial · liquidity: partial`

## What is deliberately NOT implemented

- **Any projection, prediction, or assumption of investment return, NAV performance, or maturity/vesting Unit Fund Value** — this is the paramount, non-negotiable limitation for this product. The brochure itself states future performance cannot be indicated.
- The 105%-Assured-Death-Benefit floor beyond inception — needs cumulative premium history.
- Premium Allocation Charge, Policy Administration Charge, Discontinuance Charge, Switching/Partial Withdrawal/Miscellaneous Charges — all real and published, but conditional on policy year, premium band, and/or channel in ways a single-number cost snapshot can't honestly represent.
- The Vesting Date extension mechanic and Partial Withdrawal eligibility/amount — need ongoing policy state this engine's single-call context can't carry.
- The Rs.24,00,000-equivalent-style aggregate caps — not applicable (no BSA), but any per-individual premium underwriting cap above the published minimum is not enforced (no ceiling is stated to reject against).
