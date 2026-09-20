# LIC Return Model Audit — Phase 1

For each plan: how the customer pays, how they receive money, what is guaranteed vs non-guaranteed vs market-linked, whether IRR can currently be calculated, and what data is missing.

## ENDOWMENT

### Single Premium Endowment Plan (Plan 717, 512N283V03)

- **How customer pays:** SINGLE premium. One lump-sum premium at inception; the registered engine resolves it only for the exact published sample age/term rows.
- **How customer receives money:** MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** Sum Assured on Maturity is a guaranteed, fixed multiple of the single premium paid. Guaranteed death benefit at a fixed multiple of the single premium, at least equal to 125% of it.
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** Yes — Both the outflow and the guaranteed maturity value are known once a sample premium resolves, so an IRR is calculable and would itself be VERIFIED (every contributing cash flow is guaranteed).
- **Premium calculation status:** SAMPLE_ONLY

### New Endowment Plan (Plan 714, 512N277V03)

- **How customer pays:** REGULAR premium. Level premiums for the full policy term; the registered engine resolves them only at published sample age/term rows.
- **How customer receives money:** MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED); FINAL_ADDITIONAL_BONUS (NON_GUARANTEED)
- **Guaranteed:** Sum Assured on Maturity equals the Basic Sum Assured, guaranteed. Guaranteed death benefit, at least the Basic Sum Assured.
- **Non-guaranteed:** Simple Reversionary Bonus, declared annually by LIC — not guaranteed, no rate published in this repository's verified data. Final Additional Bonus, payable on a claim in later years — not guaranteed, no rate published.
- **Market-linked:** None
- **IRR currently calculable:** No — An IRR using only the guaranteed BSA-at-maturity figure would understate the true return (bonuses are real but unpublished); an IRR including an assumed bonus would be fabricated. Not currently calculable without inventing a bonus rate.
- **Premium calculation status:** SAMPLE_ONLY

### New Jeevan Anand (Plan 715, 512N279V03)

- **How customer pays:** REGULAR premium. Level premiums for the full policy term; the registered engine resolves them only at published sample age/term rows.
- **How customer receives money:** MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED); FINAL_ADDITIONAL_BONUS (NON_GUARANTEED)
- **Guaranteed:** Sum Assured on Maturity equals the Basic Sum Assured, guaranteed. An enhanced death benefit — a multiple of Basic Sum Assured — payable on death, a distinguishing feature of this plan versus a plain endowment.
- **Non-guaranteed:** Simple Reversionary Bonus, declared annually — not guaranteed. Final Additional Bonus in later policy years — not guaranteed.
- **Market-linked:** None
- **IRR currently calculable:** No — Same bonus-rate limitation as Plan 714 — total return depends on unpublished non-guaranteed bonuses.
- **Premium calculation status:** SAMPLE_ONLY

### Jeevan Lakshya (Plan 733, 512N297V03)

- **How customer pays:** LIMITED premium. Premiums stop 3 years before the policy term ends — a genuine limited-pay structure aimed at goal-horizon planning (Jeevan Lakshya is explicitly marketed for child-goal planning, though this model reasons from its mechanics, not that marketing).
- **How customer receives money:** MATURITY (GUARANTEED); INCOME (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED); FINAL_ADDITIONAL_BONUS (NON_GUARANTEED)
- **Guaranteed:** Sum Assured on Maturity equals the Basic Sum Assured, guaranteed. On death during the policy term, in addition to the death benefit, an annual income equal to 10% of Sum Assured is paid to the nominee from the date of death until the end of the policy term — a distinguishing income-continuation feature. Guaranteed death benefit, at least the Basic Sum Assured.
- **Non-guaranteed:** Simple Reversionary Bonus — not guaranteed. Final Additional Bonus in later years — not guaranteed.
- **Market-linked:** None
- **IRR currently calculable:** No — Bonus rate unpublished, same limitation as other participating endowments.
- **Premium calculation status:** SAMPLE_ONLY

