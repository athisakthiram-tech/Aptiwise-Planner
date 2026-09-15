import { GoalInput } from "@/types";
import { getGoalOption } from "@/data/goalOptions";
import { totalPlannedContributions, goalProgressPct } from "@/lib/calculations/contributions";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";

export function Step2Summary({ goal }: { goal: GoalInput }) {
  const goalOption = getGoalOption(goal.goalType);
  const totalContributions = totalPlannedContributions(
    goal.monthlyBudget,
    goal.yearsToGoal
  );
  const progressPct = goalProgressPct(totalContributions, goal.targetAmount);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">Your goal at a glance</h2>
        <p className="text-sm text-ink-500 mt-1">
          Here&apos;s what we&apos;ll plan around.
        </p>
      </div>

      <Card className="bg-brand-600 text-white ring-0">
        <div className="text-3xl">{goalOption.emoji}</div>
        <div className="mt-1 text-base font-semibold">{goalOption.label}</div>
        <div className="mt-4 text-xs uppercase tracking-wide text-brand-100">
          Target amount
        </div>
        <div className="text-3xl font-extrabold tracking-tight">
          {formatINRCompact(goal.targetAmount)}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatTile emoji="💰" label="Monthly Budget" value={formatINRCompact(goal.monthlyBudget)} />
        <StatTile emoji="⏳" label="Time" value={`${goal.yearsToGoal} years`} />
        <StatTile emoji="🛡️" label="Existing Cover" value={formatINRCompact(goal.existingLifeCover)} />
        <StatTile emoji="🎂" label="Current Age" value={`${goal.age} yrs`} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-ink-700">
            💵 Total planned contributions
          </p>
          <p className="text-sm font-bold text-ink-900">
            {formatINRCompact(totalContributions)}
          </p>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-500">
          {formatINRCompact(goal.monthlyBudget)} × 12 months × {goal.yearsToGoal}{" "}
          years covers about {progressPct}% of your target.
        </p>
      </Card>
    </div>
  );
}
