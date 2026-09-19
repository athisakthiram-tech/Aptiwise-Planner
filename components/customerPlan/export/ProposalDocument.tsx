// Section 3/11 — the printable proposal itself: a plain, self-contained
// document built only from lib/customerPlan/export/proposalViewModel.ts.
// This component renders in TWO places: normally hidden inside the
// Planner (kept in the DOM so "Download PDF" can invoke window.print()
// without a page navigation), and it is also everything visible in the
// printed/PDF output — see app/globals.css's `.proposal-print-root`
// print rules, which hide everything else on the page.
//
// Rendered in plan.localeAtCreation, never the UI's current language
// (Section 17/18) — this component doesn't take a `locale` prop at all,
// so it can't accidentally be handed the wrong one.

import { CustomerPlan } from "@/lib/customerPlan/types";
import { buildProposalViewModel } from "@/lib/customerPlan/export/proposalViewModel";

function StatusLine({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="proposal-status">
      <span aria-hidden="true">{icon}</span> {label}
    </span>
  );
}

export function ProposalDocument({ plan }: { plan: CustomerPlan }) {
  const vm = buildProposalViewModel(plan);

  return (
    <div className="proposal-doc">
      {/* PAGE 1 — Simple summary */}
      <section className="proposal-page">
        <header className="proposal-header">
          <p className="proposal-brand">{vm.header.appName}</p>
          <h1>{vm.header.title}</h1>
        </header>

        <div className="proposal-meta">
          <div>
            <p className="proposal-label">{vm.header.customerLabel}</p>
            <p className="proposal-value-lg">{vm.header.customerName}</p>
          </div>
          <div>
            <p className="proposal-label">{vm.header.createdLabel}</p>
            <p className="proposal-value-lg">{vm.header.createdAtFormatted}</p>
          </div>
        </div>

        <section className="proposal-block proposal-avoid-break">
          <h2>{vm.goal.titleLabel}</h2>
          <p className="proposal-subtle">{vm.goal.goalTypeLabel}</p>
          <dl className="proposal-grid">
            <div>
              <dt>{vm.goal.targetLabel}</dt>
              <dd>{vm.goal.targetFormatted}</dd>
            </div>
            <div>
              <dt>{vm.goal.timeLabel}</dt>
              <dd>{vm.goal.timeFormatted}</dd>
            </div>
            <div>
              <dt>{vm.goal.currentResourcesLabel}</dt>
              <dd>{vm.goal.currentResourcesFormatted}</dd>
            </div>
            <div>
              <dt>{vm.goal.remainingGapLabel}</dt>
              <dd>
                {vm.goal.remainingGap.formattedValue} <StatusLine icon={vm.goal.remainingGap.statusIcon} label={vm.goal.remainingGap.statusLabel} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="proposal-block proposal-avoid-break">
          <h2>{vm.protection.titleLabel}</h2>
          <dl className="proposal-grid">
            <div>
              <dt>{vm.protection.requiredLabel}</dt>
              <dd>
                {vm.protection.required.formattedValue} <StatusLine icon={vm.protection.required.statusIcon} label={vm.protection.required.statusLabel} />
              </dd>
            </div>
            <div>
              <dt>{vm.protection.existingLabel}</dt>
              <dd>{vm.protection.existing.formattedValue}</dd>
            </div>
            <div>
              <dt>{vm.protection.providedLabel}</dt>
              <dd>
                {vm.protection.provided.formattedValue} <StatusLine icon={vm.protection.provided.statusIcon} label={vm.protection.provided.statusLabel} />
              </dd>
            </div>
            <div>
              <dt>{vm.protection.remainingGapLabel}</dt>
              <dd>
                {vm.protection.remainingGap.formattedValue}{" "}
                <StatusLine icon={vm.protection.remainingGap.statusIcon} label={vm.protection.remainingGap.statusLabel} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="proposal-block proposal-avoid-break">
          <h2>{vm.budget.titleLabel}</h2>
          <p className="proposal-value-lg">
            {vm.budget.availableLabel}: {vm.budget.availableFormatted}
          </p>
          <ul className="proposal-lines">
            {vm.budget.lines.map((line, i) => (
              <li key={i} className={line.tone === "warning" ? "proposal-warning" : "proposal-positive"}>
                {line.text}
              </li>
            ))}
          </ul>
        </section>
      </section>

      {/* PAGE 2 — selected structure */}
      <section className="proposal-page">
        <h2>{vm.structureTitleLabel}</h2>
        {vm.components.map((component, i) => (
          <article key={i} className="proposal-block proposal-avoid-break">
            {component.product ? (
              <>
                <h3>🛡 {component.product.productName}</h3>
                <p className="proposal-identity">
                  {component.product.planNumberLabel}: {component.product.planNumber}
                </p>
                <p className="proposal-identity">
                  {component.product.uinLabel}: {component.product.uin}
                </p>
                <p className="proposal-subtle">{component.product.categoryLabel}</p>
              </>
            ) : (
              <h3>📈 {component.investmentLabel}</h3>
            )}

            <dl className="proposal-grid">
              <div>
                <dt>{component.premiumLabel}</dt>
                <dd>
                  {component.premium.formattedValue} <StatusLine icon={component.premium.statusIcon} label={component.premium.statusLabel} />
                </dd>
              </div>
              <div>
                <dt>{component.deathBenefitLabel}</dt>
                <dd>
                  {component.deathBenefit.formattedValue}{" "}
                  <StatusLine icon={component.deathBenefit.statusIcon} label={component.deathBenefit.statusLabel} />
                </dd>
              </div>
              <div>
                <dt>{component.maturityBenefitLabel}</dt>
                <dd>
                  {component.maturityBenefit.formattedValue}{" "}
                  <StatusLine icon={component.maturityBenefit.statusIcon} label={component.maturityBenefit.statusLabel} />
                </dd>
              </div>
            </dl>

            {component.investmentIllustration && (
              <div className="proposal-illustration">
                <p className="proposal-subtle">📈 {component.investmentIllustration.titleLabel}</p>
                <p>
                  {component.investmentIllustration.contributionFormatted}
                  {component.investmentIllustration.perMonthSuffix} · {component.investmentIllustration.durationFormatted} ·{" "}
                  {component.investmentIllustration.rateFormatted}
                </p>
                <p className="proposal-value-lg">{component.investmentIllustration.projectedValueFormatted}</p>
                <p className="proposal-disclaimer">{component.investmentIllustration.disclaimer}</p>
              </div>
            )}
          </article>
        ))}

        <div className="proposal-dimensions">
          {vm.dimensions.map((dim, i) => (
            <div key={i} className="proposal-dimension-row">
              <span aria-hidden="true">{dim.icon}</span>
              <span className="proposal-dimension-label">{dim.label}</span>
              <span className="proposal-dimension-value">{dim.formattedValue}</span>
              <StatusLine icon={dim.statusIcon} label={dim.statusLabel} />
            </div>
          ))}
        </div>
      </section>

      {/* PAGE 3 — reasons + important information */}
      <section className="proposal-page">
        {vm.reasons.length > 0 && (
          <section className="proposal-block">
            <h2>{vm.reasonsTitleLabel}</h2>
            <ul className="proposal-lines">
              {vm.reasons.map((reason, i) => (
                <li key={i}>• {reason}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="proposal-block">
          <h2>{vm.disclosuresTitleLabel}</h2>
          {vm.disclosures.length > 0 && (
            <ul className="proposal-lines">
              {vm.disclosures.map((disclosure, i) => (
                <li key={i}>• {disclosure}</li>
              ))}
            </ul>
          )}
          <p className="proposal-subtle">{vm.snapshotNote}</p>
          <p className="proposal-subtle">{vm.header.createdLabel}: {vm.header.createdAtFormatted}</p>
        </section>
      </section>
    </div>
  );
}
