# LIC Plan 736 (Jeevan Labh) — Rule Verification

Developer documentation. Not shown to customers.

**Product identity:** LIC's Jeevan Labh, Plan No. 736, UIN 512N304V03.
**Document type:** A Par, Non-Linked, Life, Individual, Savings Plan.

## Source documents

| Document | Readable | Used |
|---|---|---|
| Sales Brochure (`LIC_Jeevan_labh_Sales_Brochure_Eng.pdf`, doc ref `LIC/P1/2024-25/18/Eng/SB`) | Yes — full text extracted, 23 pages | Primary/only source for every rule below |
| Policy Document | Not supplied this task | Not used — anything that would require it stays `unavailable` |

Identity confirmed on page 1/2 of the brochure: "LIC's JEEVAN LABH (UIN:
512N304V03)... Plan No.: 736", matching the catalogue's existing
`lic-736` entry exactly.

## Rule audit

| Rule | Value/Formula | Source | Implementation status |
|---|---|---|---|
| Plan Number | 736 | Brochure p.1–2 | Implemented (identity) |
| UIN | 512N304V03 | Brochure p.1–2 | Implemented (identity) |
| Minimum Age at entry | 8 years (completed) | Brochure §1(b), p.2 | Implemented |
| Maximum Age at entry | 59y (Term 16) / 54y (Term 21) / 50y (Term 25), nearer birthday | Brochure §1(c), p.2 | Implemented, per-term |
| Maximum Maturity Age | 75 years (nearer birthday) | Brochure §1(d), p.2 | Implemented |
| Policy Term / PPT pairs | Only (16/10), (21/15), (25/16) | Brochure §1(a), p.2 | Implemented — no other combination allowed |
| Minimum Basic Sum Assured | Rs. 2,00,000 | Brochure §1(e), p.2 | Implemented |
| Maximum Basic Sum Assured | No limit (subject to underwriting) | Brochure §1(f), p.3 | Implemented (no upper bound enforced) |
| Sum Assured increments | Rs.2,00,000–4,50,000 → multiples of Rs.10,000; above Rs.4,50,000 → multiples of Rs.25,000 | Brochure §1(f), p.3 | Implemented |
| Premium modes | Yearly, half-yearly, quarterly, monthly (NACH only), salary deduction (SSS) | Brochure §4, p.9 | Recorded only — engine doesn't validate mode choice beyond matching the sample table's yearly mode |
| Maturity benefit | "Sum Assured on Maturity" = Basic Sum Assured, + vested Simple Reversionary Bonus + Final Additional Bonus if any | Brochure §2.B, p.4 | Implemented: guaranteed BSA component only; bonuses never fabricated |
| Death benefit / Sum Assured on Death | Higher of Basic Sum Assured or 7× Annualised Premium, + vested bonuses; never less than 105% of total premiums paid to date of death | Brochure §2.A, p.3 | Implemented: exact figure only when a verified annualised premium exists (via the premium lookup); otherwise only the guaranteed BSA floor is reported, never the complete figure |
| Minimum death-benefit floor (105% of premiums paid) | Stated but requires premium-paid history, not a single-call input | Brochure §2.A, p.3 | Recorded only — not implemented (would need cumulative premium history, out of scope) |
| Simple Reversionary Bonus | Declared annually; once declared, becomes part of guaranteed benefits; no rate published | Brochure §2.C, p.4 | Recorded only — no rate exists to compute a projected value; never fabricated |
| Final Additional Bonus | Declared only in the claim year (death/maturity); not payable under paid-up policies; no rate published | Brochure §2.C, p.4 | Recorded only — never fabricated |
| Guaranteed additions | Not a feature of this plan (participating bonus only, not guaranteed additions) | Brochure §2.C | N/A |
| Survival benefits | Not a feature of this plan (Jeevan Labh has no interim survival payouts) | Brochure §2 | N/A |
| Riders | 4 optional riders (Accidental Death & Disability 512B209V02, Accident Benefit 512B203V03, New Term Assurance 512B210V02, Premium Waiver Benefit 512B204V04) | Brochure §3.I, p.4–6 | Recorded only — no rider premium/benefit formulas implemented |
| Loan availability | Available within Surrender Value after completion of 1st policy year (≥1 full year's premium paid); max 50–80% of SV depending on status/years | Brochure §11, p.14 | Availability implemented as a verified boolean; loan amount not implemented (requires Surrender Value) |
| Surrender availability | Allowed after completion of 1st policy year (≥1 full year's premium paid); GSV after ≥2 full years, SSV after ≥1 full year; payable value = higher of GSV/SSV | Brochure §10, p.11–13 | Availability implemented as a verified boolean; surrender value not implemented (needs premiums-paid history + GSV/SSV factor tables — recorded but not wired to a single-call context) |
| Paid-up rules | Death/Maturity Paid-Up Sum Assured = full Sum Assured × (premiums paid ÷ premiums originally payable) | Brochure §9, p.11 | Recorded only — not implemented (needs premium-paid history) |
| Revival | Within 5 years of first unpaid premium; interest compounding half-yearly, rate reset periodically (9.50% p.a. for 1 May 2024–30 Apr 2025) | Brochure §8, p.10 | Recorded only — time-bound rate, not implemented |
| Grace period | 30 days (yearly/half-yearly/quarterly), 15 days (monthly) | Brochure §5, p.9 | Recorded only — not part of any calculation |
| Free-look period | 30 days from receipt of the policy document | Brochure §15, p.16 | Recorded only |
| Exclusions | Suicide within 12 months of commencement/revival — reduced payout (80% of premiums paid, or higher of that and surrender value after revival) | Brochure §16, p.16 | Recorded only — not implemented |
| Riders' effect on premium | All life-insurance riders together ≤ 30% of base premium | Brochure §3.I, p.6 | Recorded only |
| Tax wording | Statutory taxes payable by policyholder on premiums, collected separately, "as applicable from time to time"; no rate stated. "Consult your tax advisor" for income-tax benefit/implications | Brochure §14, p.15 | **Not implemented** — no general tax engine per task scope; capability stays `unavailable` |
| GST wording | Sample illustration shows "GST Rate (1st Year): Nil... currently it is exempted" — an illustration snapshot, not a guaranteed permanent rate | Brochure §17, p.16–17 | **Not implemented as a guaranteed 0** — recorded only |
| Charges/costs | No expense ratio / fund management charge / admin charge disclosed (not a market-linked product) | Brochure (whole document) | Not implemented — generic comparison already reports `not_applicable` for mutual-fund-style charges on a non-market-linked product |
| Mode rebate | Yearly 2% of Tabular Premium; Half-yearly 1%; Quarterly/Monthly/SSS Nil | Brochure §7, p.9 | Recorded only — no verified "Tabular Premium" base rate exists beyond the sample table itself, so rebates are never applied to derive new premiums |
| High Sum Assured Rebate | Nil below Rs.5L; 2.00‰ (5L–10L); 3.00‰ (10L–15L); 3.50‰ (≥15L) of B.S.A. | Brochure §7, p.10 | Recorded only — same reason as above; never used to scale/estimate a premium |
| Official sample premium (BSA Rs.2,00,000, standard lives, yearly mode, ex-tax) | 12 exact points: ages 20/30/40/50 × terms 16/21/25 | Brochure §6, p.9 | Implemented as exact lookup only — cross-checked against the independent Benefit Illustration in §17 (age 30, PT 25/PPT 16 → Rs.10,025), which matches exactly |

## Verification status summary

- **Fully implementable from this brochure:** identity, eligibility
  (age/term/PPT/sum-assured rules), the exact 12-point sample premium
  table, the guaranteed maturity component, the guaranteed death-benefit
  formula (only when an exact premium is available), and the structural
  loan/surrender availability facts.
- **Deliberately not implemented:** bonus rates (none published),
  premiums-paid-history-dependent figures (105% floor, paid-up sums,
  surrender/loan amounts), tax/GST rates, rebates (no complete base-rate
  table to apply them to).
- **Blocked entirely (policy document not supplied):** nothing above
  required it — every implemented rule is fully supported by the sales
  brochure alone.
