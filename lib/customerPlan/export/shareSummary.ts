// Section 14 — a concise, WhatsApp-friendly text summary built purely
// from lib/customerPlan/export/proposalViewModel.ts's already-formatted,
// already-localized fields. No engine call, no re-derivation of any
// number, and the same unknown-premium/illustration-disclaimer wording
// as the full proposal.

import { CustomerPlan } from "@/lib/customerPlan/types";
import { buildProposalViewModel } from "@/lib/customerPlan/export/proposalViewModel";
import { t } from "@/lib/i18n/translations";

export function buildWhatsAppSummary(plan: CustomerPlan): string {
  const locale = plan.localeAtCreation;
  const vm = buildProposalViewModel(plan);
  const lines: string[] = [];

  lines.push(`${vm.header.appName} ${vm.header.title}`, "");
  lines.push(`${vm.header.customerLabel}: ${vm.header.customerName}`);
  lines.push(`${vm.goal.titleLabel}: ${vm.goal.goalTypeLabel}`);
  if (vm.goal.timeFormatted !== t("results.goal.notProvided", locale)) {
    lines.push(`${vm.goal.targetLabel}: ${vm.goal.targetFormatted} (${vm.goal.timeFormatted})`);
  } else {
    lines.push(`${vm.goal.targetLabel}: ${vm.goal.targetFormatted}`);
  }
  lines.push("");

  lines.push(vm.protection.titleLabel);
  lines.push(`${vm.protection.requiredLabel}: ${vm.protection.required.formattedValue}`);
  lines.push(`${vm.protection.existingLabel}: ${vm.protection.existing.formattedValue}`);
  lines.push(`${vm.protection.remainingGapLabel}: ${vm.protection.remainingGap.formattedValue}`);
  lines.push("");

  lines.push(vm.structureTitleLabel);
  for (const component of vm.components) {
    if (component.product) {
      lines.push(component.product.productName);
      lines.push(`Plan ${component.product.planNumber} | UIN ${component.product.uin}`);
    } else if (component.investmentLabel) {
      lines.push(component.investmentLabel);
    }
  }
  lines.push("");

  lines.push(`${vm.budget.availableLabel}: ${vm.budget.availableFormatted}`);
  for (const line of vm.budget.lines) {
    lines.push(line.text);
  }

  const investmentComponent = vm.components.find((c) => c.investmentIllustration);
  if (investmentComponent?.investmentIllustration) {
    lines.push("", investmentComponent.investmentIllustration.disclaimer);
  }

  return lines.join("\n");
}
