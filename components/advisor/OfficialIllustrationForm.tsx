"use client";

// Official-illustration fallback UI. Shown only when a component's own
// engine-calculated value isn't available — lets the advisor enter the
// insurer's own official illustration instead of Aptiwise showing a
// fabricated or missing number. Every value entered here is tagged
// ADVISOR_ENTERED_OFFICIAL_ILLUSTRATION (see
// lib/advisor/advisorIllustrationOverride.ts) — never silently treated
// as an Aptiwise calculation.

import { useState } from "react";
import { AdvisorIllustrationOverrideInput } from "@/lib/advisor/advisorIllustrationOverride";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const inputClass = "rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-900";

function numberOrUndefined(raw: string): number | undefined {
  return raw === "" ? undefined : Number(raw);
}

export function OfficialIllustrationForm({
  locale,
  onSave,
  onCancel,
}: {
  locale: Locale;
  onSave: (override: AdvisorIllustrationOverrideInput) => void;
  onCancel: () => void;
}) {
  const [officialPremiumMonthly, setOfficialPremiumMonthly] = useState("");
  const [basicSumAssured, setBasicSumAssured] = useState("");
  const [guaranteedBenefit, setGuaranteedBenefit] = useState("");
  const [nonGuaranteedIllustration, setNonGuaranteedIllustration] = useState("");
  const [maturityOrGoalBenefit, setMaturityOrGoalBenefit] = useState("");

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50 p-3">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold text-ink-700">{t("advisor.screen3.officialPremium", locale)}</span>
        <input type="number" value={officialPremiumMonthly} onChange={(e) => setOfficialPremiumMonthly(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold text-ink-700">{t("advisor.screen3.basicSumAssured", locale)}</span>
        <input type="number" value={basicSumAssured} onChange={(e) => setBasicSumAssured(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold text-ink-700">{t("advisor.screen3.guaranteedBenefit", locale)}</span>
        <input type="number" value={guaranteedBenefit} onChange={(e) => setGuaranteedBenefit(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold text-ink-700">{t("advisor.screen3.nonGuaranteedIllustration", locale)}</span>
        <input
          type="number"
          value={nonGuaranteedIllustration}
          onChange={(e) => setNonGuaranteedIllustration(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold text-ink-700">{t("advisor.screen3.maturityOrGoalBenefit", locale)}</span>
        <input
          type="number"
          value={maturityOrGoalBenefit}
          onChange={(e) => setMaturityOrGoalBenefit(e.target.value)}
          className={inputClass}
        />
      </label>
      <p className="text-[11px] text-ink-500">{t("advisor.screen3.officialIllustrationNote", locale)}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            onSave({
              officialPremiumMonthly: numberOrUndefined(officialPremiumMonthly),
              basicSumAssured: numberOrUndefined(basicSumAssured),
              guaranteedBenefit: numberOrUndefined(guaranteedBenefit),
              nonGuaranteedIllustration: numberOrUndefined(nonGuaranteedIllustration),
              maturityOrGoalBenefit: numberOrUndefined(maturityOrGoalBenefit),
            })
          }
          className="flex-1 rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white"
        >
          {t("advisor.screen3.save", locale)}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-ink-900">
          {t("advisor.screen3.cancel", locale)}
        </button>
      </div>
    </div>
  );
}
