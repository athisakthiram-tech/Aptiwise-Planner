"use client";

import { StrategyId } from "@/types";
import { STRATEGIES } from "@/lib/recommendations/strategies";
import { Card } from "@/components/ui/Card";

export function Step3Strategy({
  selectedId,
  onSelect,
}: {
  selectedId: StrategyId;
  onSelect: (id: StrategyId) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">3 Ways To Reach Your Goal</h2>
        <p className="text-sm text-ink-500 mt-1">
          Different mixes of protection and growth. None is universally
          &ldquo;best&rdquo; — pick what feels right to discuss.
        </p>
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
                      {strategy.title}
                    </span>
                  </div>
                  <span className="text-xs font-semibold rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                    {strategy.riskEmoji} {strategy.riskLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-700">{strategy.tagline}</p>
                <p className="mt-1 text-xs text-ink-500">{strategy.description}</p>

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
                  <span>🛡️ Protection {strategy.protectionAllocationPct}%</span>
                  <span>📈 Growth {strategy.growthAllocationPct}%</span>
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
