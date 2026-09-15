export function ProgressBar({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-medium text-ink-500 mb-1.5">
        <span>
          Step {step} of {totalSteps}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
