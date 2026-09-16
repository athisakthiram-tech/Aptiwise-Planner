import { COMPARISON_ATTRIBUTES } from "@/lib/recommendations/comparison";
import { Card } from "@/components/ui/Card";
import { Disclosure } from "@/components/ui/Disclosure";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function Step4Compare({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">{t("protection.vsGrowthTitle", locale)}</h2>
        <p className="text-sm text-ink-500 mt-1">{t("protection.vsGrowthSubtitle", locale)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl2 bg-brand-700 text-white p-4">
          <div className="text-2xl">🛡️</div>
          <div className="mt-1 text-sm font-bold">{t("protection.label", locale)}</div>
        </div>
        <div className="rounded-xl2 bg-ink-900 text-white p-4">
          <div className="text-2xl">📈</div>
          <div className="mt-1 text-sm font-bold">{t("growth.marketInvestmentLabel", locale)}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {COMPARISON_ATTRIBUTES.map((attr) => (
          <Card key={attr.key}>
            <p className="text-sm font-semibold text-ink-900 mb-2">
              {attr.emoji} {t(attr.label, locale)}
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-brand-50 p-2.5 text-ink-700">
                {t(attr.protectionNote, locale)}
              </div>
              <div className="rounded-lg bg-slate-100 p-2.5 text-ink-700">
                {t(attr.growthNote, locale)}
              </div>
            </div>
            <div className="mt-2.5">
              <Disclosure locale={locale}>{t(attr.why, locale)}</Disclosure>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
