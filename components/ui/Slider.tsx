interface SliderProps {
  label: string;
  emoji?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  onChange: (value: number) => void;
  hint?: string;
}

export function Slider({
  label,
  emoji,
  value,
  min,
  max,
  step = 1,
  displayValue,
  onChange,
  hint,
}: SliderProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-ink-700">
          {emoji} {label}
        </span>
        <span className="text-lg font-bold text-ink-900">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-slate-200 accent-brand-600 cursor-pointer"
      />
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