### Jeevan Labh (Plan 736, 512N304V03)

- **How customer pays:** LIMITED premium. Premiums payable for a meaningfully shorter period than the policy term (10/15/16 years vs. 16/21/25), freeing capacity in the later years before maturity.
- **How customer receives money:** MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED); FINAL_ADDITIONAL_BONUS (NON_GUARANTEED)
- **Guaranteed:** Sum Assured on Maturity equals the Basic Sum Assured, guaranteed. Death benefit is the higher of Basic Sum Assured or 7x annualised premium, plus vested bonuses; never less than the BSA floor.
- **Non-guaranteed:** Simple Reversionary Bonus — not guaranteed. Final Additional Bonus — not guaranteed.
- **Market-linked:** None
- **IRR currently calculable:** No — Bonus rate unpublished.
- **Premium calculation status:** SAMPLE_ONLY

### Amritbaal (Plan 774, 512N365V02)

- **How customer pays:** REGULAR premium. Only ONE exact brochure sample point is published in this repository's verified data — every other configuration is honestly unresolved, not estimated by scaling (a single point can't defensibly support nearby-age or nearby-BSA scaling with confidence).
- **How customer receives money:** MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** Sum Assured on Maturity, guaranteed, chosen from one of several death-benefit options. Guaranteed death benefit per the chosen option (I-IV).
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** No — Only one published sample premium point exists in this repository's verified data — not enough coverage to build a reliable cash-flow/IRR analysis for arbitrary customer ages.
- **Premium calculation status:** SAMPLE_ONLY

### Nav Jeevan Shree (Plan 912, 512N387V02)

- **How customer pays:** LIMITED premium. PPT is a genuine, independently-priced choice among several published options (6/8/10/12/15 years) for a given term — already correctly matched by the registered engine.
- **How customer receives money:** MATURITY (GUARANTEED); GUARANTEED_ADDITION (GUARANTEED); LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** Sum Assured on Maturity equals the Basic Sum Assured, guaranteed. A fixed, guaranteed rate-per-thousand-BSA Guaranteed Addition, distinct from the participating bonus other endowments in this list carry. Guaranteed death benefit per the chosen option (I/II).
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** Yes — Because the Guaranteed Addition is itself GUARANTEED (unlike a participating plan's bonus), the total maturity value is fully known once a premium resolves — an IRR here would be VERIFIED, not illustrative, unlike Plans 714/715/733/736.
- **Premium calculation status:** SAMPLE_ONLY

### Bima Lakshmi (Plan 881, 512N389V01)

- **How customer pays:** LIMITED premium. PPT is an independent choice (7-15 years), already correctly matched by the registered engine.
- **How customer receives money:** MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** Guaranteed maturity benefit under a chosen survival-benefit option. Guaranteed death benefit under the chosen option.
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** Yes — Non-participating with guaranteed benefits under each option — an IRR would be VERIFIED once a sample premium resolves.
- **Premium calculation status:** SAMPLE_ONLY

### New Jeevan Sathi - Single Premium (Plan 888, 512N393V01)

- **How customer pays:** SINGLE premium. Single premium; no ongoing Premium Paying Term.
- **How customer receives money:** MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED); FINAL_ADDITIONAL_BONUS (NON_GUARANTEED)
- **Guaranteed:** Guaranteed maturity benefit. Guaranteed death benefit.
- **Non-guaranteed:** Simple Reversionary Bonus — not guaranteed. Final Additional Bonus — not guaranteed.
- **Market-linked:** None
- **IRR currently calculable:** No — Bonus rate unpublished for the non-guaranteed portion; the guaranteed-only IRR would understate true return.
- **Premium calculation status:** SAMPLE_ONLY

### New Jeevan Sathi - Limited Premium (Plan 889, 512N394V01)

