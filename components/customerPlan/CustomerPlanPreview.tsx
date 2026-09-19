"use client";

// Stage C, Section 18/19: the mobile-first Plan Preview — Simple Summary
// → Structure → Protection/Goal/Budget → Details → Assumptions &
// Disclosures, as collapsible sections rather than one long legal wall.
// Never calls the selected structure "recommended"/"best"/"winner" — it
// is always "Selected structure" or "Customer plan".
//
// After creation, only customer.name/customer.phone may ever be
// edited here — every calculated field is rendered read-only from the
// frozen snapshot. To change a budget/goal/protection input, a strategy,
// or a product configuration, the advisor must return to the Planner and
// create a fresh plan from freshly recalculated results.

import { ReactNode, useState } from "react";
import { CustomerPlan } from "@/lib/customerPlan/types";
import { PlanFinancialPicture } from "@/components/customerPlan/PlanFinancialPicture";
import { PlanStructure } from "@/components/customerPlan/PlanStructure";
import { PlanReasons } from "@/components/customerPlan/PlanReasons";
import { PlanDisclosures } from "@/components/customerPlan/PlanDisclosures";
import { SaveDraftAction } from "@/components/customerPlan/SaveDraftAction";
import { ProposalActions } from "@/components/customerPlan/export/ProposalActions";
import { Card } from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";

function Section({
  titleKey,
  locale,
  defaultOpen = false,
  children,
}: {
  titleKey: string;
  locale: Locale;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-bold text-ink-900"
      >
        <span>{t(titleKey, locale)}</span>
        <span aria-hidden="true" className="text-ink-400">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && children}
    </div>
  );
}

function CustomerIdentityEditor({
  plan,
  locale,
  onSave,
  onCancel,
}: {
  plan: CustomerPlan;
  locale: Locale;
  onSave: (customer: { name: string | null; phone: string | null }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(plan.customer.name ?? "");
  const [phone, setPhone] = useState(plan.customer.phone ?? "");

  return (
    <div className="flex flex-col gap-2 rounded-xl2 bg-slate-50 p-3">
      <label className="flex flex-col gap-1 text-xs text-ink-500">
        {t("customerPlan.name", locale)}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-500">
        {t("customerPlan.phone", locale)}
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-900"
        />
      </label>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave({ name: name.trim() ? name.trim() : null, phone: phone.trim() ? phone.trim() : null })}
          className="flex-1 rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white"
        >
          {t("customerPlan.save", locale)}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 rounded-full bg-slate-200 px-3 py-2 text-xs font-semibold text-ink-900">
          {t("customerPlan.cancel", locale)}
        </button>
      </div>
    </div>
  );
}

export function CustomerPlanPreview({
  plan,
  locale,
  onBack,
  onPlanChange,
  onViewDrafts,
}: {
  plan: CustomerPlan;
  locale: Locale;
  onBack: () => void;
  onPlanChange: (updated: CustomerPlan) => void;
  onViewDrafts: () => void;
}) {
  const [editingCustomer, setEditingCustomer] = useState(false);

  const structureTitle = plan.selectedStrategy.components
    .map((c) => (c.product ? c.product.productName.replace(/^LIC's /, "") : t("results.strategy.investmentLabel", locale)))
    .join(" + ");

  return (
    <div className="flex flex-col gap-4 pb-16">
      <button type="button" onClick={onBack} className="self-start text-xs font-semibold text-brand-700">
        {t("customerPlan.backToStructure", locale)}
      </button>

      <Card className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink-500">{t("customerPlan.title", locale)}</p>
        <p className="text-xs text-ink-500">{t("customerPlan.selectedStructure", locale)}</p>
        <p className="text-base font-bold text-ink-900">{structureTitle}</p>

        <div className="mt-1 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-ink-500">{t("customerPlan.customer", locale)}</p>
            <p className="text-sm font-semibold text-ink-900">{plan.customer.name ?? t("customerPlan.unnamedCustomer", locale)}</p>
          </div>
          {!editingCustomer && (
            <button type="button" onClick={() => setEditingCustomer(true)} className="text-xs font-semibold text-brand-700">
              {t("customerPlan.editCustomer", locale)}
            </button>
          )}
        </div>
        {editingCustomer && (
          <CustomerIdentityEditor
            plan={plan}
            locale={locale}
            onCancel={() => setEditingCustomer(false)}
            onSave={(customer) => {
              onPlanChange({ ...plan, customer });
              setEditingCustomer(false);
            }}
          />
        )}
      </Card>

      <Section titleKey="customerPlan.planStructure" locale={locale} defaultOpen>
        <PlanStructure plan={plan} locale={locale} />
      </Section>

      <Section titleKey="results.goal.title" locale={locale} defaultOpen>
        <PlanFinancialPicture plan={plan} locale={locale} />
      </Section>

      <Section titleKey="customerPlan.details" locale={locale}>
        <Card className="flex flex-col gap-2.5">
          <PlanReasons plan={plan} locale={locale} />
        </Card>
      </Section>

      <Section titleKey="customerPlan.importantInformation" locale={locale}>
        <Card>
          <PlanDisclosures plan={plan} locale={locale} />
        </Card>
      </Section>

      <div className="flex flex-col gap-2 pt-2">
        <SaveDraftAction plan={plan} locale={locale} />
        <button type="button" onClick={onViewDrafts} className="text-center text-xs font-semibold text-brand-700">
          {t("customerPlan.viewDraftPlans", locale)}
        </button>
      </div>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-bold text-ink-900">{t("customerPlan.proposalSectionTitle", locale)}</p>
        <ProposalActions plan={plan} />
      </Card>
    </div>
  );
}
