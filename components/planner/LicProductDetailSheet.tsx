"use client";

import { GoalInput } from "@/types";
import { InsuranceProduct } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getPlanEngineForProduct } from "@/lib/insurance/engineRegistry";

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
  const calculatorInput = { age: goal.age, product };

  const eligibility = engine.eligibility?.evaluateEligibility(calculatorInput);
  const premium = engine.premium?.calculatePremium(calculatorInput);
  const benefits = engine.benefit?.calculateBenefits(calculatorInput);

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
            <p className="text-xs font-semibold text-ink-500">Eligibility</p>
            <p className="text-amber-700">
              {eligibility?.eligible == null
                ? "⚠️ Verification engine not integrated"
                : eligibility.eligible
                  ? "✓ Eligible"
                  : "✗ Not eligible"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">Premium</p>
            <p className="text-amber-700">
              {premium?.available && premium.premium != null
                ? formatINRCompact(premium.premium)
                : "⚠️ Not calculated"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">Life Cover</p>
            <p className="text-amber-700">
              {benefits?.available && benefits.deathBenefit != null
                ? formatINRCompact(benefits.deathBenefit)
                : "⚠️ Not calculated"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">Maturity</p>
            <p className="text-amber-700">
              {benefits?.available && benefits.maturityBenefit != null
                ? formatINRCompact(benefits.maturityBenefit)
                : "⚠️ Not calculated"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">Guaranteed Benefits</p>
            <p className="text-amber-700">
              {benefits?.available && benefits.guaranteedBenefits
                ? "See details above"
                : "⚠️ Verified calculation required"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">
              Non-Guaranteed Benefits
            </p>
            <p className="text-amber-700">
              {benefits?.available && benefits.nonGuaranteedIllustrations
                ? "See details above"
                : "⚠️ Verified illustration required"}
            </p>
          </div>
        </div>

        <p className="mt-5 text-xs font-medium text-ink-700">
          Product identity does not imply eligibility or affordability.
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
