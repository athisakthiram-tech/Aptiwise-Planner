"use client";

import { useState } from "react";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

export function Disclosure({
  label,
  locale,
  children,
}: {
  label?: string;
  locale: Locale;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold text-brand-700 hover:text-brand-600"
      >
        {open ? t("common.hide", locale) : label ?? t("common.why", locale)}
      </button>
      {open && (
        <p className="mt-2 text-xs leading-relaxed text-ink-500">{children}</p>
      )}
    </div>
  );
}
