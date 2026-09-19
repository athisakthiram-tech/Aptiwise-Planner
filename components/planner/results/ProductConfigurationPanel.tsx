"use client";

// Task 5 (integration audit) — "Requires verification" on an eligible
// product's premium/benefits is often correct not because the product
// is unusable, but because the exact Basic Sum Assured/Policy Term/
// Premium Paying Term the customer would actually choose hasn't been
// entered yet (strategyGenerator.ts deliberately never guesses these).
// This panel lets an advisor try the product's own real configuration —
// applying it re-runs the SAME registered engine (via
// lib/planning/strategyGenerator.ts's generateStrategies with
// termConfiguration) rather than inventing a number here.

import { useState } from "react";
import { TermConfigurationOverride } from "@/lib/planning/strategyGenerator";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-500">
      {label}
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-900"
      />
    </label>
  );
}

export function ProductConfigurationPanel({
  defaultBasicSumAssured,
  defaultPolicyTermYears,
  hasOverride,
  locale,
  onApply,
  onReset,
}: {
  defaultBasicSumAssured: number | null;
  defaultPolicyTermYears: number | null;
  hasOverride: boolean;
  locale: Locale;
  onApply: (override: TermConfigurationOverride) => void;
  onReset: () => void;
}) {
  const [basicSumAssured, setBasicSumAssured] = useState(defaultBasicSumAssured != null ? String(defaultBasicSumAssured) : "");
  const [policyTermYears, setPolicyTermYears] = useState(defaultPolicyTermYears != null ? String(defaultPolicyTermYears) : "");
  const [premiumPayingTermYears, setPremiumPayingTermYears] = useState("");

  function handleApply() {
    const override: TermConfigurationOverride = {};
    if (basicSumAssured.trim() !== "") override.basicSumAssured = Number(basicSumAssured);
    if (policyTermYears.trim() !== "") override.policyTermYears = Number(policyTermYears);
    if (premiumPayingTermYears.trim() !== "") override.premiumPayingTermYears = Number(premiumPayingTermYears);
    onApply(override);
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl2 bg-slate-50 p-3">
      <p className="text-xs text-ink-500">{t("results.configure.explain", locale)}</p>
      <NumberField label={t("results.configure.basicSumAssured", locale)} value={basicSumAssured} onChange={setBasicSumAssured} />
      <NumberField label={t("results.configure.policyTerm", locale)} value={policyTermYears} onChange={setPolicyTermYears} />
      <NumberField label={t("results.configure.premiumPayingTerm", locale)} value={premiumPayingTermYears} onChange={setPremiumPayingTermYears} />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={handleApply} className="flex-1 rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white">
          {t("results.configure.apply", locale)}
        </button>
        {hasOverride && (
          <button type="button" onClick={onReset} className="flex-1 rounded-full bg-slate-200 px-3 py-2 text-xs font-semibold text-ink-900">
            {t("results.configure.reset", locale)}
          </button>
        )}
      </div>
    </div>
  );
}
