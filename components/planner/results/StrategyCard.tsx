"use client";

// Section 5 (compact per-structure card) + Section 6 (critical budget
// safety). Structures are NEVER ranked or sorted by a hidden quality
// score — the caller (PlannerResults) already sorts them neutrally by
// Plan Number via lib/planning/resultsViewModel.ts.

import { StrategyResult } from "@/lib/planning/strategyTypes";
import { getBudgetPresentation, getProtectionVisualData } from "@/lib/planning/resultsViewModel";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/planner/results/StatusBadge";
import { StrategyReasons } from "@/components/planner/results/StrategyReasons";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function MiniStat({
  labelKey,
  value,
  status,
  locale,
}: {
  labelKey: string;
  value: string;
  status: import("@/types/insurance").ValueStatus;
  locale: Locale;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-ink-500">{t(labelKey, locale)}</span>
      <span className="text-sm font-semibold text-ink-900">{value}</span>
      <StatusBadge status={status} locale={locale} />
    </div>
  );
}

export function StrategyCard({
  strategy,
  protectionNeed,
  locale,
  isSelectedForCompare,
  compareDisabled,
  onToggleCompare,
  onOpenDetails,
}: {
  strategy: StrategyResult;
  protectionNeed: ProtectionNeedResult;
  locale: Locale;
  isSelectedForCompare: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
  onOpenDetails: () => void;
}) {
  const title = strategy.components
    .map((c) => (c.product ? c.product.productName.replace(/^LIC's /, "") : t("results.strategy.investmentLabel", locale)))
    .join(" + ");

  const protectionVisual = getProtectionVisualData(strategy, protectionNeed);
  const budget = getBudgetPresentation(strategy);
  const marketExposureValue = strategy.marketExposure.value;

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-bold text-ink-900">{title}</p>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat
          labelKey="results.strategy.familyProtection"
          value={protectionVisual.providedByStructure != null ? formatINRCompact(protectionVisual.providedByStructure) : "—"}
          status={protectionVisual.providedByStructureStatus}
          locale={locale}
        />
        <MiniStat
          labelKey="results.strategy.goalCoverage"
          value={strategy.goalCoverage.value != null ? `${strategy.goalCoverage.value.coveragePercent}%` : "—"}
          status={strategy.goalCoverage.status}
          locale={locale}
        />
        <MiniStat
          labelKey="results.strategy.guarantees"
          value={strategy.guarantees.value != null ? formatINRCompact(strategy.guarantees.value) : "—"}
          status={strategy.guarantees.status}
          locale={locale}
        />
        <MiniStat
          labelKey="results.strategy.marketExposure"
          value={t(`results.strategy.marketExposure.${marketExposureValue ?? "not_market_linked"}`, locale)}
          status={strategy.marketExposure.status}
          locale={locale}
        />
        <MiniStat labelKey="results.strategy.liquidity" value="—" status={strategy.liquidity.status} locale={locale} />
        <MiniStat
          labelKey="results.strategy.budgetUsage"
          value={budget.kind === "verified" ? formatINRCompact(budget.used) : "—"}
          status={strategy.monthlyBudgetUsageStatus}
          locale={locale}
        />
      </div>

      {/* Section 6 — critical: never imply "within budget" when part of the premium is unknown. */}
      <div className="rounded-lg bg-slate-50 p-3 text-xs">
        {budget.kind === "verified" ? (
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold text-emerald-700">{t("results.budget.withinBudget", locale)}</p>
            <p className="text-ink-500">{t("results.budget.verifiedUsed", locale, { amount: formatINRCompact(budget.used) })}</p>
            {budget.remaining != null && (
              <p className="text-ink-500">{t("results.budget.remaining", locale, { amount: formatINRCompact(budget.remaining) })}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-amber-700">{t("results.budget.premiumRequiresVerification", locale)}</p>
            {budget.illustrativeInvestmentAmount != null && (
              <p className="text-ink-500">
                {t("results.budget.investmentBeforeAdjustment", locale, {
                  amount: formatINRCompact(budget.illustrativeInvestmentAmount),
                })}
              </p>
            )}
            <p className="font-semibold text-amber-700">{t("results.budget.cannotVerifyTotal", locale)}</p>
            {budget.illustrativeInvestmentAmount != null && (
              <p className="text-ink-500">
                {t("results.budget.investmentUsesFullBudgetNote", locale, {
                  amount: formatINRCompact(budget.illustrativeInvestmentAmount),
                })}
              </p>
            )}
          </div>
        )}
      </div>

      <StrategyReasons reasonCodes={strategy.reasonCodes} locale={locale} />

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onOpenDetails}
          className="flex-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-ink-900"
        >
          {t("results.strategy.viewDetails", locale)}
        </button>
        <button
          type="button"
          onClick={onToggleCompare}
          disabled={!isSelectedForCompare && compareDisabled}
          aria-pressed={isSelectedForCompare}
          className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition disabled:opacity-40 ${
            isSelectedForCompare ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-900"
          }`}
        >
          {isSelectedForCompare ? t("results.strategy.removeFromCompare", locale) : t("results.strategy.addToCompare", locale)}
        </button>
      </div>
      {!isSelectedForCompare && compareDisabled && (
        <p className="text-center text-[11px] text-ink-500">{t("results.strategy.compareLimitReached", locale)}</p>
      )}
    </Card>
  );
}
