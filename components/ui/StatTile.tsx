export function StatTile({
  emoji,
  label,
  value,
  sub,
}: {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl2 bg-slate-50 p-4">
      <div className="text-xs font-medium text-ink-500 mb-1">
        {emoji} {label}
      </div>
      <div className="text-xl font-bold text-ink-900 tracking-tight">{value}</div>
      {sub && <div className="text-xs text-ink-500 mt-0.5">{sub}</div>}
    </div>
  );
}
