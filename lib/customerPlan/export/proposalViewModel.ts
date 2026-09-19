// Section 20 — the single pure adapter between a frozen CustomerPlan and
// every export surface (HTML proposal, print view, PDF, WhatsApp
// summary). buildProposalViewModel() runs NO product engine, NO
// eligibility engine, NO strategy generator and NO protection/goal
// calculation — it only formats, organizes and localizes values that
// were already frozen into the plan by lib/customerPlan/createCustomerPlan.ts.
//
// The proposal's language is always plan.localeAtCreation (Section
// 17/18) — never the UI's current locale — so a saved Tamil proposal can
// never silently render in English just because the advisor later
// switched the app's language.

import { CustomerPlan, CustomerPlanComponentSnapshot } from "@/lib/customerPlan/types";
import { categoryI18nKey, reasonCodeI18nKey } from "@/lib/planning/resultsViewModel";
import { getGoalOption } from "@/data/goalOptions";
import { formatINRCompact } from "@/lib/calculations/format";
import { formatProposalDate, formatPercent, presentAmount, presentStatus, AmountField } from "@/lib/customerPlan/export/proposalFormatting";
import { t } from "@/lib/i18n/translations";
import { Locale } from "@/lib/i18n/types";

export interface ProposalHeader {
  appName: string;
  title: string;
  customerLabel: string;
  customerName: string;
  createdLabel: string;
  createdAtFormatted: string;
}

export interface ProposalGoalSection {
  titleLabel: string;
  goalTypeLabel: string;
  targetLabel: string;
  targetFormatted: string;
  timeLabel: string;
  timeFormatted: string;
  currentResourcesLabel: string;
  currentResourcesFormatted: string;
  remainingGapLabel: string;
  remainingGap: AmountField;
}

export interface ProposalProtectionSection {
  titleLabel: string;
  requiredLabel: string;
  required: AmountField;
  existingLabel: string;
  existing: AmountField;
  providedLabel: string;
  provided: AmountField;
  remainingGapLabel: string;
  remainingGap: AmountField;
}

export interface ProposalBudgetLine {
  text: string;
  tone: "positive" | "warning";
}

export interface ProposalBudgetSection {
  kind: "verified" | "unverified";
  titleLabel: string;
  availableLabel: string;
  availableFormatted: string;
  // Pre-composed, complete sentences — Section 6's exact critical
  // wording ("Requires verification" / "Cannot yet be verified"),
  // reused verbatim from the live Results UI rather than reassembled
  // from separate label/value fragments here.
  lines: ProposalBudgetLine[];
}

export interface ProposalProductIdentity {
  productName: string;
  planNumberLabel: string;
  planNumber: string;
  uinLabel: string;
  uin: string;
  categoryLabel: string;
}

export interface ProposalInvestmentIllustration {
  titleLabel: string;
  contributionFormatted: string;
  perMonthSuffix: string;
  durationFormatted: string;
  rateFormatted: string;
  projectedValueFormatted: string;
  disclaimer: string;
}

export interface ProposalComponent {
  product: ProposalProductIdentity | null;
  investmentLabel: string | null;
  premiumLabel: string;
  premium: AmountField;
  deathBenefitLabel: string;
  deathBenefit: AmountField;
  maturityBenefitLabel: string;
  maturityBenefit: AmountField;
  investmentIllustration: ProposalInvestmentIllustration | null;
}

export interface ProposalDimensionRow {
  icon: string;
  label: string;
  formattedValue: string;
  statusIcon: string;
  statusLabel: string;
}

export interface ProposalViewModel {
  locale: Locale;
  header: ProposalHeader;
  goal: ProposalGoalSection;
  protection: ProposalProtectionSection;
  budget: ProposalBudgetSection;
  structureTitleLabel: string;
  components: ProposalComponent[];
  dimensions: ProposalDimensionRow[];
  reasonsTitleLabel: string;
  reasons: string[];
  disclosuresTitleLabel: string;
  disclosures: string[];
  snapshotNote: string;
}

