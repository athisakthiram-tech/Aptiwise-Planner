"use client";

import { useMemo, useState } from "react";
import { GoalInput } from "@/types";
import { InsuranceCategory } from "@/types/insurance";
import { getGoalOption } from "@/data/goalOptions";
import { formatINRCompact } from "@/lib/calculations/format";
import { matchLicProducts, MAX_PRIMARY_MATCHES } from "@/lib/insurance/matching";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LicProductDetailSheet } from "@/components/planner/LicProductDetailSheet";

const CATEGORY_LABELS: Record<InsuranceCategory, string> = {
  term_protection: "🛡️ Protection",
  savings_endowment: "🎯 Savings + Protection",
  market_linked_ulip: "📈 Market-Linked",
  money_back_child: "🎓 Money Back / Child",
};

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
        <p className="text-sm text-ink-500 mt-1">
          {goalOption.emoji} {goalOption.label} · {formatINRCompact(goal.monthlyBudget)}
          /month · {goal.yearsToGoal} years
        </p>
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
          <p className="text-sm font-semibold text-ink-700 mb-3">
            ✨ Plans Worth Exploring
          </p>
          <div className="flex flex-col gap-3">
            {visibleMatches.map(({ product, reasons }) => (
              <Card key={product.id}>
                <div className="flex items-center gap-2 text-xs font-semibold text-ink-500">
                  🛡️ {product.provider}
                </div>
                <div className="mt-1 text-base font-bold uppercase tracking-tight text-ink-900">
                  {product.productName.replace(/^LIC's /, "")}
                </div>
                <div className="text-xs text-ink-500">Plan {product.planNumber}</div>
                <div className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  {CATEGORY_LABELS[product.category]}
                </div>

                <p className="mt-3 text-xs font-semibold text-ink-700">
                  💡 Why this may fit
                </p>
                <ul className="mt-1 flex flex-col gap-1 text-xs text-ink-700">
                  {reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-ink-500">
                  ⚠️ Exact eligibility and benefits must be verified using official
                  LIC rules.
                </p>

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
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
}
