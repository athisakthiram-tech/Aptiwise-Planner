// Stage C, Section 21: disclosures are built from structured facts via
// machine-readable codes + localization — never a generic wall of scary
// legal text. Only the codes lib/customerPlan/disclosures.ts actually
// derived for this plan are shown.

import { CustomerPlan } from "@/lib/customerPlan/types";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function PlanDisclosures({ plan, locale }: { plan: CustomerPlan; locale: Locale }) {
  if (plan.disclosures.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-ink-500">{t("customerPlan.assumptionsDisclosures", locale)}</p>
      <ul className="flex flex-col gap-1.5">
        {plan.disclosures.map((code) => (
          <li key={code} className="flex items-start gap-1.5 text-xs text-ink-500">
            <span aria-hidden="true">•</span>
            <span>{t(`customerPlan.disclosure.${code}`, locale)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-ink-400">{t("customerPlan.snapshotNote", locale)}</p>
    </div>
  );
}
