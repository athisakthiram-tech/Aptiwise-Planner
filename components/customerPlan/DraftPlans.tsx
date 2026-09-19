"use client";

// Stage C, Section 22: the local Draft Plans list — deliberately no
// search/filter/pagination. Loads summaries via the storage abstraction
// (never touches localStorage directly), so a corrupted individual draft
// never breaks this list.

import { useState } from "react";
import { createCustomerPlanStorage } from "@/lib/customerPlan/customerPlanStorage";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { DraftPlanCard } from "@/components/customerPlan/DraftPlanCard";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function DraftPlans({
  locale,
  onBack,
  onOpen,
}: {
  locale: Locale;
  onBack: () => void;
  onOpen: (plan: CustomerPlan) => void;
}) {
  const [storage] = useState(() => createCustomerPlanStorage());
  const [drafts, setDrafts] = useState(() => storage.listDrafts());

  function handleOpen(id: string) {
    const plan = storage.loadDraft(id);
    if (plan) onOpen(plan);
  }

  function handleDelete(id: string) {
    storage.deleteDraft(id);
    setDrafts(storage.listDrafts());
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-xs font-semibold text-brand-700">
        {t("customerPlan.backToStructure", locale)}
      </button>

      <p className="text-base font-bold text-ink-900">{t("customerPlan.draftPlans", locale)}</p>

      {drafts.length === 0 ? (
        <p className="text-xs text-ink-500">{t("customerPlan.draftPlansEmpty", locale)}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {drafts.map((summary) => (
            <DraftPlanCard
              key={summary.id}
              summary={summary}
              locale={locale}
              onOpen={() => handleOpen(summary.id)}
              onDelete={() => handleDelete(summary.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
