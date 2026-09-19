"use client";

// Section 2/12 — Download PDF, Share Plan and the WhatsApp summary,
// grouped under the "Professional Proposal" step of the flow described
// in the task: CustomerPlan → Proposal → Download PDF / Share.
//
// PDF APPROACH (documented, not silently chosen): this is a purely
// static, client-only deployment with no server component to render a
// PDF, and a true text-embedded PDF library (e.g. jsPDF) ships only
// Latin fonts — it cannot render Tamil/Hindi without bundling large
// custom font files, and doing that "half way" would silently produce
// broken glyphs for a TA/HI proposal. Rather than fake multilingual PDF
// support, "Download PDF" renders the exact same ProposalDocument the
// advisor already sees (in plan.localeAtCreation) as a print-only view
// and calls the browser's native print-to-PDF ("Save as PDF" in every
// major browser's print dialog) — this renders EN/TA/HI correctly
// because it uses the browser's own text layout/fonts, needs no new
// dependency, and works the same on mobile. document.title is set to
// the sanitized proposal filename immediately before printing, since
// every major browser's print-to-PDF dialog suggests it as the saved
// file's name.
import { useRef, useState } from "react";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { buildProposalFilename } from "@/lib/customerPlan/export/proposalFilename";
import { ProposalDocument } from "@/components/customerPlan/export/ProposalDocument";
import { SharePlanAction } from "@/components/customerPlan/export/SharePlanAction";
import { WhatsAppSummary } from "@/components/customerPlan/export/WhatsAppSummary";
import { t } from "@/lib/i18n/translations";

type DownloadState = "idle" | "preparing" | "failed";

export function ProposalActions({ plan }: { plan: CustomerPlan }) {
  const locale = plan.localeAtCreation;
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const printingRef = useRef(false);

  function handleDownload() {
    // Guards a double-click/double-tap from opening two print dialogs.
    if (printingRef.current) return;
    if (typeof window === "undefined" || typeof window.print !== "function") {
      setDownloadState("failed");
      return;
    }

    printingRef.current = true;
    setDownloadState("preparing");

    const previousTitle = document.title;
    document.title = buildProposalFilename(plan).replace(/\.pdf$/i, "");

    const restore = () => {
      document.title = previousTitle;
      printingRef.current = false;
      setDownloadState("idle");
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);

    try {
      window.print();
    } catch {
      restore();
      setDownloadState("failed");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloadState === "preparing"}
        aria-busy={downloadState === "preparing"}
        className="w-full rounded-full bg-ink-900 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
      >
        📄 {downloadState === "preparing" ? t("customerPlan.export.preparing", locale) : t("customerPlan.export.downloadPdf", locale)}
      </button>
      <p role="status" aria-live="polite" className="text-center text-xs">
        {downloadState === "failed" && <span className="text-amber-700">{t("customerPlan.export.downloadFailed", locale)}</span>}
      </p>

      <SharePlanAction plan={plan} />
      <WhatsAppSummary plan={plan} />

      {/* Always mounted, hidden on screen — see app/globals.css's
          .proposal-print-root print rules. */}
      <div className="proposal-print-root" aria-hidden="true">
        <ProposalDocument plan={plan} />
      </div>
    </div>
  );
}
