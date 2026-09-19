"use client";

// Section 8: Required vs Existing vs Provided-by-structure vs Remaining
// gap — always Family Protection / Protection Need language, never
// fear-based wording ("if you die", etc). All numbers and statuses come
// from lib/planning/resultsViewModel.ts's getProtectionVisualData; this
// component only lays them out.

import { ProtectionVisualData } from "@/lib/planning/resultsViewModel";
import { formatINRCompact } from "@/lib/calculations/format";
import { StatusBadge } from "@/components/planner/results/StatusBadge";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function Bar({ pct, tone }: { pct: number; tone: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

function Row({
  labelKey,
  value,
  statusValue,
  basis,
  tone,
  locale,
}: {
  labelKey: string;
  value: number | null;
  statusValue: import("@/types/insurance").ValueStatus;
  basis: number;
  tone: string;
  locale: Locale;
}) {
  const pct = value != null && basis > 0 ? (value / basis) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-500">{t(labelKey, locale)}</span>
        <span className="flex items-center gap-1.5 font-semibold text-ink-900">
          {value != null ? formatINRCompact(value) : t("results.goal.notProvided", locale)}
          <StatusBadge status={statusValue} locale={locale} />
        </span>
      </div>
      <Bar pct={pct} tone={tone} />
    </div>
  );
}

export function ProtectionVisual({ data, locale }: { data: ProtectionVisualData; locale: Locale }) {
  if (data.required == null) {
    return <p className="text-xs text-amber-700">{t("results.protectionVisual.unavailable", locale)}</p>;
  }

  const basis = data.required;

  return (
    <div className="flex flex-col gap-3">
      <Row
        labelKey="results.protectionVisual.required"
        value={data.required}
        statusValue={data.requiredStatus}
        basis={basis}
        tone="bg-ink-900"
        locale={locale}
      />
      <Row
        labelKey="results.protectionVisual.existing"
        value={data.existing}
        statusValue={data.existing != null ? "verified" : "unavailable"}
        basis={basis}
        tone="bg-slate-400"
        locale={locale}
      />
      <Row
        labelKey="results.protectionVisual.structure"
        value={data.providedByStructure}
        statusValue={data.providedByStructureStatus}
        basis={basis}
        tone="bg-brand-500"
        locale={locale}
      />
      <Row
        labelKey="results.protectionVisual.remainingGap"
        value={data.remainingGap}
        statusValue={data.remainingGapStatus}
        basis={basis}
        tone="bg-amber-500"
        locale={locale}
      />
      {data.remainingGap === 0 && data.remainingGapStatus !== "unavailable" && (
        <p className="text-xs font-medium text-emerald-700">{t("results.protectionVisual.fullyMet", locale)}</p>
      )}
    </div>
  );
}
