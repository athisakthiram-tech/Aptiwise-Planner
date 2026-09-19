// Section 4: one visual card per strategy family — only families that
// were actually generated for this customer are ever rendered (the
// caller filters via lib/planning/resultsViewModel.ts's
// groupStrategiesByFamily). Deliberately no "best/recommended/ideal"
// wording anywhere in this card.

import { StrategyFamilyGroup, FAMILY_META } from "@/lib/planning/resultsViewModel";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function StrategyFamilyCard({
  group,
  locale,
  onOpen,
}: {
  group: StrategyFamilyGroup;
  locale: Locale;
  onOpen: () => void;
}) {
  const meta = FAMILY_META[group.family];
  return (
    <button type="button" onClick={onOpen} className="w-full text-left">
      <Card className="flex items-center gap-3 active:scale-[0.99] transition">
        <div className="text-2xl" aria-hidden="true">
          {meta.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-ink-900">{t(meta.titleKey, locale)}</p>
          <p className="mt-0.5 text-xs text-ink-500">{t(meta.blurbKey, locale)}</p>
          <p className="mt-1 text-xs font-medium text-brand-700">
            {t("results.family.structureCount", locale, { n: group.strategies.length })}
          </p>
        </div>
        <div className="text-ink-300" aria-hidden="true">
          →
        </div>
      </Card>
    </button>
  );
}
