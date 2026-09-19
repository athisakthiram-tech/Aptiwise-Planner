import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { formatINRCompact } from "@/lib/calculations/format";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function ProtectionSummaryCard({
  protectionNeed,
  locale,
}: {
  protectionNeed: ProtectionNeedResult;
  locale: Locale;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-bold text-ink-900">{t("results.protection.title", locale)}</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-ink-500">{t("results.protection.calculatedNeed", locale)}</p>
          <p className="text-lg font-bold text-ink-900">
            {protectionNeed.requiredProtection != null
              ? formatINRCompact(protectionNeed.requiredProtection)
              : t("results.goal.notProvided", locale)}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-500">{t("results.protection.existingCover", locale)}</p>
          <p className="text-base font-semibold text-ink-900">
            {protectionNeed.existingProtection != null
              ? formatINRCompact(protectionNeed.existingProtection)
              : t("results.goal.notProvided", locale)}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-ink-500">{t("results.protection.protectionGap", locale)}</p>
          <p className="text-base font-semibold text-ink-900">
            {protectionNeed.protectionGap != null ? formatINRCompact(protectionNeed.protectionGap) : t("results.goal.notProvided", locale)}
          </p>
        </div>
      </div>
      {protectionNeed.status === "unavailable" && (
        <p className="text-xs text-amber-700">{t("results.protection.unavailableNote", locale)}</p>
      )}
      {protectionNeed.status === "partial" && (
        <p className="text-xs text-amber-700">{t("results.protection.partialNote", locale)}</p>
      )}
    </Card>
  );
}
