"use client";

import { StrategyId } from "@/types";
import { STRATEGIES } from "@/lib/recommendations/strategies";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function Step3Strategy({
  selectedId,
  onSelect,
  locale,
}: {
  selectedId: StrategyId;
  onSelect: (id: StrategyId) => void;
  locale: Locale;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">{t("strategy.title", locale)}</h2>
        <p className="text-sm text-ink-500 mt-1">{t("strategy.subtitle", locale)}</p>
      </div>

      <div className="flex flex-col gap-3">
        {STRATEGIES.map((strategy) => {
          const active = strategy.id === selectedId;
          return (
            <button
              key={strategy.id}
              type="button"
              onClick={() => onSelect(strategy.id)}
              className="text-left"
            >
              <Card
                className={`transition ${
                  active ? "ring-2 ring-brand-500 bg-brand-50" : "hover:ring-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{strategy.emoji}</span>
                    <span className="text-base font-bold text-ink-900">
                      {t(strategy.title, locale)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                    {strategy.riskEmoji} {t(strategy.riskLabel, locale)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-700">{t(strategy.tagline, locale)}</p>
                <p className="mt-1 text-xs text-ink-500">{t(strategy.description, locale)}</p>

                <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full bg-brand-700"
                    style={{ width: `${strategy.protectionAllocationPct}%` }}
                  />
                  <div
                    className="h-full bg-brand-200"
                    style={{ width: `${strategy.growthAllocationPct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-ink-500">
                  <span>
                    {t("strategy.protectionPct", locale, { pct: strategy.protectionAllocationPct })}
                  </span>
                  <span>
                    {t("strategy.growthPct", locale, { pct: strategy.growthAllocationPct })}
                  </span>
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
