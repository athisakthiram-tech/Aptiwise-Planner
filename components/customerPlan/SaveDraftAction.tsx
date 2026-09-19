"use client";

// Stage C, Section 12/19: local-device draft saving. This stage saves
// ON THIS DEVICE/BROWSER only — never a secure cloud store, never a CRM —
// and the UI says so explicitly every time a save succeeds.

import { useState } from "react";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { createCustomerPlanStorage } from "@/lib/customerPlan/customerPlanStorage";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function SaveDraftAction({ plan, locale }: { plan: CustomerPlan; locale: Locale }) {
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");

  function handleSave() {
    const storage = createCustomerPlanStorage();
    const ok = storage.saveDraft(plan);
    setStatus(ok ? "saved" : "failed");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleSave}
        className="w-full rounded-full bg-ink-900 px-4 py-3 text-sm font-semibold text-white shadow-sm"
      >
        {t("customerPlan.saveDraft", locale)}
      </button>
      {status === "saved" && (
        <div className="text-center text-xs">
          <p className="font-semibold text-emerald-700">{t("customerPlan.draftSavedOnDevice", locale)}</p>
          <p className="text-ink-500">{t("customerPlan.draftSavedNote", locale)}</p>
        </div>
      )}
      {status === "failed" && <p className="text-center text-xs text-amber-700">{t("customerPlan.saveFailed", locale)}</p>}
    </div>
  );
}
