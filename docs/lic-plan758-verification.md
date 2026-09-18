# LIC Plan 758 (New Jeevan Shanti) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's New Jeevan Shanti, Plan No. 758, UIN 512N338V08. A **Non-Par, Non-Linked, Single Premium, Individual, Savings, DEFERRED Annuity** plan — the only deferred-annuity product in this codebase; every other annuity plan here is immediate.

## Why this product needed an extra bespoke layer on top of the shared annuity engine

It reuses `annuityShared.ts` for the common eligibility/benefit/liquidity shape, but adds one field the shared module has no concept of: a **deferment period** (1-5 years) between purchase and the first annuity payment, with its own vesting-age bound (31-80). This extra layer lives in `plan758.ts`'s own `evaluateEligibility` wrapper, which calls the shared eligibility check first and then adds the deferment-period/vesting-age checks — the same "shared core + bespoke extension" pattern as `pureTermShared.ts`'s `hasIncreasingOption` flag, just for a field instead of a flag.

## Source document

`Lic_NEW_Jeevan_Shanti__2025__Eng_Singal_page_21.08.2025.pdf` — full 20-page document read in its entirety. Identity confirmed on page 2: "LIC's New Jeevan Shanti (UIN:512N338V08)". Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 30 years (last birthday) | §4, p.4 | Implemented |
| Maximum entry age | 79 years (last birthday) | §4, p.4 | Implemented |
| Minimum/Maximum Vesting Age | 31 / 80 years | §4, p.4 | Implemented via age + deferment period |
| Minimum/Maximum Deferment Period | 1 year / 5 years (subject to Maximum Vesting Age) | §4, p.4 | Implemented |
| Minimum Purchase Price | ₹1,50,000 flat, subject to minimum annuity | §4, p.4 | Implemented |
| Option 1: Deferred annuity, Single Life | — | §2, p.3 | Implemented |
| Option 2: Deferred annuity, Joint Life | — | §2, p.3 | Implemented |
| Death Benefit (both options) | Higher of [Purchase Price + Accrued Additional Benefit on Death − annuity paid to date] OR 105% of Purchase Price | §3, p.3-4 | **Only the 105%-of-Purchase-Price floor is reported.** The Accrued Additional Benefit needs the monthly-mode annuity rate per unit Purchase Price for the exact age/option/deferment — a rate this codebase only has one (yearly-mode) sample point for, so it can never be honestly computed for arbitrary inputs. Never the full "higher of" formula — same "known floor, unverified upside" convention as Plan 867's Assured Death Benefit |
| Loan | Available after 3 months, general (not option-restricted) | §12, p.12 | Implemented, verified true |
| Surrender | Available anytime; GSV/SSV, higher of the two (not option-restricted) | §11, p.11 | Implemented, verified true |
| Maturity Benefit | None under this plan | §3.b, p.4 | Deliberately never set |
| Tax/GST | No rate stated | §15, p.13-14 | Not implemented — `unavailable` |

## Capabilities

`eligibility: verified · premium: not_applicable · benefits: partial · familyProtection: partial · tax: unavailable · costs: not_applicable · liquidity: partial`

## What is deliberately NOT implemented

- The Accrued Additional Benefit on Death component — needs a monthly-mode annuity rate this codebase doesn't have for arbitrary inputs; only the 105%-of-Purchase-Price floor is ever reported.
- Any annuity amount other than the one published illustration point (₹10,00,000, age 45/deferment 5/secondary age 35, yearly) — never interpolated.
- Incentive-rate additions for higher Purchase Price / existing policyholders.
- The Guaranteed Surrender Value's exact factor table (75%/90% by policy year, §11) beyond flagging surrender as available — computing an actual surrender value needs "years elapsed" state this engine's single-call context can't carry.
