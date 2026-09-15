"use client";

import { useState } from "react";
import { GoalInput, StrategyId } from "@/types";
import { getGoalOption } from "@/data/goalOptions";
import { getStrategyById } from "@/lib/recommendations/strategies";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function Step8Final({
  goal,
  strategyId,
}: {
  goal: GoalInput;
  strategyId: StrategyId;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const goalOption = getGoalOption(goal.goalType);
  const strategy = getStrategyById(strategyId)!;

  const showComingNext = (feature: string) =>
    setNotice(`${feature} is coming next — not available in this preview.`);

  return (
    <div className="flex flex-col gap-5">
      <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white ring-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
          ✨ Your Financial Plan
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-3xl">{goalOption.emoji}</span>
          <span className="text-xl font-extrabold">{goalOption.label}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <div className="text-brand-100 text-xs">⏳ Duration</div>
            <div className="font-bold">{goal.yearsToGoal} years</div>
          </div>
          <div>
            <div className="text-brand-100 text-xs">💰 Monthly Budget</div>
            <div className="font-bold">{formatINRCompact(goal.monthlyBudget)}</div>
          </div>
          <div>
            <div className="text-brand-100 text-xs">🛡️ Protection</div>
            <div className="font-bold">{formatINRCompact(goal.existingLifeCover)}</div>
          </div>
          <div>
            <div className="text-brand-100 text-xs">📈 Investment Allocation</div>
            <div className="font-bold">{strategy.growthAllocationPct}%</div>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-white/10 p-3">
          <div className="text-brand-100 text-xs">⚖️ Selected Strategy</div>
          <div className="font-bold">
            {strategy.emoji} {strategy.title}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" onClick={() => showComingNext("📱 Share Plan")}>
          📱 Share
        </Button>
        <Button variant="secondary" onClick={() => showComingNext("📄 Download Plan")}>
          📄 Download
        </Button>
        <Button variant="secondary" onClick={() => showComingNext("❤️ Save Plan")}>
          ❤️ Save
        </Button>
      </div>

      {notice && (
        <div className="rounded-xl2 bg-slate-100 p-3.5 text-xs text-ink-700 text-center">
          {notice}
        </div>
      )}

      <div className="rounded-xl2 bg-slate-100 p-3.5 text-xs text-ink-500 leading-relaxed">
        This plan is for educational discussion purposes only. Guaranteed
        values, non-guaranteed illustrations and market-linked returns are
        distinct — final terms depend on the actual product selected.
      </div>
    </div>
  );
}
