import { Card } from "@/components/ui/Card";

const FLOW = [
  { emoji: "👨‍👩‍👧", label: "Your Family" },
  { emoji: "🎯", label: "Financial Goal" },
  { emoji: "🛡️", label: "Protection" },
  { emoji: "❤️", label: "Family, Protected" },
];

export function Step7Family() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">Why protection matters</h2>
        <p className="text-sm text-ink-500 mt-1">
          A simple way to see how it all connects.
        </p>
      </div>

      <Card className="flex flex-col items-center py-6">
        {FLOW.map((item, i) => (
          <div key={item.label} className="flex flex-col items-center">
            <div className="flex flex-col items-center">
              <span className="text-4xl">{item.emoji}</span>
              <span className="mt-2 text-sm font-semibold text-ink-900">
                {item.label}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <span className="my-2 text-xl text-ink-500">↓</span>
            )}
          </div>
        ))}
      </Card>

      <div className="rounded-xl2 bg-slate-100 p-3.5 text-xs text-ink-500 leading-relaxed">
        Insurance protection depends on the selected policy&apos;s contractual
        benefits, terms, exclusions and claim conditions. Not every insurance
        product guarantees returns or guarantees completion of a financial
        goal.
      </div>
    </div>
  );
}
