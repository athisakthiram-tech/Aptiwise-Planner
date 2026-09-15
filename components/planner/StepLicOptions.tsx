"use client";

import { useMemo, useState } from "react";
import { GoalInput } from "@/types";
import { getGoalOption } from "@/data/goalOptions";
import { formatINRCompact } from "@/lib/calculations/format";
import { matchLicProducts, MAX_PRIMARY_MATCHES } from "@/lib/insurance/matching";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LicProductDetailSheet } from "@/components/planner/LicProductDetailSheet";

export function StepLicOptions({ goal }: { goal: GoalInput }) {
  const [showAll, setShowAll] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { potentialMatches, warnings } = useMemo(
    () => matchLicProducts(goal),
    [goal]
  );
  const goalOption = getGoalOption(goal.goalType);
  const visibleMatches = showAll
    ? potentialMatches
    : potentialMatches.slice(0, MAX_PRIMARY_MATCHES);
  const selectedProduct = potentialMatches.find(
    (m) => m.product.id === selectedProductId
  )?.product;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">🏦 LIC Options For Your Goal</h2>
        <div className="mt-2 flex flex-col gap-0.5 text-sm text-ink-700">
          <span>
            {goalOption.emoji} {goalOption.label}
          </span>
          <span>💰 Budget: {formatINRCompact(goal.monthlyBudget)}/month</span>
          <span>⏳ {goal.yearsToGoal} years</span>
        </div>
      </div>

      {warnings.map((w) => (
        <div
          key={w}
          className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800"
        >
          ⚠️ {w}
        </div>
      ))}

      {potentialMatches.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink-700 mb-1">
            ✨ Plans Worth Exploring
          </p>
          <p className="text-xs text-ink-500 mb-3">
            Matched by goal and product category. Premium affordability is
            checked only when verified plan-specific calculation rules are
            available.
          </p>
          <div className="flex flex-col gap-3">
            {visibleMatches.map(({ product, quality }) => (
              <Card key={product.id}>
                <div className="flex items-center gap-2 text-xs font-semibold text-ink-500">
                  🛡️ {product.provider}
                </div>
                <div className="mt-1 text-base font-bold uppercase tracking-tight text-ink-900">
                  {product.productName.replace(/^LIC's /, "")}
                </div>
                <div className="text-xs text-ink-500">Plan {product.planNumber}</div>
                <div className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  🎯 Potential Goal Match
                </div>

                <ul className="mt-3 flex flex-col gap-1.5 text-xs">
                  <li className="font-medium text-brand-700">
                    ✓ Goal/category match
                  </li>
                  <li className="text-amber-700">
                    ⚠️ Eligibility{" "}
                    <span className="font-normal text-ink-500">
                      — {quality.eligibilityVerified ? "verified" : "needs verified product rules"}
                    </span>
                  </li>
                  <li className="text-amber-700">
                    ⚠️ {formatINRCompact(goal.monthlyBudget)} budget fit{" "}
                    <span className="font-normal text-ink-500">
                      — {quality.budgetVerified ? "confirmed" : "not calculated yet"}
                    </span>
                  </li>
                  <li className="text-amber-700">
                    ⚠️ Benefits{" "}
                    <span className="font-normal text-ink-500">
                      — {quality.benefitsVerified ? "verified" : "not calculated yet"}
                    </span>
                  </li>
                </ul>

                <Button
                  variant="ghost"
                  className="mt-3 w-full justify-center bg-slate-50"
                  onClick={() => setSelectedProductId(product.id)}
                >
                  Explore Plan →
                </Button>
              </Card>
            ))}
          </div>

          {!showAll && potentialMatches.length > MAX_PRIMARY_MATCHES && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-3 w-full text-center text-sm font-semibold text-brand-700"
            >
              View more LIC options →
            </button>
          )}
        </div>
      )}

      <Card>
        <p className="text-xs font-semibold text-ink-500 mb-1">
          🛡️ Current Life Cover
        </p>
        <p className="text-2xl font-extrabold text-ink-900">
          {formatINRCompact(goal.existingLifeCover)}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-ink-500">Protection requirement</span>
          <span className="font-semibold text-amber-700">⚠️ Needs assessment</span>
        </div>
      </Card>

      <p className="text-xs text-ink-500">
        Discuss these options with the customer — this list does not
        constitute personalized financial advice.
      </p>

      {selectedProduct && (
        <LicProductDetailSheet
          product={selectedProduct}
          goal={goal}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
}
