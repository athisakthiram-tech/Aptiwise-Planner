// Section 19 — a single place for every formatting rule the proposal
// (HTML preview, print view and WhatsApp summary) needs, so none of the
// three re-implements amount/date/percent/status formatting on its own.
// This module formats already-known values; it never calculates one.

import { ValueStatus } from "@/types/insurance";
import { formatINRCompact } from "@/lib/calculations/format";
import { getStatusPresentation } from "@/lib/planning/resultsViewModel";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

const INTL_DATE_LOCALE: Record<Locale, string> = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
};

export function formatProposalDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(INTL_DATE_LOCALE[locale], {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    // A locale ICU data gap must never crash proposal generation — an
    // ISO date is always a safe, unambiguous fallback.
    return date.toISOString().slice(0, 10);
  }
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export interface StatusPresentation {
  icon: string;
  label: string;
}

// Icon + text together, exactly the existing StatusBadge rule (Section
// 5) — never color alone, and legible in a black-and-white printout.
export function presentStatus(status: ValueStatus, locale: Locale): StatusPresentation {
  const presentation = getStatusPresentation(status);
  return { icon: presentation.icon, label: t(presentation.i18nKey, locale) };
}

export interface AmountField {
  formattedValue: string;
  status: ValueStatus;
  statusIcon: string;
  statusLabel: string;
}

// The one place a "not provided/unavailable" amount is turned into
// display text — a null value NEVER becomes "₹0".
export function presentAmount(value: number | null, status: ValueStatus, locale: Locale): AmountField {
  const { icon, label } = presentStatus(status, locale);
  return {
    formattedValue: value != null ? formatINRCompact(value) : t("results.goal.notProvided", locale),
    status,
    statusIcon: icon,
    statusLabel: label,
  };
}
