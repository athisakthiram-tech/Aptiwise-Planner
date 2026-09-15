"use client";

import { useState } from "react";

export function Disclosure({
  label = "Why? 🤔",
  children,
}: {
  label?: string;
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
        {open ? "Hide" : label}
      </button>
      {open && (
        <p className="mt-2 text-xs leading-relaxed text-ink-500">{children}</p>
      )}
    </div>
  );
}
