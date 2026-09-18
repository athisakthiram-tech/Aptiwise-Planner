// Minimal in-repo translation table. No external i18n dependency.
//
// Only presentation strings live here — never financial logic, LIC
// identifiers, plan numbers, or ₹ values. Numbers are always formatted by
// lib/calculations/format.ts (Indian digit grouping), independent of
// locale, and interpolated into these strings via `vars`.

import { Locale } from "@/lib/i18n/types";

type TranslationDict = Record<string, string>;

const en: TranslationDict = {
  // ---- common ----
  "common.back": "Back",
  "common.continue": "Continue",
  "common.startOver": "Start Over",
  "common.notGuaranteed": "Illustration only — not guaranteed returns",
  "common.perMonthSuffix": "/month",
  "common.perYearSuffix": "/year",
  "common.yearsValue": "{n} years",
  "common.yearsValueShort": "{n} yrs",
  "common.age": "Age",
  "common.budget": "Budget",
  "common.horizon": "Horizon",
  "common.yourBudget": "Your budget",
  "common.eligibilityLabel": "Eligibility",
  "common.premiumLabel": "Premium",
  "common.familyProtectionLabel": "Family Protection",
  "common.maturityLabel": "Maturity",
  "common.bonusesLabel": "Bonuses",
  "common.benefitsLabel": "Benefits",
  "common.notCalculated": "Not calculated",
  "common.notIncluded": "Not included",
  "common.bonusDisclaimer":
    "Future LIC bonuses are not guaranteed and are not included in this calculation.",
  "common.underwritingDisclaimer":
    "Product-level eligibility does not constitute LIC underwriting approval.",
  "common.howCalculated": "How is this calculated? 🤔",
  "common.why": "Why? 🤔",
  "common.hide": "Hide",
  "common.close": "Close",
  "common.stepOf": "Step {step} of {totalSteps}",

  // ---- goals (Step 1) ----
  "goals.title": "Let's plan your goal 🎯",
  "goals.subtitle": "A few quick details to build a visual plan together.",
  "goals.chooseGoal": "Choose a goal",
  "goals.age": "Your age",
  "goals.monthlyBudget": "Monthly budget",
  "goals.targetAmount": "Target amount",
  "goals.yearsToGoal": "Years to goal",
  "goals.existingLifeCover": "Existing life cover",
  "goals.type.child_education": "Child Education",
  "goals.type.home": "Home",
  "goals.type.marriage": "Marriage",
  "goals.type.retirement": "Retirement",
  "goals.type.wealth": "Wealth",
  "goals.type.family_protection": "Family Protection",

  // ---- risk comfort ----
  "risk.title": "Risk comfort",
  "risk.low": "Low",
  "risk.medium": "Medium",
  "risk.high": "High",

  // ---- summary (Step 2) ----
  "summary.title": "Your goal at a glance",
  "summary.subtitle": "Here's what we'll plan around.",
  "summary.time": "Time",
  "summary.currentAge": "Current Age",
  "summary.totalContributions": "💵 Total planned contributions",
  "summary.contributionsExplain":
    "{amount} × 12 months × {years} years covers about {pct}% of your target.",

  // ---- goal gap (Step 3) ----
  "goalGap.title": "Your Goal",
  "goalGap.neededIn": "needed in {years} years",
  "goalGap.canSetAside": "You can set aside",
  "goalGap.yourContributions": "Your own contributions",
  "goalGap.journeyTitle": "What could the journey look like?",
  "goalGap.illustration": "{rate}% illustration",
  "goalGap.ofGoal": "{percent}% of goal",
  "goalGap.goalLabel": "Goal",
  "goalGap.illustrativeValue": "Illustrative value",
  "goalGap.potentialGap": "Potential goal gap",
  "goalGap.surplus": "Above your goal",
  "goalGap.youContribute": "You contribute",
  "goalGap.illustrativeGrowth": "Illustrative growth",
  "goalGap.chooseScenario": "Choose a scenario to explore",

  // ---- plan builder (Step 4) ----
  "planBuilder.title": "Build Your Plan",
  "planBuilder.subtitle":
    "Explore how your monthly capacity could be split — this is a planning simulator, not a recommendation.",
  "planBuilder.monthlyCapacity": "Monthly capacity",
  "planBuilder.startingIllustration": "Starting illustration",
  "planBuilder.goalBuilding": "Goal Building",
  "planBuilder.protectionAllocationLabel": "Protection Allocation",
  "planBuilder.goalBuildingAllocationLabel": "Goal-Building Allocation",
  "planBuilder.scenario": "Scenario",
  "planBuilder.yourStructure": "Your Structure",
  "planBuilder.yearIllustration": "{years}-Year Illustration",
  "planBuilder.youContributeTowardGoal": "You contribute toward goal",
  "planBuilder.illustrativeGoalValue": "Illustrative goal value",
  "planBuilder.potentialGap": "Potential gap",
  "planBuilder.targetReached": "Target reached",
  "planBuilder.compareStructures": "Compare structures",
  "planBuilder.structuresDisclaimer": "Illustrative structures — not recommendations.",
  "planBuilder.structure.protectionFocus": "Protection Focus",
  "planBuilder.structure.balancedIllustration": "Balanced Illustration",
  "planBuilder.structure.goalFocus": "Goal Focus",
  "planBuilder.protectionAdequacy": "Protection adequacy",
  "planBuilder.needsAssessment": "Needs assessment",
  "planBuilder.protectionAdequacyNote": "Protection adequacy will be evaluated separately.",
  "planBuilder.protectionPerMonth": "Protection allocation/month",
  "planBuilder.goalBuildingPerMonth": "Goal-building allocation/month",
  "planBuilder.goalContributionLabel": "Goal contribution",

  // ---- protection-adjusted comparison ("Full Picture") ----
  "fullPicture.title": "See the Full Picture",
  "fullPicture.subtitle":
    "For the same goal, timeline and available money — the trade-offs between different ways to work toward it.",
  "comparison.structure.traditionalInsurance": "Insurance Structure",
  "comparison.structure.investmentScenario": "Investment Scenario",
  "comparison.goalCoverage": "Goal Coverage",
  "comparison.remainingGoalGap": "Remaining Goal Gap",
  "comparison.familyProtection": "Family Protection",
  "comparison.builtInLifeProtection": "Built-in Life Protection",
  "comparison.taxTreatment": "Tax Treatment",
  "comparison.premiumGst": "Premium GST",
  "comparison.taxBenefit": "Tax Benefit",
  "comparison.maturityTaxTreatment": "Maturity Tax Treatment",
  "comparison.costsCharges": "Costs & Charges",
  "comparison.expenseRatio": "Expense Ratio",
  "comparison.fundManagementCharge": "Fund Management Charge",
  "comparison.exitLoad": "Exit Load",
  "comparison.otherCharges": "Other Charges",
  "comparison.marketRisk": "Market Risk",
  "comparison.marketLinked": "Market Linked",
  "comparison.liquidity": "Liquidity",
  "comparison.guarantees": "Guarantees",
  "comparison.guaranteedValue": "Guaranteed Value",
  "comparison.nonGuaranteedBenefit": "Non-Guaranteed Benefit",
  "comparison.protectionDuringJourney": "Protection During Your Journey",
  "comparison.timelineToday": "Today",
  "comparison.timelineGoalYear": "Goal Year",
  "comparison.separateInsuranceNote":
    "Separate life insurance can be combined with an investment strategy.",
  "comparison.exploreGap": "Explore ways to address the remaining gap",
  "comparison.option.additionalInsurance": "Additional insurance/savings",
  "comparison.option.marketLinkedInsurance": "Market-linked insurance",
  "comparison.option.investmentStrategy": "Investment strategy",
  "comparison.option.protectionPlusInvestment": "Protection + investment",
  "comparison.status.verified": "Verified",
  "comparison.status.partial": "Partially Verified",
  "comparison.status.illustrative": "Illustrative",
  "comparison.status.conditional": "Conditional",
  "comparison.status.not_applicable": "Not Applicable",
  "comparison.status.unavailable": "Requires Verification",
  "comparison.riskLevel.not_market_linked": "Not market-linked",
  "comparison.riskLevel.market_linked": "Market-linked",
  "comparison.riskLevel.higher_volatility": "Higher market volatility",
  "comparison.note.guaranteed_value_only": "Verified guaranteed value included",
  "comparison.note.requires_sum_assured": "Requires a Basic Sum Assured to calculate",
  "comparison.note.requires_additional_verified_inputs": "Requires additional verified inputs",
  "comparison.note.bonus_not_verified": "Not included / requires verified bonus assumptions",
  "comparison.note.depends_on_policy_rules": "Depends on the policy and customer eligibility rules",
  "comparison.note.not_a_mutual_fund": "Not applicable — not a mutual-fund-style product",
  "comparison.note.requires_verified_source": "Requires a verified source",
  "comparison.note.policy_specific": "Depends on the specific policy",
  "comparison.note.no_built_in_life_protection": "No built-in life protection",
  "comparison.note.illustrative_market_scenario": "Illustrative market scenario",
  "comparison.note.not_an_insurance_premium": "Not applicable — no insurance premium involved",
  "comparison.note.not_calculated_yet": "Not calculated yet",
  "comparison.note.no_guaranteed_component": "None",

  // ---- LIC options (Step 4) ----
  "lic.title": "🏦 LIC Options For Your Goal",
  "lic.budgetLine": "💰 Budget: {amount}/month",
  "lic.warning.retirement_expansion_required":
    "Retirement-specific product catalogue expansion required.",
  "lic.warning.no_active_matches": "No active LIC catalogue entries currently map to this goal.",
  "lic.plansWorthExploring": "✨ Plans Worth Exploring",
  "lic.matchExplain":
    "Matched by goal and product category. Premium affordability is checked only when verified plan-specific calculation rules are available.",
  "lic.potentialGoalMatch": "🎯 Potential Goal Match",
  "lic.categoryMatch": "✓ Goal/category match",
  "lic.needsVerifiedRules": "needs verified product rules",
  "lic.verified": "verified",
  "lic.budgetFitLabel": "{amount} budget fit",
  "lic.confirmed": "confirmed",
  "lic.notCalculatedYet": "not calculated yet",
  "lic.explorePlan": "Explore Plan →",
  "lic.viewMore": "View more LIC options →",
  "lic.currentLifeCover": "🛡️ Current Life Cover",
  "lic.protectionRequirement": "Protection requirement",
  "lic.needsAssessment": "⚠️ Needs assessment",
  "lic.notAdviceDisclaimer":
    "Discuss these options with the customer — this list does not constitute personalized financial advice.",
  "lic.whyItAppeared": "🎯 Why It Appeared",
  "lic.categoryMatchReason": "Matches your selected goal category",
  "lic.yourDetails": "Your Details",
  "lic.eligibility.notIntegrated": "⚠️ Verification engine not integrated",
  "lic.eligibility.passes": "✓ Passes product-level rules",
  "lic.eligibility.notEligible": "✗ Not eligible based on selected product parameters",
  "lic.eligibility.needsDetails": "⚠️ Needs more details to verify eligibility",
  "lic.premiumUnavailable": "⚠️ Exact premium requires verified LIC premium rates",
  "lic.deathBenefitStructure":
    "{income}/year until maturity, plus {lumpsum} at maturity, on death during the term.",
  "lic.maturityGuaranteed": "{amount} guaranteed (excludes any future bonus)",
  "lic.calculationExplain":
    "Guaranteed figures come directly from your chosen Sum Assured using this plan's published benefit formula. They exclude bonuses and exclude the alternative \"7× annual premium\" death benefit, which needs a verified premium to compare.",
  "lic.verifyBeforeSale":
    "⚠️ Verify before sale — eligibility, premium, benefits, exclusions and policy conditions must be checked against current official LIC documents ({url}).",

  // ---- Plan 733 configurator ----
  "plan733.configLabel": "Plan configuration",
  "plan733.basicSumAssured": "Basic Sum Assured",
  "plan733.configHint": "Plan configuration — not a recommended cover amount.",
  "plan733.policyTerm": "⏳ Policy Term",
  "plan733.eligibilityPass": "✓ Passes Plan 733 product-level rules",
  "plan733.eligibilityFail": "⚠️ Configuration doesn't satisfy Plan 733 product rules",
  "plan733.reason.age_below_min": "Age must be at least {min} (entered {actual}).",
  "plan733.reason.age_above_max": "Age must be at most {max} (entered {actual}).",
  "plan733.reason.term_out_of_range":
    "Policy term must be between {min} and {max} years (entered {actual}).",
  "plan733.reason.maturity_age_too_high":
    "Age at maturity ({actual}) would exceed the maximum of {max}.",
  "plan733.reason.maturity_age_too_low":
    "Age at maturity ({actual}) would be below the minimum of {min}.",
  "plan733.reason.ppt_mismatch":
    "Premium Paying Term must equal Policy Term minus {offset} years.",
  "plan733.reason.sum_assured_below_min":
    "Basic Sum Assured must be at least {min} (entered {actual}).",
  "plan733.reason.sum_assured_invalid_increment":
    "Basic Sum Assured is not a valid increment for its range.",
  "plan733.verifiedPremium": "Verified brochure example premium: {amount} / year",
  "plan733.monthlyEquivalentNote":
    "≈ {amount}/month. Monthly equivalent for comparison only; the brochure premium above is the verified value.",
  "plan733.premiumUnavailable": "⚠️ Exact premium unavailable for this configuration",
  "plan733.premiumUnavailableReason": "Verified LIC premium rate data is required.",
  "plan733.budgetComparison": "💰 Budget Comparison",
  "plan733.premiumEquivalent": "Premium equivalent",
  "plan733.withinBudget": "✓ Within entered budget",
  "plan733.aboveBudget": "⚠️ Above entered budget",
  "plan733.budgetNote": "Based on annual premium equivalent for planning comparison.",
  "plan733.budgetNotVerified": "Budget fit = Not verified",
  "plan733.baseMaturityBenefit": "🎯 Base maturity benefit",
  "plan733.deathBenefitStructure":
    "Death-benefit structure: {income}/year until maturity, plus {lumpsum} lump sum at maturity, if death occurs during the term.",
  "plan733.calculationExplain":
    "Base maturity benefit equals your chosen Basic Sum Assured. The death-benefit structure shown is 110% of Basic Sum Assured payable at maturity plus 10% of Basic Sum Assured paid yearly until maturity — the plan's actual death benefit may be higher if 7× your annual premium exceeds this, which needs a verified premium to compare. Bonuses are excluded because LIC has not published a rate.",
  "plan733.noValidTerm":
    "⚠️ No Plan 733 policy term satisfies the maturity-age rules for age {age}.",
  "plan736.configLabel": "Plan configuration",
  "plan736.basicSumAssured": "Basic Sum Assured",
  "plan736.configHint": "Plan configuration — not a recommended cover amount.",
  "plan736.policyTerm": "⏳ Policy Term",
  "plan736.pptFollowsTerm": "Premium Paying Term is fixed at {ppt} years for this policy term.",
  "plan736.eligibilityPass": "✓ Passes Plan 736 product-level rules",
  "plan736.eligibilityFail": "⚠️ Configuration doesn't satisfy Plan 736 product rules",
  "plan736.reason.age_below_min": "Age must be at least {min} (entered {actual}).",
  "plan736.reason.age_above_max_for_term":
    "For a {term}-year term, age must be at most {max} (entered {actual}).",
  "plan736.reason.invalid_term_ppt_combination":
    "Policy Term and Premium Paying Term must be one of the offered combinations (16/10, 21/15, 25/16).",
  "plan736.reason.maturity_age_exceeded":
    "Age at maturity ({actual}) would exceed the maximum of {max}.",
  "plan736.reason.sum_assured_below_min":
    "Basic Sum Assured must be at least {min} (entered {actual}).",
  "plan736.reason.sum_assured_invalid_increment":
    "Basic Sum Assured is not a valid increment for its range.",
  "plan736.verifiedPremium": "Verified brochure example premium: {amount} / year",
  "plan736.monthlyEquivalentNote":
    "≈ {amount}/month. Monthly equivalent for comparison only; the brochure premium above is the verified value.",
  "plan736.premiumUnavailable": "⚠️ Exact premium unavailable for this configuration",
  "plan736.premiumUnavailableReason": "Verified LIC premium rate data is required.",
  "plan736.budgetComparison": "💰 Budget Comparison",
  "plan736.premiumEquivalent": "Premium equivalent",
  "plan736.withinBudget": "✓ Within entered budget",
  "plan736.aboveBudget": "⚠️ Above entered budget",
  "plan736.budgetNote": "Based on annual premium equivalent for planning comparison.",
  "plan736.budgetNotVerified": "Budget fit = Not verified",
  "plan736.baseMaturityBenefit": "🎯 Base maturity benefit",
  "plan736.familyProtection": "❤️ Family protection (Sum Assured on Death)",
  "plan736.familyProtectionFloor":
    "Family protection is at least {amount} (the guaranteed floor); the full amount also depends on your premium, which isn't verified for this exact configuration.",
  "plan736.liquidity": "Liquidity",
  "plan736.liquidityFacts":
    "Loan and surrender are available once at least one full year's premium has been paid. Exact loan/surrender amounts are not calculated here.",
  "plan736.calculationExplain":
    "Base maturity benefit equals your chosen Basic Sum Assured. Family protection (Sum Assured on Death) is the higher of the Basic Sum Assured or 7× your annualised premium — shown in full only when your exact premium is verified from the brochure's sample table; otherwise only the guaranteed Basic-Sum-Assured floor is shown. Bonuses are excluded because LIC has not published a rate.",
  "plan736.noValidTerm":
    "⚠️ No Plan 736 policy term satisfies the eligibility rules for age {age}.",
  "lic.std.configLabel": "Plan configuration",
  "lic.std.basicSumAssured": "Basic Sum Assured",
  "lic.std.configHint": "Plan configuration — not a recommended cover amount.",
  "lic.std.policyTerm": "⏳ Policy Term",
  "lic.std.premiumPayingTerm": "Premium Paying Term",
  "lic.std.pptFollowsTerm": "Premium Paying Term is fixed at {ppt} years for this policy term.",
  "lic.std.deathBenefitOption": "Sum Assured on Death option",
  "lic.std.survivalBenefitOption": "Survival Benefit option",
  "lic.std.option.I": "Option I",
  "lic.std.option.II": "Option II",
  "lic.std.option.III": "Option III",
  "lic.std.option.IV": "Option IV",
  "lic.std.option.A": "Option A",
  "lic.std.option.B": "Option B",
  "lic.std.option.C": "Option C",
  "lic.std.option.1": "Option 1",
  "lic.std.option.2": "Option 2",
  "lic.std.option.3": "Option 3",
  "lic.std.option.4": "Option 4",
  "lic.std.eligibilityPass": "✓ Passes Plan {plan} product-level rules",
  "lic.std.eligibilityFail": "⚠️ Configuration doesn't satisfy Plan {plan} product rules",
  "lic.std.reason.age_below_min": "Age must be at least {min} (entered {actual}).",
  "lic.std.reason.age_above_max": "Age must be at most {max} (entered {actual}).",
  "lic.std.reason.age_out_of_range": "Age must be between {min} and {max} (entered {actual}).",
  "lic.std.reason.age_above_max_for_ppt":
    "For a {ppt}-year Premium Paying Term, age must be at most {max} (entered {actual}).",
  "lic.std.reason.term_out_of_range":
    "Policy term must be between {min} and {max} years (entered {actual}).",
  "lic.std.reason.term_out_of_range_for_ppt":
    "For a {ppt}-year Premium Paying Term, policy term must be between {min} and {max} years (entered {actual}).",
  "lic.std.reason.maturity_age_too_high":
    "Age at maturity ({actual}) would exceed the maximum of {max}.",
  "lic.std.reason.maturity_age_too_low":
    "Age at maturity ({actual}) would be below the minimum of {min}.",
  "lic.std.reason.ppt_must_equal_term": "Premium Paying Term must equal Policy Term for this plan.",
  "lic.std.reason.invalid_premium_paying_term": "This Premium Paying Term is not offered by this plan.",
  "lic.std.reason.sum_assured_below_min":
    "Basic Sum Assured must be at least {min} (entered {actual}).",
  "lic.std.reason.sum_assured_invalid_increment":
    "Basic Sum Assured is not a valid increment for its range.",
  "lic.std.reason.death_benefit_option_mode_mismatch":
    "The chosen Option requires a different premium payment mode.",
  "lic.std.verifiedPremium": "Verified brochure example premium: {amount} / year",
  "lic.std.verifiedSinglePremium": "Verified brochure example premium: {amount} (one-time payment)",
  "lic.std.monthlyEquivalentNote":
    "≈ {amount}/month. Monthly equivalent for comparison only; the brochure premium above is the verified value.",
  "lic.std.premiumUnavailable": "⚠️ Exact premium unavailable for this configuration",
  "lic.std.premiumUnavailableReason": "Verified LIC premium rate data is required.",
  "lic.std.budgetComparison": "💰 Budget Comparison",
  "lic.std.premiumEquivalent": "Premium equivalent",
  "lic.std.withinBudget": "✓ Within entered budget",
  "lic.std.aboveBudget": "⚠️ Above entered budget",
  "lic.std.budgetNote": "Based on annual premium equivalent for planning comparison.",
  "lic.std.budgetNotVerified": "Budget fit = Not verified",
  "lic.std.baseMaturityBenefit": "🎯 Base maturity benefit",
  "lic.std.guaranteedAdditionNote":
    "Includes {amount} in guaranteed additions — a fixed rate that does not depend on LIC's investment performance.",
  "lic.std.familyProtection": "❤️ Family protection (Sum Assured on Death)",
  "lic.std.familyProtectionFloor":
    "Family protection is at least {amount} (the guaranteed floor); the full amount also depends on your premium, which isn't verified for this exact configuration.",
  "lic.std.liquidity": "Liquidity",
  "lic.std.liquidityFacts":
    "Loan and surrender are available once at least one full year's premium has been paid. Exact loan/surrender amounts are not calculated here.",
  "lic.std.calculationExplain":
    "Base maturity benefit equals your chosen Basic Sum Assured, plus any guaranteed addition this plan applies at a fixed, published rate. Family protection (Sum Assured on Death) follows this plan's official formula and is shown in full only when your exact premium is verified from the brochure's sample table; otherwise only the guaranteed floor is shown. Any additional bonus depends on LIC's future performance and is never included here unless a rate has been published.",
  "lic.std.noValidTerm": "⚠️ No Plan {plan} policy term satisfies the eligibility rules for age {age}.",
  "lic.std.secondDeathNote":
    "On the second death, this policy also pays at least {amount}, plus any Guaranteed Addition accrued by then.",
  "lic.std.survivalBenefitPerInstallment": "💰 Survival benefit (per instalment)",
  "lic.std.survivalBenefitAtEndOfPpt": "💰 Survival benefit (at end of Premium Paying Term)",
  "lic.std.regularIncomeBenefit": "💰 Regular Income Benefit (per year)",
  "lic.std.boosterIncomeBenefit": "🎁 Booster Income Benefit (one-time)",
  "lic774.premiumPaymentMode": "Premium payment",
  "lic774.mode.limited": "Limited Premium",
  "lic774.mode.single": "Single Premium",
  "lic774.nonParNote":
    "This is a Non-Par plan — its maturity and death benefits are fixed and guaranteed, with no participation in LIC's profits or bonus.",
  "lic.term.premiumMode": "Premium payment",
  "lic.term.mode.regular": "Regular Premium",
  "lic.term.mode.limited": "Limited Premium",
  "lic.term.mode.single": "Single Premium",
  "lic.term.deathBenefitOption": "Sum Assured on Death option",
  "lic.term.option.I": "Level Sum Assured",
  "lic.term.option.II": "Increasing Sum Assured",
  "lic.term.increasingNote":
    "Under Increasing Sum Assured, the amount payable on death rises each year from the 6th policy year and reaches {amount} (2x Basic Sum Assured) by the 16th policy year, then stays level.",
  "lic.term.noMaturityBenefit": "This is a pure risk plan — no maturity benefit is ever payable, only protection.",
  "lic.term.liquidityFacts":
    "No loan is available under this plan. There is no surrender value under Regular Premium; under Single or Limited Premium, Unexpired Risk Premium Value (if any) may be payable on surrender — the exact amount is not calculated here.",
  "lic.term.calculationExplain":
    "The Sum Assured on Death is the highest of a fixed Absolute Amount (Basic Sum Assured, or an increasing schedule under Option II), 7x your annualised premium, and 105% of premiums paid (Single Premium instead uses 125% of the Single Premium) — shown in full only when your exact premium is verified from the brochure's sample table; otherwise only the guaranteed Absolute Amount is shown. There is no maturity benefit and no bonus.",
  "lic.credit.interestRate": "Loan interest rate",
  "lic.credit.interestRateHint":
    "Chosen once at inception to match your loan's own interest rate — it sets the pace at which cover reduces, and cannot be changed later.",
  "lic.credit.sumAssuredAtInception": "❤️ Sum Assured on Death (at inception)",
  "lic.credit.decreasingNote":
    "This cover decreases every policy year on a loan-repayment schedule, reaching about {amount} by the final policy year.",
  "lic.credit.calculationExplain":
    "Sum Assured on Death starts at your chosen Basic Sum Assured and reduces every policy year, following the same equated-yearly-repayment schedule as a bank loan at your chosen interest rate. There is no maturity benefit and no bonus.",

  // ---- strategy (Step 5) ----
  "strategy.title": "3 Ways To Reach Your Goal",
  "strategy.subtitle":
    "Different mixes of protection and growth. None is universally \"best\" — pick what feels right to discuss.",
  "strategy.protection_first.title": "Protection First",
  "strategy.protection_first.tagline": "Protection + conservative savings orientation",
  "strategy.protection_first.description":
    "Prioritises life cover and capital safety, with a smaller share aimed at steady, lower-volatility growth.",
  "strategy.balanced.title": "Balanced",
  "strategy.balanced.tagline": "Protection + market-linked growth",
  "strategy.balanced.description":
    "Splits attention between protecting the family and letting a meaningful portion pursue market-linked growth.",
  "strategy.growth_focused.title": "Growth Focused",
  "strategy.growth_focused.tagline": "Greater market exposure",
  "strategy.growth_focused.description":
    "Leans towards market-linked instruments for higher growth potential, while keeping a base level of protection.",
  "strategy.risk.lower": "Lower",
  "strategy.risk.medium": "Medium",
  "strategy.risk.higher": "Higher",
  "strategy.protectionPct": "🛡️ Protection {pct}%",
  "strategy.growthPct": "📈 Growth {pct}%",

  // ---- protection vs growth (Step 6) ----
  "protection.vsGrowthTitle": "Protection vs Growth",
  "protection.vsGrowthSubtitle": "Two different jobs — worth understanding side by side.",
  "protection.label": "Protection",
  "growth.marketInvestmentLabel": "Market Investment",
  "protection.compare.life_cover.label": "Life Cover",
  "protection.compare.life_cover.protectionNote":
    "Pays a sum assured to family on an insured event, per policy terms.",
  "protection.compare.life_cover.growthNote": "No life cover component.",
  "protection.compare.life_cover.why":
    "Life insurance is a contract to pay a defined benefit on a covered event, subject to the policy's terms and exclusions. Market investments don't provide this contractual protection.",
  "protection.compare.goal_planning.label": "Goal Planning",
  "protection.compare.goal_planning.protectionNote":
    "Some plans combine cover with disciplined savings.",
  "protection.compare.goal_planning.growthNote": "Commonly used to target a future corpus.",
  "protection.compare.goal_planning.why":
    "Both can support a goal, but they work differently — one via a protection contract, the other via market participation.",
  "protection.compare.growth_potential.label": "Growth Potential",
  "protection.compare.growth_potential.protectionNote":
    "Typically lower, some portions may be guaranteed.",
  "protection.compare.growth_potential.growthNote": "Potentially higher, but not assured.",
  "protection.compare.growth_potential.why":
    "Market-linked instruments have historically offered higher long-term growth potential, but returns are never guaranteed and can be negative in any given period.",
  "protection.compare.volatility.label": "Market Volatility",
  "protection.compare.volatility.protectionNote":
    "Guaranteed components are largely insulated from market swings.",
  "protection.compare.volatility.growthNote": "Value can rise and fall with markets.",
  "protection.compare.volatility.why":
    "Market-linked products fluctuate with market conditions. Insurance guarantees (where applicable) come from the insurer's contractual promise, not market performance.",
  "protection.compare.liquidity.label": "Liquidity",
  "protection.compare.liquidity.protectionNote":
    "Often limited; early exit may reduce value or attract charges.",
  "protection.compare.liquidity.growthNote":
    "Generally more accessible, though this varies by product.",
  "protection.compare.liquidity.why":
    "Insurance products are designed for the long term and may penalise early withdrawal. Many investment products offer easier access to funds, but this varies widely.",
  "protection.compare.family_protection.label": "Family Protection",
  "protection.compare.family_protection.protectionNote":
    "Core purpose — a defined payout to protect dependents.",
  "protection.compare.family_protection.growthNote":
    "Indirect — depends on the value accumulated at the time of need.",
  "protection.compare.family_protection.why":
    "Insurance is purpose-built to protect a family financially on a covered event. Investments can help a family too, but only to the extent value has already accumulated.",

  // ---- SIP scenario (Step 7) ----
  "sip.title": "Investment scenario",
  "sip.subtitle": "Investing {amount}/month for {years} years, at a few illustrative rates.",
  "sip.ratePa": "{rate}% p.a.",
  "sip.disclaimer":
    "⚠️ Illustration only — not guaranteed returns. These are not expected or promised mutual-fund performance figures.",

  // ---- market risk (Step 8) ----
  "marketRisk.title": "Market risk, visually",
  "marketRisk.subtitle": "Markets move — in both directions — over time.",
  "marketRisk.canRise": "Markets can rise",
  "marketRisk.canFall": "Markets can fall",
  "marketRisk.longTerm": "Long-term still involves risk",
  "marketRisk.disclaimer": "Past performance does not guarantee future returns.",

  // ---- family protection story (Step 9) ----
  "protection.storyTitle": "Why protection matters",
  "protection.storySubtitle": "A simple way to see how it all connects.",
  "protection.flow.family": "Your Family",
  "protection.flow.goal": "Financial Goal",
  "protection.flow.protection": "Protection",
  "protection.flow.protected": "Family, Protected",
  "protection.storyDisclaimer":
    "Insurance protection depends on the selected policy's contractual benefits, terms, exclusions and claim conditions. Not every insurance product guarantees returns or guarantees completion of a financial goal.",

  // ---- final plan (Step 10) ----
  "finalPlan.title": "✨ Your Financial Plan",
  "finalPlan.duration": "⏳ Duration",
  "finalPlan.investmentAllocation": "📈 Investment Allocation",
  "finalPlan.selectedStrategy": "⚖️ Selected Strategy",
  "finalPlan.share": "📱 Share",
  "finalPlan.download": "📄 Download",
  "finalPlan.save": "❤️ Save",
  "finalPlan.sharePlan": "📱 Share Plan",
  "finalPlan.downloadPlan": "📄 Download Plan",
  "finalPlan.savePlan": "❤️ Save Plan",
  "finalPlan.comingNext": "{feature} is coming next — not available in this preview.",
  "finalPlan.disclaimer":
    "This plan is for educational discussion purposes only. Guaranteed values, non-guaranteed illustrations and market-linked returns are distinct — final terms depend on the actual product selected.",
};

