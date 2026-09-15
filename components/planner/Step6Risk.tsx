import { Card } from "@/components/ui/Card";

// Simple deterministic zig-zag path to illustrate that markets move up and
// down over time — purely illustrative, not real market data.
const PATH_POINTS = [10, 35, 22, 55, 40, 70, 52, 85, 65, 95];

export function Step6Risk() {
  const width = 300;
  const height = 100;
  const stepX = width / (PATH_POINTS.length - 1);
  const points = PATH_POINTS.map((v, i) => {
    const x = i * stepX;
    const y = height - (v / 100) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">Market risk, visually</h2>
        <p className="text-sm text-ink-500 mt-1">
          Markets move — in both directions — over time.
        </p>
      </div>

      <Card>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
          <polyline
            points={points}
            fill="none"
            stroke="#0f9d58"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-brand-50 p-2.5">
            <div className="text-lg">📈</div>
            <div className="mt-1 font-medium text-ink-700">Markets can rise</div>
          </div>
          <div className="rounded-lg bg-red-50 p-2.5">
            <div className="text-lg">📉</div>
            <div className="mt-1 font-medium text-ink-700">Markets can fall</div>
          </div>
          <div className="rounded-lg bg-slate-100 p-2.5">
            <div className="text-lg">⏳</div>
            <div className="mt-1 font-medium text-ink-700">
              Long-term still involves risk
            </div>
          </div>
        </div>
      </Card>

      <div className="rounded-xl2 bg-slate-100 p-3.5 text-xs text-ink-500">
        Past performance does not guarantee future returns.
      </div>
    </div>
  );
}
