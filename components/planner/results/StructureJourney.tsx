// Section 10: a simple, insurance-jargon-free visual story of what a
// structure does with the customer's money — varies by family, per the
// task's own worked examples. Never implies guaranteed investment growth
// (the goal/wealth-building box always says "illustration" for the two
// families that actually carry market exposure).

import { StrategyFamily } from "@/lib/planning/strategyTypes";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function JourneyBox({ emoji, labelKey, locale }: { emoji: string; labelKey: string; locale: Locale }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-ink-700">
      <span aria-hidden="true">{emoji}</span>
      <span>{t(labelKey, locale)}</span>
    </div>
  );
}

function Arrow() {
  return (
    <div className="pl-4 text-ink-300" aria-hidden="true">
      ↓
    </div>
  );
}

export function StructureJourney({ family, locale }: { family: StrategyFamily; locale: Locale }) {
  if (family === "protection_investment") {
    return (
      <div className="flex flex-col gap-1">
        <JourneyBox emoji="💰" labelKey="results.journey.budget" locale={locale} />
        <Arrow />
        <div className="grid grid-cols-2 gap-2 pl-2">
          <JourneyBox emoji="🛡️" labelKey="results.journey.protectionAlongTheWay" locale={locale} />
          <JourneyBox emoji="📈" labelKey="results.journey.investmentIllustration" locale={locale} />
        </div>
        <Arrow />
        <JourneyBox emoji="🎯" labelKey="results.journey.futureGoal" locale={locale} />
      </div>
    );
  }

  if (family === "market_linked_insurance") {
    return (
      <div className="flex flex-col gap-1">
        <JourneyBox emoji="💰" labelKey="results.journey.premium" locale={locale} />
        <Arrow />
        <JourneyBox emoji="📊" labelKey="results.journey.marketLinkedStructure" locale={locale} />
        <div className="grid grid-cols-2 gap-2 pl-2">
          <JourneyBox emoji="🛡️" labelKey="results.journey.protectionAlongTheWay" locale={locale} />
          <JourneyBox emoji="📈" labelKey="results.journey.unitLinkedValue" locale={locale} />
        </div>
      </div>
    );
  }

  if (family === "retirement_structure") {
    return (
      <div className="flex flex-col gap-1">
        <JourneyBox emoji="💰" labelKey="results.journey.premium" locale={locale} />
        <Arrow />
        <JourneyBox emoji="🌴" labelKey="results.journey.retirementIncome" locale={locale} />
      </div>
    );
  }

  // traditional_protection and traditional_structure
  return (
    <div className="flex flex-col gap-1">
      <JourneyBox emoji="💰" labelKey="results.journey.premium" locale={locale} />
      <Arrow />
      <JourneyBox emoji="🏦" labelKey="results.journey.insuranceStructure" locale={locale} />
      <div className="grid grid-cols-2 gap-2 pl-2">
        <JourneyBox emoji="🛡️" labelKey="results.journey.protectionAlongTheWay" locale={locale} />
        <JourneyBox emoji="🎯" labelKey="results.journey.maturityGoalValue" locale={locale} />
      </div>
    </div>
  );
}
