"use client";

import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getPlanEngineForProduct } from "@/lib/insurance/engineRegistry";
import { Disclosure } from "@/components/ui/Disclosure";

export function LicProductDetailSheet({
  product,
  goal,
  onClose,
}: {
  product: InsuranceProduct;
  goal: GoalInput;
  onClose: () => void;
}) {
  const engine = getPlanEngineForProduct(product);
  const calculatorInput = { age: goal.age, policyTermYears: goal.yearsToGoal, product };

  const eligibility = engine.eligibility?.evaluateEligibility(calculatorInput);
  const premium = engine.premium?.calculatePremium(calculatorInput);
  const benefits = engine.benefit?.calculateBenefits(calculatorInput);
  const guaranteed = benefits?.available ? benefits.guaranteedBenefits : undefined;

  const eligibilityText = !eligibility
    ? "⚠️ Verification engine not integrated"
    : eligibility.eligible === true
      ? "✓ Passes product-level rules"
      : eligibility.eligible === false
        ? "✗ Not eligible based on selected product parameters"
        : "⚠️ Needs more details to verify eligibility";
  const eligibilityReason =
    eligibility && eligibility.eligible !== true ? eligibility.reasons[0] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-ink-500">🛡️ {product.provider}</div>
            <div className="text-lg font-extrabold uppercase text-ink-900">
              {product.productName.replace(/^LIC's /, "")}
            </div>
            <div className="text-xs text-ink-500">Plan {product.planNumber}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-ink-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-ink-500">🎯 Why It Appeared</p>
            <p className="text-ink-900">Matches your selected goal category</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-500 mb-1.5">Your Details</p>
            <div className="grid grid-cols-2 gap-y-1 rounded-lg bg-slate-50 p-3 text-ink-900">
              <span>👤 Age</span>
              <span className="text-right font-medium">{goal.age}</span>
              <span>💰 Budget</span>
              <span className="text-right font-medium">
                {formatINRCompact(goal.monthlyBudget)}/month
              </span>
              <span>⏳ Horizon</span>
              <span className="text-right font-medium">{goal.yearsToGoal} years</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-500">👤 Eligibility</p>
            <p className="text-amber-700">{eligibilityText}</p>
            {eligibilityReason && (
              <p className="mt-0.5 text-xs text-ink-500">{eligibilityReason}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-500">🧾 Premium</p>
            <p className="text-amber-700">
              {premium?.available && premium.premium != null
                ? `${formatINRCompact(premium.premium)} / year`
                : "⚠️ Exact premium requires verified LIC premium rates"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-500">❤️ Family Protection</p>
            {guaranteed ? (
              <p className="text-ink-900">
                {formatINRCompact(guaranteed.deathBenefitAnnualIncomePerYear)}/year until
                maturity, plus {formatINRCompact(guaranteed.deathBenefitMaturityComponent)} at
                maturity, on death during the term.
              </p>
            ) : (
              <p className="text-amber-700">⚠️ Not calculated</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-500">🎯 Maturity</p>
            {benefits?.available && benefits.maturityBenefit != null ? (
              <p className="text-ink-900">
                {formatINRCompact(benefits.maturityBenefit)} guaranteed (excludes any future
                bonus)
              </p>
            ) : (
              <p className="text-amber-700">⚠️ Not calculated</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-500">🎁 Bonuses</p>
            <p className="text-ink-500">
              Future LIC bonuses are not guaranteed and are not included in this calculation.
            </p>
          </div>

          {guaranteed && (
            <Disclosure label="How is this calculated? 🤔">
              Guaranteed figures come directly from your chosen Sum Assured using this
              plan&apos;s published benefit formula. They exclude bonuses and exclude the
              alternative &ldquo;7× annual premium&rdquo; death benefit, which needs a verified
              premium to compare.
            </Disclosure>
          )}
        </div>

        <p className="mt-5 text-xs font-medium text-ink-700">
          Product-level eligibility does not constitute LIC underwriting approval.
        </p>

        <div className="mt-3 rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
          ⚠️ Verify before sale — eligibility, premium, benefits, exclusions
          and policy conditions must be checked against current official LIC
          documents ({product.officialSourceUrl}).
        </div>
      </div>
    </div>
  );
}