const ta: TranslationDict = {
  // ---- common ----
  "common.back": "பின்செல்",
  "common.continue": "தொடரவும்",
  "common.startOver": "மீண்டும் தொடங்கு",
  "common.notGuaranteed":
    "இது ஒரு கணக்கீட்டு எடுத்துக்காட்டு மட்டுமே — வருமானத்திற்கு உத்தரவாதம் இல்லை",
  "common.perMonthSuffix": "/மாதம்",
  "common.perYearSuffix": "/ஆண்டு",
  "common.yearsValue": "{n} ஆண்டுகள்",
  "common.yearsValueShort": "{n} ஆண்டுகள்",
  "common.age": "வயது",
  "common.budget": "பட்ஜெட்",
  "common.horizon": "காலஅளவு",
  "common.yourBudget": "உங்கள் பட்ஜெட்",
  "common.eligibilityLabel": "தகுதி",
  "common.premiumLabel": "பிரீமியம்",
  "common.familyProtectionLabel": "குடும்பப் பாதுகாப்பு",
  "common.maturityLabel": "முதிர்வு",
  "common.bonusesLabel": "போனஸ்",
  "common.benefitsLabel": "பலன்கள்",
  "common.notCalculated": "இன்னும் கணக்கிடப்படவில்லை",
  "common.notIncluded": "சேர்க்கப்படவில்லை",
  "common.bonusDisclaimer":
    "எதிர்கால LIC போனஸ் உத்தரவாதம் இல்லை, இந்த கணக்கீட்டில் சேர்க்கப்படவில்லை.",
  "common.underwritingDisclaimer":
    "இந்த தகுதி திட்ட-மட்ட விதிகளின் அடிப்படையில் மட்டுமே — இது LIC-யின் இறுதி ஒப்புதலைக் குறிக்காது.",
  "common.howCalculated": "இது எப்படி கணக்கிடப்படுகிறது? 🤔",
  "common.why": "ஏன்? 🤔",
  "common.hide": "மறை",
  "common.close": "மூடு",
  "common.stepOf": "படி {step} / {totalSteps}",

  // ---- goals (Step 1) ----
  "goals.title": "உங்கள் இலக்கைத் திட்டமிடுவோம் 🎯",
  "goals.subtitle": "ஒரு காட்சி திட்டத்தை உருவாக்க சில விவரங்கள்.",
  "goals.chooseGoal": "ஒரு இலக்கைத் தேர்ந்தெடுக்கவும்",
  "goals.age": "உங்கள் வயது",
  "goals.monthlyBudget": "மாத சேமிப்பு தொகை",
  "goals.targetAmount": "இலக்கு தொகை",
  "goals.yearsToGoal": "இலக்கை அடைய ஆண்டுகள்",
  "goals.existingLifeCover": "தற்போதுள்ள ஆயுள் காப்பீட்டு தொகை",
  "goals.type.child_education": "குழந்தை கல்வி",
  "goals.type.home": "வீடு",
  "goals.type.marriage": "திருமணம்",
  "goals.type.retirement": "ஓய்வூதியம்",
  "goals.type.wealth": "செல்வம்",
  "goals.type.family_protection": "குடும்பப் பாதுகாப்பு",

  // ---- risk comfort ----
  "risk.title": "ரிஸ்க் எடுக்கும் தன்மை",
  "risk.low": "குறைவு",
  "risk.medium": "நடுத்தரம்",
  "risk.high": "அதிகம்",

  // ---- summary (Step 2) ----
  "summary.title": "உங்கள் இலக்கு ஒரு பார்வையில்",
  "summary.subtitle": "இதன் அடிப்படையில் நாம் திட்டமிடுவோம்.",
  "summary.time": "காலம்",
  "summary.currentAge": "தற்போதைய வயது",
  "summary.totalContributions": "💵 மொத்த திட்டமிட்ட பங்களிப்பு",
  "summary.contributionsExplain":
    "{amount} × 12 மாதங்கள் × {years} ஆண்டுகள் உங்கள் இலக்கின் சுமார் {pct}% ஈடுசெய்யும்.",

  // ---- goal gap (Step 3) ----
  "goalGap.title": "உங்கள் இலக்கு",
  "goalGap.neededIn": "{years} ஆண்டுகளில் தேவை",
  "goalGap.canSetAside": "நீங்கள் ஒதுக்கக்கூடியது",
  "goalGap.yourContributions": "உங்கள் சொந்த பங்களிப்பு",
  "goalGap.journeyTitle": "இந்த பயணம் எப்படி இருக்கக்கூடும்?",
  "goalGap.illustration": "{rate}% கணக்கீடு",
  "goalGap.ofGoal": "இலக்கின் {percent}%",
  "goalGap.goalLabel": "இலக்கு",
  "goalGap.illustrativeValue": "கணக்கீட்டு மதிப்பு",
  "goalGap.potentialGap": "இலக்கை அடைய தேவையான கூடுதல் தொகை",
  "goalGap.surplus": "இலக்கை விட அதிகம்",
  "goalGap.youContribute": "நீங்கள் அளிக்கும் தொகை",
  "goalGap.illustrativeGrowth": "கணக்கீட்டு வளர்ச்சி",
  "goalGap.chooseScenario": "ஆராய ஒரு காட்சியைத் தேர்ந்தெடுக்கவும்",

  // ---- plan builder (Step 4) ----
  "planBuilder.title": "உங்கள் திட்டத்தை உருவாக்குங்கள்",
  "planBuilder.subtitle":
    "உங்கள் மாத தொகையை எப்படி பிரிக்கலாம் என்பதை ஆராயுங்கள் — இது ஒரு பரிந்துரை அல்ல, திட்டமிடல் கருவி மட்டுமே.",
  "planBuilder.monthlyCapacity": "மாத திறன்",
  "planBuilder.startingIllustration": "தொடக்க எடுத்துக்காட்டு",
  "planBuilder.goalBuilding": "இலக்கு உருவாக்கம்",
  "planBuilder.protectionAllocationLabel": "பாதுகாப்பு ஒதுக்கீடு",
  "planBuilder.goalBuildingAllocationLabel": "இலக்கு-உருவாக்க ஒதுக்கீடு",
  "planBuilder.scenario": "காட்சி",
  "planBuilder.yourStructure": "உங்கள் அமைப்பு",
  "planBuilder.yearIllustration": "{years}-ஆண்டு எடுத்துக்காட்டு",
  "planBuilder.youContributeTowardGoal": "இலக்கை நோக்கி நீங்கள் அளிக்கும் தொகை",
  "planBuilder.illustrativeGoalValue": "கணக்கீட்டு இலக்கு மதிப்பு",
  "planBuilder.potentialGap": "சாத்தியமான குறைபாடு",
  "planBuilder.targetReached": "இலக்கு எட்டப்பட்டது",
  "planBuilder.compareStructures": "அமைப்புகளை ஒப்பிடுங்கள்",
  "planBuilder.structuresDisclaimer": "இவை எடுத்துக்காட்டு அமைப்புகள் மட்டுமே — பரிந்துரைகள் அல்ல.",
  "planBuilder.structure.protectionFocus": "பாதுகாப்பு மையம்",
  "planBuilder.structure.balancedIllustration": "சமநிலை எடுத்துக்காட்டு",
  "planBuilder.structure.goalFocus": "இலக்கு மையம்",
  "planBuilder.protectionAdequacy": "பாதுகாப்பு போதுமான அளவு",
  "planBuilder.needsAssessment": "மதிப்பீடு தேவை",
  "planBuilder.protectionAdequacyNote": "பாதுகாப்பு போதுமானதா என்பது தனியாக மதிப்பிடப்படும்.",
  "planBuilder.protectionPerMonth": "மாதம் பாதுகாப்பு ஒதுக்கீடு",
  "planBuilder.goalBuildingPerMonth": "மாதம் இலக்கு-உருவாக்க ஒதுக்கீடு",
  "planBuilder.goalContributionLabel": "இலக்கு பங்களிப்பு",

  // ---- protection-adjusted comparison ("Full Picture") ----
  "fullPicture.title": "முழு சித்திரத்தைப் பாருங்கள்",
  "fullPicture.subtitle":
    "ஒரே இலக்கு, ஒரே காலஅளவு, ஒரே கிடைக்கும் தொகைக்கு — இலக்கை அடைய வெவ்வேறு வழிகளுக்கு இடையேயான வேறுபாடுகள்.",
  "comparison.structure.traditionalInsurance": "காப்பீட்டு அமைப்பு",
  "comparison.structure.investmentScenario": "முதலீட்டு காட்சி",
  "comparison.goalCoverage": "இலக்கு பூர்த்தி",
  "comparison.remainingGoalGap": "மீதமுள்ள இலக்கு குறைபாடு",
  "comparison.familyProtection": "குடும்பப் பாதுகாப்பு",
  "comparison.builtInLifeProtection": "உள்ளடக்கிய ஆயுள் பாதுகாப்பு",
  "comparison.taxTreatment": "வரி நடைமுறை",
  "comparison.premiumGst": "பிரீமியம் GST",
  "comparison.taxBenefit": "வரி சலுகை",
  "comparison.maturityTaxTreatment": "முதிர்வு வரி நடைமுறை",
  "comparison.costsCharges": "செலவுகள் & கட்டணங்கள்",
  "comparison.expenseRatio": "செலவு விகிதம்",
  "comparison.fundManagementCharge": "நிதி மேலாண்மை கட்டணம்",
  "comparison.exitLoad": "வெளியேறல் கட்டணம்",
  "comparison.otherCharges": "மற்ற கட்டணங்கள்",
  "comparison.marketRisk": "சந்தை ரிஸ்க்",
  "comparison.marketLinked": "சந்தை-இணைந்தது",
  "comparison.liquidity": "பணமாக்கும் எளிமை",
  "comparison.guarantees": "உத்தரவாதங்கள்",
  "comparison.guaranteedValue": "உத்தரவாத மதிப்பு",
  "comparison.nonGuaranteedBenefit": "உத்தரவாதமற்ற பலன்",
  "comparison.protectionDuringJourney": "பயணத்தின் போது பாதுகாப்பு",
  "comparison.timelineToday": "இன்று",
  "comparison.timelineGoalYear": "இலக்கு ஆண்டு",
  "comparison.separateInsuranceNote":
    "தனி ஆயுள் காப்பீட்டை ஒரு முதலீட்டு உத்தியுடன் இணைக்கலாம்.",
  "comparison.exploreGap": "மீதமுள்ள குறைபாட்டை ஈடுசெய்ய வழிகளை ஆராயுங்கள்",
  "comparison.option.additionalInsurance": "கூடுதல் காப்பீடு/சேமிப்பு",
  "comparison.option.marketLinkedInsurance": "சந்தை-இணைந்த காப்பீடு",
  "comparison.option.investmentStrategy": "முதலீட்டு உத்தி",
  "comparison.option.protectionPlusInvestment": "பாதுகாப்பு + முதலீடு",
  "comparison.status.verified": "சரிபார்க்கப்பட்டது",
  "comparison.status.partial": "ஓரளவு சரிபார்க்கப்பட்டது",
  "comparison.status.illustrative": "கணக்கீட்டு எடுத்துக்காட்டு",
  "comparison.status.conditional": "நிபந்தனைக்குட்பட்டது",
  "comparison.status.not_applicable": "பொருந்தாது",
  "comparison.status.unavailable": "சரிபார்ப்பு தேவை",
  "comparison.riskLevel.not_market_linked": "சந்தையுடன் இணைக்கப்படவில்லை",
  "comparison.riskLevel.market_linked": "சந்தை-இணைந்தது",
  "comparison.riskLevel.higher_volatility": "அதிக சந்தை ஏற்ற இறக்கம்",
  "comparison.note.guaranteed_value_only": "சரிபார்க்கப்பட்ட உத்தரவாத மதிப்பு மட்டும் சேர்க்கப்பட்டுள்ளது",
  "comparison.note.requires_sum_assured": "கணக்கிட அடிப்படை காப்பீட்டுத் தொகை தேவை",
  "comparison.note.requires_additional_verified_inputs": "கூடுதல் சரிபார்க்கப்பட்ட விவரங்கள் தேவை",
  "comparison.note.bonus_not_verified": "சேர்க்கப்படவில்லை / சரிபார்க்கப்பட்ட போனஸ் கணிப்புகள் தேவை",
  "comparison.note.depends_on_policy_rules": "பாலிசி மற்றும் வாடிக்கையாளர் தகுதி விதிகளைப் பொறுத்தது",
  "comparison.note.not_a_mutual_fund": "பொருந்தாது — இது மியூச்சுவல் ஃபண்ட் வகை தயாரிப்பு அல்ல",
  "comparison.note.requires_verified_source": "சரிபார்க்கப்பட்ட ஆதாரம் தேவை",
  "comparison.note.policy_specific": "குறிப்பிட்ட பாலிசியைப் பொறுத்தது",
  "comparison.note.no_built_in_life_protection": "உள்ளடக்கிய ஆயுள் பாதுகாப்பு இல்லை",
  "comparison.note.illustrative_market_scenario": "கணக்கீட்டு சந்தை காட்சி",
  "comparison.note.not_an_insurance_premium": "பொருந்தாது — காப்பீட்டு பிரீமியம் இதில் இல்லை",
  "comparison.note.not_calculated_yet": "இன்னும் கணக்கிடப்படவில்லை",
  "comparison.note.no_guaranteed_component": "இல்லை",

  // ---- LIC options (Step 4) ----
  "lic.title": "🏦 உங்கள் இலக்கிற்கான LIC திட்டங்கள்",
  "lic.budgetLine": "💰 பட்ஜெட்: {amount}/மாதம்",
  "lic.warning.retirement_expansion_required":
    "ஓய்வூதியத்திற்கான தனி LIC திட்டப் பட்டியல் இன்னும் விரிவாக்கப்பட வேண்டும்.",
  "lic.warning.no_active_matches":
    "இந்த இலக்குக்கு பொருந்தும் செயலில் உள்ள LIC திட்டங்கள் தற்போது இல்லை.",
  "lic.plansWorthExploring": "✨ பரிசீலிக்கக்கூடிய திட்டங்கள்",
  "lic.matchExplain":
    "இலக்கு மற்றும் திட்ட வகையின் அடிப்படையில் பொருத்தப்பட்டது. சரிபார்க்கப்பட்ட திட்ட-குறிப்பிட்ட கணக்கீட்டு விதிகள் இருந்தால் மட்டுமே பிரீமியம் தகுதி சரிபார்க்கப்படும்.",
  "lic.potentialGoalMatch": "🎯 உங்கள் இலக்குடன் பொருந்தக்கூடிய திட்டம்",
  "lic.categoryMatch": "✓ இலக்கு/வகை பொருத்தம்",
  "lic.needsVerifiedRules": "சரிபார்க்கப்பட்ட திட்ட விதிகள் தேவை",
  "lic.verified": "சரிபார்க்கப்பட்டது",
  "lic.budgetFitLabel": "{amount} பட்ஜெட் பொருத்தம்",
  "lic.confirmed": "உறுதி செய்யப்பட்டது",
  "lic.notCalculatedYet": "இன்னும் கணக்கிடப்படவில்லை",
  "lic.explorePlan": "திட்டத்தை ஆராயுங்கள் →",
  "lic.viewMore": "மேலும் LIC விருப்பங்களைப் பார்க்க →",
  "lic.currentLifeCover": "🛡️ தற்போதைய ஆயுள் காப்பீடு",
  "lic.protectionRequirement": "தேவையான பாதுகாப்பு தொகை",
  "lic.needsAssessment": "⚠️ மதிப்பீடு தேவை",
  "lic.notAdviceDisclaimer":
    "இந்த விருப்பங்களை வாடிக்கையாளருடன் விவாதிக்கவும் — இந்தப் பட்டியல் தனிப்பட்ட நிதி ஆலோசனை அல்ல.",
  "lic.whyItAppeared": "🎯 இது ஏன் தோன்றியது",
  "lic.categoryMatchReason": "உங்கள் தேர்ந்தெடுக்கப்பட்ட இலக்கு வகையுடன் பொருந்துகிறது",
  "lic.yourDetails": "உங்கள் விவரங்கள்",
  "lic.eligibility.notIntegrated": "⚠️ சரிபார்ப்பு அமைப்பு இன்னும் இணைக்கப்படவில்லை",
  "lic.eligibility.passes": "✓ திட்ட-மட்ட விதிகளை பூர்த்தி செய்கிறது",
  "lic.eligibility.notEligible": "✗ தேர்ந்தெடுக்கப்பட்ட விவரங்களின்படி தகுதியில்லை",
  "lic.eligibility.needsDetails": "⚠️ தகுதியை சரிபார்க்க கூடுதல் விவரங்கள் தேவை",
  "lic.premiumUnavailable": "⚠️ சரியான பிரீமியத்திற்கு சரிபார்க்கப்பட்ட LIC விகிதங்கள் தேவை",
  "lic.deathBenefitStructure":
    "முதிர்வு வரை ஆண்டுக்கு {income}, மேலும் காலத்தில் மரணம் நேர்ந்தால் முதிர்வில் {lumpsum}.",
  "lic.maturityGuaranteed": "{amount} உத்தரவாதம் (எதிர்கால போனஸ் தவிர)",
  "lic.calculationExplain":
    "உத்தரவாத தொகைகள் நீங்கள் தேர்ந்தெடுத்த காப்பீட்டுத் தொகையிலிருந்து இந்த திட்டத்தின் வெளியிடப்பட்ட சூத்திரப்படி நேரடியாக கணக்கிடப்படுகின்றன. இவை போனஸையும், சரிபார்க்கப்பட்ட பிரீமியம் தேவைப்படும் \"7× ஆண்டு பிரீமியம்\" மரண பலனையும் சேர்க்கவில்லை.",
  "lic.verifyBeforeSale":
    "⚠️ விற்பனைக்கு முன் சரிபார்க்கவும் — தகுதி, பிரீமியம், பலன்கள், விலக்குகள் மற்றும் பாலிசி நிபந்தனைகளை தற்போதைய அதிகாரப்பூர்வ LIC ஆவணங்களுடன் ({url}) சரிபார்க்க வேண்டும்.",

  // ---- Plan 733 configurator ----
  "plan733.configLabel": "திட்ட கட்டமைப்பு",
  "plan733.basicSumAssured": "அடிப்படை காப்பீட்டுத் தொகை",
  "plan733.configHint": "இது திட்ட கட்டமைப்பு — பரிந்துரைக்கப்பட்ட காப்பீட்டுத் தொகை அல்ல.",
  "plan733.policyTerm": "⏳ பாலிசி காலம்",
  "plan733.eligibilityPass": "✓ Plan 733 திட்ட-மட்ட விதிகளை பூர்த்தி செய்கிறது",
  "plan733.eligibilityFail": "⚠️ இந்த கட்டமைப்பு Plan 733 திட்ட விதிகளை பூர்த்தி செய்யவில்லை",
  "plan733.reason.age_below_min":
    "வயது குறைந்தபட்சம் {min} ஆக இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "plan733.reason.age_above_max":
    "வயது அதிகபட்சம் {max} ஆக இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "plan733.reason.term_out_of_range":
    "பாலிசி காலம் {min} முதல் {max} ஆண்டுகளுக்குள் இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "plan733.reason.maturity_age_too_high":
    "முதிர்வு வயது ({actual}) அதிகபட்ச வரம்பான {max}-ஐ தாண்டிவிடும்.",
  "plan733.reason.maturity_age_too_low":
    "முதிர்வு வயது ({actual}) குறைந்தபட்ச வரம்பான {min}-ஐ விட குறைவாக இருக்கும்.",
  "plan733.reason.ppt_mismatch":
    "பிரீமியம் செலுத்தும் காலம், பாலிசி காலத்தில் இருந்து {offset} ஆண்டுகள் குறைந்ததாக இருக்க வேண்டும்.",
  "plan733.reason.sum_assured_below_min":
    "அடிப்படை காப்பீட்டுத் தொகை குறைந்தபட்சம் {min} ஆக இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "plan733.reason.sum_assured_invalid_increment":
    "அடிப்படை காப்பீட்டுத் தொகை அதன் வரம்புக்கான சரியான அளவீட்டில் இல்லை.",
  "plan733.verifiedPremium": "சரிபார்க்கப்பட்ட விளம்பர எடுத்துக்காட்டு பிரீமியம்: {amount} / ஆண்டு",
  "plan733.monthlyEquivalentNote":
    "≈ {amount}/மாதம். இது ஒப்பீட்டிற்கு மட்டுமே; மேலே உள்ள ஆண்டு பிரீமியம் மட்டுமே சரிபார்க்கப்பட்ட மதிப்பு.",
  "plan733.premiumUnavailable": "⚠️ இந்த கட்டமைப்பிற்கு சரியான பிரீமியம் கிடைக்கவில்லை",
  "plan733.premiumUnavailableReason": "சரிபார்க்கப்பட்ட LIC பிரீமியம் விகித தரவு தேவை.",
  "plan733.budgetComparison": "💰 பட்ஜெட் ஒப்பீடு",
  "plan733.premiumEquivalent": "பிரீமியத்திற்கு நிகரான தொகை",
  "plan733.withinBudget": "✓ உள்ளிட்ட பட்ஜெட்டிற்குள் உள்ளது",
  "plan733.aboveBudget": "⚠️ உள்ளிட்ட பட்ஜெட்டை விட அதிகம்",
  "plan733.budgetNote": "திட்டமிடல் ஒப்பீட்டிற்காக ஆண்டு பிரீமியத்தின் அடிப்படையில்.",
  "plan733.budgetNotVerified": "பட்ஜெட் பொருத்தம் = சரிபார்க்கப்படவில்லை",
  "plan733.baseMaturityBenefit": "🎯 அடிப்படை முதிர்வு பலன்",
  "plan733.deathBenefitStructure":
    "மரண பலன் அமைப்பு: முதிர்வு வரை ஆண்டுக்கு {income}, மேலும் காலத்தில் மரணம் நேர்ந்தால் முதிர்வில் ஒரு முறை {lumpsum}.",
  "plan733.calculationExplain":
    "அடிப்படை முதிர்வு பலன் நீங்கள் தேர்ந்தெடுத்த காப்பீட்டுத் தொகைக்கு சமம். காட்டப்படும் மரண பலன் அமைப்பு காப்பீட்டுத் தொகையில் 110% முதிர்வில் மற்றும் 10% ஆண்டுதோறும் முதிர்வு வரை — இதை விட 7× ஆண்டு பிரீமியம் அதிகமாக இருந்தால் உண்மையான மரண பலன் அதிகமாக இருக்கலாம், அதற்கு சரிபார்க்கப்பட்ட பிரீமியம் தேவை. LIC போனஸ் விகிதத்தை வெளியிடாததால் போனஸ் சேர்க்கப்படவில்லை.",
  "plan733.noValidTerm":
    "⚠️ வயது {age}-க்கு முதிர்வு வயது விதிகளுக்குப் பொருந்தும் Plan 733 பாலிசி காலம் இல்லை.",
  "plan736.configLabel": "திட்ட கட்டமைப்பு",
  "plan736.basicSumAssured": "அடிப்படை காப்பீட்டுத் தொகை",
  "plan736.configHint": "இது திட்ட கட்டமைப்பு — பரிந்துரைக்கப்பட்ட காப்பீட்டுத் தொகை அல்ல.",
  "plan736.policyTerm": "⏳ பாலிசி காலம்",
  "plan736.pptFollowsTerm":
    "இந்த பாலிசி காலத்திற்கு பிரீமியம் செலுத்தும் காலம் {ppt} ஆண்டுகளாக நிர்ணயிக்கப்பட்டுள்ளது.",
  "plan736.eligibilityPass": "✓ Plan 736 திட்ட-மட்ட விதிகளை பூர்த்தி செய்கிறது",
  "plan736.eligibilityFail": "⚠️ இந்த கட்டமைப்பு Plan 736 திட்ட விதிகளை பூர்த்தி செய்யவில்லை",
  "plan736.reason.age_below_min":
    "வயது குறைந்தபட்சம் {min} ஆக இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "plan736.reason.age_above_max_for_term":
    "{term} ஆண்டு காலத்திற்கு, வயது அதிகபட்சம் {max} ஆக இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "plan736.reason.invalid_term_ppt_combination":
    "பாலிசி காலமும் பிரீமியம் செலுத்தும் காலமும் வழங்கப்படும் சேர்க்கைகளில் ஒன்றாக இருக்க வேண்டும் (16/10, 21/15, 25/16).",
  "plan736.reason.maturity_age_exceeded":
    "முதிர்வு வயது ({actual}) அதிகபட்ச வரம்பான {max}-ஐ தாண்டிவிடும்.",
  "plan736.reason.sum_assured_below_min":
    "அடிப்படை காப்பீட்டுத் தொகை குறைந்தபட்சம் {min} ஆக இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "plan736.reason.sum_assured_invalid_increment":
    "அடிப்படை காப்பீட்டுத் தொகை அதன் வரம்புக்கான சரியான அளவீட்டில் இல்லை.",
  "plan736.verifiedPremium": "சரிபார்க்கப்பட்ட விளம்பர எடுத்துக்காட்டு பிரீமியம்: {amount} / ஆண்டு",
  "plan736.monthlyEquivalentNote":
    "≈ {amount}/மாதம். இது ஒப்பீட்டிற்கு மட்டுமே; மேலே உள்ள ஆண்டு பிரீமியம் மட்டுமே சரிபார்க்கப்பட்ட மதிப்பு.",
  "plan736.premiumUnavailable": "⚠️ இந்த கட்டமைப்பிற்கு சரியான பிரீமியம் கிடைக்கவில்லை",
  "plan736.premiumUnavailableReason": "சரிபார்க்கப்பட்ட LIC பிரீமியம் விகித தரவு தேவை.",
  "plan736.budgetComparison": "💰 பட்ஜெட் ஒப்பீடு",
  "plan736.premiumEquivalent": "பிரீமியத்திற்கு நிகரான தொகை",
  "plan736.withinBudget": "✓ உள்ளிட்ட பட்ஜெட்டிற்குள் உள்ளது",
  "plan736.aboveBudget": "⚠️ உள்ளிட்ட பட்ஜெட்டை விட அதிகம்",
  "plan736.budgetNote": "திட்டமிடல் ஒப்பீட்டிற்காக ஆண்டு பிரீமியத்தின் அடிப்படையில்.",
  "plan736.budgetNotVerified": "பட்ஜெட் பொருத்தம் = சரிபார்க்கப்படவில்லை",
  "plan736.baseMaturityBenefit": "🎯 அடிப்படை முதிர்வு பலன்",
  "plan736.familyProtection": "❤️ குடும்ப பாதுகாப்பு (மரணத்தின்போது காப்பீட்டுத் தொகை)",
  "plan736.familyProtectionFloor":
    "குடும்ப பாதுகாப்பு குறைந்தது {amount} ஆக இருக்கும் (உறுதியான குறைந்தபட்சம்); முழு தொகையும் உங்கள் பிரீமியத்தையும் சார்ந்துள்ளது, இது இந்த கட்டமைப்பிற்கு சரிபார்க்கப்படவில்லை.",
  "plan736.liquidity": "பணப்புழக்கம்",
  "plan736.liquidityFacts":
    "குறைந்தது ஒரு முழு ஆண்டு பிரீமியம் செலுத்தப்பட்டதும் கடன் மற்றும் surrender வசதி கிடைக்கும். சரியான கடன்/surrender தொகைகள் இங்கு கணக்கிடப்படவில்லை.",
  "plan736.calculationExplain":
    "அடிப்படை முதிர்வு பலன் நீங்கள் தேர்ந்தெடுத்த காப்பீட்டுத் தொகைக்கு சமம். குடும்ப பாதுகாப்பு (மரணத்தின்போது காப்பீட்டுத் தொகை) அடிப்படை காப்பீட்டுத் தொகை அல்லது உங்கள் ஆண்டு பிரீமியத்தின் 7 மடங்கு — இவற்றில் அதிகமானது — இது உங்கள் சரியான பிரீமியம் விளம்பரத்தின் எடுத்துக்காட்டு அட்டவணையில் சரிபார்க்கப்பட்டால் மட்டுமே முழுமையாக காட்டப்படும்; இல்லையெனில் உறுதியான அடிப்படை காப்பீட்டுத் தொகை குறைந்தபட்சம் மட்டுமே காட்டப்படும். LIC போனஸ் விகிதத்தை வெளியிடாததால் போனஸ் சேர்க்கப்படவில்லை.",
  "plan736.noValidTerm":
    "⚠️ வயது {age}-க்கு தகுதி விதிகளுக்குப் பொருந்தும் Plan 736 பாலிசி காலம் இல்லை.",
  "lic.std.configLabel": "திட்ட கட்டமைப்பு",
  "lic.std.basicSumAssured": "அடிப்படை காப்பீட்டுத் தொகை",
  "lic.std.configHint": "இது திட்ட கட்டமைப்பு — பரிந்துரைக்கப்பட்ட காப்பீட்டுத் தொகை அல்ல.",
  "lic.std.policyTerm": "⏳ பாலிசி காலம்",
  "lic.std.premiumPayingTerm": "பிரீமியம் செலுத்தும் காலம்",
  "lic.std.pptFollowsTerm":
    "இந்த பாலிசி காலத்திற்கு பிரீமியம் செலுத்தும் காலம் {ppt} ஆண்டுகளாக நிர்ணயிக்கப்பட்டுள்ளது.",
  "lic.std.deathBenefitOption": "மரணத்தின்போது காப்பீட்டுத் தொகை விருப்பம்",
  "lic.std.survivalBenefitOption": "உயிர்வாழ் நலன் விருப்பம்",
  "lic.std.option.I": "விருப்பம் I",
  "lic.std.option.II": "விருப்பம் II",
  "lic.std.option.III": "விருப்பம் III",
  "lic.std.option.IV": "விருப்பம் IV",
  "lic.std.option.A": "விருப்பம் A",
  "lic.std.option.B": "விருப்பம் B",
  "lic.std.option.C": "விருப்பம் C",
  "lic.std.option.1": "விருப்பம் 1",
  "lic.std.option.2": "விருப்பம் 2",
  "lic.std.option.3": "விருப்பம் 3",
  "lic.std.option.4": "விருப்பம் 4",
  "lic.std.eligibilityPass": "✓ Plan {plan} திட்ட-மட்ட விதிகளை பூர்த்தி செய்கிறது",
  "lic.std.eligibilityFail": "⚠️ இந்த கட்டமைப்பு Plan {plan} திட்ட விதிகளை பூர்த்தி செய்யவில்லை",
  "lic.std.reason.age_below_min":
    "வயது குறைந்தபட்சம் {min} ஆக இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "lic.std.reason.age_above_max":
    "வயது அதிகபட்சம் {max} ஆக இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "lic.std.reason.age_out_of_range":
    "வயது {min} மற்றும் {max}-க்கு இடையில் இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "lic.std.reason.age_above_max_for_ppt":
    "{ppt} ஆண்டு பிரீமியம் செலுத்தும் காலத்திற்கு, வயது அதிகபட்சம் {max} ஆக இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "lic.std.reason.term_out_of_range":
    "பாலிசி காலம் {min} முதல் {max} ஆண்டுகளுக்குள் இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "lic.std.reason.term_out_of_range_for_ppt":
    "{ppt} ஆண்டு பிரீமியம் செலுத்தும் காலத்திற்கு, பாலிசி காலம் {min} முதல் {max} ஆண்டுகளுக்குள் இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "lic.std.reason.maturity_age_too_high":
    "முதிர்வு வயது ({actual}) அதிகபட்ச வரம்பான {max}-ஐ தாண்டிவிடும்.",
  "lic.std.reason.maturity_age_too_low":
    "முதிர்வு வயது ({actual}) குறைந்தபட்ச வரம்பான {min}-ஐ விட குறைவாக இருக்கும்.",
  "lic.std.reason.ppt_must_equal_term":
    "இந்த திட்டத்திற்கு பிரீமியம் செலுத்தும் காலம் பாலிசி காலத்திற்கு சமமாக இருக்க வேண்டும்.",
  "lic.std.reason.invalid_premium_paying_term":
    "இந்த பிரீமியம் செலுத்தும் காலம் இந்த திட்டத்தில் வழங்கப்படவில்லை.",
  "lic.std.reason.sum_assured_below_min":
    "அடிப்படை காப்பீட்டுத் தொகை குறைந்தபட்சம் {min} ஆக இருக்க வேண்டும் (உள்ளிட்டது {actual}).",
  "lic.std.reason.sum_assured_invalid_increment":
    "அடிப்படை காப்பீட்டுத் தொகை அதன் வரம்புக்கான சரியான அளவீட்டில் இல்லை.",
  "lic.std.reason.death_benefit_option_mode_mismatch":
    "தேர்ந்தெடுக்கப்பட்ட விருப்பத்திற்கு வேறு பிரீமியம் செலுத்தும் முறை தேவை.",
  "lic.std.verifiedPremium": "சரிபார்க்கப்பட்ட விளம்பர எடுத்துக்காட்டு பிரீமியம்: {amount} / ஆண்டு",
  "lic.std.verifiedSinglePremium":
    "சரிபார்க்கப்பட்ட விளம்பர எடுத்துக்காட்டு பிரீமியம்: {amount} (ஒரு முறை கட்டணம்)",
  "lic.std.monthlyEquivalentNote":
    "≈ {amount}/மாதம். இது ஒப்பீட்டிற்கு மட்டுமே; மேலே உள்ள ஆண்டு பிரீமியம் மட்டுமே சரிபார்க்கப்பட்ட மதிப்பு.",
  "lic.std.premiumUnavailable": "⚠️ இந்த கட்டமைப்பிற்கு சரியான பிரீமியம் கிடைக்கவில்லை",
  "lic.std.premiumUnavailableReason": "சரிபார்க்கப்பட்ட LIC பிரீமியம் விகித தரவு தேவை.",
  "lic.std.budgetComparison": "💰 பட்ஜெட் ஒப்பீடு",
  "lic.std.premiumEquivalent": "பிரீமியத்திற்கு நிகரான தொகை",
  "lic.std.withinBudget": "✓ உள்ளிட்ட பட்ஜெட்டிற்குள் உள்ளது",
  "lic.std.aboveBudget": "⚠️ உள்ளிட்ட பட்ஜெட்டை விட அதிகம்",
  "lic.std.budgetNote": "திட்டமிடல் ஒப்பீட்டிற்காக ஆண்டு பிரீமியத்தின் அடிப்படையில்.",
  "lic.std.budgetNotVerified": "பட்ஜெட் பொருத்தம் = சரிபார்க்கப்படவில்லை",
  "lic.std.baseMaturityBenefit": "🎯 அடிப்படை முதிர்வு பலன்",
  "lic.std.guaranteedAdditionNote":
    "{amount} உறுதியான கூடுதல் தொகை சேர்க்கப்பட்டுள்ளது — இது LIC-யின் முதலீட்டு செயல்திறனைச் சாராத நிலையான விகிதம்.",
  "lic.std.familyProtection": "❤️ குடும்ப பாதுகாப்பு (மரணத்தின்போது காப்பீட்டுத் தொகை)",
  "lic.std.familyProtectionFloor":
    "குடும்ப பாதுகாப்பு குறைந்தது {amount} ஆக இருக்கும் (உறுதியான குறைந்தபட்சம்); முழு தொகையும் உங்கள் பிரீமியத்தையும் சார்ந்துள்ளது, இது இந்த கட்டமைப்பிற்கு சரிபார்க்கப்படவில்லை.",
  "lic.std.liquidity": "பணப்புழக்கம்",
  "lic.std.liquidityFacts":
    "குறைந்தது ஒரு முழு ஆண்டு பிரீமியம் செலுத்தப்பட்டதும் கடன் மற்றும் surrender வசதி கிடைக்கும். சரியான கடன்/surrender தொகைகள் இங்கு கணக்கிடப்படவில்லை.",
  "lic.std.calculationExplain":
    "அடிப்படை முதிர்வு பலன் நீங்கள் தேர்ந்தெடுத்த காப்பீட்டுத் தொகைக்கு சமம், மேலும் இந்த திட்டம் நிலையான, வெளியிடப்பட்ட விகிதத்தில் வழங்கும் எந்தவொரு உறுதியான கூடுதல் தொகையும் சேர்க்கப்படும். குடும்ப பாதுகாப்பு (மரணத்தின்போது காப்பீட்டுத் தொகை) இந்த திட்டத்தின் அதிகாரப்பூர்வ சூத்திரத்தைப் பின்பற்றுகிறது, உங்கள் சரியான பிரீமியம் விளம்பரத்தின் எடுத்துக்காட்டு அட்டவணையில் சரிபார்க்கப்பட்டால் மட்டுமே முழுமையாக காட்டப்படும்; இல்லையெனில் உறுதியான குறைந்தபட்சம் மட்டுமே காட்டப்படும். கூடுதல் போனஸ் ஏதேனும் LIC-யின் எதிர்கால செயல்திறனைச் சார்ந்துள்ளது, விகிதம் வெளியிடப்படாத வரை இங்கு சேர்க்கப்படாது.",
  "lic.std.noValidTerm":
    "⚠️ வயது {age}-க்கு தகுதி விதிகளுக்குப் பொருந்தும் Plan {plan} பாலிசி காலம் இல்லை.",
  "lic.std.secondDeathNote":
    "இரண்டாவது மரணத்தின்போது, இந்த பாலிசி குறைந்தது {amount}-ஐயும், அதுவரை சேர்ந்த உறுதியான கூடுதல் தொகையையும் வழங்கும்.",
  "lic.std.survivalBenefitPerInstallment": "💰 உயிர்வாழ் நலன் (ஒவ்வொரு தவணையும்)",
  "lic.std.survivalBenefitAtEndOfPpt": "💰 உயிர்வாழ் நலன் (பிரீமியம் செலுத்தும் காலம் முடிவில்)",
  "lic.std.regularIncomeBenefit": "💰 வழக்கமான வருமான நலன் (ஆண்டுக்கு)",
  "lic.std.boosterIncomeBenefit": "🎁 பூஸ்டர் வருமான நலன் (ஒரே முறை)",
  "lic774.premiumPaymentMode": "பிரீமியம் செலுத்துதல்",
  "lic774.mode.limited": "வரையறுக்கப்பட்ட பிரீமியம்",
  "lic774.mode.single": "ஒற்றை பிரீமியம்",
  "lic774.nonParNote":
    "இது Non-Par திட்டம் — இதன் முதிர்வு மற்றும் மரண பலன்கள் நிலையானவை மற்றும் உறுதியானவை, LIC-யின் லாபம் அல்லது போனஸில் பங்கேற்பு இல்லை.",
  "lic.term.premiumMode": "பிரீமியம் செலுத்துதல்",
  "lic.term.mode.regular": "வழக்கமான பிரீமியம்",
  "lic.term.mode.limited": "வரையறுக்கப்பட்ட பிரீமியம்",
  "lic.term.mode.single": "ஒற்றை பிரீமியம்",
  "lic.term.deathBenefitOption": "மரணத்தின்போது காப்பீட்டுத் தொகை விருப்பம்",
  "lic.term.option.I": "நிலையான காப்பீட்டுத் தொகை",
  "lic.term.option.II": "அதிகரிக்கும் காப்பீட்டுத் தொகை",
  "lic.term.increasingNote":
    "அதிகரிக்கும் காப்பீட்டுத் தொகையின் கீழ், மரணத்தின்போது வழங்கப்படும் தொகை 6வது பாலிசி ஆண்டிலிருந்து ஒவ்வொரு ஆண்டும் அதிகரித்து, 16வது பாலிசி ஆண்டில் {amount} (2 மடங்கு அடிப்படை காப்பீட்டுத் தொகை) ஆக அடைந்து, பின்னர் நிலையாக இருக்கும்.",
  "lic.term.noMaturityBenefit": "இது ஒரு தூய அபாய பாதுகாப்பு திட்டம் — முதிர்வு பலன் எப்போதும் வழங்கப்படாது, பாதுகாப்பு மட்டுமே.",
  "lic.term.liquidityFacts":
    "இந்த திட்டத்தின் கீழ் கடன் கிடைக்காது. வழக்கமான பிரீமியத்தின் கீழ் surrender மதிப்பு இல்லை; ஒற்றை அல்லது வரையறுக்கப்பட்ட பிரீமியத்தின் கீழ், காலாவதியாகாத அபாய பிரீமியம் மதிப்பு (ஏதேனும் இருந்தால்) surrender செய்யும்போது வழங்கப்படலாம் — சரியான தொகை இங்கு கணக்கிடப்படவில்லை.",
  "lic.term.calculationExplain":
    "மரணத்தின்போது காப்பீட்டுத் தொகை என்பது நிலையான தொகை (அடிப்படை காப்பீட்டுத் தொகை, அல்லது விருப்பம் II-ன் கீழ் அதிகரிக்கும் அட்டவணை), உங்கள் ஆண்டு பிரீமியத்தின் 7 மடங்கு, மற்றும் செலுத்தப்பட்ட பிரீமியத்தின் 105% (ஒற்றை பிரீமியத்திற்கு பதிலாக ஒற்றை பிரீமியத்தின் 125%) ஆகியவற்றில் அதிகபட்சமானது — உங்கள் சரியான பிரீமியம் விளம்பரத்தின் எடுத்துக்காட்டு அட்டவணையில் சரிபார்க்கப்பட்டால் மட்டுமே முழுமையாக காட்டப்படும்; இல்லையெனில் உறுதியான தொகை மட்டுமே காட்டப்படும். முதிர்வு பலனோ போனஸோ இல்லை.",
  "lic.credit.interestRate": "கடன் வட்டி விகிதம்",
  "lic.credit.interestRateHint":
    "உங்கள் கடனின் சொந்த வட்டி விகிதத்துடன் பொருந்த ஆரம்பத்தில் ஒருமுறை தேர்ந்தெடுக்கப்படுகிறது — இது பாதுகாப்பு குறையும் வேகத்தை நிர்ணயிக்கிறது, பின்னர் மாற்ற முடியாது.",
  "lic.credit.sumAssuredAtInception": "❤️ மரணத்தின்போது காப்பீட்டுத் தொகை (ஆரம்பத்தில்)",
  "lic.credit.decreasingNote":
    "இந்த பாதுகாப்பு ஒவ்வொரு பாலிசி ஆண்டும் கடன் திருப்பிச் செலுத்தும் அட்டவணையின் அடிப்படையில் குறைகிறது, இறுதி பாலிசி ஆண்டில் சுமார் {amount} ஐ அடைகிறது.",
  "lic.credit.calculationExplain":
    "மரணத்தின்போது காப்பீட்டுத் தொகை நீங்கள் தேர்ந்தெடுத்த அடிப்படை காப்பீட்டுத் தொகையில் தொடங்கி, உங்கள் தேர்ந்தெடுக்கப்பட்ட வட்டி விகிதத்தில் வங்கி கடன் போன்ற சம ஆண்டு திருப்பிச் செலுத்தும் அட்டவணையைப் பின்பற்றி ஒவ்வொரு பாலிசி ஆண்டும் குறைகிறது. முதிர்வு பலனோ போனஸோ இல்லை.",

  // ---- strategy (Step 5) ----
  "strategy.title": "உங்கள் இலக்கை அடைய 3 வழிகள்",
  "strategy.subtitle":
    "பாதுகாப்பு மற்றும் வளர்ச்சியின் வெவ்வேறு கலவைகள். எதுவும் \"சிறந்தது\" என்று சொல்ல முடியாது — விவாதிக்க பொருத்தமானதைத் தேர்ந்தெடுக்கவும்.",
  "strategy.protection_first.title": "பாதுகாப்பு முதலில்",
  "strategy.protection_first.tagline": "பாதுகாப்பு + நிலையான சேமிப்பு நோக்கம்",
  "strategy.protection_first.description":
    "ஆயுள் காப்பீடு மற்றும் மூலதன பாதுகாப்புக்கு முன்னுரிமை அளித்து, ஒரு சிறிய பகுதியை நிலையான வளர்ச்சிக்கு ஒதுக்குகிறது.",
  "strategy.balanced.title": "சமநிலை",
  "strategy.balanced.tagline": "பாதுகாப்பு + சந்தை-இணைந்த வளர்ச்சி",
  "strategy.balanced.description":
    "குடும்பத்தைப் பாதுகாப்பதற்கும், சந்தை-இணைந்த வளர்ச்சியை நாடுவதற்கும் இடையே கவனத்தைப் பிரிக்கிறது.",
  "strategy.growth_focused.title": "வளர்ச்சி மையம்",
  "strategy.growth_focused.tagline": "அதிக சந்தை ஈடுபாடு",
  "strategy.growth_focused.description":
    "அதிக வளர்ச்சி வாய்ப்பிற்காக சந்தை-இணைந்த கருவிகளை நோக்கி சாய்கிறது, அத்துடன் ஒரு அடிப்படை பாதுகாப்பையும் தக்க வைக்கிறது.",
  "strategy.risk.lower": "குறைவு",
  "strategy.risk.medium": "நடுத்தரம்",
  "strategy.risk.higher": "அதிகம்",
  "strategy.protectionPct": "🛡️ பாதுகாப்பு {pct}%",
  "strategy.growthPct": "📈 வளர்ச்சி {pct}%",

  // ---- protection vs growth (Step 6) ----
  "protection.vsGrowthTitle": "பாதுகாப்பு vs வளர்ச்சி",
  "protection.vsGrowthSubtitle": "இரண்டு வெவ்வேறு பணிகள் — பக்கத்திற்கு பக்கம் புரிந்துகொள்ள வேண்டியவை.",
  "protection.label": "பாதுகாப்பு",
  "growth.marketInvestmentLabel": "சந்தை முதலீடு",
  "protection.compare.life_cover.label": "ஆயுள் காப்பீடு",
  "protection.compare.life_cover.protectionNote":
    "பாலிசி நிபந்தனைகளின்படி காப்பீட்டு நிகழ்வில் குடும்பத்திற்கு தொகை வழங்கப்படும்.",
  "protection.compare.life_cover.growthNote": "ஆயுள் காப்பீடு எதுவும் இல்லை.",
  "protection.compare.life_cover.why":
    "ஆயுள் காப்பீடு என்பது ஒரு நிபந்தனைக்குட்பட்ட நிகழ்வில் நிர்ணயிக்கப்பட்ட பலனை வழங்கும் ஒப்பந்தம். சந்தை முதலீடுகள் இந்த ஒப்பந்த பாதுகாப்பை வழங்காது.",
  "protection.compare.goal_planning.label": "இலக்கு திட்டமிடல்",
  "protection.compare.goal_planning.protectionNote":
    "சில திட்டங்கள் காப்பீட்டுடன் ஒழுங்கான சேமிப்பையும் இணைக்கின்றன.",
  "protection.compare.goal_planning.growthNote": "எதிர்கால தொகையை இலக்காகக் கொள்ள பொதுவாகப் பயன்படுத்தப்படுகிறது.",
  "protection.compare.goal_planning.why":
    "இரண்டும் இலக்கை அடைய உதவும், ஆனால் வெவ்வேறு வழிகளில் — ஒன்று பாதுகாப்பு ஒப்பந்தம் மூலம், மற்றொன்று சந்தை பங்கேற்பு மூலம்.",
  "protection.compare.growth_potential.label": "வளர்ச்சி வாய்ப்பு",
  "protection.compare.growth_potential.protectionNote":
    "பொதுவாக குறைவு, சில பகுதிகள் உத்தரவாதமாக இருக்கலாம்.",
  "protection.compare.growth_potential.growthNote": "அதிகமாக இருக்கக்கூடும், ஆனால் உறுதி இல்லை.",
  "protection.compare.growth_potential.why":
    "சந்தை-இணைந்த கருவிகள் வரலாற்று ரீதியாக நீண்ட கால அதிக வளர்ச்சி வாய்ப்பை வழங்கியுள்ளன, ஆனால் வருமானம் ஒருபோதும் உத்தரவாதம் இல்லை, எந்த காலகட்டத்திலும் குறையவும் செய்யலாம்.",
  "protection.compare.volatility.label": "சந்தை ஏற்ற இறக்கம்",
  "protection.compare.volatility.protectionNote":
    "உத்தரவாத பகுதிகள் பெரும்பாலும் சந்தை ஏற்ற இறக்கத்தில் இருந்து பாதுகாக்கப்படுகின்றன.",
  "protection.compare.volatility.growthNote": "மதிப்பு சந்தையுடன் ஏறவும் இறங்கவும் செய்யலாம்.",
  "protection.compare.volatility.why":
    "சந்தை-இணைந்த தயாரிப்புகள் சந்தை நிலைமைகளுடன் மாறுபடும். காப்பீட்டு உத்தரவாதங்கள் (பொருந்தும் இடத்தில்) காப்பீட்டாளரின் ஒப்பந்த உறுதிமொழியிலிருந்து வருகின்றன, சந்தை செயல்பாட்டிலிருந்து அல்ல.",
  "protection.compare.liquidity.label": "பணமாக்கும் எளிமை",
  "protection.compare.liquidity.protectionNote":
    "பெரும்பாலும் வரம்புக்குட்பட்டது; முன்கூட்டியே வெளியேறினால் மதிப்பு குறையலாம் அல்லது கட்டணங்கள் விதிக்கப்படலாம்.",
  "protection.compare.liquidity.growthNote":
    "பொதுவாக அணுகுவது எளிதானது, ஆனால் இது தயாரிப்பைப் பொறுத்து மாறுபடும்.",
  "protection.compare.liquidity.why":
    "காப்பீட்டு தயாரிப்புகள் நீண்ட காலத்திற்காக வடிவமைக்கப்பட்டவை, முன்கூட்டியே பணம் எடுத்தால் அபராதம் விதிக்கப்படலாம். பல முதலீட்டு தயாரிப்புகள் பணத்தை எளிதாக அணுக அனுமதிக்கின்றன, ஆனால் இது பரவலாக மாறுபடும்.",
  "protection.compare.family_protection.label": "குடும்பப் பாதுகாப்பு",
  "protection.compare.family_protection.protectionNote":
    "முக்கிய நோக்கம் — சார்ந்தவர்களைப் பாதுகாக்க நிர்ணயிக்கப்பட்ட தொகை.",
  "protection.compare.family_protection.growthNote":
    "மறைமுகம் — தேவைப்படும் நேரத்தில் திரண்டுள்ள மதிப்பைப் பொறுத்தது.",
  "protection.compare.family_protection.why":
    "காப்பீடு ஒரு நிகழ்வில் குடும்பத்தை நிதி ரீதியாக பாதுகாக்கவே வடிவமைக்கப்பட்டது. முதலீடுகளும் குடும்பத்திற்கு உதவும், ஆனால் ஏற்கனவே திரண்டுள்ள மதிப்பு அளவிற்கு மட்டுமே.",

  // ---- SIP scenario (Step 7) ----
  "sip.title": "முதலீட்டு காட்சி",
  "sip.subtitle": "{amount}/மாதம் {years} ஆண்டுகளுக்கு முதலீடு செய்தால், சில எடுத்துக்காட்டு விகிதங்களில்.",
  "sip.ratePa": "{rate}% ஆண்டுக்கு",
  "sip.disclaimer":
    "⚠️ இது ஒரு கணக்கீட்டு எடுத்துக்காட்டு மட்டுமே — உத்தரவாதமான வருமானம் அல்ல. இவை எதிர்பார்க்கப்படும் அல்லது உறுதியளிக்கப்பட்ட மியூச்சுவல் ஃபண்ட் செயல்திறன் எண்கள் அல்ல.",

  // ---- market risk (Step 8) ----
  "marketRisk.title": "சந்தை ரிஸ்க், காட்சி வடிவில்",
  "marketRisk.subtitle": "காலப்போக்கில் சந்தைகள் இரு திசைகளிலும் நகரும்.",
  "marketRisk.canRise": "சந்தைகள் உயரலாம்",
  "marketRisk.canFall": "சந்தைகள் குறையலாம்",
  "marketRisk.longTerm": "நீண்ட காலத்திலும் ரிஸ்க் உள்ளது",
  "marketRisk.disclaimer": "கடந்த கால செயல்திறன் எதிர்கால வருமானத்திற்கு உத்தரவாதம் அளிக்காது.",

  // ---- family protection story (Step 9) ----
  "protection.storyTitle": "பாதுகாப்பு ஏன் முக்கியம்",
  "protection.storySubtitle": "இது எப்படி இணைந்திருக்கிறது என்பதைக் காண ஒரு எளிய வழி.",
  "protection.flow.family": "உங்கள் குடும்பம்",
  "protection.flow.goal": "நிதி இலக்கு",
  "protection.flow.protection": "பாதுகாப்பு",
  "protection.flow.protected": "குடும்பம், பாதுகாக்கப்பட்டது",
  "protection.storyDisclaimer":
    "காப்பீட்டு பாதுகாப்பு தேர்ந்தெடுக்கப்பட்ட பாலிசியின் ஒப்பந்த பலன்கள், நிபந்தனைகள், விலக்குகள் மற்றும் உரிமைகோரல் நிபந்தனைகளைப் பொறுத்தது. ஒவ்வொரு காப்பீட்டு தயாரிப்பும் வருமானத்திற்கு உத்தரவாதம் அளிக்காது அல்லது நிதி இலக்கை நிறைவேற்றுவதற்கு உத்தரவாதம் அளிக்காது.",

  // ---- final plan (Step 10) ----
  "finalPlan.title": "✨ உங்கள் நிதித் திட்டம்",
  "finalPlan.duration": "⏳ காலம்",
  "finalPlan.investmentAllocation": "📈 முதலீட்டு ஒதுக்கீடு",
  "finalPlan.selectedStrategy": "⚖️ தேர்ந்தெடுக்கப்பட்ட உத்தி",
  "finalPlan.share": "📱 பகிர்",
  "finalPlan.download": "📄 பதிவிறக்கு",
  "finalPlan.save": "❤️ சேமி",
  "finalPlan.sharePlan": "📱 திட்டத்தைப் பகிர்",
  "finalPlan.downloadPlan": "📄 திட்டத்தைப் பதிவிறக்கு",
  "finalPlan.savePlan": "❤️ திட்டத்தைச் சேமி",
  "finalPlan.comingNext": "{feature} விரைவில் வரும் — இந்த முன்னோட்டத்தில் இது இன்னும் இல்லை.",
  "finalPlan.disclaimer":
    "இந்த திட்டம் விவாதத்திற்கான கல்வி நோக்கத்திற்காக மட்டுமே. உத்தரவாத மதிப்புகள், உத்தரவாதமற்ற எடுத்துக்காட்டுகள் மற்றும் சந்தை-இணைந்த வருமானம் வேறுபட்டவை — இறுதி நிபந்தனைகள் தேர்ந்தெடுக்கப்பட்ட தயாரிப்பைப் பொறுத்தது.",
};