- **How customer pays:** LIMITED premium. Premiums payable for meaningfully less than the full term (5 of 15, 10 of 20, or 15 of 25 years).
- **How customer receives money:** MATURITY (GUARANTEED); GUARANTEED_ADDITION (GUARANTEED); LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** Guaranteed maturity benefit under the chosen option. A guaranteed, premium-based Guaranteed Addition accruing for the full policy term. Guaranteed death benefit under the chosen option (I/II).
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** Yes — The Guaranteed Addition is itself guaranteed, so total maturity value is fully known once premium resolves — an IRR would be VERIFIED.
- **Premium calculation status:** SAMPLE_ONLY

### New Bima Jyoti (Plan 890, 512N395V01)

- **How customer pays:** LIMITED premium. Premiums stop 5 years before maturity, freeing capacity in the final years.
- **How customer receives money:** MATURITY (GUARANTEED); GUARANTEED_ADDITION (GUARANTEED); LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** Sum Assured on Maturity equals the Basic Sum Assured plus a guaranteed Guaranteed Addition. A fixed, guaranteed base rate-per-thousand-BSA Guaranteed Addition, with a High-Sum-Assured incentive rate for larger BSA and longer PPT bands. Guaranteed death benefit — the higher of 125% BSA or 7x annualised premium.
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** Yes — Non-participating with a fully guaranteed Guaranteed Addition — an IRR would be VERIFIED once premium resolves.
- **Premium calculation status:** SAMPLE_ONLY

### Bima Platinum (Plan 770, 512N397V01)

- **How customer pays:** LIMITED premium. 5 independent PPT choices for the one published 30-year term.
- **How customer receives money:** MATURITY (GUARANTEED); GUARANTEED_ADDITION (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED); FINAL_ADDITIONAL_BONUS (NON_GUARANTEED)
- **Guaranteed:** Guaranteed maturity benefit. A guaranteed, premium-based Guaranteed Addition. Guaranteed death benefit.
- **Non-guaranteed:** Simple Reversionary Bonus — not guaranteed. Final Additional Bonus — not guaranteed.
- **Market-linked:** None
- **IRR currently calculable:** No — A participating bonus applies alongside the guaranteed Guaranteed Addition; unpublished bonus rate limits full IRR confidence.
- **Premium calculation status:** SAMPLE_ONLY

## WHOLE LIFE

### Jeevan Umang (Plan 745, 512N312V03)

- **How customer pays:** LIMITED premium. Premiums are payable for a chosen limited term, after which a recurring survival benefit begins — the defining income-orientation of this product.
- **How customer receives money:** SURVIVAL (GUARANTEED); MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED)
- **Guaranteed:** An annual survival benefit, a percentage of Basic Sum Assured, payable every year after the Premium Paying Term completes, continuing until maturity/whole-life cover ends — the product's central income mechanic. A whole-life/maturity benefit payable at the end of cover (around age 100). A guaranteed death benefit payable at any time during the whole-life cover period, in addition to (not instead of) the accumulated survival benefits already paid.
- **Non-guaranteed:** A participating Simple Reversionary Bonus — not guaranteed, rate not verified in this repository.
- **Market-linked:** None
- **IRR currently calculable:** No — No registered engine exists to produce a verified premium, so a defensible cash-flow-based IRR cannot yet be built for this product.
- **Premium calculation status:** NOT_YET_ESTIMATABLE

### Jeevan Utsav (Plan 771, 512N363V02)

- **How customer pays:** LIMITED premium. A shorter limited Premium Paying Term than Jeevan Umang is typical of this product's design, again followed by recurring benefits.
- **How customer receives money:** INCOME (GUARANTEED); OTHER_CONTRACTUAL_BENEFIT (GUARANTEED); GUARANTEED_ADDITION (GUARANTEED); LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** Under the Regular Income Benefit variant, a guaranteed income begins a short period after the Premium Paying Term completes and continues to around age 100. Under the Flexi Income Benefit variant, the customer can choose to accumulate the income benefit (with guaranteed additions) instead of drawing it immediately, adding flexibility this product's Regular variant doesn't have. Guaranteed Additions accrue during the Premium Paying Term, a guaranteed (not participating-bonus-dependent) component distinguishing it from a plain participating endowment. A guaranteed death benefit throughout the whole-life cover period.
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** No — No registered engine exists yet; the Flexi variant's accumulation-with-guaranteed-additions option is a genuinely guaranteed cash flow once premium data is verified, which could support a VERIFIED IRR in a future pass.
- **Premium calculation status:** NOT_YET_ESTIMATABLE