function componentTitle(component: CustomerPlanComponentSnapshot, locale: Locale): string {
  return component.product ? component.product.productName.replace(/^LIC's /, "") : t("results.strategy.investmentLabel", locale);
}

export function buildProposalViewModel(plan: CustomerPlan): ProposalViewModel {
  const locale = plan.localeAtCreation;
  const { goal, protection, budget } = plan.financialPicture;
  const { selectedStrategy } = plan;

  const goalOption = goal.goalType ? getGoalOption(goal.goalType) : null;

  const header: ProposalHeader = {
    appName: "Aptiwise",
    title: t("customerPlan.title", locale),
    customerLabel: t("customerPlan.customer", locale),
    customerName: plan.customer.name ?? t("customerPlan.unnamedCustomer", locale),
    createdLabel: t("customerPlan.created", locale),
    createdAtFormatted: formatProposalDate(plan.createdAt, locale),
  };

  const goalSection: ProposalGoalSection = {
    titleLabel: t("results.goal.title", locale),
    goalTypeLabel: goalOption ? `${goalOption.emoji} ${t(goalOption.label, locale)}` : t("results.goal.notProvided", locale),
    targetLabel: t("results.goal.target", locale),
    targetFormatted: goal.targetAmount != null ? formatINRCompact(goal.targetAmount) : t("results.goal.notProvided", locale),
    timeLabel: t("results.goal.time", locale),
    timeFormatted: goal.yearsToGoal != null ? t("common.yearsValue", locale, { n: goal.yearsToGoal }) : t("results.goal.notProvided", locale),
    currentResourcesLabel: t("results.goal.currentResources", locale),
    currentResourcesFormatted: goal.currentResources != null ? formatINRCompact(goal.currentResources) : t("results.goal.notProvided", locale),
    remainingGapLabel: t("results.goal.goalGap", locale),
    remainingGap: presentAmount(goal.remainingGoalGap, goal.status, locale),
  };

  const protectionSection: ProposalProtectionSection = {
    titleLabel: t("results.protection.title", locale),
    requiredLabel: t("results.protectionVisual.required", locale),
    required: presentAmount(protection.requiredProtection, protection.requiredStatus, locale),
    existingLabel: t("results.protectionVisual.existing", locale),
    existing: presentAmount(protection.existingProtection, protection.existingProtection != null ? "verified" : "unavailable", locale),
    providedLabel: t("results.protectionVisual.structure", locale),
    provided: presentAmount(protection.protectionProvidedByStructure, protection.protectionProvidedByStructureStatus, locale),
    remainingGapLabel: t("results.protectionVisual.remainingGap", locale),
    remainingGap: presentAmount(protection.remainingProtectionGap, protection.remainingProtectionGapStatus, locale),
  };

  const budgetAvailableFormatted =
    budget.monthlyBudgetAvailable != null ? formatINRCompact(budget.monthlyBudgetAvailable) : t("results.goal.notProvided", locale);

  // Section 6 (critical): the exported proposal must reproduce the same
  // "never imply within-budget on an unverified premium" split the live
  // Results UI enforces — never a flat "Total = amount" line.
  const budgetSection: ProposalBudgetSection =
    budget.monthlyBudgetUsageStatus === "verified" && budget.monthlyBudgetVerifiedUsed != null
      ? {
          kind: "verified",
          titleLabel: t("results.budget.title", locale),
          availableLabel: t("results.goal.target", locale),
          availableFormatted: budgetAvailableFormatted,
          lines: [
            { text: t("results.budget.withinBudget", locale), tone: "positive" },
            { text: t("results.budget.verifiedUsed", locale, { amount: formatINRCompact(budget.monthlyBudgetVerifiedUsed) }), tone: "positive" },
            ...(budget.remainingBudget != null
              ? [{ text: t("results.budget.remaining", locale, { amount: formatINRCompact(budget.remainingBudget) }), tone: "positive" as const }]
              : []),
          ],
        }
      : {
          kind: "unverified",
          titleLabel: t("results.budget.title", locale),
          availableLabel: t("results.goal.target", locale),
          availableFormatted: budgetAvailableFormatted,
          lines: [
            { text: t("results.budget.premiumRequiresVerification", locale), tone: "warning" },
            ...(() => {
              const illustrative = selectedStrategy.components.find((c) => c.role === "illustrative_investment");
              return illustrative?.premium.value != null
                ? [
                    {
                      text: t("results.budget.investmentBeforeAdjustment", locale, { amount: formatINRCompact(illustrative.premium.value) }),
                      tone: "warning" as const,
                    },
                  ]
                : [];
            })(),
            { text: t("results.budget.cannotVerifyTotal", locale), tone: "warning" },
          ],
        };

  const components: ProposalComponent[] = selectedStrategy.components.map((component) => ({
    product: component.product
      ? {
          productName: component.product.productName,
          planNumberLabel: "Plan Number",
          planNumber: component.product.planNumber,
          uinLabel: "UIN",
          uin: component.product.uin,
          categoryLabel: t(categoryI18nKey(component.product.category), locale),
        }
      : null,
    investmentLabel: component.product ? null : componentTitle(component, locale),
    premiumLabel: t("results.detail.premiumStatus", locale),
    premium: presentAmount(component.premium.value, component.premium.status, locale),
    deathBenefitLabel: t("results.detail.protection", locale),
    deathBenefit: presentAmount(component.deathBenefit.value, component.deathBenefit.status, locale),
    maturityBenefitLabel: t("results.detail.maturityBenefit", locale),
    maturityBenefit: presentAmount(component.maturityBenefit.value, component.maturityBenefit.status, locale),
    investmentIllustration: component.investmentIllustration
      ? {
          titleLabel: t("results.journey.investmentIllustration", locale),
          contributionFormatted: presentAmount(component.investmentIllustration.contributionAmount, "illustrative", locale).formattedValue,
          perMonthSuffix: t("common.perMonthSuffix", locale),
          durationFormatted: t("common.yearsValue", locale, { n: component.investmentIllustration.years }),
          rateFormatted: t("sip.ratePa", locale, { rate: component.investmentIllustration.ratePct }),
          projectedValueFormatted: presentAmount(component.investmentIllustration.projectedValue, "illustrative", locale).formattedValue,
          disclaimer: t("results.warning.illustration_only_not_guaranteed_returns", locale),
        }
      : null,
  }));

  const marketExposureLabel = t(`results.strategy.marketExposure.${selectedStrategy.marketExposure.value ?? "not_market_linked"}`, locale);
  const goalCoveragePct = selectedStrategy.goalCoverage.value?.coveragePercent ?? null;

  // results.strategy.familyProtection/goalCoverage/marketExposure and
  // results.compare.dimension.guarantees already carry their own emoji
  // (Section 5's existing StrategyCard labels) — `icon` stays empty here
  // so it is never shown twice; liquidity/costs/tax have no such prefix
  // in the shared translation set, so Section 3's icons are added directly.
  const dimensions: ProposalDimensionRow[] = [
    {
      icon: "",
      label: t("results.strategy.familyProtection", locale),
      formattedValue: presentAmount(protection.protectionProvidedByStructure, protection.protectionProvidedByStructureStatus, locale).formattedValue,
      ...presentStatusPair(protection.protectionProvidedByStructureStatus, locale),
    },
    {
      icon: "",
      label: t("results.strategy.goalCoverage", locale),
      formattedValue: goalCoveragePct != null ? formatPercent(goalCoveragePct) : t("results.goal.notProvided", locale),
      ...presentStatusPair(selectedStrategy.goalCoverage.status, locale),
    },
    {
      icon: "",
      label: t("results.strategy.marketExposure", locale),
      formattedValue: marketExposureLabel,
      ...presentStatusPair(selectedStrategy.marketExposure.status, locale),
    },
    {
      icon: "",
      label: t("results.compare.dimension.guarantees", locale),
      formattedValue: presentAmount(selectedStrategy.guarantees.value, selectedStrategy.guarantees.status, locale).formattedValue,
      ...presentStatusPair(selectedStrategy.guarantees.status, locale),
    },
    {
      icon: "💧",
      label: t("results.detail.liquidity", locale),
      formattedValue: "—",
      ...presentStatusPair(selectedStrategy.liquidity.status, locale),
    },
    {
      icon: "💸",
      label: t("results.detail.costs", locale),
      formattedValue: "—",
      ...presentStatusPair(selectedStrategy.costs.status, locale),
    },
    {
      icon: "🧾",
      label: t("results.detail.tax", locale),
      formattedValue: "—",
      ...presentStatusPair(selectedStrategy.taxTreatment.status, locale),
    },
  ];

  return {
    locale,
    header,
    goal: goalSection,
    protection: protectionSection,
    budget: budgetSection,
    structureTitleLabel: t("customerPlan.planStructure", locale),
    components,
    dimensions,
    reasonsTitleLabel: t("results.reason.title", locale),
    reasons: selectedStrategy.reasonCodes.map((code) => t(reasonCodeI18nKey(code), locale)),
    disclosuresTitleLabel: t("customerPlan.importantInformation", locale),
    disclosures: plan.disclosures.map((code) => t(`customerPlan.disclosure.${code}`, locale)),
    snapshotNote: t("customerPlan.snapshotNote", locale),
  };
}

function presentStatusPair(status: Parameters<typeof presentStatus>[0], locale: Locale) {
  const { icon, label } = presentStatus(status, locale);
  return { statusIcon: icon, statusLabel: label };
}
