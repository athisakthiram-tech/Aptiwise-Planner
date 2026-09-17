# LIC Plan 748 (Bima Shree) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Bima Shree, Plan No. 748, UIN 512N316V03 — confirmed via UIN match against the already-audited catalogue entry (`lib/insurance/providers/lic/catalogue.ts`); the extracted brochure pages themselves print the UIN but not the plan number in the pages read. A **Par**, High-Net-worth plan with a genuinely HYBRID benefit structure: a fully guaranteed, BSA-based Guaranteed Addition (like Amritbaal/Plan 774) PLUS a separate discretionary Loyalty Addition (undisclosed rate, participating — never fabricated, like Plan 733/736's Simple Reversionary Bonus).

## Source document

`LIC_Bima_Shree_Sales_Brochure_4_inch_x_9_inch_Eng_3_1.pdf` — fully readable, 24 pages (pages 1-15 read). Identity confirmed via UIN 512N316V03 on page 2. Only source used.

## Rule audit

| Rule | Value/Formula | Source | Status |
|---|---|---|---|
| Minimum entry age | 8 years (completed) | §1.c, p.2 | Implemented |
| Policy Term | Discrete set: 14, 16, 18, 20, 24, 28 years | §1.a, p.2 | Implemented |
| Premium Paying Term | Always Policy Term - 4 years — DERIVED, never chosen | (Guaranteed Addition section wording, p.5) | Implemented |
| Maximum entry age | By Policy Term: 14→55, 16→53, 18→51, 20→49, 24→45, 28→41 (nearer birthday) | §1.d, p.2-3 | Implemented, term-dependent |
| Maximum age at maturity | 69 years (nearer birthday) — same for every term (consistent with the max-entry-age table: each pair sums to exactly 69) | §1.e, p.3 | Implemented |
| Minimum Sum Assured | Rs.10,00,000 | §1.f, p.3 | Implemented |
| Sum Assured increments | Flat multiples of Rs.50,000 | §1.g, p.3 | Implemented |
| Death Benefit | First 5 policy years: SAD + accrued GA. After 5 years but before maturity: SAD + accrued GA + Loyalty Addition (if any). SAD = higher of 125% BSA or 7x annualised premium; floor 105% premiums paid | §2.A, p.3 | 125%-BSA side of SAD always computable (no premium needed); 7x-premium side only when premium verified. Loyalty Addition never fabricated. 105% floor recorded only |
| Survival Benefit | 2 fixed-date payments, % of BSA by term (14y: 30% at yrs 10&12; 16y: 35% at 12&14; 18y: 40% at 14&16; 20y: 45% at 16&18; 24y: 45% at 20&22; 28y: 45% at 24&26) | §2.B, p.4 | Implemented exactly |
| Maturity Benefit | % of BSA by term (14y:40%, 16y:30%, 18y:20%, 20/24/28y:10%) + accrued GA + Loyalty Addition (if any). The survival % and maturity % for each term always sum to exactly 100% of BSA — cross-checked | §2.C, p.4 | Implemented (guaranteed BSA portion + GA; Loyalty Addition never fabricated) |
| **Guaranteed Addition** | Rs.50 per Rs.1,000 BSA/year for the first 5 years of PPT; Rs.55 per Rs.1,000 BSA/year from the 6th year to the end of PPT — computable from BSA + PPT alone, no premium dependency (like Plan 774) | §4, p.5 | Implemented exactly |
| Loyalty Addition | Discretionary, participating; rate never published; requires 5 completed policy years AND 5 full years' premiums paid | §3, p.4-5 | Recorded only — never fabricated |
| Sample premium | 4 ages (20/30/40/50) x up to 6 terms, BSA Rs.10,00,000 (age-50 rows for terms 20/24/28 are not published in the brochure and are simply absent, never guessed) | §8, p.11 | Implemented as exact lookup only |
| High Sum Assured rebate | Per-mille scale | §9, p.11 | Recorded only — no complete base-rate table to scale from |
| Loan | Available (facility mentioned; amount not stated in extracted pages) | Key Features, p.2 | Not implemented |
| Surrender | GSV/SSV, higher of the two, after 1-2 full years' premiums; separate GSV tables for premiums paid and accrued Guaranteed Additions | §12, p.13-15 | Availability implemented; value not |
| Tax/GST | No rate stated | — | Not implemented — `unavailable` |
| Riders | 4 (Accidental Death and Disability, Accident Benefit, New Term Assurance, Premium Waiver) | §5.I, p.5-6 | Identity recorded only |

## Capabilities

`eligibility: verified · premium: partial · benefits: partial · familyProtection: partial · tax: unavailable · costs: unavailable · liquidity: verified`

## What is deliberately NOT implemented

- The discretionary Loyalty Addition rate — never published, never fabricated.
- The 105%-of-premiums-paid death-benefit floor — needs cumulative premium history.
- High Sum Assured rebate on premium — no complete base-rate table to scale it from.
- Any premium for an age/term combination outside the published sample (including the brochure's own unpublished age-50/term-20+ cells).
- Exact loan/surrender amounts (only availability is modeled).