### Jeevan Utsav Single Premium (Plan 883, 512N392V01)

- **How customer pays:** SINGLE premium. One premium at inception; income begins after a defined period, per the Regular/Flexi variant chosen.
- **How customer receives money:** INCOME (GUARANTEED); OTHER_CONTRACTUAL_BENEFIT (GUARANTEED); LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** Under the Regular Income Benefit variant, guaranteed recurring income begins after a defined period from the single premium. Under the Flexi Income Benefit variant, income can be accumulated instead of drawn, with guaranteed additions. A guaranteed whole-life death benefit, funded entirely by the single premium.
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** No — No registered engine exists yet for this product.
- **Premium calculation status:** NOT_YET_ESTIMATABLE

## MONEY BACK

### Bima Shree (Plan 748, 512N316V03)

- **How customer pays:** LIMITED premium. Premiums stop 4 years before the policy term ends.
- **How customer receives money:** SURVIVAL (GUARANTEED); MATURITY (GUARANTEED); GUARANTEED_ADDITION (GUARANTEED); LOYALTY_ADDITION (NON_GUARANTEED); LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** Two scheduled survival benefit payments (a percentage of Basic Sum Assured) at fixed points during the policy term — the exact percentage/years vary by the chosen policy term. A final maturity payment (the remaining percentage of Basic Sum Assured) at the end of the policy term, together with accrued Guaranteed Additions. A fixed, guaranteed rate-per-thousand-BSA Guaranteed Addition, computable from Basic Sum Assured and Premium Paying Term alone — no premium dependency, unlike this catalogue's premium-based Guaranteed Addition plans. Guaranteed death benefit, the higher of 125% BSA or 7x annualised premium.
- **Non-guaranteed:** A discretionary, participating Loyalty Addition — rate never published, not modeled with any number.
- **Market-linked:** None
- **IRR currently calculable:** Yes — The Guaranteed Addition is itself guaranteed and BSA/PPT-based (not premium-dependent), so the guaranteed portion of total value is knowable once BSA/PPT are fixed — an IRR using only guaranteed cash flows (excluding the discretionary Loyalty Addition) would be VERIFIED.
- **Premium calculation status:** SAMPLE_ONLY

### Jeevan Tarun (Plan 734, 512N299V03)

- **How customer pays:** REGULAR premium. Sample premiums are published for exactly 4 entry ages (0, 4, 8, 12) across 4 survival-benefit options — the registered engine never reads a customer-supplied term/PPT since neither is an independent choice for this plan.
- **How customer receives money:** SURVIVAL (GUARANTEED); MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED)
- **Guaranteed:** Scheduled survival benefit payments at intervals from age 20 onward (exact schedule depends on the chosen option 1-4), each a percentage of Basic Sum Assured. A final maturity payment, together with vested bonuses, at the end of the (age-derived) policy term. Guaranteed death benefit, at least the Basic Sum Assured, payable if the child life assured dies during the term.
- **Non-guaranteed:** Simple Reversionary Bonus — not guaranteed.
- **Market-linked:** None
- **IRR currently calculable:** No — Bonus rate unpublished for the non-guaranteed portion; only 4 entry ages have published sample premiums, limiting broad IRR coverage today.
- **Premium calculation status:** SAMPLE_ONLY

### New Money Back Plan - 20 Years (Plan 720, 512N280V03)

