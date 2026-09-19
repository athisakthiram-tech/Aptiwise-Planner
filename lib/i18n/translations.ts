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
  "lic.pension.marketLinkedWarning":
    "This is a unit-linked plan. The investment risk is borne by you. Unit values may go up or down based on market performance — this planner never predicts or assumes any investment return.",
  "lic.pension.premiumMode": "Premium payment",
  "lic.pension.mode.single": "Single Premium",
  "lic.pension.mode.yearly": "Yearly",
  "lic.pension.mode.half_yearly": "Half-Yearly",
  "lic.pension.mode.quarterly": "Quarterly",
  "lic.pension.mode.monthly": "Monthly",
  "lic.pension.premiumLabel": "Premium",
  "lic.pension.premiumHint": "Minimum for this mode: {min}. You choose the amount — there is no fixed rate table.",
  "lic.pension.policyTerm": "⏳ Policy Term",
  "lic.pension.vestingAgeNote": "Your age at vesting (end of term) would be {age}.",
  "lic.pension.assuredDeathBenefit": "❤️ Assured Death Benefit (at inception)",
  "lic.pension.guaranteedAdditions": "💰 Guaranteed Additions (over the full term)",
  "lic.pension.guaranteedAdditionsNote":
    "Guaranteed Additions are a fixed top-up to your Unit Fund — not the total fund value. The actual maturity/vesting amount also depends on investment performance.",
  "lic.pension.noMaturityProjection":
    "⚠️ No maturity or vesting value is shown — it depends entirely on market performance and can never be predicted.",
  "lic.pension.charges": "Charges",
  "lic.pension.fundManagementCharge": "Fund Management Charge",
  "lic.pension.mortalityCharge": "Mortality Charge",
  "lic.pension.otherChargesNote":
    "Premium Allocation, Policy Administration and Discontinuance Charges also apply — these vary by policy year and premium band and are not shown as a single figure here.",
  "lic.pension.liquidityFacts":
    "No loan is available under this plan. Units cannot be surrendered or withdrawn during the first 5 years (lock-in period). After 5 years, surrender/withdrawal is available, generally requiring you to purchase an annuity with the proceeds.",
  "lic.pension.calculationExplain":
    "Guaranteed Additions are a fixed percentage of your premium, added to your Unit Fund at specific policy years — this part is guaranteed regardless of markets. The Assured Death Benefit shown is 105% of premiums paid at inception. The maturity/vesting value is your Unit Fund Value, which depends on NAV performance of your chosen fund and is never projected here.",

  // ---- annuity/pension plans (857/862/879/758) ----
  "lic.annuity.purchasePriceLabel": "Purchase Price",
  "lic.annuity.purchasePriceHint":
    "This is the lump sum you pay to buy the annuity. There is no fixed rate table here — the exact annuity amount is only shown when it matches this plan's one published illustration point.",
  "lic.annuity.modeLabel": "Annuity payment mode",
  "lic.annuity.optionLabel": "Annuity Option",
  "lic.annuity.optionCode": "Option {code}",
  "lic.annuity.jointLifeBadge": "Joint Life",
  "lic.annuity.secondaryAgeLabel": "Secondary Annuitant's age",
  "lic.annuity.secondaryAgeHint": "Required for Joint Life options.",
  "lic.annuity.defermentPeriodLabel": "Deferment period",
  "lic.annuity.defermentPeriodHint":
    "Years between purchase and the first annuity payment ({min}-{max} years).",
  "lic.annuity.annuityAmountLabel": "💰 Annuity Amount",
  "lic.annuity.annuityAmountUnavailable":
    "Not shown — this exact combination doesn't match the plan's one published illustration point, and rates are never interpolated or guessed.",
  "lic.annuity.deathBenefitLabel": "❤️ Benefit on Death",
  "lic.annuity.deathBenefit.none":
    "Nothing is payable on death under this option — annuity payments simply cease.",
  "lic.annuity.deathBenefit.fullPurchasePrice":
    "{pct}% of Purchase Price ({amount}) is payable to the nominee.",
  "lic.annuity.deathBenefit.guaranteedPeriod":
    "The balance of the {years}-year guaranteed period is payable to the nominee (up to {amount} if death occurs right after purchase).",
  "lic.annuity.deathBenefit.notComputed":
    "Payable per this option's own terms (e.g. continuing to a joint-life survivor) — not reducible to a single figure here.",
  "lic.annuity.maturityNote":
    "There is no maturity benefit under this plan — the Purchase Price buys a lifetime annuity, not a savings maturity value.",
  "lic.annuity.loanLabel": "Loan",
  "lic.annuity.surrenderLabel": "Surrender",
  "lic.annuity.status.yes": "Available",
  "lic.annuity.status.no": "Not available",
  "lic.annuity.status.conditional": "Conditional — see plan terms",
  "lic.annuity.surrenderCriticalIllnessNote":
    "Surrender is only allowed if the Annuitant, spouse or a child is diagnosed with a specified critical illness.",
  "lic.annuity.calculationExplain":
    "The annuity amount is looked up only for the exact Purchase Price, age, mode and Option this plan's brochure illustrates — never interpolated or estimated for any other combination. The death benefit shown is only the portion that's fully guaranteed regardless of markets or elapsed time.",

  // ---- Index Plus (873) — ULIP with a Basic Sum Assured ----
  "lic.indexplus.bsaMultipleLabel": "Basic Sum Assured multiple",
  "lic.indexplus.bsaMultipleOption": "{multiple}× Annualized Premium",
  "lic.indexplus.basicSumAssuredLabel": "Basic Sum Assured",
  "lic.indexplus.maturityAgeNote": "Your age at maturity (end of term) would be {age}.",
  "lic.indexplus.liquidityFacts":
    "No loan is available under this plan. Units cannot be surrendered or withdrawn during the first 5 years (lock-in period).",
  "lic.indexplus.calculationExplain":
    "Basic Sum Assured is your chosen multiple (7x or 10x) of Annualized Premium — always known directly, no rate table needed. Guaranteed Additions are a fixed percentage of Annualized Premium, credited at specific policy years regardless of markets. The maturity value is your Unit Fund Value, which depends on NAV performance and is never projected here.",

  // ---- Planner Results experience ----
  "results.extras.toggleLabel": "Add a few more details (optional)",
  "results.extras.hideLabel": "Hide extra details",
  "results.extras.intro": "These help make your Family Protection and Goal numbers more complete — skip anything you don't know yet.",
  "results.extras.existingInvestments": "Existing investments/savings for this goal",
  "results.extras.outstandingLiabilities": "Outstanding loans/liabilities",

  "results.goal.title": "🎯 Your Goal",
  "results.goal.target": "Target",
  "results.goal.time": "Time",
  "results.goal.currentResources": "Current resources",
  "results.goal.goalGap": "Goal gap",
  "results.goal.notProvided": "Not provided yet",

  "results.protection.title": "🛡️ Your Family Protection",
  "results.protection.calculatedNeed": "Calculated need",
  "results.protection.existingCover": "Existing cover",
  "results.protection.protectionGap": "Protection gap",
  "results.protection.unavailableNote": "Add a few more details above to calculate this.",
  "results.protection.partialNote": "Based on the details available so far — add more for a fuller picture.",

  "results.budget.title": "💰 Planning Budget",

  "results.explore.title": "🧭 Explore Planning Structures",
  "results.explore.subtitle": "Different ways to work toward your goal — none of these is a single \"right answer\".",
  "results.family.structureCount": "{n} structures",
  "results.family.open": "View structures",

  "results.family.title.protection_investment": "Protection + Investment",
  "results.family.blurb.protection_investment": "Separates protection from investment.",
  "results.family.title.traditional_protection": "Traditional Insurance + Protection",
  "results.family.blurb.traditional_protection": "Combines a savings-based LIC plan with extra protection where a gap remains.",
  "results.family.title.market_linked_insurance": "Market-Linked Insurance",
  "results.family.blurb.market_linked_insurance": "Life cover bundled with a market-linked investment fund.",
  "results.family.title.traditional_structure": "Traditional Insurance",
  "results.family.blurb.traditional_structure": "A savings-based LIC plan aimed at your stated goal.",
  "results.family.title.retirement_structure": "Retirement Planning",
  "results.family.blurb.retirement_structure": "Pension/annuity products for income after retirement.",

  "results.strategy.familyProtection": "❤️ Family Protection",
  "results.strategy.goalCoverage": "🎯 Goal Coverage",
  "results.strategy.budgetUsage": "💰 Budget Usage",
  "results.strategy.marketExposure": "📈 Market Exposure",
  "results.strategy.guarantees": "🔒 Guarantees",
  "results.strategy.liquidity": "💧 Liquidity",
  "results.strategy.viewDetails": "Structure details",
  "results.strategy.addToCompare": "Add to compare",
  "results.strategy.removeFromCompare": "Remove from compare",
  "results.strategy.compareLimitReached": "You can compare up to 3 structures at a time.",
  "results.strategy.back": "← All structures",
  "results.strategy.marketExposure.market_linked": "Market-linked",
  "results.strategy.marketExposure.not_market_linked": "Not market-linked",
  "results.strategy.investmentLabel": "Investment",

  "results.status.verified": "Verified",
  "results.status.illustrative": "Illustration",
  "results.status.partial": "Partial",
  "results.status.conditional": "Conditional",
  "results.status.unavailable": "Requires verification",
  "results.status.notApplicable": "Not applicable",

  "results.budget.verifiedUsed": "{amount}/month used",
  "results.budget.remaining": "{amount}/month remaining",
  "results.budget.withinBudget": "Within your stated budget",
  "results.budget.premiumRequiresVerification": "Insurance premium: requires verification",
  "results.budget.cannotVerifyTotal": "Total budget usage: cannot yet be verified",
  "results.budget.investmentBeforeAdjustment": "Investment illustration: {amount}/month, before insurance premium adjustment",
  "results.budget.investmentUsesFullBudgetNote":
    "This illustration uses your full available {amount}/month because the insurance premium for this structure isn't verified yet — the real amount available for investment may be lower.",

  "results.protectionVisual.required": "Required",
  "results.protectionVisual.existing": "Existing",
  "results.protectionVisual.structure": "This structure",
  "results.protectionVisual.remainingGap": "Remaining gap",
  "results.protectionVisual.fullyMet": "No remaining protection gap for this amount.",
  "results.protectionVisual.unavailable": "Your Family Protection need isn't calculated yet.",

  "results.goalVisual.title": "Goal Coverage",
  "results.goalVisual.currentResources": "Current resources",
  "results.goalVisual.structureValue": "Structure value",
  "results.goalVisual.remainingGap": "Remaining goal gap",
  "results.goalVisual.coveragePercent": "{pct}% goal coverage",
  "results.goalVisual.illustrativeNote": "Includes a non-guaranteed, illustrative projection — not a promised value.",
  "results.goalVisual.unavailable": "Goal coverage from this structure isn't available yet.",

  "results.journey.today": "Today",
  "results.journey.budget": "Your budget",
  "results.journey.premium": "Premium",
  "results.journey.protectionAlongTheWay": "Protection along the way",
  "results.journey.goalBuilding": "Goal / wealth building",
  "results.journey.futureGoal": "Your future goal",
  "results.journey.insuranceStructure": "LIC insurance structure",
  "results.journey.marketLinkedStructure": "Market-linked insurance",
  "results.journey.maturityGoalValue": "Maturity / goal value",
  "results.journey.unitLinkedValue": "Unit-linked value",
  "results.journey.investmentIllustration": "Investment illustration",
  "results.journey.retirementIncome": "Retirement income",

  "results.reason.title": "Why is this shown?",
  "results.reason.PROTECTION_GAP_PRESENT": "You have a Family Protection gap.",
  "results.reason.NO_PROTECTION_GAP": "No additional Family Protection gap was found.",
  "results.reason.GOAL_FUNDING_REQUIRED": "Your stated goal needs additional funding.",
  "results.reason.GOAL_ALREADY_COVERED": "Your stated resources already cover this goal.",
  "results.reason.MARKET_RISK_ACCEPTED": "This structure includes market exposure.",
  "results.reason.MARKET_RISK_NOT_PREFERRED":
    "This structure includes market exposure, though you indicated a preference for lower risk.",
  "results.reason.LIQUIDITY_IMPORTANT": "Easy access to your money matters to you.",
  "results.reason.RETIREMENT_GOAL": "Shown because your stated goal is retirement.",
  "results.reason.PRODUCT_ELIGIBLE": "You meet this product's published eligibility conditions.",
  "results.reason.PRODUCT_NEEDS_MORE_INFO": "More information is needed to confirm eligibility.",
  "results.reason.PREMIUM_VERIFIED": "This premium is from LIC's published rates.",
  "results.reason.PREMIUM_UNAVAILABLE": "The exact premium isn't available from published rates yet.",
  "results.reason.ADDITIONAL_PROTECTION_REQUIRED": "Extra protection was added to help close your Family Protection gap.",
  "results.reason.NO_ELIGIBLE_PRODUCTS": "No eligible products were found for this structure.",

  "results.compare.title": "⚖️ Compare Structures",
  "results.compare.selectPrompt": "Select up to 3 structures to compare",
  "results.compare.empty": "Select structures from the list to compare them here.",
  "results.compare.open": "Compare selected",
  "results.compare.dimension.familyProtection": "❤️ Family Protection",
  "results.compare.dimension.goalCoverage": "🎯 Goal Coverage",
  "results.compare.dimension.budgetUsage": "💰 Budget Usage",
  "results.compare.dimension.guarantees": "🔒 Guaranteed Benefits",
  "results.compare.dimension.marketExposure": "📈 Market Exposure",
  "results.compare.dimension.liquidity": "💧 Liquidity",
  "results.compare.dimension.costs": "💸 Costs",
  "results.compare.dimension.taxTreatment": "🧾 Tax Treatment",

  "results.detail.title": "📋 Structure Details",
  "results.detail.productName": "Product name",
  "results.detail.category": "Category",
  "results.detail.eligibilityStatus": "Eligibility status",
  "results.detail.premiumStatus": "Premium status",
  "results.detail.protection": "Protection",
  "results.detail.maturityBenefit": "Maturity / benefits",
  "results.detail.guaranteedValues": "Guaranteed values",
  "results.detail.nonGuaranteedValues": "Non-guaranteed values",
  "results.detail.liquidity": "Liquidity",
  "results.detail.costs": "Costs",
  "results.detail.tax": "Tax",
  "results.detail.assumptions": "Assumptions",
  "results.detail.warnings": "Notes",
  "results.detail.eligible": "Eligible",
  "results.detail.eligibleNeedsInfo": "Needs more information",
  "results.detail.eligibleNo": "Not eligible",
  "results.detail.noComponents": "No further components in this structure.",

  "results.assumption.illustrative_investment_uses_full_monthly_budget_because_protection_premium_is_unavailable":
    "The investment illustration uses your full available budget because the insurance premium for this structure isn't verified yet.",
  "results.assumption.additional_term_component_uses_first_eligible_registered_term_product_not_a_ranked_choice":
    "The extra protection shown uses the first eligible term plan found — not a ranked or preferred choice.",
  "results.assumption.market_linked_premium_is_a_direct_customer_choice_not_derived_from_goal_or_budget":
    "The premium for a market-linked plan is your own choice — it isn't derived from your goal or budget.",
  "results.assumption.retirement_income_amount_is_a_direct_customer_choice_not_derived_from_goal":
    "The amount you'd pay for retirement income is your own choice — it isn't derived from your stated goal.",
  "results.warning.illustration_only_not_guaranteed_returns": "Illustration only — not guaranteed returns.",
  "results.warning.market_linked_maturity_value_never_projected_nav_dependent":
    "The market-linked maturity value depends on fund performance and is never projected here.",

  "results.category.term_protection": "Term Protection",
  "results.category.savings_endowment": "Savings / Endowment",
  "results.category.whole_life": "Whole Life",
  "results.category.money_back_child": "Money Back / Child Plan",
  "results.category.pension": "Pension / Annuity",
  "results.category.market_linked_ulip": "Unit-Linked (ULIP)",
  "results.category.micro_insurance": "Micro Insurance",

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
  "lic.pension.marketLinkedWarning":
    "இது ஒரு யூனிட்-லிங்க்டு திட்டம். முதலீட்டு ஆபத்து உங்களிடம் உள்ளது. சந்தை செயல்திறனைப் பொறுத்து யூனிட் மதிப்புகள் ஏறலாம் அல்லது இறங்கலாம் — இந்த திட்டமிடுதல் கருவி எந்த முதலீட்டு வருமானத்தையும் ஒருபோதும் கணிக்காது அல்லது கருதாது.",
  "lic.pension.premiumMode": "பிரீமியம் செலுத்துதல்",
  "lic.pension.mode.single": "ஒற்றை பிரீமியம்",
  "lic.pension.mode.yearly": "ஆண்டுதோறும்",
  "lic.pension.mode.half_yearly": "அரையாண்டு",
  "lic.pension.mode.quarterly": "காலாண்டு",
  "lic.pension.mode.monthly": "மாதந்தோறும்",
  "lic.pension.premiumLabel": "பிரீமியம்",
  "lic.pension.premiumHint": "இந்த முறைக்கான குறைந்தபட்சம்: {min}. நீங்கள் தொகையைத் தேர்வு செய்கிறீர்கள் — நிலையான விகித அட்டவணை இல்லை.",
  "lic.pension.policyTerm": "⏳ பாலிசி காலம்",
  "lic.pension.vestingAgeNote": "காலம் முடிவில் (vesting) உங்கள் வயது {age} ஆக இருக்கும்.",
  "lic.pension.assuredDeathBenefit": "❤️ உறுதிசெய்யப்பட்ட மரண நலன் (ஆரம்பத்தில்)",
  "lic.pension.guaranteedAdditions": "💰 உறுதியான கூடுதல் தொகைகள் (முழு காலத்திற்கும்)",
  "lic.pension.guaranteedAdditionsNote":
    "உறுதியான கூடுதல் தொகைகள் உங்கள் யூனிட் ஃபண்டுக்கான நிலையான கூடுதல் — மொத்த நிதி மதிப்பு அல்ல. உண்மையான முதிர்வு/vesting தொகை முதலீட்டு செயல்திறனைப் பொறுத்தும்.",
  "lic.pension.noMaturityProjection":
    "⚠️ முதிர்வு அல்லது vesting மதிப்பு காட்டப்படவில்லை — இது முழுவதுமாக சந்தை செயல்திறனைப் பொறுத்தது, ஒருபோதும் கணிக்க முடியாது.",
  "lic.pension.charges": "கட்டணங்கள்",
  "lic.pension.fundManagementCharge": "நிதி மேலாண்மை கட்டணம்",
  "lic.pension.mortalityCharge": "மரண கட்டணம்",
  "lic.pension.otherChargesNote":
    "பிரீமியம் ஒதுக்கீடு, பாலிசி நிர்வாகம் மற்றும் நிறுத்தல் கட்டணங்களும் பொருந்தும் — இவை பாலிசி ஆண்டு மற்றும் பிரீமியம் வரம்பைப் பொறுத்து மாறுபடும், இங்கே ஒரு எண்ணாக காட்டப்படவில்லை.",
  "lic.pension.liquidityFacts":
    "இந்த திட்டத்தின் கீழ் கடன் கிடைக்காது. முதல் 5 ஆண்டுகளில் (லாக்-இன் காலம்) யூனிட்களை surrender செய்யவோ திரும்பப் பெறவோ முடியாது. 5 ஆண்டுகளுக்குப் பிறகு, surrender/திரும்பப் பெறுதல் கிடைக்கும், பொதுவாக தொகையைக் கொண்டு annuity வாங்க வேண்டும்.",
  "lic.pension.calculationExplain":
    "உறுதியான கூடுதல் தொகைகள் உங்கள் பிரீமியத்தின் நிலையான சதவீதம், குறிப்பிட்ட பாலிசி ஆண்டுகளில் உங்கள் யூனிட் ஃபண்டுக்கு சேர்க்கப்படும் — இந்த பகுதி சந்தையைப் பொருட்படுத்தாமல் உறுதியானது. காட்டப்படும் உறுதிசெய்யப்பட்ட மரண நலன் ஆரம்பத்தில் செலுத்திய பிரீமியத்தின் 105% ஆகும். முதிர்வு/vesting மதிப்பு உங்கள் யூனிட் ஃபண்ட் மதிப்பு, இது உங்கள் தேர்ந்தெடுக்கப்பட்ட நிதியின் NAV செயல்திறனைப் பொறுத்தது, இங்கே ஒருபோதும் கணிக்கப்படாது.",

  // ---- annuity/pension plans (857/862/879/758) ----
  "lic.annuity.purchasePriceLabel": "கொள்முதல் விலை",
  "lic.annuity.purchasePriceHint":
    "இது annuity வாங்க நீங்கள் செலுத்தும் மொத்தத் தொகை. இங்கே நிலையான விகித அட்டவணை இல்லை — இந்தத் திட்டத்தின் ஒரே வெளியிடப்பட்ட உதாரணப் புள்ளியுடன் பொருந்தும்போது மட்டுமே சரியான annuity தொகை காட்டப்படும்.",
  "lic.annuity.modeLabel": "Annuity செலுத்தும் முறை",
  "lic.annuity.optionLabel": "Annuity விருப்பம்",
  "lic.annuity.optionCode": "விருப்பம் {code}",
  "lic.annuity.jointLifeBadge": "கூட்டு வாழ்க்கை (Joint Life)",
  "lic.annuity.secondaryAgeLabel": "இரண்டாம் Annuitant-இன் வயது",
  "lic.annuity.secondaryAgeHint": "கூட்டு வாழ்க்கை விருப்பங்களுக்கு தேவை.",
  "lic.annuity.defermentPeriodLabel": "தாமத காலம் (Deferment Period)",
  "lic.annuity.defermentPeriodHint":
    "கொள்முதல் மற்றும் முதல் annuity செலுத்துதலுக்கு இடையேயான ஆண்டுகள் ({min}-{max} ஆண்டுகள்).",
  "lic.annuity.annuityAmountLabel": "💰 Annuity தொகை",
  "lic.annuity.annuityAmountUnavailable":
    "காட்டப்படவில்லை — இந்தச் சேர்க்கை திட்டத்தின் ஒரே வெளியிடப்பட்ட உதாரணப் புள்ளியுடன் பொருந்தவில்லை, விகிதங்கள் ஒருபோதும் interpolate செய்யப்படாது அல்லது யூகிக்கப்படாது.",
  "lic.annuity.deathBenefitLabel": "❤️ மரணத்தின் போது நலன்",
  "lic.annuity.deathBenefit.none":
    "இந்த விருப்பத்தின் கீழ் மரணத்தின் போது எதுவும் செலுத்தப்படாது — annuity கொடுப்பனவுகள் நிறுத்தப்படும்.",
  "lic.annuity.deathBenefit.fullPurchasePrice":
    "கொள்முதல் விலையில் {pct}% ({amount}) நியமிக்கப்பட்டவருக்கு செலுத்தப்படும்.",
  "lic.annuity.deathBenefit.guaranteedPeriod":
    "உத்தரவாதமான {years} ஆண்டு காலத்தின் மீதி நியமிக்கப்பட்டவருக்கு செலுத்தப்படும் (கொள்முதலுக்குப் பின் உடனடியாக மரணம் நேர்ந்தால் அதிகபட்சம் {amount}).",
  "lic.annuity.deathBenefit.notComputed":
    "இந்த விருப்பத்தின் சொந்த விதிமுறைகளின்படி செலுத்தப்படும் (எ.கா. கூட்டு-வாழ்க்கை survivor-க்கு தொடர்தல்) — இங்கே ஒரு எண்ணாக காட்ட முடியாது.",
  "lic.annuity.maturityNote":
    "இந்தத் திட்டத்தின் கீழ் முதிர்வு நலன் இல்லை — கொள்முதல் விலை ஆயுள் முழுவதும் annuity வாங்குகிறது, சேமிப்பு முதிர்வு மதிப்பு அல்ல.",
  "lic.annuity.loanLabel": "கடன்",
  "lic.annuity.surrenderLabel": "சரண்டர்",
  "lic.annuity.status.yes": "கிடைக்கும்",
  "lic.annuity.status.no": "கிடைக்காது",
  "lic.annuity.status.conditional": "நிபந்தனைக்குட்பட்டது — திட்ட விதிமுறைகளைப் பார்க்கவும்",
  "lic.annuity.surrenderCriticalIllnessNote":
    "Annuitant, துணைவர் அல்லது குழந்தை ஒரு குறிப்பிட்ட கடுமையான நோயால் கண்டறியப்பட்டால் மட்டுமே சரண்டர் அனுமதிக்கப்படும்.",
  "lic.annuity.calculationExplain":
    "Annuity தொகை இந்தத் திட்டத்தின் சிற்றேட்டில் காட்டப்பட்டுள்ள சரியான கொள்முதல் விலை, வயது, முறை மற்றும் விருப்பத்திற்கு மட்டுமே தேடப்படுகிறது — வேறு எந்த சேர்க்கைக்கும் interpolate அல்லது மதிப்பிடப்படாது. காட்டப்படும் மரண நலன் சந்தைகள் அல்லது கடந்த காலத்தைப் பொருட்படுத்தாமல் முழுமையாக உத்தரவாதம் அளிக்கப்பட்ட பகுதி மட்டுமே.",

  // ---- Index Plus (873) — ULIP with a Basic Sum Assured ----
  "lic.indexplus.bsaMultipleLabel": "அடிப்படை பாதுகாப்புத் தொகை மடங்கு",
  "lic.indexplus.bsaMultipleOption": "வருடாந்திர பிரீமியத்தின் {multiple}× மடங்கு",
  "lic.indexplus.basicSumAssuredLabel": "அடிப்படை பாதுகாப்புத் தொகை",
  "lic.indexplus.maturityAgeNote": "முதிர்வில் (காலத்தின் முடிவில்) உங்கள் வயது {age} ஆக இருக்கும்.",
  "lic.indexplus.liquidityFacts":
    "இந்த திட்டத்தின் கீழ் கடன் கிடைக்காது. முதல் 5 ஆண்டுகளில் (லாக்-இன் காலம்) யூனிட்களை surrender செய்யவோ திரும்பப் பெறவோ முடியாது.",
  "lic.indexplus.calculationExplain":
    "அடிப்படை பாதுகாப்புத் தொகை என்பது நீங்கள் தேர்ந்தெடுத்த வருடாந்திர பிரீமியத்தின் மடங்கு (7x அல்லது 10x) — விகித அட்டவணை தேவையின்றி நேரடியாக அறியப்படும். உறுதியான கூடுதல் தொகைகள் வருடாந்திர பிரீமியத்தின் நிலையான சதவீதம், குறிப்பிட்ட பாலிசி ஆண்டுகளில் சந்தையைப் பொருட்படுத்தாமல் வழங்கப்படும். முதிர்வு மதிப்பு உங்கள் யூனிட் ஃபண்ட் மதிப்பு, இது NAV செயல்திறனைப் பொறுத்தது, இங்கே ஒருபோதும் கணிக்கப்படாது.",

  // ---- Planner Results experience ----
  "results.extras.toggleLabel": "இன்னும் சில விவரங்களைச் சேர்க்கவும் (விருப்பத்தேர்வு)",
  "results.extras.hideLabel": "கூடுதல் விவரங்களை மறை",
  "results.extras.intro": "இவை உங்கள் குடும்பப் பாதுகாப்பு மற்றும் இலக்கு எண்களை முழுமையாக்க உதவும் — உங்களுக்குத் தெரியாதவற்றைத் தவிர்க்கலாம்.",
  "results.extras.existingInvestments": "இந்த இலக்குக்கான தற்போதைய முதலீடுகள்/சேமிப்புகள்",
  "results.extras.outstandingLiabilities": "நிலுவையிலுள்ள கடன்கள்/பொறுப்புகள்",

  "results.goal.title": "🎯 உங்கள் இலக்கு",
  "results.goal.target": "இலக்குத் தொகை",
  "results.goal.time": "காலம்",
  "results.goal.currentResources": "தற்போதைய வளங்கள்",
  "results.goal.goalGap": "இலக்கு இடைவெளி",
  "results.goal.notProvided": "இன்னும் வழங்கப்படவில்லை",

  "results.protection.title": "🛡️ உங்கள் குடும்பப் பாதுகாப்பு",
  "results.protection.calculatedNeed": "கணக்கிடப்பட்ட தேவை",
  "results.protection.existingCover": "தற்போதைய கவரேஜ்",
  "results.protection.protectionGap": "பாதுகாப்பு இடைவெளி",
  "results.protection.unavailableNote": "இதைக் கணக்கிட மேலே சில கூடுதல் விவரங்களைச் சேர்க்கவும்.",
  "results.protection.partialNote": "இதுவரை உள்ள விவரங்களின் அடிப்படையில் — முழுமையான படத்திற்கு மேலும் சேர்க்கவும்.",

  "results.budget.title": "💰 திட்டமிடல் பட்ஜெட்",

  "results.explore.title": "🧭 திட்டமிடல் கட்டமைப்புகளை ஆராயுங்கள்",
  "results.explore.subtitle": "உங்கள் இலக்கை நோக்கிச் செல்ல வெவ்வேறு வழிகள் — இவற்றில் ஒன்றும் ஒரே \"சரியான பதில்\" அல்ல.",
  "results.family.structureCount": "{n} கட்டமைப்புகள்",
  "results.family.open": "கட்டமைப்புகளைக் காண்க",

  "results.family.title.protection_investment": "பாதுகாப்பு + முதலீடு",
  "results.family.blurb.protection_investment": "பாதுகாப்பையும் முதலீட்டையும் தனித்தனியாகப் பிரிக்கிறது.",
  "results.family.title.traditional_protection": "பாரம்பரிய காப்பீடு + பாதுகாப்பு",
  "results.family.blurb.traditional_protection": "ஒரு சேமிப்பு அடிப்படையிலான LIC திட்டத்தை, இடைவெளி இருக்கும்போது கூடுதல் பாதுகாப்புடன் இணைக்கிறது.",
  "results.family.title.market_linked_insurance": "சந்தை-இணைந்த காப்பீடு",
  "results.family.blurb.market_linked_insurance": "வாழ்க்கை காப்பீட்டுடன் சந்தை-இணைந்த முதலீட்டு நிதியை இணைக்கிறது.",
  "results.family.title.traditional_structure": "பாரம்பரிய காப்பீடு",
  "results.family.blurb.traditional_structure": "உங்கள் இலக்கை நோக்கிய சேமிப்பு அடிப்படையிலான LIC திட்டம்.",
  "results.family.title.retirement_structure": "ஓய்வூதியத் திட்டமிடல்",
  "results.family.blurb.retirement_structure": "ஓய்விற்குப் பிறகான வருமானத்திற்கான பென்ஷன்/annuity தயாரிப்புகள்.",

  "results.strategy.familyProtection": "❤️ குடும்பப் பாதுகாப்பு",
  "results.strategy.goalCoverage": "🎯 இலக்கு கவரேஜ்",
  "results.strategy.budgetUsage": "💰 பட்ஜெட் பயன்பாடு",
  "results.strategy.marketExposure": "📈 சந்தை வெளிப்பாடு",
  "results.strategy.guarantees": "🔒 உத்தரவாதங்கள்",
  "results.strategy.liquidity": "💧 லிக்விடிட்டி",
  "results.strategy.viewDetails": "கட்டமைப்பு விவரங்கள்",
  "results.strategy.addToCompare": "ஒப்பிடலில் சேர்",
  "results.strategy.removeFromCompare": "ஒப்பிடலிலிருந்து நீக்கு",
  "results.strategy.compareLimitReached": "ஒரே நேரத்தில் அதிகபட்சம் 3 கட்டமைப்புகளை ஒப்பிடலாம்.",
  "results.strategy.back": "← அனைத்து கட்டமைப்புகள்",
  "results.strategy.marketExposure.market_linked": "சந்தை-இணைந்தது",
  "results.strategy.marketExposure.not_market_linked": "சந்தை-இணைக்கப்படாதது",
  "results.strategy.investmentLabel": "முதலீடு",

  "results.status.verified": "சரிபார்க்கப்பட்டது",
  "results.status.illustrative": "உதாரணம்",
  "results.status.partial": "பகுதியளவு",
  "results.status.conditional": "நிபந்தனைக்குட்பட்டது",
  "results.status.unavailable": "சரிபார்ப்பு தேவை",
  "results.status.notApplicable": "பொருந்தாது",

  "results.budget.verifiedUsed": "{amount}/மாதம் பயன்படுத்தப்பட்டது",
  "results.budget.remaining": "{amount}/மாதம் மீதம்",
  "results.budget.withinBudget": "உங்கள் குறிப்பிட்ட பட்ஜெட்டிற்குள்",
  "results.budget.premiumRequiresVerification": "காப்பீட்டு பிரீமியம்: சரிபார்ப்பு தேவை",
  "results.budget.cannotVerifyTotal": "மொத்த பட்ஜெட் பயன்பாடு: இன்னும் சரிபார்க்க முடியவில்லை",
  "results.budget.investmentBeforeAdjustment": "முதலீட்டு உதாரணம்: {amount}/மாதம், காப்பீட்டு பிரீமியம் சரிசெய்யப்படுவதற்கு முன்",
  "results.budget.investmentUsesFullBudgetNote":
    "இந்த கட்டமைப்பிற்கான காப்பீட்டு பிரீமியம் இன்னும் சரிபார்க்கப்படாததால், இந்த உதாரணம் உங்கள் முழு கிடைக்கும் {amount}/மாதத்தையும் பயன்படுத்துகிறது — முதலீட்டிற்கு உண்மையில் கிடைக்கும் தொகை குறைவாக இருக்கலாம்.",

  "results.protectionVisual.required": "தேவையானது",
  "results.protectionVisual.existing": "தற்போதையது",
  "results.protectionVisual.structure": "இந்த கட்டமைப்பு",
  "results.protectionVisual.remainingGap": "மீதமுள்ள இடைவெளி",
  "results.protectionVisual.fullyMet": "இந்தத் தொகைக்கு மீதமுள்ள பாதுகாப்பு இடைவெளி இல்லை.",
  "results.protectionVisual.unavailable": "உங்கள் குடும்பப் பாதுகாப்பு தேவை இன்னும் கணக்கிடப்படவில்லை.",

  "results.goalVisual.title": "இலக்கு கவரேஜ்",
  "results.goalVisual.currentResources": "தற்போதைய வளங்கள்",
  "results.goalVisual.structureValue": "கட்டமைப்பு மதிப்பு",
  "results.goalVisual.remainingGap": "மீதமுள்ள இலக்கு இடைவெளி",
  "results.goalVisual.coveragePercent": "{pct}% இலக்கு கவரேஜ்",
  "results.goalVisual.illustrativeNote": "உத்தரவாதமற்ற, உதாரண மதிப்பீட்டை உள்ளடக்கியது — உறுதியளிக்கப்பட்ட மதிப்பு அல்ல.",
  "results.goalVisual.unavailable": "இந்த கட்டமைப்பிலிருந்து இலக்கு கவரேஜ் இன்னும் கிடைக்கவில்லை.",

  "results.journey.today": "இன்று",
  "results.journey.budget": "உங்கள் பட்ஜெட்",
  "results.journey.premium": "பிரீமியம்",
  "results.journey.protectionAlongTheWay": "பயணத்தின்போது பாதுகாப்பு",
  "results.journey.goalBuilding": "இலக்கு / செல்வம் உருவாக்கம்",
  "results.journey.futureGoal": "உங்கள் எதிர்கால இலக்கு",
  "results.journey.insuranceStructure": "LIC காப்பீட்டு கட்டமைப்பு",
  "results.journey.marketLinkedStructure": "சந்தை-இணைந்த காப்பீடு",
  "results.journey.maturityGoalValue": "முதிர்வு / இலக்கு மதிப்பு",
  "results.journey.unitLinkedValue": "யூனிட்-இணைந்த மதிப்பு",
  "results.journey.investmentIllustration": "முதலீட்டு உதாரணம்",
  "results.journey.retirementIncome": "ஓய்வூதிய வருமானம்",

  "results.reason.title": "இது ஏன் காட்டப்படுகிறது?",
  "results.reason.PROTECTION_GAP_PRESENT": "உங்களுக்கு குடும்பப் பாதுகாப்பு இடைவெளி உள்ளது.",
  "results.reason.NO_PROTECTION_GAP": "கூடுதல் குடும்பப் பாதுகாப்பு இடைவெளி எதுவும் கிடைக்கவில்லை.",
  "results.reason.GOAL_FUNDING_REQUIRED": "உங்கள் குறிப்பிட்ட இலக்குக்கு கூடுதல் நிதி தேவை.",
  "results.reason.GOAL_ALREADY_COVERED": "உங்கள் குறிப்பிட்ட வளங்கள் ஏற்கனவே இந்த இலக்கை ஈடுகட்டுகின்றன.",
  "results.reason.MARKET_RISK_ACCEPTED": "இந்த கட்டமைப்பில் சந்தை வெளிப்பாடு உள்ளது.",
  "results.reason.MARKET_RISK_NOT_PREFERRED":
    "நீங்கள் குறைந்த ரிஸ்க் விருப்பத்தைக் குறிப்பிட்டிருந்தாலும், இந்த கட்டமைப்பில் சந்தை வெளிப்பாடு உள்ளது.",
  "results.reason.LIQUIDITY_IMPORTANT": "உங்கள் பணத்தை எளிதாக அணுகுவது உங்களுக்கு முக்கியம்.",
  "results.reason.RETIREMENT_GOAL": "உங்கள் குறிப்பிட்ட இலக்கு ஓய்வூதியம் என்பதால் காட்டப்படுகிறது.",
  "results.reason.PRODUCT_ELIGIBLE": "இந்த தயாரிப்பின் வெளியிடப்பட்ட தகுதி நிபந்தனைகளை நீங்கள் பூர்த்தி செய்கிறீர்கள்.",
  "results.reason.PRODUCT_NEEDS_MORE_INFO": "தகுதியை உறுதிப்படுத்த கூடுதல் தகவல் தேவை.",
  "results.reason.PREMIUM_VERIFIED": "இந்த பிரீமியம் LIC-இன் வெளியிடப்பட்ட விகிதங்களிலிருந்து.",
  "results.reason.PREMIUM_UNAVAILABLE": "வெளியிடப்பட்ட விகிதங்களிலிருந்து சரியான பிரீமியம் இன்னும் கிடைக்கவில்லை.",
  "results.reason.ADDITIONAL_PROTECTION_REQUIRED": "உங்கள் குடும்பப் பாதுகாப்பு இடைவெளியை மூட உதவ கூடுதல் பாதுகாப்பு சேர்க்கப்பட்டது.",
  "results.reason.NO_ELIGIBLE_PRODUCTS": "இந்த கட்டமைப்பிற்கு தகுதியான தயாரிப்புகள் எதுவும் கிடைக்கவில்லை.",

  "results.compare.title": "⚖️ கட்டமைப்புகளை ஒப்பிடுக",
  "results.compare.selectPrompt": "ஒப்பிட அதிகபட்சம் 3 கட்டமைப்புகளைத் தேர்ந்தெடுக்கவும்",
  "results.compare.empty": "ஒப்பிடுவதற்கு பட்டியலிலிருந்து கட்டமைப்புகளைத் தேர்ந்தெடுக்கவும்.",
  "results.compare.open": "தேர்ந்தெடுக்கப்பட்டவற்றை ஒப்பிடு",
  "results.compare.dimension.familyProtection": "❤️ குடும்பப் பாதுகாப்பு",
  "results.compare.dimension.goalCoverage": "🎯 இலக்கு கவரேஜ்",
  "results.compare.dimension.budgetUsage": "💰 பட்ஜெட் பயன்பாடு",
  "results.compare.dimension.guarantees": "🔒 உத்தரவாத பலன்கள்",
  "results.compare.dimension.marketExposure": "📈 சந்தை வெளிப்பாடு",
  "results.compare.dimension.liquidity": "💧 லிக்விடிட்டி",
  "results.compare.dimension.costs": "💸 செலவுகள்",
  "results.compare.dimension.taxTreatment": "🧾 வரி நடைமுறை",

  "results.detail.title": "📋 கட்டமைப்பு விவரங்கள்",
  "results.detail.productName": "தயாரிப்பு பெயர்",
  "results.detail.category": "வகை",
  "results.detail.eligibilityStatus": "தகுதி நிலை",
  "results.detail.premiumStatus": "பிரீமியம் நிலை",
  "results.detail.protection": "பாதுகாப்பு",
  "results.detail.maturityBenefit": "முதிர்வு / பலன்கள்",
  "results.detail.guaranteedValues": "உத்தரவாத மதிப்புகள்",
  "results.detail.nonGuaranteedValues": "உத்தரவாதமற்ற மதிப்புகள்",
  "results.detail.liquidity": "லிக்விடிட்டி",
  "results.detail.costs": "செலவுகள்",
  "results.detail.tax": "வரி",
  "results.detail.assumptions": "அனுமானங்கள்",
  "results.detail.warnings": "குறிப்புகள்",
  "results.detail.eligible": "தகுதியானது",
  "results.detail.eligibleNeedsInfo": "கூடுதல் தகவல் தேவை",
  "results.detail.eligibleNo": "தகுதியற்றது",
  "results.detail.noComponents": "இந்த கட்டமைப்பில் மேலும் கூறுகள் இல்லை.",

  "results.assumption.illustrative_investment_uses_full_monthly_budget_because_protection_premium_is_unavailable":
    "இந்த கட்டமைப்பிற்கான காப்பீட்டு பிரீமியம் இன்னும் சரிபார்க்கப்படாததால், முதலீட்டு உதாரணம் உங்கள் முழு கிடைக்கும் பட்ஜெட்டையும் பயன்படுத்துகிறது.",
  "results.assumption.additional_term_component_uses_first_eligible_registered_term_product_not_a_ranked_choice":
    "காட்டப்படும் கூடுதல் பாதுகாப்பு, கிடைக்கும் முதல் தகுதியான டெர்ம் திட்டத்தைப் பயன்படுத்துகிறது — இது தரவரிசைப்படுத்தப்பட்ட அல்லது விருப்பமான தேர்வு அல்ல.",
  "results.assumption.market_linked_premium_is_a_direct_customer_choice_not_derived_from_goal_or_budget":
    "சந்தை-இணைந்த திட்டத்திற்கான பிரீமியம் உங்கள் சொந்த தேர்வு — இது உங்கள் இலக்கு அல்லது பட்ஜெட்டிலிருந்து பெறப்படவில்லை.",
  "results.assumption.retirement_income_amount_is_a_direct_customer_choice_not_derived_from_goal":
    "ஓய்வூதிய வருமானத்திற்காக நீங்கள் செலுத்தும் தொகை உங்கள் சொந்த தேர்வு — இது உங்கள் குறிப்பிட்ட இலக்கிலிருந்து பெறப்படவில்லை.",
  "results.warning.illustration_only_not_guaranteed_returns": "உதாரணம் மட்டுமே — உத்தரவாதமான வருமானம் அல்ல.",
  "results.warning.market_linked_maturity_value_never_projected_nav_dependent":
    "சந்தை-இணைந்த முதிர்வு மதிப்பு நிதியின் செயல்திறனைப் பொறுத்தது, இது இங்கே ஒருபோதும் கணிக்கப்படாது.",

  "results.category.term_protection": "டெர்ம் பாதுகாப்பு",
  "results.category.savings_endowment": "சேமிப்பு / எண்டோமெண்ட்",
  "results.category.whole_life": "முழு வாழ்நாள்",
  "results.category.money_back_child": "மனி பேக் / குழந்தை திட்டம்",
  "results.category.pension": "பென்ஷன் / Annuity",
  "results.category.market_linked_ulip": "யூனிட்-இணைந்த (ULIP)",
  "results.category.micro_insurance": "மைக்ரோ காப்பீடு",

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
  "lic.pension.marketLinkedWarning":
    "यह एक यूनिट-लिंक्ड योजना है। निवेश जोखिम आप पर है। बाजार के प्रदर्शन के आधार पर यूनिट मूल्य ऊपर या नीचे जा सकते हैं — यह प्लानर कभी भी किसी निवेश रिटर्न की भविष्यवाणी या धारणा नहीं करता।",
  "lic.pension.premiumMode": "प्रीमियम भुगतान",
  "lic.pension.mode.single": "एकल प्रीमियम",
  "lic.pension.mode.yearly": "वार्षिक",
  "lic.pension.mode.half_yearly": "अर्ध-वार्षिक",
  "lic.pension.mode.quarterly": "त्रैमासिक",
  "lic.pension.mode.monthly": "मासिक",
  "lic.pension.premiumLabel": "प्रीमियम",
  "lic.pension.premiumHint": "इस मोड के लिए न्यूनतम: {min}। आप राशि चुनते हैं — कोई निश्चित दर तालिका नहीं है।",
  "lic.pension.policyTerm": "⏳ पॉलिसी अवधि",
  "lic.pension.vestingAgeNote": "वेस्टिंग (अवधि के अंत) में आपकी उम्र {age} होगी।",
  "lic.pension.assuredDeathBenefit": "❤️ आश्वासित मृत्यु लाभ (आरंभ में)",
  "lic.pension.guaranteedAdditions": "💰 गारंटीड एडिशन (पूरी अवधि में)",
  "lic.pension.guaranteedAdditionsNote":
    "गारंटीड एडिशन आपके यूनिट फंड में एक निश्चित अतिरिक्त राशि है — कुल फंड मूल्य नहीं। वास्तविक परिपक्वता/वेस्टिंग राशि निवेश प्रदर्शन पर भी निर्भर करती है।",
  "lic.pension.noMaturityProjection":
    "⚠️ कोई परिपक्वता या वेस्टिंग मूल्य नहीं दिखाया गया है — यह पूरी तरह से बाजार के प्रदर्शन पर निर्भर करता है और इसकी कभी भविष्यवाणी नहीं की जा सकती।",
  "lic.pension.charges": "शुल्क",
  "lic.pension.fundManagementCharge": "फंड प्रबंधन शुल्क",
  "lic.pension.mortalityCharge": "मृत्यु शुल्क",
  "lic.pension.otherChargesNote":
    "प्रीमियम आवंटन, पॉलिसी प्रशासन और बंद करने के शुल्क भी लागू होते हैं — ये पॉलिसी वर्ष और प्रीमियम बैंड के अनुसार भिन्न होते हैं और यहाँ एक ही आंकड़े के रूप में नहीं दिखाए गए हैं।",
  "lic.pension.liquidityFacts":
    "इस योजना के तहत कोई ऋण उपलब्ध नहीं है। पहले 5 वर्षों (लॉक-इन अवधि) के दौरान यूनिट्स सरेंडर या निकाली नहीं जा सकतीं। 5 वर्षों के बाद, सरेंडर/निकासी उपलब्ध है, आमतौर पर आय से वार्षिकी खरीदने की आवश्यकता होती है।",
  "lic.pension.calculationExplain":
    "गारंटीड एडिशन आपके प्रीमियम का एक निश्चित प्रतिशत है, जो विशिष्ट पॉलिसी वर्षों में आपके यूनिट फंड में जोड़ा जाता है — यह हिस्सा बाजार की परवाह किए बिना गारंटीड है। दिखाया गया आश्वासित मृत्यु लाभ आरंभ में भुगतान किए गए प्रीमियम का 105% है। परिपक्वता/वेस्टिंग मूल्य आपका यूनिट फंड मूल्य है, जो आपकी चुनी हुई फंड की NAV प्रदर्शन पर निर्भर करता है और यहाँ कभी अनुमानित नहीं किया जाता।",

  // ---- annuity/pension plans (857/862/879/758) ----
  "lic.annuity.purchasePriceLabel": "क्रय मूल्य (Purchase Price)",
  "lic.annuity.purchasePriceHint":
    "यह वह एकमुश्त राशि है जो आप annuity खरीदने के लिए चुकाते हैं। यहाँ कोई निश्चित दर तालिका नहीं है — सटीक वार्षिकी राशि केवल तभी दिखाई जाती है जब यह इस योजना के एकमात्र प्रकाशित उदाहरण बिंदु से मेल खाती हो।",
  "lic.annuity.modeLabel": "वार्षिकी भुगतान मोड",
  "lic.annuity.optionLabel": "वार्षिकी विकल्प",
  "lic.annuity.optionCode": "विकल्प {code}",
  "lic.annuity.jointLifeBadge": "संयुक्त जीवन (Joint Life)",
  "lic.annuity.secondaryAgeLabel": "द्वितीय Annuitant की आयु",
  "lic.annuity.secondaryAgeHint": "संयुक्त जीवन विकल्पों के लिए आवश्यक।",
  "lic.annuity.defermentPeriodLabel": "स्थगन अवधि (Deferment Period)",
  "lic.annuity.defermentPeriodHint":
    "क्रय और पहले वार्षिकी भुगतान के बीच के वर्ष ({min}-{max} वर्ष)।",
  "lic.annuity.annuityAmountLabel": "💰 वार्षिकी राशि",
  "lic.annuity.annuityAmountUnavailable":
    "नहीं दिखाया गया — यह संयोजन योजना के एकमात्र प्रकाशित उदाहरण बिंदु से मेल नहीं खाता, और दरों का कभी अनुमान या इंटरपोलेशन नहीं किया जाता।",
  "lic.annuity.deathBenefitLabel": "❤️ मृत्यु पर लाभ",
  "lic.annuity.deathBenefit.none":
    "इस विकल्प के तहत मृत्यु पर कुछ भी देय नहीं है — वार्षिकी भुगतान बंद हो जाता है।",
  "lic.annuity.deathBenefit.fullPurchasePrice":
    "क्रय मूल्य का {pct}% ({amount}) नामिती को देय होगा।",
  "lic.annuity.deathBenefit.guaranteedPeriod":
    "गारंटीड {years}-वर्ष की अवधि का शेष भाग नामिती को देय होगा (यदि क्रय के तुरंत बाद मृत्यु हो तो अधिकतम {amount})।",
  "lic.annuity.deathBenefit.notComputed":
    "इस विकल्प की अपनी शर्तों के अनुसार देय (जैसे संयुक्त-जीवन उत्तरजीवी को जारी रहना) — यहाँ एक अंक में नहीं दिखाया जा सकता।",
  "lic.annuity.maturityNote":
    "इस योजना के तहत कोई परिपक्वता लाभ नहीं है — क्रय मूल्य आजीवन वार्षिकी खरीदता है, बचत परिपक्वता मूल्य नहीं।",
  "lic.annuity.loanLabel": "ऋण",
  "lic.annuity.surrenderLabel": "सरेंडर",
  "lic.annuity.status.yes": "उपलब्ध",
  "lic.annuity.status.no": "उपलब्ध नहीं",
  "lic.annuity.status.conditional": "सशर्त — योजना की शर्तें देखें",
  "lic.annuity.surrenderCriticalIllnessNote":
    "सरेंडर केवल तभी अनुमत है जब Annuitant, पति/पत्नी या बच्चे को किसी विशिष्ट गंभीर बीमारी का निदान हो।",
  "lic.annuity.calculationExplain":
    "वार्षिकी राशि केवल उस सटीक क्रय मूल्य, आयु, मोड और विकल्प के लिए देखी जाती है जिसे इस योजना का ब्रोशर दर्शाता है — किसी अन्य संयोजन के लिए कभी इंटरपोलेट या अनुमानित नहीं किया जाता। दिखाया गया मृत्यु लाभ केवल वह हिस्सा है जो बाजार या बीते समय की परवाह किए बिना पूरी तरह गारंटीड है।",

  // ---- Index Plus (873) — ULIP with a Basic Sum Assured ----
  "lic.indexplus.bsaMultipleLabel": "मूल बीमा राशि गुणक",
  "lic.indexplus.bsaMultipleOption": "वार्षिकीकृत प्रीमियम का {multiple}× गुना",
  "lic.indexplus.basicSumAssuredLabel": "मूल बीमा राशि",
  "lic.indexplus.maturityAgeNote": "परिपक्वता (अवधि के अंत) में आपकी उम्र {age} होगी।",
  "lic.indexplus.liquidityFacts":
    "इस योजना के तहत कोई ऋण उपलब्ध नहीं है। पहले 5 वर्षों (लॉक-इन अवधि) के दौरान यूनिट्स सरेंडर या निकाली नहीं जा सकतीं।",
  "lic.indexplus.calculationExplain":
    "मूल बीमा राशि आपके चुने हुए वार्षिकीकृत प्रीमियम के गुणक (7x या 10x) के बराबर है — बिना किसी दर तालिका के सीधे ज्ञात। गारंटीड एडिशन वार्षिकीकृत प्रीमियम का एक निश्चित प्रतिशत है, जो विशिष्ट पॉलिसी वर्षों में बाजार की परवाह किए बिना जोड़ा जाता है। परिपक्वता मूल्य आपका यूनिट फंड मूल्य है, जो NAV प्रदर्शन पर निर्भर करता है और यहाँ कभी अनुमानित नहीं किया जाता।",

  // ---- Planner Results experience ----
  "results.extras.toggleLabel": "कुछ और विवरण जोड़ें (वैकल्पिक)",
  "results.extras.hideLabel": "अतिरिक्त विवरण छिपाएँ",
  "results.extras.intro": "ये आपके पारिवारिक सुरक्षा और लक्ष्य के आंकड़ों को अधिक पूर्ण बनाने में मदद करते हैं — जो नहीं पता उसे छोड़ दें।",
  "results.extras.existingInvestments": "इस लक्ष्य के लिए मौजूदा निवेश/बचत",
  "results.extras.outstandingLiabilities": "बकाया ऋण/देनदारियाँ",

  "results.goal.title": "🎯 आपका लक्ष्य",
  "results.goal.target": "लक्ष्य राशि",
  "results.goal.time": "समय",
  "results.goal.currentResources": "वर्तमान संसाधन",
  "results.goal.goalGap": "लक्ष्य अंतर",
  "results.goal.notProvided": "अभी तक नहीं दिया गया",

  "results.protection.title": "🛡️ आपकी पारिवारिक सुरक्षा",
  "results.protection.calculatedNeed": "गणना की गई आवश्यकता",
  "results.protection.existingCover": "मौजूदा कवर",
  "results.protection.protectionGap": "सुरक्षा अंतर",
  "results.protection.unavailableNote": "इसकी गणना के लिए ऊपर कुछ और विवरण जोड़ें।",
  "results.protection.partialNote": "अभी तक उपलब्ध विवरणों के आधार पर — पूर्ण तस्वीर के लिए और जोड़ें।",

  "results.budget.title": "💰 योजना बजट",

  "results.explore.title": "🧭 योजना संरचनाएँ देखें",
  "results.explore.subtitle": "आपके लक्ष्य की ओर बढ़ने के अलग-अलग तरीके — इनमें से कोई भी एक ही \"सही जवाब\" नहीं है।",
  "results.family.structureCount": "{n} संरचनाएँ",
  "results.family.open": "संरचनाएँ देखें",

  "results.family.title.protection_investment": "सुरक्षा + निवेश",
  "results.family.blurb.protection_investment": "सुरक्षा और निवेश को अलग-अलग रखता है।",
  "results.family.title.traditional_protection": "पारंपरिक बीमा + सुरक्षा",
  "results.family.blurb.traditional_protection": "एक बचत-आधारित LIC योजना को, अंतर बचे रहने पर अतिरिक्त सुरक्षा के साथ जोड़ता है।",
  "results.family.title.market_linked_insurance": "बाज़ार-आधारित बीमा",
  "results.family.blurb.market_linked_insurance": "जीवन बीमा को बाज़ार-आधारित निवेश फंड के साथ जोड़ता है।",
  "results.family.title.traditional_structure": "पारंपरिक बीमा",
  "results.family.blurb.traditional_structure": "आपके लक्ष्य की ओर लक्षित बचत-आधारित LIC योजना।",
  "results.family.title.retirement_structure": "सेवानिवृत्ति योजना",
  "results.family.blurb.retirement_structure": "सेवानिवृत्ति के बाद आय के लिए पेंशन/annuity उत्पाद।",

  "results.strategy.familyProtection": "❤️ पारिवारिक सुरक्षा",
  "results.strategy.goalCoverage": "🎯 लक्ष्य कवरेज",
  "results.strategy.budgetUsage": "💰 बजट उपयोग",
  "results.strategy.marketExposure": "📈 बाज़ार एक्सपोज़र",
  "results.strategy.guarantees": "🔒 गारंटी",
  "results.strategy.liquidity": "💧 तरलता",
  "results.strategy.viewDetails": "संरचना विवरण",
  "results.strategy.addToCompare": "तुलना में जोड़ें",
  "results.strategy.removeFromCompare": "तुलना से हटाएँ",
  "results.strategy.compareLimitReached": "आप एक बार में अधिकतम 3 संरचनाओं की तुलना कर सकते हैं।",
  "results.strategy.back": "← सभी संरचनाएँ",
  "results.strategy.marketExposure.market_linked": "बाज़ार-आधारित",
  "results.strategy.marketExposure.not_market_linked": "गैर-बाज़ार-आधारित",
  "results.strategy.investmentLabel": "निवेश",

  "results.status.verified": "सत्यापित",
  "results.status.illustrative": "उदाहरण",
  "results.status.partial": "आंशिक",
  "results.status.conditional": "सशर्त",
  "results.status.unavailable": "सत्यापन आवश्यक",
  "results.status.notApplicable": "लागू नहीं",

  "results.budget.verifiedUsed": "{amount}/माह उपयोग किया गया",
  "results.budget.remaining": "{amount}/माह शेष",
  "results.budget.withinBudget": "आपके बताए गए बजट के भीतर",
  "results.budget.premiumRequiresVerification": "बीमा प्रीमियम: सत्यापन आवश्यक",
  "results.budget.cannotVerifyTotal": "कुल बजट उपयोग: अभी सत्यापित नहीं किया जा सकता",
  "results.budget.investmentBeforeAdjustment": "निवेश उदाहरण: {amount}/माह, बीमा प्रीमियम समायोजन से पहले",
  "results.budget.investmentUsesFullBudgetNote":
    "इस संरचना के लिए बीमा प्रीमियम अभी सत्यापित नहीं है, इसलिए यह उदाहरण आपके पूरे उपलब्ध {amount}/माह का उपयोग करता है — निवेश के लिए वास्तव में उपलब्ध राशि कम हो सकती है।",

  "results.protectionVisual.required": "आवश्यक",
  "results.protectionVisual.existing": "मौजूदा",
  "results.protectionVisual.structure": "यह संरचना",
  "results.protectionVisual.remainingGap": "शेष अंतर",
  "results.protectionVisual.fullyMet": "इस राशि के लिए कोई शेष सुरक्षा अंतर नहीं है।",
  "results.protectionVisual.unavailable": "आपकी पारिवारिक सुरक्षा आवश्यकता अभी गणना नहीं की गई है।",

  "results.goalVisual.title": "लक्ष्य कवरेज",
  "results.goalVisual.currentResources": "वर्तमान संसाधन",
  "results.goalVisual.structureValue": "संरचना मूल्य",
  "results.goalVisual.remainingGap": "शेष लक्ष्य अंतर",
  "results.goalVisual.coveragePercent": "{pct}% लक्ष्य कवरेज",
  "results.goalVisual.illustrativeNote": "इसमें एक गैर-गारंटीड, उदाहरण अनुमान शामिल है — यह वादा किया गया मूल्य नहीं है।",
  "results.goalVisual.unavailable": "इस संरचना से लक्ष्य कवरेज अभी उपलब्ध नहीं है।",

  "results.journey.today": "आज",
  "results.journey.budget": "आपका बजट",
  "results.journey.premium": "प्रीमियम",
  "results.journey.protectionAlongTheWay": "यात्रा के दौरान सुरक्षा",
  "results.journey.goalBuilding": "लक्ष्य / संपत्ति निर्माण",
  "results.journey.futureGoal": "आपका भविष्य का लक्ष्य",
  "results.journey.insuranceStructure": "LIC बीमा संरचना",
  "results.journey.marketLinkedStructure": "बाज़ार-आधारित बीमा",
  "results.journey.maturityGoalValue": "परिपक्वता / लक्ष्य मूल्य",
  "results.journey.unitLinkedValue": "यूनिट-लिंक्ड मूल्य",
  "results.journey.investmentIllustration": "निवेश उदाहरण",
  "results.journey.retirementIncome": "सेवानिवृत्ति आय",

  "results.reason.title": "यह क्यों दिखाया गया है?",
  "results.reason.PROTECTION_GAP_PRESENT": "आपके पास एक पारिवारिक सुरक्षा अंतर है।",
  "results.reason.NO_PROTECTION_GAP": "कोई अतिरिक्त पारिवारिक सुरक्षा अंतर नहीं मिला।",
  "results.reason.GOAL_FUNDING_REQUIRED": "आपके बताए गए लक्ष्य को अतिरिक्त धन की आवश्यकता है।",
  "results.reason.GOAL_ALREADY_COVERED": "आपके बताए गए संसाधन पहले से ही इस लक्ष्य को कवर करते हैं।",
  "results.reason.MARKET_RISK_ACCEPTED": "इस संरचना में बाज़ार एक्सपोज़र शामिल है।",
  "results.reason.MARKET_RISK_NOT_PREFERRED":
    "आपने कम जोखिम की प्राथमिकता बताई है, फिर भी इस संरचना में बाज़ार एक्सपोज़र शामिल है।",
  "results.reason.LIQUIDITY_IMPORTANT": "आपके पैसे तक आसान पहुँच आपके लिए महत्वपूर्ण है।",
  "results.reason.RETIREMENT_GOAL": "आपके बताए गए लक्ष्य सेवानिवृत्ति होने के कारण दिखाया गया है।",
  "results.reason.PRODUCT_ELIGIBLE": "आप इस उत्पाद की प्रकाशित पात्रता शर्तों को पूरा करते हैं।",
  "results.reason.PRODUCT_NEEDS_MORE_INFO": "पात्रता की पुष्टि के लिए अधिक जानकारी आवश्यक है।",
  "results.reason.PREMIUM_VERIFIED": "यह प्रीमियम LIC की प्रकाशित दरों से है।",
  "results.reason.PREMIUM_UNAVAILABLE": "प्रकाशित दरों से सटीक प्रीमियम अभी उपलब्ध नहीं है।",
  "results.reason.ADDITIONAL_PROTECTION_REQUIRED": "आपकी पारिवारिक सुरक्षा अंतर को कम करने में मदद के लिए अतिरिक्त सुरक्षा जोड़ी गई।",
  "results.reason.NO_ELIGIBLE_PRODUCTS": "इस संरचना के लिए कोई पात्र उत्पाद नहीं मिला।",

  "results.compare.title": "⚖️ संरचनाओं की तुलना करें",
  "results.compare.selectPrompt": "तुलना के लिए अधिकतम 3 संरचनाएँ चुनें",
  "results.compare.empty": "तुलना करने के लिए सूची से संरचनाएँ चुनें।",
  "results.compare.open": "चयनित की तुलना करें",
  "results.compare.dimension.familyProtection": "❤️ पारिवारिक सुरक्षा",
  "results.compare.dimension.goalCoverage": "🎯 लक्ष्य कवरेज",
  "results.compare.dimension.budgetUsage": "💰 बजट उपयोग",
  "results.compare.dimension.guarantees": "🔒 गारंटीड लाभ",
  "results.compare.dimension.marketExposure": "📈 बाज़ार एक्सपोज़र",
  "results.compare.dimension.liquidity": "💧 तरलता",
  "results.compare.dimension.costs": "💸 शुल्क",
  "results.compare.dimension.taxTreatment": "🧾 कर व्यवहार",

  "results.detail.title": "📋 संरचना विवरण",
  "results.detail.productName": "उत्पाद नाम",
  "results.detail.category": "श्रेणी",
  "results.detail.eligibilityStatus": "पात्रता स्थिति",
  "results.detail.premiumStatus": "प्रीमियम स्थिति",
  "results.detail.protection": "सुरक्षा",
  "results.detail.maturityBenefit": "परिपक्वता / लाभ",
  "results.detail.guaranteedValues": "गारंटीड मूल्य",
  "results.detail.nonGuaranteedValues": "गैर-गारंटीड मूल्य",
  "results.detail.liquidity": "तरलता",
  "results.detail.costs": "शुल्क",
  "results.detail.tax": "कर",
  "results.detail.assumptions": "मान्यताएँ",
  "results.detail.warnings": "टिप्पणियाँ",
  "results.detail.eligible": "पात्र",
  "results.detail.eligibleNeedsInfo": "अधिक जानकारी आवश्यक",
  "results.detail.eligibleNo": "अपात्र",
  "results.detail.noComponents": "इस संरचना में कोई और घटक नहीं है।",

  "results.assumption.illustrative_investment_uses_full_monthly_budget_because_protection_premium_is_unavailable":
    "इस संरचना के लिए बीमा प्रीमियम अभी सत्यापित नहीं है, इसलिए निवेश उदाहरण आपके पूरे उपलब्ध बजट का उपयोग करता है।",
  "results.assumption.additional_term_component_uses_first_eligible_registered_term_product_not_a_ranked_choice":
    "दिखाई गई अतिरिक्त सुरक्षा पहली पात्र टर्म योजना का उपयोग करती है — यह कोई क्रमबद्ध या पसंदीदा चयन नहीं है।",
  "results.assumption.market_linked_premium_is_a_direct_customer_choice_not_derived_from_goal_or_budget":
    "बाज़ार-आधारित योजना का प्रीमियम आपकी अपनी पसंद है — यह आपके लक्ष्य या बजट से नहीं निकाला गया है।",
  "results.assumption.retirement_income_amount_is_a_direct_customer_choice_not_derived_from_goal":
    "सेवानिवृत्ति आय के लिए आप जो राशि चुकाएँगे वह आपकी अपनी पसंद है — यह आपके बताए गए लक्ष्य से नहीं निकाली गई है।",
  "results.warning.illustration_only_not_guaranteed_returns": "केवल उदाहरण — गारंटीशुदा रिटर्न नहीं।",
  "results.warning.market_linked_maturity_value_never_projected_nav_dependent":
    "बाज़ार-आधारित परिपक्वता मूल्य फंड के प्रदर्शन पर निर्भर करता है और यहाँ कभी अनुमानित नहीं किया जाता।",

  "results.category.term_protection": "टर्म सुरक्षा",
  "results.category.savings_endowment": "बचत / एंडोमेंट",
  "results.category.whole_life": "संपूर्ण जीवन",
  "results.category.money_back_child": "मनी बैक / बाल योजना",
  "results.category.pension": "पेंशन / Annuity",
  "results.category.market_linked_ulip": "यूनिट-लिंक्ड (ULIP)",
  "results.category.micro_insurance": "माइक्रो बीमा",

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