const hi: TranslationDict = {
  // ---- common ----
  "common.back": "पीछे",
  "common.continue": "आगे बढ़ें",
  "common.startOver": "फिर से शुरू करें",
  "common.notGuaranteed": "यह केवल गणना का उदाहरण है — रिटर्न की गारंटी नहीं है",
  "common.perMonthSuffix": "/माह",
  "common.perYearSuffix": "/वर्ष",
  "common.yearsValue": "{n} वर्ष",
  "common.yearsValueShort": "{n} वर्ष",
  "common.age": "उम्र",
  "common.budget": "बजट",
  "common.horizon": "अवधि",
  "common.yourBudget": "आपका बजट",
  "common.eligibilityLabel": "पात्रता",
  "common.premiumLabel": "प्रीमियम",
  "common.familyProtectionLabel": "पारिवारिक सुरक्षा",
  "common.maturityLabel": "परिपक्वता",
  "common.bonusesLabel": "बोनस",
  "common.benefitsLabel": "लाभ",
  "common.notCalculated": "अभी गणना नहीं की गई",
  "common.notIncluded": "शामिल नहीं है",
  "common.bonusDisclaimer": "भविष्य के LIC बोनस की गारंटी नहीं है और इसे इस गणना में शामिल नहीं किया गया है।",
  "common.underwritingDisclaimer":
    "यह पात्रता केवल उत्पाद-स्तर के नियमों पर आधारित है — यह LIC की अंतिम स्वीकृति नहीं है।",
  "common.howCalculated": "इसकी गणना कैसे होती है? 🤔",
  "common.why": "क्यों? 🤔",
  "common.hide": "छिपाएँ",
  "common.close": "बंद करें",
  "common.stepOf": "चरण {step} / {totalSteps}",

  // ---- goals (Step 1) ----
  "goals.title": "चलिए आपका लक्ष्य तय करते हैं 🎯",
  "goals.subtitle": "एक विज़ुअल योजना बनाने के लिए कुछ जल्दी जानकारी।",
  "goals.chooseGoal": "एक लक्ष्य चुनें",
  "goals.age": "आपकी उम्र",
  "goals.monthlyBudget": "मासिक बचत राशि",
  "goals.targetAmount": "लक्ष्य राशि",
  "goals.yearsToGoal": "लक्ष्य तक वर्ष",
  "goals.existingLifeCover": "मौजूदा जीवन बीमा कवर",
  "goals.type.child_education": "बच्चे की शिक्षा",
  "goals.type.home": "घर",
  "goals.type.marriage": "विवाह",
  "goals.type.retirement": "सेवानिवृत्ति",
  "goals.type.wealth": "धन-सृजन",
  "goals.type.family_protection": "पारिवारिक सुरक्षा",

  // ---- risk comfort ----
  "risk.title": "जोखिम उठाने की क्षमता",
  "risk.low": "कम",
  "risk.medium": "मध्यम",
  "risk.high": "अधिक",

  // ---- summary (Step 2) ----
  "summary.title": "आपका लक्ष्य एक नज़र में",
  "summary.subtitle": "हम इसी आधार पर योजना बनाएँगे।",
  "summary.time": "अवधि",
  "summary.currentAge": "वर्तमान उम्र",
  "summary.totalContributions": "💵 कुल नियोजित योगदान",
  "summary.contributionsExplain":
    "{amount} × 12 महीने × {years} वर्ष आपके लक्ष्य का लगभग {pct}% पूरा करता है।",

  // ---- goal gap (Step 3) ----
  "goalGap.title": "आपका लक्ष्य",
  "goalGap.neededIn": "{years} वर्षों में आवश्यक",
  "goalGap.canSetAside": "आप हर माह इतना अलग रख सकते हैं",
  "goalGap.yourContributions": "आपका स्वयं का योगदान",
  "goalGap.journeyTitle": "यह सफर कैसा दिख सकता है?",
  "goalGap.illustration": "{rate}% उदाहरण",
  "goalGap.ofGoal": "लक्ष्य का {percent}%",
  "goalGap.goalLabel": "लक्ष्य",
  "goalGap.illustrativeValue": "अनुमानित मूल्य",
  "goalGap.potentialGap": "लक्ष्य तक पहुँचने के लिए संभावित कमी",
  "goalGap.surplus": "लक्ष्य से अधिक",
  "goalGap.youContribute": "आपका योगदान",
  "goalGap.illustrativeGrowth": "अनुमानित वृद्धि",
  "goalGap.chooseScenario": "जानने के लिए एक परिदृश्य चुनें",

  // ---- plan builder (Step 4) ----
  "planBuilder.title": "अपनी योजना बनाएं",
  "planBuilder.subtitle":
    "देखें कि आपकी मासिक राशि को कैसे बाँटा जा सकता है — यह सुझाव नहीं, केवल एक योजना उपकरण है।",
  "planBuilder.monthlyCapacity": "मासिक क्षमता",
  "planBuilder.startingIllustration": "शुरुआती उदाहरण",
  "planBuilder.goalBuilding": "लक्ष्य निर्माण",
  "planBuilder.protectionAllocationLabel": "सुरक्षा आवंटन",
  "planBuilder.goalBuildingAllocationLabel": "लक्ष्य-निर्माण आवंटन",
  "planBuilder.scenario": "परिदृश्य",
  "planBuilder.yourStructure": "आपकी संरचना",
  "planBuilder.yearIllustration": "{years}-वर्ष का उदाहरण",
  "planBuilder.youContributeTowardGoal": "लक्ष्य की ओर आपका योगदान",
  "planBuilder.illustrativeGoalValue": "अनुमानित लक्ष्य मूल्य",
  "planBuilder.potentialGap": "संभावित कमी",
  "planBuilder.targetReached": "लक्ष्य पूरा हुआ",
  "planBuilder.compareStructures": "संरचनाओं की तुलना करें",
  "planBuilder.structuresDisclaimer": "ये केवल उदाहरण संरचनाएं हैं — सुझाव नहीं।",
  "planBuilder.structure.protectionFocus": "सुरक्षा केंद्रित",
  "planBuilder.structure.balancedIllustration": "संतुलित उदाहरण",
  "planBuilder.structure.goalFocus": "लक्ष्य केंद्रित",
  "planBuilder.protectionAdequacy": "सुरक्षा पर्याप्तता",
  "planBuilder.needsAssessment": "आकलन आवश्यक",
  "planBuilder.protectionAdequacyNote": "सुरक्षा पर्याप्त है या नहीं, इसका आकलन अलग से किया जाएगा।",
  "planBuilder.protectionPerMonth": "मासिक सुरक्षा आवंटन",
  "planBuilder.goalBuildingPerMonth": "मासिक लक्ष्य-निर्माण आवंटन",
  "planBuilder.goalContributionLabel": "लक्ष्य योगदान",

  // ---- protection-adjusted comparison ("Full Picture") ----
  "fullPicture.title": "पूरी तस्वीर देखें",
  "fullPicture.subtitle":
    "एक ही लक्ष्य, एक ही समयसीमा और एक ही उपलब्ध राशि के लिए — लक्ष्य तक पहुँचने के अलग-अलग तरीकों के बीच का अंतर।",
  "comparison.structure.traditionalInsurance": "बीमा संरचना",
  "comparison.structure.investmentScenario": "निवेश परिदृश्य",
  "comparison.goalCoverage": "लक्ष्य पूर्ति",
  "comparison.remainingGoalGap": "शेष लक्ष्य कमी",
  "comparison.familyProtection": "पारिवारिक सुरक्षा",
  "comparison.builtInLifeProtection": "अंतर्निहित जीवन सुरक्षा",
  "comparison.taxTreatment": "कर व्यवहार",
  "comparison.premiumGst": "प्रीमियम पर GST",
  "comparison.taxBenefit": "कर लाभ",
  "comparison.maturityTaxTreatment": "परिपक्वता पर कर व्यवहार",
  "comparison.costsCharges": "लागत और शुल्क",
  "comparison.expenseRatio": "व्यय अनुपात",
  "comparison.fundManagementCharge": "फंड प्रबंधन शुल्क",
  "comparison.exitLoad": "एग्ज़िट लोड",
  "comparison.otherCharges": "अन्य शुल्क",
  "comparison.marketRisk": "बाज़ार जोखिम",
  "comparison.marketLinked": "बाज़ार-आधारित",
  "comparison.liquidity": "नकदी में बदलने की सुविधा",
  "comparison.guarantees": "गारंटी",
  "comparison.guaranteedValue": "गारंटीशुदा मूल्य",
  "comparison.nonGuaranteedBenefit": "गैर-गारंटीशुदा लाभ",
  "comparison.protectionDuringJourney": "आपके सफर के दौरान सुरक्षा",
  "comparison.timelineToday": "आज",
  "comparison.timelineGoalYear": "लक्ष्य वर्ष",
  "comparison.separateInsuranceNote": "अलग जीवन बीमा को निवेश रणनीति के साथ जोड़ा जा सकता है।",
  "comparison.exploreGap": "शेष कमी को पूरा करने के तरीके जानें",
  "comparison.option.additionalInsurance": "अतिरिक्त बीमा/बचत",
  "comparison.option.marketLinkedInsurance": "बाज़ार-आधारित बीमा",
  "comparison.option.investmentStrategy": "निवेश रणनीति",
  "comparison.option.protectionPlusInvestment": "सुरक्षा + निवेश",
  "comparison.status.verified": "सत्यापित",
  "comparison.status.partial": "आंशिक रूप से सत्यापित",
  "comparison.status.illustrative": "अनुमानित उदाहरण",
  "comparison.status.conditional": "शर्तों पर निर्भर",
  "comparison.status.not_applicable": "लागू नहीं",
  "comparison.status.unavailable": "सत्यापन आवश्यक",
  "comparison.riskLevel.not_market_linked": "बाज़ार-आधारित नहीं",
  "comparison.riskLevel.market_linked": "बाज़ार-आधारित",
  "comparison.riskLevel.higher_volatility": "अधिक बाज़ार उतार-चढ़ाव",
  "comparison.note.guaranteed_value_only": "केवल सत्यापित गारंटीशुदा मूल्य शामिल है",
  "comparison.note.requires_sum_assured": "गणना के लिए मूल बीमा राशि आवश्यक है",
  "comparison.note.requires_additional_verified_inputs": "अतिरिक्त सत्यापित जानकारी आवश्यक है",
  "comparison.note.bonus_not_verified": "शामिल नहीं / सत्यापित बोनस अनुमान आवश्यक",
  "comparison.note.depends_on_policy_rules": "पॉलिसी और ग्राहक पात्रता नियमों पर निर्भर करता है",
  "comparison.note.not_a_mutual_fund": "लागू नहीं — यह म्यूचुअल फंड जैसा उत्पाद नहीं है",
  "comparison.note.requires_verified_source": "सत्यापित स्रोत आवश्यक है",
  "comparison.note.policy_specific": "विशिष्ट पॉलिसी पर निर्भर करता है",
  "comparison.note.no_built_in_life_protection": "कोई अंतर्निहित जीवन सुरक्षा नहीं",
  "comparison.note.illustrative_market_scenario": "अनुमानित बाज़ार परिदृश्य",
  "comparison.note.not_an_insurance_premium": "लागू नहीं — इसमें कोई बीमा प्रीमियम शामिल नहीं है",
  "comparison.note.not_calculated_yet": "अभी गणना नहीं की गई",
  "comparison.note.no_guaranteed_component": "कोई नहीं",

  // ---- LIC options (Step 4) ----
  "lic.title": "🏦 आपके लक्ष्य के लिए LIC योजनाएँ",
  "lic.budgetLine": "💰 बजट: {amount}/माह",
  "lic.warning.retirement_expansion_required":
    "सेवानिवृत्ति के लिए विशेष उत्पाद सूची अभी और विस्तृत की जानी है।",
  "lic.warning.no_active_matches":
    "इस लक्ष्य के लिए फिलहाल कोई सक्रिय LIC योजना उपलब्ध नहीं है।",
  "lic.plansWorthExploring": "✨ विचार करने योग्य योजनाएँ",
  "lic.matchExplain":
    "लक्ष्य और उत्पाद श्रेणी के आधार पर मिलान किया गया है। प्रीमियम की सामर्थ्य केवल तभी जाँची जाती है जब सत्यापित योजना-विशिष्ट गणना नियम उपलब्ध हों।",
  "lic.potentialGoalMatch": "🎯 आपके लक्ष्य से मेल खाने वाली योजना",
  "lic.categoryMatch": "✓ लक्ष्य/श्रेणी मेल",
  "lic.needsVerifiedRules": "सत्यापित उत्पाद नियम आवश्यक",
  "lic.verified": "सत्यापित",
  "lic.budgetFitLabel": "{amount} बजट में फिट",
  "lic.confirmed": "पुष्टि हो गई",
  "lic.notCalculatedYet": "अभी गणना नहीं की गई",
  "lic.explorePlan": "योजना देखें →",
  "lic.viewMore": "और LIC विकल्प देखें →",
  "lic.currentLifeCover": "🛡️ मौजूदा जीवन बीमा कवर",
  "lic.protectionRequirement": "आवश्यक सुरक्षा राशि",
  "lic.needsAssessment": "⚠️ आकलन आवश्यक",
  "lic.notAdviceDisclaimer":
    "इन विकल्पों पर ग्राहक के साथ चर्चा करें — यह सूची व्यक्तिगत वित्तीय सलाह नहीं है।",
  "lic.whyItAppeared": "🎯 यह क्यों दिखाई दिया",
  "lic.categoryMatchReason": "आपकी चुनी गई लक्ष्य श्रेणी से मेल खाता है",
  "lic.yourDetails": "आपका विवरण",
  "lic.eligibility.notIntegrated": "⚠️ सत्यापन प्रणाली अभी जोड़ी नहीं गई है",
  "lic.eligibility.passes": "✓ उत्पाद-स्तर के नियमों को पूरा करता है",
  "lic.eligibility.notEligible": "✗ चुने गए विवरण के अनुसार पात्र नहीं",
  "lic.eligibility.needsDetails": "⚠️ पात्रता जांचने के लिए और जानकारी चाहिए",
  "lic.premiumUnavailable": "⚠️ सटीक प्रीमियम के लिए सत्यापित LIC दरें आवश्यक हैं",
  "lic.deathBenefitStructure":
    "परिपक्वता तक हर साल {income}, साथ ही अवधि के दौरान मृत्यु होने पर परिपक्वता पर {lumpsum}।",
  "lic.maturityGuaranteed": "{amount} गारंटीशुदा (भविष्य के बोनस को छोड़कर)",
  "lic.calculationExplain":
    "गारंटीशुदा राशियाँ आपकी चुनी गई बीमा राशि से इस योजना के प्रकाशित फॉर्मूले के अनुसार सीधे निकाली जाती हैं। इनमें बोनस और \"7× वार्षिक प्रीमियम\" वाला मृत्यु लाभ शामिल नहीं है, जिसकी तुलना के लिए सत्यापित प्रीमियम चाहिए।",
  "lic.verifyBeforeSale":
    "⚠️ बिक्री से पहले सत्यापित करें — पात्रता, प्रीमियम, लाभ, अपवाद और पॉलिसी शर्तों की जाँच वर्तमान आधिकारिक LIC दस्तावेज़ों ({url}) से करनी होगी।",

  // ---- Plan 733 configurator ----
  "plan733.configLabel": "योजना कॉन्फ़िगरेशन",
  "plan733.basicSumAssured": "मूल बीमा राशि",
  "plan733.configHint": "यह योजना कॉन्फ़िगरेशन है — अनुशंसित कवर राशि नहीं।",
  "plan733.policyTerm": "⏳ पॉलिसी अवधि",
  "plan733.eligibilityPass": "✓ Plan 733 के उत्पाद-स्तर नियमों को पूरा करता है",
  "plan733.eligibilityFail": "⚠️ यह कॉन्फ़िगरेशन Plan 733 के नियमों को पूरा नहीं करता",
  "plan733.reason.age_below_min": "उम्र कम से कम {min} होनी चाहिए (दर्ज: {actual})।",
  "plan733.reason.age_above_max": "उम्र अधिकतम {max} होनी चाहिए (दर्ज: {actual})।",
  "plan733.reason.term_out_of_range":
    "पॉलिसी अवधि {min} से {max} वर्ष के बीच होनी चाहिए (दर्ज: {actual})।",
  "plan733.reason.maturity_age_too_high":
    "परिपक्वता पर उम्र ({actual}) अधिकतम सीमा {max} से अधिक हो जाएगी।",
  "plan733.reason.maturity_age_too_low":
    "परिपक्वता पर उम्र ({actual}) न्यूनतम सीमा {min} से कम होगी।",
  "plan733.reason.ppt_mismatch": "प्रीमियम भुगतान अवधि, पॉलिसी अवधि से {offset} वर्ष कम होनी चाहिए।",
  "plan733.reason.sum_assured_below_min":
    "मूल बीमा राशि कम से कम {min} होनी चाहिए (दर्ज: {actual})।",
  "plan733.reason.sum_assured_invalid_increment": "मूल बीमा राशि अपनी सीमा के लिए सही चरण में नहीं है।",
  "plan733.verifiedPremium": "सत्यापित ब्रोशर उदाहरण प्रीमियम: {amount} / वर्ष",
  "plan733.monthlyEquivalentNote":
    "≈ {amount}/माह। यह केवल तुलना के लिए है; ऊपर दिखाया गया वार्षिक प्रीमियम ही सत्यापित मूल्य है।",
  "plan733.premiumUnavailable": "⚠️ इस कॉन्फ़िगरेशन के लिए सटीक प्रीमियम उपलब्ध नहीं है",
  "plan733.premiumUnavailableReason": "सत्यापित LIC प्रीमियम दर डेटा आवश्यक है।",
  "plan733.budgetComparison": "💰 बजट तुलना",
  "plan733.premiumEquivalent": "प्रीमियम के बराबर राशि",
  "plan733.withinBudget": "✓ आपके बजट के भीतर",
  "plan733.aboveBudget": "⚠️ आपके बजट से अधिक",
  "plan733.budgetNote": "योजना तुलना के लिए वार्षिक प्रीमियम के बराबर राशि पर आधारित।",
  "plan733.budgetNotVerified": "बजट फिट = सत्यापित नहीं",
  "plan733.baseMaturityBenefit": "🎯 मूल परिपक्वता लाभ",
  "plan733.deathBenefitStructure":
    "मृत्यु-लाभ संरचना: परिपक्वता तक हर साल {income}, साथ ही अवधि के दौरान मृत्यु होने पर परिपक्वता पर एकमुश्त {lumpsum}।",
  "plan733.calculationExplain":
    "मूल परिपक्वता लाभ आपकी चुनी गई मूल बीमा राशि के बराबर है। दिखाई गई मृत्यु-लाभ संरचना परिपक्वता पर मूल बीमा राशि का 110% और परिपक्वता तक हर साल 10% है — यदि 7× वार्षिक प्रीमियम इससे अधिक हो तो वास्तविक मृत्यु लाभ अधिक हो सकता है, जिसकी तुलना के लिए सत्यापित प्रीमियम चाहिए। LIC ने बोनस दर प्रकाशित नहीं की है इसलिए बोनस शामिल नहीं किया गया है।",
  "plan733.noValidTerm":
    "⚠️ उम्र {age} के लिए परिपक्वता-आयु नियमों को पूरा करने वाली कोई Plan 733 पॉलिसी अवधि नहीं है।",
  "plan736.configLabel": "योजना कॉन्फ़िगरेशन",
  "plan736.basicSumAssured": "मूल बीमा राशि",
  "plan736.configHint": "यह योजना कॉन्फ़िगरेशन है — अनुशंसित कवर राशि नहीं।",
  "plan736.policyTerm": "⏳ पॉलिसी अवधि",
  "plan736.pptFollowsTerm": "इस पॉलिसी अवधि के लिए प्रीमियम भुगतान अवधि {ppt} वर्ष निर्धारित है।",
  "plan736.eligibilityPass": "✓ Plan 736 के उत्पाद-स्तर नियमों को पूरा करता है",
  "plan736.eligibilityFail": "⚠️ यह कॉन्फ़िगरेशन Plan 736 के नियमों को पूरा नहीं करता",
  "plan736.reason.age_below_min": "उम्र कम से कम {min} होनी चाहिए (दर्ज: {actual})।",
  "plan736.reason.age_above_max_for_term":
    "{term} वर्ष की अवधि के लिए, उम्र अधिकतम {max} होनी चाहिए (दर्ज: {actual})।",
  "plan736.reason.invalid_term_ppt_combination":
    "पॉलिसी अवधि और प्रीमियम भुगतान अवधि उपलब्ध संयोजनों में से एक होनी चाहिए (16/10, 21/15, 25/16)।",
  "plan736.reason.maturity_age_exceeded":
    "परिपक्वता पर उम्र ({actual}) अधिकतम सीमा {max} से अधिक हो जाएगी।",
  "plan736.reason.sum_assured_below_min":
    "मूल बीमा राशि कम से कम {min} होनी चाहिए (दर्ज: {actual})।",
  "plan736.reason.sum_assured_invalid_increment": "मूल बीमा राशि अपनी सीमा के लिए सही चरण में नहीं है।",
  "plan736.verifiedPremium": "सत्यापित ब्रोशर उदाहरण प्रीमियम: {amount} / वर्ष",
  "plan736.monthlyEquivalentNote":
    "≈ {amount}/माह। यह केवल तुलना के लिए है; ऊपर दिखाया गया वार्षिक प्रीमियम ही सत्यापित मूल्य है।",
  "plan736.premiumUnavailable": "⚠️ इस कॉन्फ़िगरेशन के लिए सटीक प्रीमियम उपलब्ध नहीं है",
  "plan736.premiumUnavailableReason": "सत्यापित LIC प्रीमियम दर डेटा आवश्यक है।",
  "plan736.budgetComparison": "💰 बजट तुलना",
  "plan736.premiumEquivalent": "प्रीमियम के बराबर राशि",
  "plan736.withinBudget": "✓ आपके बजट के भीतर",
  "plan736.aboveBudget": "⚠️ आपके बजट से अधिक",
  "plan736.budgetNote": "योजना तुलना के लिए वार्षिक प्रीमियम के बराबर राशि पर आधारित।",
  "plan736.budgetNotVerified": "बजट फिट = सत्यापित नहीं",
  "plan736.baseMaturityBenefit": "🎯 मूल परिपक्वता लाभ",
  "plan736.familyProtection": "❤️ पारिवारिक सुरक्षा (मृत्यु पर बीमा राशि)",
  "plan736.familyProtectionFloor":
    "पारिवारिक सुरक्षा कम से कम {amount} है (गारंटीड न्यूनतम); पूरी राशि आपके प्रीमियम पर भी निर्भर करती है, जो इस सटीक कॉन्फ़िगरेशन के लिए सत्यापित नहीं है।",
  "plan736.liquidity": "तरलता",
  "plan736.liquidityFacts":
    "कम से कम एक पूर्ण वर्ष का प्रीमियम चुकाने के बाद ऋण और सरेंडर उपलब्ध होते हैं। सटीक ऋण/सरेंडर राशि की गणना यहाँ नहीं की गई है।",
  "plan736.calculationExplain":
    "मूल परिपक्वता लाभ आपकी चुनी गई मूल बीमा राशि के बराबर है। पारिवारिक सुरक्षा (मृत्यु पर बीमा राशि) मूल बीमा राशि या आपके वार्षिक प्रीमियम के 7 गुना में से जो अधिक हो, वह है — यह पूरी तरह तभी दिखाई जाती है जब आपका सटीक प्रीमियम ब्रोशर की उदाहरण तालिका से सत्यापित हो; अन्यथा केवल गारंटीड मूल बीमा राशि न्यूनतम दिखाई जाती है। LIC ने बोनस दर प्रकाशित नहीं की है इसलिए बोनस शामिल नहीं किया गया है।",
  "plan736.noValidTerm":
    "⚠️ उम्र {age} के लिए पात्रता नियमों को पूरा करने वाली कोई Plan 736 पॉलिसी अवधि नहीं है।",
  "lic.std.configLabel": "योजना कॉन्फ़िगरेशन",
  "lic.std.basicSumAssured": "मूल बीमा राशि",
  "lic.std.configHint": "यह योजना कॉन्फ़िगरेशन है — अनुशंसित कवर राशि नहीं।",
  "lic.std.policyTerm": "⏳ पॉलिसी अवधि",
  "lic.std.premiumPayingTerm": "प्रीमियम भुगतान अवधि",
  "lic.std.pptFollowsTerm": "इस पॉलिसी अवधि के लिए प्रीमियम भुगतान अवधि {ppt} वर्ष निर्धारित है।",
  "lic.std.deathBenefitOption": "मृत्यु पर बीमा राशि विकल्प",
  "lic.std.survivalBenefitOption": "उत्तरजीविता लाभ विकल्प",
  "lic.std.option.I": "विकल्प I",
  "lic.std.option.II": "विकल्प II",
  "lic.std.option.III": "विकल्प III",
  "lic.std.option.IV": "विकल्प IV",
  "lic.std.option.A": "विकल्प A",
  "lic.std.option.B": "विकल्प B",
  "lic.std.option.C": "विकल्प C",
  "lic.std.option.1": "विकल्प 1",
  "lic.std.option.2": "विकल्प 2",
  "lic.std.option.3": "विकल्प 3",
  "lic.std.option.4": "विकल्प 4",
  "lic.std.eligibilityPass": "✓ Plan {plan} के उत्पाद-स्तर नियमों को पूरा करता है",
  "lic.std.eligibilityFail": "⚠️ यह कॉन्फ़िगरेशन Plan {plan} के नियमों को पूरा नहीं करता",
  "lic.std.reason.age_below_min": "उम्र कम से कम {min} होनी चाहिए (दर्ज: {actual})।",
  "lic.std.reason.age_above_max": "उम्र अधिकतम {max} होनी चाहिए (दर्ज: {actual})।",
  "lic.std.reason.age_out_of_range": "उम्र {min} और {max} के बीच होनी चाहिए (दर्ज: {actual})।",
  "lic.std.reason.age_above_max_for_ppt":
    "{ppt} वर्ष की प्रीमियम भुगतान अवधि के लिए, उम्र अधिकतम {max} होनी चाहिए (दर्ज: {actual})।",
  "lic.std.reason.term_out_of_range":
    "पॉलिसी अवधि {min} से {max} वर्ष के बीच होनी चाहिए (दर्ज: {actual})।",
  "lic.std.reason.term_out_of_range_for_ppt":
    "{ppt} वर्ष की प्रीमियम भुगतान अवधि के लिए, पॉलिसी अवधि {min} से {max} वर्ष के बीच होनी चाहिए (दर्ज: {actual})।",
  "lic.std.reason.maturity_age_too_high":
    "परिपक्वता पर उम्र ({actual}) अधिकतम सीमा {max} से अधिक हो जाएगी।",
  "lic.std.reason.maturity_age_too_low":
    "परिपक्वता पर उम्र ({actual}) न्यूनतम सीमा {min} से कम होगी।",
  "lic.std.reason.ppt_must_equal_term":
    "इस योजना के लिए प्रीमियम भुगतान अवधि पॉलिसी अवधि के बराबर होनी चाहिए।",
  "lic.std.reason.invalid_premium_paying_term": "यह प्रीमियम भुगतान अवधि इस योजना में उपलब्ध नहीं है।",
  "lic.std.reason.sum_assured_below_min":
    "मूल बीमा राशि कम से कम {min} होनी चाहिए (दर्ज: {actual})।",
  "lic.std.reason.sum_assured_invalid_increment": "मूल बीमा राशि अपनी सीमा के लिए सही चरण में नहीं है।",
  "lic.std.reason.death_benefit_option_mode_mismatch":
    "चुने गए विकल्प के लिए एक अलग प्रीमियम भुगतान मोड आवश्यक है।",
  "lic.std.verifiedPremium": "सत्यापित ब्रोशर उदाहरण प्रीमियम: {amount} / वर्ष",
  "lic.std.verifiedSinglePremium": "सत्यापित ब्रोशर उदाहरण प्रीमियम: {amount} (एकमुश्त भुगतान)",
  "lic.std.monthlyEquivalentNote":
    "≈ {amount}/माह। यह केवल तुलना के लिए है; ऊपर दिखाया गया वार्षिक प्रीमियम ही सत्यापित मूल्य है।",
  "lic.std.premiumUnavailable": "⚠️ इस कॉन्फ़िगरेशन के लिए सटीक प्रीमियम उपलब्ध नहीं है",
  "lic.std.premiumUnavailableReason": "सत्यापित LIC प्रीमियम दर डेटा आवश्यक है।",
  "lic.std.budgetComparison": "💰 बजट तुलना",
  "lic.std.premiumEquivalent": "प्रीमियम के बराबर राशि",
  "lic.std.withinBudget": "✓ आपके बजट के भीतर",
  "lic.std.aboveBudget": "⚠️ आपके बजट से अधिक",
  "lic.std.budgetNote": "योजना तुलना के लिए वार्षिक प्रीमियम के बराबर राशि पर आधारित।",
  "lic.std.budgetNotVerified": "बजट फिट = सत्यापित नहीं",
  "lic.std.baseMaturityBenefit": "🎯 मूल परिपक्वता लाभ",
  "lic.std.guaranteedAdditionNote":
    "इसमें {amount} की गारंटीड अतिरिक्त राशि शामिल है — यह एक निश्चित दर है जो LIC के निवेश प्रदर्शन पर निर्भर नहीं करती।",
  "lic.std.familyProtection": "❤️ पारिवारिक सुरक्षा (मृत्यु पर बीमा राशि)",
  "lic.std.familyProtectionFloor":
    "पारिवारिक सुरक्षा कम से कम {amount} है (गारंटीड न्यूनतम); पूरी राशि आपके प्रीमियम पर भी निर्भर करती है, जो इस सटीक कॉन्फ़िगरेशन के लिए सत्यापित नहीं है।",
  "lic.std.liquidity": "तरलता",
  "lic.std.liquidityFacts":
    "कम से कम एक पूर्ण वर्ष का प्रीमियम चुकाने के बाद ऋण और सरेंडर उपलब्ध होते हैं। सटीक ऋण/सरेंडर राशि की गणना यहाँ नहीं की गई है।",
  "lic.std.calculationExplain":
    "मूल परिपक्वता लाभ आपकी चुनी गई मूल बीमा राशि के बराबर है, साथ ही इस योजना द्वारा निश्चित, प्रकाशित दर पर दी जाने वाली कोई भी गारंटीड अतिरिक्त राशि। पारिवारिक सुरक्षा (मृत्यु पर बीमा राशि) इस योजना के आधिकारिक सूत्र का पालन करती है और पूरी तरह तभी दिखाई जाती है जब आपका सटीक प्रीमियम ब्रोशर की उदाहरण तालिका से सत्यापित हो; अन्यथा केवल गारंटीड न्यूनतम दिखाई जाती है। कोई भी अतिरिक्त बोनस LIC के भविष्य के प्रदर्शन पर निर्भर करता है और दर प्रकाशित होने तक यहाँ शामिल नहीं किया जाता।",
  "lic.std.noValidTerm": "⚠️ उम्र {age} के लिए पात्रता नियमों को पूरा करने वाली कोई Plan {plan} पॉलिसी अवधि नहीं है।",
  "lic.std.secondDeathNote":
    "दूसरी मृत्यु पर, यह पॉलिसी कम से कम {amount} का भुगतान भी करती है, साथ ही तब तक अर्जित कोई भी गारंटीड एडिशन।",
  "lic.std.survivalBenefitPerInstallment": "💰 उत्तरजीविता लाभ (प्रति किस्त)",
  "lic.std.survivalBenefitAtEndOfPpt": "💰 उत्तरजीविता लाभ (प्रीमियम भुगतान अवधि के अंत में)",
  "lic.std.regularIncomeBenefit": "💰 नियमित आय लाभ (प्रति वर्ष)",
  "lic.std.boosterIncomeBenefit": "🎁 बूस्टर आय लाभ (एकमुश्त)",
  "lic774.premiumPaymentMode": "प्रीमियम भुगतान",
  "lic774.mode.limited": "सीमित प्रीमियम",
  "lic774.mode.single": "एकल प्रीमियम",
  "lic774.nonParNote":
    "यह एक Non-Par योजना है — इसके परिपक्वता और मृत्यु लाभ निश्चित और गारंटीड हैं, इसमें LIC के लाभ या बोनस में कोई भागीदारी नहीं है।",
  "lic.term.premiumMode": "प्रीमियम भुगतान",
  "lic.term.mode.regular": "नियमित प्रीमियम",
  "lic.term.mode.limited": "सीमित प्रीमियम",
  "lic.term.mode.single": "एकल प्रीमियम",
  "lic.term.deathBenefitOption": "मृत्यु पर बीमा राशि विकल्प",
  "lic.term.option.I": "स्तरीय बीमा राशि",
  "lic.term.option.II": "बढ़ती हुई बीमा राशि",
  "lic.term.increasingNote":
    "बढ़ती हुई बीमा राशि के तहत, मृत्यु पर देय राशि 6वें पॉलिसी वर्ष से हर साल बढ़ती है और 16वें पॉलिसी वर्ष तक {amount} (मूल बीमा राशि का 2 गुना) तक पहुँच जाती है, फिर स्थिर रहती है।",
  "lic.term.noMaturityBenefit": "यह एक शुद्ध जोखिम योजना है — कोई परिपक्वता लाभ कभी देय नहीं है, केवल सुरक्षा।",
  "lic.term.liquidityFacts":
    "इस योजना के तहत कोई ऋण उपलब्ध नहीं है। नियमित प्रीमियम के तहत कोई सरेंडर मूल्य नहीं है; एकल या सीमित प्रीमियम के तहत, सरेंडर पर अप्रचलित जोखिम प्रीमियम मूल्य (यदि कोई हो) देय हो सकता है — सटीक राशि की गणना यहाँ नहीं की गई है।",
  "lic.term.calculationExplain":
    "मृत्यु पर बीमा राशि एक निश्चित राशि (मूल बीमा राशि, या विकल्प II के तहत बढ़ती हुई अनुसूची), आपके वार्षिक प्रीमियम का 7 गुना, और भुगतान किए गए प्रीमियम का 105% (एकल प्रीमियम के लिए इसके बजाय एकल प्रीमियम का 125%) में से सबसे अधिक है — यह पूर्ण रूप से तभी दिखाया जाता है जब आपका सटीक प्रीमियम ब्रोशर की नमूना तालिका से सत्यापित हो; अन्यथा केवल गारंटीड राशि दिखाई जाती है। कोई परिपक्वता लाभ या बोनस नहीं है।",
  "lic.credit.interestRate": "ऋण ब्याज दर",
  "lic.credit.interestRateHint":
    "आपके ऋण की अपनी ब्याज दर से मेल खाने के लिए शुरुआत में एक बार चुनी जाती है — यह उस गति को तय करती है जिस पर कवर घटता है, और बाद में इसे बदला नहीं जा सकता।",
  "lic.credit.sumAssuredAtInception": "❤️ मृत्यु पर बीमा राशि (आरंभ में)",
  "lic.credit.decreasingNote":
    "यह कवर हर पॉलिसी वर्ष ऋण-चुकौती अनुसूची के अनुसार घटता है, अंतिम पॉलिसी वर्ष तक लगभग {amount} तक पहुँच जाता है।",
  "lic.credit.calculationExplain":
    "मृत्यु पर बीमा राशि आपकी चुनी हुई मूल बीमा राशि से शुरू होती है और हर पॉलिसी वर्ष घटती है, आपकी चुनी हुई ब्याज दर पर बैंक ऋण जैसी समान वार्षिक चुकौती अनुसूची का पालन करते हुए। कोई परिपक्वता लाभ या बोनस नहीं है।",

  // ---- strategy (Step 5) ----
  "strategy.title": "आपके लक्ष्य तक पहुँचने के 3 तरीके",
  "strategy.subtitle":
    "सुरक्षा और वृद्धि के अलग-अलग मिश्रण। कोई भी सार्वभौमिक रूप से \"सबसे अच्छा\" नहीं है — जो चर्चा के लिए सही लगे उसे चुनें।",
  "strategy.protection_first.title": "पहले सुरक्षा",
  "strategy.protection_first.tagline": "सुरक्षा + सुरक्षित बचत की दिशा",
  "strategy.protection_first.description":
    "जीवन बीमा कवर और पूंजी सुरक्षा को प्राथमिकता देता है, और एक छोटा हिस्सा स्थिर, कम उतार-चढ़ाव वाली वृद्धि के लिए रखता है।",
  "strategy.balanced.title": "संतुलित",
  "strategy.balanced.tagline": "सुरक्षा + बाज़ार-आधारित वृद्धि",
  "strategy.balanced.description":
    "परिवार की सुरक्षा और बाज़ार-आधारित वृद्धि की तलाश के बीच ध्यान बाँटता है।",
  "strategy.growth_focused.title": "वृद्धि केंद्रित",
  "strategy.growth_focused.tagline": "अधिक बाज़ार जोखिम",
  "strategy.growth_focused.description":
    "अधिक वृद्धि क्षमता के लिए बाज़ार-आधारित साधनों की ओर झुकता है, साथ ही एक बुनियादी सुरक्षा भी बनाए रखता है।",
  "strategy.risk.lower": "कम",
  "strategy.risk.medium": "मध्यम",
  "strategy.risk.higher": "अधिक",
  "strategy.protectionPct": "🛡️ सुरक्षा {pct}%",
  "strategy.growthPct": "📈 वृद्धि {pct}%",

  // ---- protection vs growth (Step 6) ----
  "protection.vsGrowthTitle": "सुरक्षा बनाम वृद्धि",
  "protection.vsGrowthSubtitle": "दो अलग-अलग काम — पास-पास समझने लायक।",
  "protection.label": "सुरक्षा",
  "growth.marketInvestmentLabel": "बाज़ार निवेश",
  "protection.compare.life_cover.label": "जीवन बीमा कवर",
  "protection.compare.life_cover.protectionNote":
    "पॉलिसी की शर्तों के अनुसार बीमित घटना पर परिवार को राशि मिलती है।",
  "protection.compare.life_cover.growthNote": "जीवन बीमा कवर शामिल नहीं है।",
  "protection.compare.life_cover.why":
    "जीवन बीमा एक कवर की गई घटना पर एक तय लाभ देने का अनुबंध है, जो पॉलिसी की शर्तों और अपवादों के अधीन है। बाज़ार निवेश यह अनुबंधित सुरक्षा नहीं देते।",
  "protection.compare.goal_planning.label": "लक्ष्य योजना",
  "protection.compare.goal_planning.protectionNote": "कुछ योजनाएँ कवर के साथ अनुशासित बचत को जोड़ती हैं।",
  "protection.compare.goal_planning.growthNote": "आमतौर पर भविष्य की राशि के लिए इस्तेमाल होता है।",
  "protection.compare.goal_planning.why":
    "दोनों लक्ष्य में मदद कर सकते हैं, लेकिन अलग तरीकों से — एक सुरक्षा अनुबंध के माध्यम से, दूसरा बाज़ार भागीदारी के माध्यम से।",
  "protection.compare.growth_potential.label": "वृद्धि की संभावना",
  "protection.compare.growth_potential.protectionNote": "आमतौर पर कम, कुछ हिस्सा गारंटीशुदा हो सकता है।",
  "protection.compare.growth_potential.growthNote": "संभावित रूप से अधिक, लेकिन तय नहीं।",
  "protection.compare.growth_potential.why":
    "बाज़ार-आधारित साधनों ने ऐतिहासिक रूप से लंबी अवधि में अधिक वृद्धि क्षमता दिखाई है, लेकिन रिटर्न कभी गारंटीशुदा नहीं होता और किसी भी अवधि में घट भी सकता है।",
  "protection.compare.volatility.label": "बाज़ार में उतार-चढ़ाव",
  "protection.compare.volatility.protectionNote":
    "गारंटीशुदा हिस्से काफी हद तक बाज़ार के उतार-चढ़ाव से सुरक्षित रहते हैं।",
  "protection.compare.volatility.growthNote": "मूल्य बाज़ार के साथ ऊपर-नीचे हो सकता है।",
  "protection.compare.volatility.why":
    "बाज़ार-आधारित उत्पाद बाज़ार की स्थितियों के साथ बदलते हैं। बीमा गारंटी (जहाँ लागू हो) बीमाकर्ता के अनुबंधित वादे से आती है, बाज़ार के प्रदर्शन से नहीं।",
  "protection.compare.liquidity.label": "नकदी में बदलने की सुविधा",
  "protection.compare.liquidity.protectionNote":
    "अक्सर सीमित; जल्दी बाहर निकलने पर राशि घट सकती है या शुल्क लग सकता है।",
  "protection.compare.liquidity.growthNote": "आमतौर पर अधिक सुलभ, हालाँकि यह उत्पाद पर निर्भर करता है।",
  "protection.compare.liquidity.why":
    "बीमा उत्पाद लंबी अवधि के लिए बनाए जाते हैं और जल्दी निकासी पर शुल्क लग सकता है। कई निवेश उत्पाद पैसे तक आसान पहुँच देते हैं, पर यह काफी अलग-अलग हो सकता है।",
  "protection.compare.family_protection.label": "पारिवारिक सुरक्षा",
  "protection.compare.family_protection.protectionNote":
    "मुख्य उद्देश्य — आश्रितों की सुरक्षा के लिए एक तय भुगतान।",
  "protection.compare.family_protection.growthNote":
    "अप्रत्यक्ष — ज़रूरत के समय जमा हुई राशि पर निर्भर करता है।",
  "protection.compare.family_protection.why":
    "बीमा किसी घटना पर परिवार को आर्थिक रूप से सुरक्षित करने के लिए ही बनाया गया है। निवेश भी परिवार की मदद कर सकते हैं, पर केवल उतनी राशि तक जितनी तब तक जमा हो चुकी हो।",

  // ---- SIP scenario (Step 7) ----
  "sip.title": "निवेश परिदृश्य",
  "sip.subtitle": "{amount}/माह {years} वर्षों तक निवेश करने पर, कुछ उदाहरण दरों के अनुसार।",
  "sip.ratePa": "{rate}% प्रति वर्ष",
  "sip.disclaimer":
    "⚠️ यह केवल गणना का उदाहरण है — रिटर्न की गारंटी नहीं है। ये अपेक्षित या वादा किए गए म्यूचुअल फंड प्रदर्शन के आँकड़े नहीं हैं।",

  // ---- market risk (Step 8) ----
  "marketRisk.title": "बाज़ार जोखिम, दृश्य रूप में",
  "marketRisk.subtitle": "समय के साथ बाज़ार दोनों दिशाओं में चलते हैं।",
  "marketRisk.canRise": "बाज़ार ऊपर जा सकता है",
  "marketRisk.canFall": "बाज़ार नीचे भी जा सकता है",
  "marketRisk.longTerm": "लंबी अवधि में भी जोखिम रहता है",
  "marketRisk.disclaimer": "पिछला प्रदर्शन भविष्य के रिटर्न की गारंटी नहीं देता।",

  // ---- family protection story (Step 9) ----
  "protection.storyTitle": "सुरक्षा क्यों ज़रूरी है",
  "protection.storySubtitle": "यह सब कैसे जुड़ा है, यह देखने का एक आसान तरीका।",
  "protection.flow.family": "आपका परिवार",
  "protection.flow.goal": "वित्तीय लक्ष्य",
  "protection.flow.protection": "सुरक्षा",
  "protection.flow.protected": "परिवार, सुरक्षित",
  "protection.storyDisclaimer":
    "बीमा सुरक्षा चुनी गई पॉलिसी के अनुबंधित लाभों, शर्तों, अपवादों और दावा शर्तों पर निर्भर करती है। हर बीमा उत्पाद रिटर्न की गारंटी नहीं देता या वित्तीय लक्ष्य पूरा होने की गारंटी नहीं देता।",

  // ---- final plan (Step 10) ----
  "finalPlan.title": "✨ आपकी वित्तीय योजना",
  "finalPlan.duration": "⏳ अवधि",
  "finalPlan.investmentAllocation": "📈 निवेश आवंटन",
  "finalPlan.selectedStrategy": "⚖️ चुनी गई रणनीति",
  "finalPlan.share": "📱 शेयर करें",
  "finalPlan.download": "📄 डाउनलोड करें",
  "finalPlan.save": "❤️ सहेजें",
  "finalPlan.sharePlan": "📱 योजना शेयर करें",
  "finalPlan.downloadPlan": "📄 योजना डाउनलोड करें",
  "finalPlan.savePlan": "❤️ योजना सहेजें",
  "finalPlan.comingNext": "{feature} जल्द आ रहा है — यह अभी इस प्रीव्यू में उपलब्ध नहीं है।",
  "finalPlan.disclaimer":
    "यह योजना केवल चर्चा और जानकारी के लिए है। गारंटीशुदा मूल्य, गैर-गारंटीशुदा उदाहरण और बाज़ार-आधारित रिटर्न अलग-अलग हैं — अंतिम शर्तें चुने गए वास्तविक उत्पाद पर निर्भर करती हैं।",
};

export const TRANSLATIONS: Record<Locale, TranslationDict> = { en, ta, hi };

export function t(
  key: string,
  locale: Locale,
  vars?: Record<string, string | number>
): string {
  const template = TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
    template
  );
}