- **How customer pays:** REGULAR premium. Level premiums for the full 20-year term.
- **How customer receives money:** SURVIVAL (GUARANTEED); MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED)
- **Guaranteed:** Scheduled survival benefit payments (a percentage of Basic Sum Assured) at fixed intervals during the 20-year term — LIC's well-documented money-back cash-flow design. A final maturity payment (the remaining percentage of Basic Sum Assured) plus vested bonuses at the end of the term. Guaranteed death benefit — the full Basic Sum Assured, regardless of survival benefits already paid.
- **Non-guaranteed:** Simple Reversionary Bonus — not guaranteed.
- **Market-linked:** None
- **IRR currently calculable:** No — No registered engine exists yet for this product.
- **Premium calculation status:** NOT_YET_ESTIMATABLE

### New Money Back Plan - 25 Years (Plan 721, 512N278V03)

- **How customer pays:** REGULAR premium. Level premiums for the full 25-year term.
- **How customer receives money:** SURVIVAL (GUARANTEED); MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED)
- **Guaranteed:** A greater number of scheduled survival benefit payments than the 20-year variant, spread across the longer 25-year term. A final maturity payment plus vested bonuses at the end of the term. Guaranteed full-BSA death benefit throughout the term, unaffected by survival benefits already paid.
- **Non-guaranteed:** Simple Reversionary Bonus — not guaranteed.
- **Market-linked:** None
- **IRR currently calculable:** No — No registered engine exists yet for this product.
- **Premium calculation status:** NOT_YET_ESTIMATABLE

### New Children's Money Back Plan (Plan 732, 512N296V03)

- **How customer pays:** REGULAR premium. Funded by the parent/guardian on behalf of the child.
- **How customer receives money:** SURVIVAL (GUARANTEED); MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED); SIMPLE_REVERSIONARY_BONUS (NON_GUARANTEED)
- **Guaranteed:** Scheduled survival benefit payments at intervals tied to the child's growing-up milestones (exact schedule not verified in this repository). A final maturity payment plus vested bonuses at the end of the term. Guaranteed death benefit on the child; commonly available alongside a Premium Waiver Benefit rider that continues the policy's benefits if the proposer/parent dies during the term.
- **Non-guaranteed:** Simple Reversionary Bonus — not guaranteed.
- **Market-linked:** None
- **IRR currently calculable:** No — No registered engine exists yet for this product.
- **Premium calculation status:** NOT_YET_ESTIMATABLE

## PENSION

### New Pension Plus (Plan 867, 512L347V01)

- **How customer pays:** CUSTOMER_CHOSEN premium. The customer chooses the premium directly; there is no rate table to consult.
- **How customer receives money:** OTHER_CONTRACTUAL_BENEFIT (GUARANTEED); MARKET_LINKED_FUND_VALUE (MARKET_LINKED)
- **Guaranteed:** Guaranteed Additions and an Assured Death Benefit floor are fully computable from the chosen premium via a published formula.
- **Non-guaranteed:** None
- **Market-linked:** The vesting/maturity Unit Fund Value depends on market performance and is never projected as a guaranteed figure.
- **IRR currently calculable:** No — The Unit Fund Value component is inherently market-dependent — any IRR would have to include that non-guaranteed leg and could never be labeled VERIFIED.
- **Premium calculation status:** ESTIMABLE
- **ULIP historical performance data:** None available
- **ULIP official illustration:** Not modeled in this repository
- **ULIP charges data:** Fund Management Charge, Mortality Charge
- **ULIP fund-value calculation capability:** Market-dependent, never projected as guaranteed.

### Jeevan Akshay-VII (Plan 857, 512N337V07)

