import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl2 bg-white shadow-sm ring-1 ring-slate-100 p-5 ${className}`}
    >
      {children}
    </div>
  );
}
