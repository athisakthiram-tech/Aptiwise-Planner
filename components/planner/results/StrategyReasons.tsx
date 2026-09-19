// Section 11: "Why is this shown?" — every line comes from a machine-
// readable StrategyReasonCode resolved to an i18n key via
// lib/planning/resultsViewModel.ts. No English text is generated inside
// this component or any financial engine; it only looks up translations.

import { StrategyReasonCode } from "@/lib/planning/strategyTypes";
import { reasonCodeI18nKey } from "@/lib/planning/resultsViewModel";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function StrategyReasons({ reasonCodes, locale }: { reasonCodes: StrategyReasonCode[]; locale: Locale }) {
  if (reasonCodes.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-ink-500">{t("results.reason.title", locale)}</p>
      <ul className="flex flex-col gap-1">
        {reasonCodes.map((code) => (
          <li key={code} className="flex items-start gap-1.5 text-xs text-ink-700">
            <span aria-hidden="true">✓</span>
            <span>{t(reasonCodeI18nKey(code), locale)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