- **How customer pays:** SINGLE premium. The customer chooses the Purchase Price directly; LIC then applies its own annuity rate for the chosen option to determine the recurring payout — that rate table is not verified in this repository.
- **How customer receives money:** ANNUITY (GUARANTEED)
- **Guaranteed:** A guaranteed recurring annuity payment, beginning immediately, at the rate LIC applies for the chosen option (Life Annuity, Life Annuity with Return of Purchase Price, Joint Life, etc.) — the exact per-option rate is not verified in this repository.
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** No — The annuity rate per option is not verified in this repository, so the recurring payment amount (and hence an IRR) cannot yet be defensibly calculated for an arbitrary Purchase Price.
- **Premium calculation status:** ESTIMABLE

### New Jeevan Shanti (Plan 758, 512N338V08)

- **How customer pays:** SINGLE premium. The customer chooses the Purchase Price and the deferment period; the resulting recurring annuity rate is not verified in this repository.
- **How customer receives money:** ANNUITY (GUARANTEED)
- **Guaranteed:** A guaranteed recurring annuity payment beginning after the chosen deferment period, at the rate LIC applies for the chosen option — the exact rate is not verified in this repository.
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** No — The deferred-annuity rate table is not verified in this repository.
- **Premium calculation status:** ESTIMABLE

### Saral Pension (Plan 862, 512N342V05)

- **How customer pays:** SINGLE premium. The customer chooses the Purchase Price directly.
- **How customer receives money:** ANNUITY (GUARANTEED)
- **Guaranteed:** A guaranteed recurring annuity payment, beginning immediately, at the standard rate LIC applies for this simplified plan's options — the exact rate is not verified in this repository.
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** No — Annuity rate table not verified in this repository.
- **Premium calculation status:** ESTIMABLE

### Smart Pension (Plan 879, 512N386V01)

- **How customer pays:** SINGLE premium. The customer chooses the Purchase Price directly; several annuity options have their own maximum-entry-age override.
- **How customer receives money:** ANNUITY (GUARANTEED)
- **Guaranteed:** A guaranteed recurring annuity payment, beginning immediately, at the rate LIC applies for the chosen option — the exact rate is not verified in this repository.
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** No — Annuity rate table not verified in this repository.
- **Premium calculation status:** ESTIMABLE

## ULIP

### Index Plus (Plan 873, 512L354V01)

- **How customer pays:** REGULAR premium. The customer chooses the Annualized Premium directly; Basic Sum Assured is then always directly computable as a formula (7x or 10x) of that choice — no rate-table lookup is ever needed for this step.
- **How customer receives money:** MARKET_LINKED_FUND_VALUE (MARKET_LINKED); OTHER_CONTRACTUAL_BENEFIT (GUARANTEED)
- **Guaranteed:** Basic Sum Assured is a customer-chosen multiple (7x or 10x) of Annualized Premium — always exactly computable, a formula not an estimate.
- **Non-guaranteed:** None
- **Market-linked:** The Unit Fund Value depends on the performance of the customer's chosen fund(s) and is never projected as a guaranteed figure.
- **IRR currently calculable:** No — The Fund Value leg is inherently market-dependent; any IRR would be, at best, ILLUSTRATIVE (a what-if scenario), never VERIFIED.
- **Premium calculation status:** ESTIMABLE
- **ULIP historical performance data:** None available
- **ULIP official illustration:** Not modeled in this repository
- **ULIP charges data:** Fund Management Charge, Mortality Charge
- **ULIP fund-value calculation capability:** Market-dependent, never projected as guaranteed.

### Nivesh Plus (Plan 749, 512L317V02)

- **How customer pays:** SINGLE premium. The customer chooses the Single Premium directly; Basic Sum Assured is then always directly computable as a formula (1.25x or 10x) of that choice.
- **How customer receives money:** MARKET_LINKED_FUND_VALUE (MARKET_LINKED); OTHER_CONTRACTUAL_BENEFIT (GUARANTEED)
- **Guaranteed:** Basic Sum Assured is a customer-chosen multiple (1.25x or 10x) of the Single Premium — always exactly computable.
- **Non-guaranteed:** None
- **Market-linked:** The Unit Fund Value depends on fund performance and is never projected as guaranteed.
- **IRR currently calculable:** No — The Fund Value leg is inherently market-dependent; any IRR would be at best ILLUSTRATIVE.
- **Premium calculation status:** ESTIMABLE
- **ULIP historical performance data:** None available
- **ULIP official illustration:** Not modeled in this repository
- **ULIP charges data:** Fund Management Charge, Mortality Charge
- **ULIP fund-value calculation capability:** Market-dependent, never projected as guaranteed.

