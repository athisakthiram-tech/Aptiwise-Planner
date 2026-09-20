"use client";

// Section 13/14: full technical detail view, reached only after the
// customer taps "Structure details" from the compact card — never shown
// up front. Every LIC product is identified by name + Plan Number + UIN
// together (Section 14), never by marketing name alone.

import { useMemo, useState } from "react";
import { StrategyResult } from "@/lib/planning/strategyTypes";
import { generateStrategies, TermConfigurationOverride } from "@/lib/planning/strategyGenerator";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { GoalNeedResult } from "@/lib/planning/goalNeeds";
import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import {
  getGoalVisualData,
  getProtectionVisualData,
  categoryI18nKey,
  assumptionI18nKey,
  warningI18nKey,
} from "@/lib/planning/resultsViewModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/planner/results/StatusBadge";
import { ProtectionVisual } from "@/components/planner/results/ProtectionVisual";
import { GoalCoverageVisual } from "@/components/planner/results/GoalCoverageVisual";
import { StructureJourney } from "@/components/planner/results/StructureJourney";
import { StrategyReasons } from "@/components/planner/results/StrategyReasons";
import { ProductConfigurationPanel } from "@/components/planner/results/ProductConfigurationPanel";
import { CreatePlanAction } from "@/components/customerPlan/CreatePlanAction";
import { CustomerPlan, CustomerPlanFundingContext } from "@/lib/customerPlan/types";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

// `labelKey` is translated via i18n; `label` is a literal, untranslated
// string — used only for identity fields (Plan Number, UIN) that stay
// identical in every language (Section 14/18).
function DetailRow({
  labelKey,
  label,
  value,
  locale,
}: {
  labelKey?: string;
  label?: string;
  value: string;
  locale: Locale;
}) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-ink-500">{label ?? (labelKey ? t(labelKey, locale) : "")}</span>
      <span className="text-right font-medium text-ink-900">{value}</span>
    </div>
  );
}

function ValueRow({
  labelKey,
  value,
  status,
  locale,
}: {
  labelKey: string;
  value: number | null;
  status: import("@/types/insurance").ValueStatus;
  locale: Locale;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-ink-500">{t(labelKey, locale)}</span>
      <span className="flex items-center gap-1.5 font-medium text-ink-900">
        {value != null ? formatINRCompact(value) : "—"}
        <StatusBadge status={status} locale={locale} />
      </span>
    </div>
  );
}

