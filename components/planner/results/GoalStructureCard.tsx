"use client";

// The Goal Orchestrator's compact, customer-facing card (task spec
// section 20/21). Deliberately simpler than StrategyCard.tsx: no status
// badges, no reason codes, no confidence pill, and never the words
// "Requires Verification" / "Not Applicable" — an unknown premium or
// benefit shows as "—" (still visible, never hidden, never fabricated as
// ₹0) instead of a technical status. Full technical detail (including
// every ValueStatus) stays one tap away via the Details button, which
// reuses StrategyDetails.tsx unchanged.

import { GoalStructure } from "@/lib/planning/goalOrchestrator/types";
import { StrategyComponent } from "@/lib/planning/strategyTypes";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { getGoalVisualData, getProtectionVisualData } from "@/lib/planning/resultsViewModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function ComponentBlock({ component, locale }: { component: StrategyComponent; locale: Locale }) {
  const productLabel = component.product
    ? component.product.productName.replace(/^LIC's /, "")
    : t("goalOrchestrator.investmentComponentLabel", locale);
  const configuration = component.configuration;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-slate-50 p-3">
      <p className="text-sm font-semibold text-ink-900">{productLabel}</p>
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-ink-500">{t("goalOrchestrator.planningPremium", locale)}</span>
        <span className="font-medium text-ink-900">
          {component.monthlyPremium.value != null ? `${formatINRCompact(component.monthlyPremium.value)}/mo` : "—"}
        </span>
      </div>
      {/* BSA/Pay For/Policy Term rows are omitted entirely — not shown as
          "—" — when this component never had a configuration at all
          (e.g. an illustrative-investment role, which has no BSA by
          definition). A configured field that came back null still
          renders its row as "—" further down via configuration's own
          per-field presence checks. */}
      {configuration && configuration.basicSumAssured != null && (
        <div className="flex justify-between gap-3 text-xs">
          <span className="text-ink-500">{t("goalOrchestrator.bsa", locale)}</span>
          <span className="font-medium text-ink-900">{formatINRCompact(configuration.basicSumAssured)}</span>
        </div>
      )}
      {configuration && configuration.premiumPayingTermYears != null && (
        <div className="flex justify-between gap-3 text-xs">
          <span className="text-ink-500">{t("goalOrchestrator.payFor", locale)}</span>
          <span className="font-medium text-ink-900">
            {t("goalOrchestrator.payForYears", locale, { years: configuration.premiumPayingTermYears })}
          </span>
        </div>
      )}
      {configuration && configuration.policyTermYears != null && (
        <div className="flex justify-between gap-3 text-xs">
          <span className="text-ink-500">{t("goalOrchestrator.policyTerm", locale)}</span>
          <span className="font-medium text-ink-900">
            {t("goalOrchestrator.policyTermYears", locale, { years: configuration.policyTermYears })}
          </span>
        </div>
      )}
    </div>
  );
}

function Outcome({ label, value, formatted }: { label: string; value: number | null; formatted?: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-2">
      <span className="text-[11px] text-ink-500">{label}</span>
      <span className="text-sm font-semibold text-ink-900">{formatted ?? (value != null ? formatINRCompact(value) : "—")}</span>
    </div>
  );
}

export function GoalStructureCard({
  structure,
  protectionNeed,
  profile,
  locale,
  onViewTimeline,
  onDetails,
}: {
  structure: GoalStructure;
  protectionNeed: ProtectionNeedResult;
  profile: CustomerFinancialProfile;
  locale: Locale;
  onViewTimeline: () => void;
  onDetails: () => void;
}) {
  const strategy = structure.strategyResult;
  const protectionVisual = getProtectionVisualData(strategy, protectionNeed);
  const goalVisual = getGoalVisualData(strategy, profile);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {strategy.components.map((component, i) => (
          <ComponentBlock key={i} component={component} locale={locale} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-white">
        <Outcome label={t("results.strategy.familyProtection", locale)} value={protectionVisual.providedByStructure} />
        <Outcome label={t("goalOrchestrator.goalIllustration", locale)} value={goalVisual.structureValue} />
        <Outcome
          label={t("goalOrchestrator.goalCoverage", locale)}
          value={null}
          formatted={goalVisual.coveragePercent != null ? `${goalVisual.coveragePercent}%` : "—"}
        />
        <Outcome label={t("goalOrchestrator.remainingGoalGap", locale)} value={goalVisual.remainingGap} />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onViewTimeline}
          className="flex-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-ink-900"
        >
          {t("goalOrchestrator.viewTimeline", locale)}
        </button>
        <button
          type="button"
          onClick={onDetails}
          className="flex-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-ink-900"
        >
          {t("goalOrchestrator.viewDetails", locale)}
        </button>
      </div>
    </Card>
  );
}
