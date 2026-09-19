"use client";

// Section 12: compare up to 3 selected structures, dimension by
// dimension. Deliberately no winner/score/highlighted column anywhere —
// every column gets identical visual treatment.

import { StrategyResult } from "@/lib/planning/strategyTypes";
import { getBudgetPresentation } from "@/lib/planning/resultsViewModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { StatusBadge } from "@/components/planner/results/StatusBadge";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function ComparisonCell({
  value,
  status,
  locale,
}: {
  value: string;
  status: import("@/types/insurance").ValueStatus;
  locale: Locale;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-semibold text-ink-900">{value}</p>
      <StatusBadge status={status} locale={locale} />
    </div>
  );
}

export function StrategyComparison({ strategies, locale }: { strategies: StrategyResult[]; locale: Locale }) {
  if (strategies.length === 0) {
    return <p className="text-sm text-ink-500">{t("results.compare.empty", locale)}</p>;
  }

  const dimensions: {
    key: string;
    labelKey: string;
    render: (s: StrategyResult) => { value: string; status: import("@/types/insurance").ValueStatus };
  }[] = [
    {
      key: "protection",
      labelKey: "results.compare.dimension.familyProtection",
      render: (s) => ({
        value: s.protectionCoverage.value != null ? formatINRCompact(s.protectionCoverage.value) : "—",
        status: s.protectionCoverage.status,
      }),
    },
    {
      key: "goal",
      labelKey: "results.compare.dimension.goalCoverage",
      render: (s) => ({
        value: s.goalCoverage.value != null ? `${s.goalCoverage.value.coveragePercent}%` : "—",
        status: s.goalCoverage.status,
      }),
    },
    {
      key: "budget",
      labelKey: "results.compare.dimension.budgetUsage",
      render: (s) => {
        const budget = getBudgetPresentation(s);
        return {
          value: budget.kind === "verified" ? formatINRCompact(budget.used) : "—",
          status: s.monthlyBudgetUsageStatus,
        };
      },
    },
    {
      key: "guarantees",
      labelKey: "results.compare.dimension.guarantees",
      render: (s) => ({
        value: s.guarantees.value != null ? formatINRCompact(s.guarantees.value) : "—",
        status: s.guarantees.status,
      }),
    },
    {
      key: "market",
      labelKey: "results.compare.dimension.marketExposure",
      render: (s) => ({
        value: t(`results.strategy.marketExposure.${s.marketExposure.value ?? "not_market_linked"}`, locale),
        status: s.marketExposure.status,
      }),
    },
    {
      key: "liquidity",
      labelKey: "results.compare.dimension.liquidity",
      render: (s) => ({ value: "—", status: s.liquidity.status }),
    },
    {
      key: "costs",
      labelKey: "results.compare.dimension.costs",
      render: (s) => ({ value: "—", status: s.costs.status }),
    },
    {
      key: "tax",
      labelKey: "results.compare.dimension.taxTreatment",
      render: (s) => ({ value: "—", status: s.taxTreatment.status }),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {strategies.map((s) => {
          const title = s.components
            .map((c) => (c.product ? c.product.productName.replace(/^LIC's /, "") : t("results.strategy.investmentLabel", locale)))
            .join(" + ");
          return (
            <div key={s.id} className="w-64 flex-shrink-0 rounded-xl2 bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="mb-3 text-sm font-bold text-ink-900">{title}</p>
              <div className="flex flex-col gap-3">
                {dimensions.map((dim) => {
                  const cell = dim.render(s);
                  return (
                    <div key={dim.key}>
                      <p className="text-[11px] text-ink-500">{t(dim.labelKey, locale)}</p>
                      <ComparisonCell value={cell.value} status={cell.status} locale={locale} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