export function StrategyDetails({
  strategy,
  protectionNeed,
  goalNeed,
  profile,
  locale,
  fundingContext,
  onBack,
  onCreatePlan,
}: {
  strategy: StrategyResult;
  protectionNeed: ProtectionNeedResult;
  goalNeed: GoalNeedResult;
  profile: CustomerFinancialProfile;
  locale: Locale;
  // Optional (Goal Orchestrator V2) — set only when this strategy came
  // from a GoalStructure, so the created plan preserves who funds the
  // goal and who benefits from it.
  fundingContext?: CustomerPlanFundingContext;
  onBack: () => void;
  onCreatePlan: (plan: CustomerPlan) => void;
}) {
  const [termOverride, setTermOverride] = useState<TermConfigurationOverride | null>(null);
  const [configuringIndex, setConfiguringIndex] = useState<number | null>(null);

  // Task 5 (integration audit): re-runs the exact same, unmodified
  // strategy generator with an advisor-supplied term configuration —
  // never a second calculation implementation. Falls back to the
  // original strategy if, for any reason, this exact structure (same
  // id) isn't present in the freshly generated list.
  const effectiveStrategy = useMemo(() => {
    if (!termOverride) return strategy;
    const regenerated = generateStrategies({
      profile,
      protectionNeed,
      goalNeed,
      termConfiguration: termOverride,
    });
    return regenerated.find((s) => s.id === strategy.id) ?? strategy;
  }, [strategy, termOverride, profile, protectionNeed, goalNeed]);

  const protectionVisual = getProtectionVisualData(effectiveStrategy, protectionNeed);
  const goalVisual = getGoalVisualData(effectiveStrategy, profile);

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-xs font-semibold text-brand-700">
        {t("results.strategy.back", locale)}
      </button>

      <p className="text-base font-bold text-ink-900">{t("results.detail.title", locale)}</p>
      {termOverride && <p className="text-xs text-ink-500">{t("results.configure.configuredNote", locale)}</p>}

      <CreatePlanAction
        strategy={effectiveStrategy}
        protectionNeed={protectionNeed}
        goalNeed={goalNeed}
        profile={profile}
        locale={locale}
        fundingContext={fundingContext}
        onCreated={onCreatePlan}
      />

      <Card className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-ink-500">{t("results.protection.title", locale)}</p>
        <ProtectionVisual data={protectionVisual} locale={locale} />
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-ink-500">{t("results.goalVisual.title", locale)}</p>
        <GoalCoverageVisual data={goalVisual} locale={locale} />
      </Card>

      <Card>
        <StructureJourney family={effectiveStrategy.family} locale={locale} />
      </Card>

      {effectiveStrategy.components.map((component, i) => {
        // Configuration only ever targets the term-protection role — see
        // TermConfigurationOverride's own comment on why this seam is
        // scoped that way.
        const canConfigure = component.role === "term_protection" && component.product != null;
        return (
          <Card key={i} className="flex flex-col gap-2.5">
            {component.product ? (
              <>
                <p className="text-sm font-bold text-ink-900">{component.product.productName}</p>
                <DetailRow label="Plan Number" value={component.product.planNumber} locale={locale} />
                <DetailRow label="UIN" value={component.product.uin} locale={locale} />
                <DetailRow
                  labelKey="results.detail.category"
                  value={t(categoryI18nKey(component.product.category), locale)}
                  locale={locale}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-500">{t("results.detail.eligibilityStatus", locale)}</span>
                  <span className="font-medium text-ink-900">
                    {component.eligible === true
                      ? t("results.detail.eligible", locale)
                      : component.eligible === false
                        ? t("results.detail.eligibleNo", locale)
                        : t("results.detail.eligibleNeedsInfo", locale)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm font-bold text-ink-900">{t("results.strategy.investmentLabel", locale)}</p>
            )}

            <ValueRow
              labelKey="results.detail.premiumStatus"
              value={component.monthlyPremium.value}
              status={component.monthlyPremium.status}
              locale={locale}
            />
            <ValueRow
              labelKey="results.detail.protection"
              value={component.deathBenefit.value}
              status={component.deathBenefit.status}
              locale={locale}
            />
            <ValueRow
              labelKey="results.detail.maturityBenefit"
              value={component.maturityBenefit.value}
              status={component.maturityBenefit.status}
              locale={locale}
            />

            <StrategyReasons reasonCodes={component.reasonCodes} locale={locale} />

            {canConfigure && (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfiguringIndex(configuringIndex === i ? null : i)}
                  className="self-start text-xs font-semibold text-brand-700"
                >
                  {t("results.configure.toggle", locale)}
                </button>
                {configuringIndex === i && (
                  <ProductConfigurationPanel
                    defaultBasicSumAssured={termOverride?.basicSumAssured ?? protectionNeed.protectionGap}
                    defaultPolicyTermYears={termOverride?.policyTermYears ?? profile.yearsToGoal}
                    hasOverride={termOverride != null}
                    locale={locale}
                    onApply={(override) => setTermOverride(override)}
                    onReset={() => setTermOverride(null)}
                  />
                )}
              </div>
            )}
          </Card>
        );
      })}

      <Card className="flex flex-col gap-2.5">
        <p className="text-xs font-semibold text-ink-500">{t("results.compare.dimension.guarantees", locale)}</p>
        <ValueRow labelKey="results.detail.guaranteedValues" value={effectiveStrategy.guarantees.value} status={effectiveStrategy.guarantees.status} locale={locale} />
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-500">{t("results.detail.liquidity", locale)}</span>
          <StatusBadge status={effectiveStrategy.liquidity.status} locale={locale} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-500">{t("results.detail.costs", locale)}</span>
          <StatusBadge status={effectiveStrategy.costs.status} locale={locale} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-500">{t("results.detail.tax", locale)}</span>
          <StatusBadge status={effectiveStrategy.taxTreatment.status} locale={locale} />
        </div>
      </Card>

      {(effectiveStrategy.assumptions.length > 0 || effectiveStrategy.warnings.length > 0) && (
        <Card className="flex flex-col gap-2">
          {effectiveStrategy.assumptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-500">{t("results.detail.assumptions", locale)}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {effectiveStrategy.assumptions.map((a) => (
                  <li key={a} className="text-xs text-ink-500">
                    • {t(assumptionI18nKey(a), locale)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {effectiveStrategy.warnings.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-500">{t("results.detail.warnings", locale)}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {effectiveStrategy.warnings.map((w) => (
                  <li key={w} className="text-xs text-ink-500">
                    • {t(warningI18nKey(w), locale)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
