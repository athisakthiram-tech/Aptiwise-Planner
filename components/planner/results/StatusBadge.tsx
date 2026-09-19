// Customer-friendly presentation of the engine's ValueStatus vocabulary
// (Section 7). Icon + text always together — never color alone. The
// mapping itself (icon, i18n key) lives in lib/planning/resultsViewModel.ts
// so it stays testable without rendering anything.

import { ValueStatus } from "@/types/insurance";
import { getStatusPresentation } from "@/lib/planning/resultsViewModel";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const STATUS_TONE: Record<ValueStatus, string> = {
  verified: "bg-emerald-50 text-emerald-700",
  illustrative: "bg-sky-50 text-sky-700",
  unavailable: "bg-amber-50 text-amber-700",
  not_applicable: "bg-slate-100 text-ink-500",
  partial: "bg-amber-50 text-amber-700",
  conditional: "bg-slate-100 text-ink-700",
};

export function StatusBadge({ status, locale }: { status: ValueStatus; locale: Locale }) {
  const presentation = getStatusPresentation(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[status]}`}
    >
      <span aria-hidden="true">{presentation.icon}</span>
      {t(presentation.i18nKey, locale)}
    </span>
  );
}
