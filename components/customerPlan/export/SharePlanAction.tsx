"use client";

// Section 13 — progressive Web Share integration. Hidden entirely where
// the browser has no navigator.share at all (Section 23's "Web Share
// unavailable" case): Download PDF and the WhatsApp summary already
// serve as the safe fallback actions in that case, so this component
// doesn't render a disabled/confusing button.
//
// This stage never attaches a generated file to the share — see
// ProposalActions.tsx's header comment for why "Download PDF" is a
// browser print, not a Blob this app can hand to navigator.share — so
// only title/text are ever shared here.

import { useEffect, useState } from "react";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { buildWhatsAppSummary } from "@/lib/customerPlan/export/shareSummary";
import { shareViaWebShare } from "@/lib/customerPlan/export/webShareAdapter";
import { t } from "@/lib/i18n/translations";

type ShareState = "idle" | "sharing" | "shared" | "cancelled" | "failed";

export function SharePlanAction({ plan }: { plan: CustomerPlan }) {
  const locale = plan.localeAtCreation;
  // null until the client confirms support, so SSR/CSR markup matches
  // and a browser without Web Share never sees the button at all.
  const [supported, setSupported] = useState<boolean | null>(null);
  const [state, setState] = useState<ShareState>("idle");

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  if (supported !== true) return null;

  async function handleShare() {
    setState("sharing");
    const outcome = await shareViaWebShare({
      title: t("customerPlan.title", locale),
      text: buildWhatsAppSummary(plan),
    });
    if (outcome.status === "shared") setState("shared");
    else if (outcome.status === "cancelled") setState("cancelled");
    else if (outcome.status === "failed") setState("failed");
    else setState("idle");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleShare}
        disabled={state === "sharing"}
        aria-busy={state === "sharing"}
        className="w-full rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-ink-900 disabled:opacity-60"
      >
        📤 {t("customerPlan.export.sharePlan", locale)}
      </button>
      <p role="status" aria-live="polite" className="text-center text-xs">
        {state === "failed" && <span className="text-amber-700">{t("customerPlan.export.shareFailed", locale)}</span>}
        {state === "shared" && <span className="text-emerald-700">{t("customerPlan.export.shareSuccess", locale)}</span>}
      </p>
    </div>
  );
}
