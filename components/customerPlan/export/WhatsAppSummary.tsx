"use client";

// Section 14/15 — a dedicated WhatsApp shortcut, separate from the
// generic Web Share action (desktop advisors rarely have Web Share, but
// still want a one-tap WhatsApp option). Never requires a phone number:
// with one, it pre-fills the recipient; without one, it opens WhatsApp's
// contact picker with the text ready. Either way WhatsApp itself still
// requires the advisor to tap Send — nothing here sends automatically.

import { useState } from "react";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { buildWhatsAppSummary } from "@/lib/customerPlan/export/shareSummary";
import { t } from "@/lib/i18n/translations";

function phoneDigitsForWaLink(phone: string | null): string {
  return phone ? phone.replace(/[^0-9]/g, "") : "";
}

export function buildWhatsAppLink(plan: CustomerPlan): string {
  const text = buildWhatsAppSummary(plan);
  const digits = phoneDigitsForWaLink(plan.customer.phone);
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function WhatsAppSummary({ plan }: { plan: CustomerPlan }) {
  const locale = plan.localeAtCreation;
  const [copiedFallback, setCopiedFallback] = useState(false);

  async function handleClick() {
    setCopiedFallback(false);
    const url = buildWhatsAppLink(plan);
    const opened = typeof window !== "undefined" ? window.open(url, "_blank", "noopener,noreferrer") : null;

    // A popup blocker (or an environment with no window) silently
    // returns null/undefined rather than throwing — copy the summary
    // text instead of leaving the advisor with no way to proceed.
    if (!opened && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(buildWhatsAppSummary(plan));
        setCopiedFallback(true);
      } catch {
        // Clipboard access denied — nothing more we can safely do here.
      }
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
      >
        💬 {t("customerPlan.export.whatsappSummary", locale)}
      </button>
      <p role="status" aria-live="polite" className="text-center text-xs text-ink-500">
        {copiedFallback && t("customerPlan.export.copiedFallback", locale)}
      </p>
    </div>
  );
}
