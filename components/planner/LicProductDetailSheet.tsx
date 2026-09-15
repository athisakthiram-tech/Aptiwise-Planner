"use client";

import { InsuranceProduct } from "@/types/insurance";

const CATEGORY_PURPOSE: Record<InsuranceProduct["category"], string> = {
  term_protection: "Protection",
  savings_endowment: "Savings + protection",
  market_linked_ulip: "Market-linked investment + protection",
  money_back_child: "Periodic payouts / child-oriented savings",
};

export function LicProductDetailSheet({
  product,
  onClose,
}: {
  product: InsuranceProduct;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-ink-500">🛡️ {product.provider}</div>
            <div className="text-lg font-extrabold uppercase text-ink-900">
              {product.productName.replace(/^LIC's /, "")}
            </div>
            <div className="text-xs text-ink-500">Plan {product.planNumber}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-ink-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-ink-500">🎯 Purpose</p>
            <p className="text-ink-900">{CATEGORY_PURPOSE[product.category]}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">❤️ Protection</p>
            <p className="text-ink-900">Available according to policy terms</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">💰 Premium</p>
            <p className="text-ink-900">Not calculated yet</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">🎁 Maturity Benefit</p>
            <p className="text-ink-900">
              Requires official LIC calculation/illustration
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">🟢 Guaranteed Benefits</p>
            <p className="text-ink-900">Shown only once verified data is integrated</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">
              🟡 Non-Guaranteed Benefits
            </p>
            <p className="text-ink-900">Shown separately once verified data is integrated</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl2 bg-amber-50 ring-1 ring-amber-200 p-3.5 text-xs text-amber-800">
          ⚠️ Verify before sale — eligibility, premium, benefits, exclusions
          and policy conditions must be checked against current official LIC
          documents ({product.officialSourceUrl}).
        </div>
      </div>
    </div>
  );
}
