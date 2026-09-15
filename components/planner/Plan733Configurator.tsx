"use client";

import { useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getPlanEngineForProduct } from "@/lib/insurance/engineRegistry";
import { comparePlanBudget } from "@/lib/insurance/budgetComparison";
import { PLAN_733_RULES, PLAN_733_BONUS_DISCLAIMER } from "@/lib/insurance/providers/lic/plans/plan733";
import { Slider } from "@/components/ui/Slider";
import { Disclosure } from "@/components/ui/Disclosure";

// UI convenience only — Plan 733 has no maximum Basic Sum Assured per the
// brochure ("No Limit, subject to underwriting decision"). This just
// bounds the slider; it is not a product rule.
const SUM_ASSURED_SLIDER_MAX = 2000000;

function validPolicyTerms(age: number): number[] {
  const terms: number[] = [];
  for (let t = PLAN_733_RULES.minPolicyTermYears; t <= PLAN_733_RULES.maxPolicyTermYears; t++) {
    const maturityAge = age + t;
    if (maturityAge >= PLAN_733_RULES.minMaturityAge && maturityAge <= PLAN_733_RULES.maxMaturityAge) {
      terms.push(t);
    }
  }
  return terms;
}

export function Plan733Configurator({
  product,
  goal,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
}) {
  const terms = validPolicyTerms(goal.age);
  const [sumAssured, setSumAssured] = useState<number>(PLAN_733_RULES.minBasicSumAssured);
  const [policyTermYears, setPolicyTermYears] = useState<number | undefined>(
    terms.includes(goal.yearsToGoal) ? goal.yearsToGoal : terms[0]
  );

  if (terms.length === 0) {
    return (
      <div className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
        ⚠️ No Plan 733 policy term satisfies the maturity-age rules for age {goal.age}.
      </div>
    );
  }

  const engine = getPlanEngineForProduct(product);
  const calculatorInput = { age: goal.age, policyTermYears, sumAssured, product };
  const eligibility = engine.eligibility?.evaluateEligibility(calculatorInput);
  const premium = engine.premium?.calculatePremium(calculatorInput);
  const benefits = engine.benefit?.calculateBenefits(calculatorInput);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;
  const budget = comparePlanBudget(goal.monthlyBudget, premium);

  // The disclaimer is always appended last by evaluateEligibility — every
  // other reason is a concise, concrete failure/gap explanation.
  const failureReasons = eligibility ? eligibility.reasons.slice(0, -1) : [];

  const sliderStep =
    sumAssured <= PLAN_733_RULES.sumAssuredIncrement.lowerBandMaxInclusive
      ? PLAN_733_RULES.sumAssuredIncrement.lowerBandMultiple
      : PLAN_733_RULES.sumAssuredIncrement.upperBandMultiple;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">Plan configuration</p>
        <Slider
          label="Basic Sum Assured"
          emoji="❤️"
          value={sumAssured}
          min={PLAN_733_RULES.minBasicSumAssured}
          max={SUM_ASSURED_SLIDER_MAX}
          step={sliderStep}
          displayValue={formatINRCompact(sumAssured)}
          onChange={setSumAssured}
          hint="Plan configuration — not a recommended cover amount."
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink-700 mb-2">⏳ Policy Term</p>
        <div className="flex flex-wrap gap-2">
          {terms.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPolicyTermYears(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                policyTermYears === t
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-ink-700"
              }`}
            >
              {t} yrs
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500">✓ Eligibility</p>
        <p className="text-amber-700">
          {eligibility?.eligible === true
            ? "✓ Passes Plan 733 product-level rules"
            : "⚠️ Configuration doesn't satisfy Plan 733 product rules"}
        </p>
        {failureReasons.map((r) => (
          <p key={r} className="mt-0.5 text-xs text-ink-500">
            {r}
          </p>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500">🧾 Premium</p>
        {premium?.available && premium.premium != null ? (
          <>
            <p className="text-ink-900">
              Verified brochure example premium: {formatINRCompact(premium.premium)} / year
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              ≈ {formatINRCompact(premium.premium / 12)}/month. Monthly equivalent for
              comparison only; the brochure premium above is the verified value.
            </p>
          </>
        ) : (
          <>
            <p className="text-amber-700">⚠️ Exact premium unavailable for this configuration</p>
            <p className="mt-0.5 text-xs text-ink-500">
              Verified LIC premium rate data is required.
            </p>
          </>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-1">💰 Budget Comparison</p>
        {budget.verified ? (
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Your budget</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(budget.customerMonthlyBudget)}/month
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Premium equivalent</span>
              <span className="font-medium text-ink-900">
                {formatINRCompact(budget.monthlyEquivalent as number)}/month
              </span>
            </div>
            <p className={`mt-2 font-semibold ${budget.withinBudget ? "text-brand-700" : "text-amber-700"}`}>
              {budget.withinBudget ? "✓ Within entered budget" : "⚠️ Above entered budget"}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              Based on annual premium equivalent for planning comparison.
            </p>
          </div>
        ) : (
          <p className="text-amber-700">Budget fit = Not verified</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-1.5">❤️ Benefits</p>
        <div className="rounded-lg bg-slate-50 p-3 text-sm flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-ink-500">❤️ Basic Sum Assured</span>
            <span className="font-medium text-ink-900">{formatINRCompact(sumAssured)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">🎯 Base maturity benefit</span>
            <span className="font-medium text-ink-900">
              {benefits?.available && benefits.maturityBenefit != null
                ? formatINRCompact(benefits.maturityBenefit)
                : "⚠️ Not calculated"}
            </span>
          </div>
          {guaranteed && (
            <p className="text-xs text-ink-500">
              ❤️ Death-benefit structure: {formatINRCompact(guaranteed.deathBenefitAnnualIncomePerYear)}
              /year until maturity, plus {formatINRCompact(guaranteed.deathBenefitMaturityComponent)}{" "}
              lump sum at maturity, if death occurs during the term.
            </p>
          )}
          <div className="flex justify-between">
            <span className="text-ink-500">🎁 Bonuses</span>
            <span className="font-medium text-ink-900">Not included</span>
          </div>
          <p className="text-xs text-ink-500">{PLAN_733_BONUS_DISCLAIMER}</p>
        </div>
      </div>

      {guaranteed && (
        <Disclosure label="How is this calculated? 🤔">
          Base maturity benefit equals your chosen Basic Sum Assured. The death-benefit
          structure shown is 110% of Basic Sum Assured payable at maturity plus 10% of
          Basic Sum Assured paid yearly until maturity — the plan&apos;s actual death benefit
          may be higher if 7× your annual premium exceeds this, which needs a verified
          premium to compare. Bonuses are excluded because LIC has not published a rate.
        </Disclosure>
      )}
    </div>
  );
}