### Protection Plus (Plan 886, 512L361V01)

- **How customer pays:** REGULAR premium. The customer chooses the Annualized Premium and a BSA multiple within a published band; Basic Sum Assured is then always directly computable.
- **How customer receives money:** MARKET_LINKED_FUND_VALUE (MARKET_LINKED); OTHER_CONTRACTUAL_BENEFIT (GUARANTEED)
- **Guaranteed:** Basic Sum Assured is a customer-chosen multiple (within a published band) of Annualized Premium — always exactly computable.
- **Non-guaranteed:** None
- **Market-linked:** The Unit Fund Value depends on fund performance and is never projected as guaranteed.
- **IRR currently calculable:** No — The Fund Value leg is inherently market-dependent; any IRR would be at best ILLUSTRATIVE. No Guaranteed Additions exist on this product to offset that (unlike some traditional plans' guaranteed accrual).
- **Premium calculation status:** ESTIMABLE
- **ULIP historical performance data:** None available
- **ULIP official illustration:** Not modeled in this repository
- **ULIP charges data:** Fund Management Charge, Mortality Charge
- **ULIP fund-value calculation capability:** Market-dependent, never projected as guaranteed.

### SIIP (Plan 752, 512L334V02)

- **How customer pays:** CUSTOMER_CHOSEN premium. Like this catalogue's other ULIPs, premium is expected to be a direct customer choice, with Basic Sum Assured as a formula-derived multiple — the exact multiple/bands are not yet verified in this repository.
- **How customer receives money:** MARKET_LINKED_FUND_VALUE (MARKET_LINKED)
- **Guaranteed:** None
- **Non-guaranteed:** None
- **Market-linked:** The Unit Fund Value depends on fund performance and is never projected as guaranteed.
- **IRR currently calculable:** No — No registered engine exists yet for this product; charges/fund mechanics are not verified in this repository.
- **Premium calculation status:** ESTIMABLE
- **ULIP historical performance data:** None available
- **ULIP official illustration:** Not modeled in this repository
- **ULIP charges data:** Not verified
- **ULIP fund-value calculation capability:** Market-dependent, never projected as guaranteed.

## MICRO

### Micro Bachat (Plan 751, 512N329V03)

- **How customer pays:** REGULAR premium. Designed for small, affordable premium amounts (the 'micro' segment), but exact minimums are not verified in this repository.
- **How customer receives money:** MATURITY (GUARANTEED); LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** A maturity benefit at the end of the policy term — a savings component distinguishing this from a pure micro-protection plan, though the exact benefit formula is not verified in this repository. A guaranteed death benefit, sized for the micro-insurance segment (small Sum Assured).
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** No — No registered engine exists yet; exact benefit formula not verified in this repository.
- **Premium calculation status:** NOT_YET_ESTIMATABLE

### Jan Suraksha (Plan 880, 512N388V01)

- **How customer pays:** REGULAR premium. Designed for the micro-insurance segment; exact mechanics not verified in this repository.
- **How customer receives money:** LIFE_PROTECTION (GUARANTEED)
- **Guaranteed:** A guaranteed death benefit sized for the micro-insurance segment. Whether a maturity/savings benefit also exists is NOT verified in this repository — do not assume either way.
- **Non-guaranteed:** None
- **Market-linked:** None
- **IRR currently calculable:** No — No registered engine exists; even the product's benefit design (savings vs. protection-only) is unverified in this repository — return analysis cannot yet be attempted.
- **Premium calculation status:** NOT_YET_ESTIMATABLE

