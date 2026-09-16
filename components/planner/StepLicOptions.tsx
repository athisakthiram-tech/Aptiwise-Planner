"use client";

import { useMemo, useState } from "react";
import { GoalInput } from "@/types";
import { getGoalOption } from "@/data/goalOptions";
import { formatINRCompact } from "@/lib/calculations/format";
import { matchLicProducts, MAX_PRIMARY_MATCHES } from "@/lib/insurance/matching";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LicProductDetailSheet } from "@/components/planner/LicProductDetailSheet";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function StepLicOptions({ goal, locale }: { goal: GoalInput; locale: Locale }) {
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
        <h2 className="text-xl font-bold">{t("lic.title", locale)}</h2>
        <div className="mt-2 flex flex-col gap-0.5 text-sm text-ink-700">
          <span>
            {goalOption.emoji} {t(goalOption.label, locale)}
          </span>
          <span>{t("lic.budgetLine", locale, { amount: formatINRCompact(goal.monthlyBudget) })}</span>
          <span>⏳ {t("common.yearsValue", locale, { n: goal.yearsToGoal })}</span>
        </div>
      </div>

      {warnings.map((w) => (
        <div
          key={w}
          className="rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800"
        >
          ⚠️ {t(`lic.warning.${w}`, locale)}
        </div>
      ))}

      {potentialMatches.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink-700 mb-1">
            {t("lic.plansWorthExploring", locale)}
          </p>
          <p className="text-xs text-ink-500 mb-3">{t("lic.matchExplain", locale)}</p>
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
                  {t("lic.potentialGoalMatch", locale)}
                </div>

                <ul className="mt-3 flex flex-col gap-1.5 text-xs">
                  <li className="font-medium text-brand-700">{t("lic.categoryMatch", locale)}</li>
                  <li className="text-amber-700">
                    ⚠️ {t("common.eligibilityLabel", locale)}{" "}
                    <span className="font-normal text-ink-500">
                      —{" "}
                      {quality.eligibilityVerified
                        ? t("lic.verified", locale)
                        : t("lic.needsVerifiedRules", locale)}
                    </span>
                  </li>
                  <li className="text-amber-700">
                    ⚠️{" "}
                    {t("lic.budgetFitLabel", locale, {
                      amount: formatINRCompact(goal.monthlyBudget),
                    })}{" "}
                    <span className="font-normal text-ink-500">
                      —{" "}
                      {quality.budgetVerified
                        ? t("lic.confirmed", locale)
                        : t("lic.notCalculatedYet", locale)}
                    </span>
                  </li>
                  <li className="text-amber-700">
                    ⚠️ {t("common.benefitsLabel", locale)}{" "}
                    <span className="font-normal text-ink-500">
                      —{" "}
                      {quality.benefitsVerified
                        ? t("lic.verified", locale)
                        : t("lic.notCalculatedYet", locale)}
                    </span>
                  </li>
                </ul>

                <Button
                  variant="ghost"
                  className="mt-3 w-full justify-center bg-slate-50"
                  onClick={() => setSelectedProductId(product.id)}
                >
                  {t("lic.explorePlan", locale)}
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
              {t("lic.viewMore", locale)}
            </button>
          )}
        </div>
      )}

      <Card>
        <p className="text-xs font-semibold text-ink-500 mb-1">{t("lic.currentLifeCover", locale)}</p>
        <p className="text-2xl font-extrabold text-ink-900">
          {formatINRCompact(goal.existingLifeCover)}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-ink-500">{t("lic.protectionRequirement", locale)}</span>
          <span className="font-semibold text-amber-700">{t("lic.needsAssessment", locale)}</span>
        </div>
      </Card>

      <p className="text-xs text-ink-500">{t("lic.notAdviceDisclaimer", locale)}</p>

      {selectedProduct && (
        <LicProductDetailSheet
          product={selectedProduct}
          goal={goal}
          locale={locale}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
}
