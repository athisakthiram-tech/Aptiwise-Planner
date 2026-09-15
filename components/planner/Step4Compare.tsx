import { COMPARISON_ATTRIBUTES } from "@/lib/recommendations/comparison";
import { Card } from "@/components/ui/Card";
import { Disclosure } from "@/components/ui/Disclosure";

export function Step4Compare() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">Protection vs Growth</h2>
        <p className="text-sm text-ink-500 mt-1">
          Two different jobs — worth understanding side by side.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl2 bg-brand-700 text-white p-4">
          <div className="text-2xl">🛡️</div>
          <div className="mt-1 text-sm font-bold">Protection</div>
        </div>
        <div className="rounded-xl2 bg-ink-900 text-white p-4">
          <div className="text-2xl">📈</div>
          <div className="mt-1 text-sm font-bold">Market Investment</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {COMPARISON_ATTRIBUTES.map((attr) => (
          <Card key={attr.key}>
            <p className="text-sm font-semibold text-ink-900 mb-2">
              {attr.emoji} {attr.label}
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-brand-50 p-2.5 text-ink-700">
                {attr.protectionNote}
              </div>
              <div className="rounded-lg bg-slate-100 p-2.5 text-ink-700">
                {attr.growthNote}
              </div>
            </div>
            <div className="mt-2.5">
              <Disclosure>{attr.why}</Disclosure>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
