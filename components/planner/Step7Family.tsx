import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const FLOW = [
  { emoji: "👨‍👩‍👧", labelKey: "protection.flow.family" },
  { emoji: "🎯", labelKey: "protection.flow.goal" },
  { emoji: "🛡️", labelKey: "protection.flow.protection" },
  { emoji: "❤️", labelKey: "protection.flow.protected" },
];

export function Step7Family({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">{t("protection.storyTitle", locale)}</h2>
        <p className="text-sm text-ink-500 mt-1">{t("protection.storySubtitle", locale)}</p>
      </div>

      <Card className="flex flex-col items-center py-6">
        {FLOW.map((item, i) => (
          <div key={item.labelKey} className="flex flex-col items-center">
            <div className="flex flex-col items-center">
              <span className="text-4xl">{item.emoji}</span>
              <span className="mt-2 text-sm font-semibold text-ink-900">
                {t(item.labelKey, locale)}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <span className="my-2 text-xl text-ink-500">↓</span>
            )}
          </div>
        ))}
      </Card>

      <div className="rounded-xl2 bg-slate-100 p-3.5 text-xs text-ink-500 leading-relaxed">
        {t("protection.storyDisclaimer", locale)}
      </div>
    </div>
  );
}
