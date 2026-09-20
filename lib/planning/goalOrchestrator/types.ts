// Goal Orchestrator's own output shapes. Deliberately built AROUND the
// existing StrategyResult/StrategyComponent shapes (lib/planning/
// strategyTypes.ts) rather than replacing them — a GoalStructure's
// `strategyResult` is exactly what createCustomerPlan() already knows
// how to freeze, so "GoalStructure -> CustomerPlan -> Proposal -> PDF ->
// WhatsApp -> local draft" reuses the entire existing pipeline unchanged
// (Section 23) instead of inventing a second proposal architecture.

import { CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { ProtectionNeedResult } from "@/lib/planning/protectionNeeds";
import { GoalNeedResult } from "@/lib/planning/goalNeeds";
import { StrategyResult } from "@/lib/planning/strategyTypes";
import { ProductRole } from "@/lib/planning/goalOrchestrator/productRoles";
import { CashFlowPhase } from "@/lib/planning/goalOrchestrator/cashFlowTimeline";

export type { ProductRole, CashFlowPhase };

// GOAL vs FUNDING PERSON vs BENEFICIARY (Section 2) — deliberately plain
// display strings, never fed into any calculation. Product eligibility
// still keys off CustomerFinancialProfile.age (the funding/life-assured
// person's own age, exactly as every registered engine already expects)
// — these labels exist only so the UI can say "Father" / "Child"
// instead of silently assuming the goal's beneficiary IS the person
// whose eligibility/premium was calculated.
export interface FundingContext {
  fundingPersonLabel: string | null;
  beneficiaryLabel: string | null;
}

export const UNKNOWN_FUNDING_CONTEXT: FundingContext = {
  fundingPersonLabel: null,
  beneficiaryLabel: null,
};

// Machine-readable, localizable-later reason codes specific to the
// orchestrator's OWN decisions (single- vs multi-component, post-PPT
// reuse, market-linked alternative) — kept separate from the existing
// StrategyReasonCode vocabulary (still used, unchanged, at the
// component level) rather than extending that already-widely-consumed
// union.
export type GoalOrchestratorReasonCode =
  | "SINGLE_COMPONENT_SUFFICIENT"
  | "SECOND_COMPONENT_USES_POST_PPT_CAPACITY"
  | "SECOND_COMPONENT_USES_REMAINING_CAPACITY"
  | "MARKET_LINKED_ALTERNATIVE_STRUCTURE"
  | "PRIMARY_PREMIUM_REQUIRES_VERIFICATION";

export interface GoalStructure {
  id: string;
  // The exact shape the rest of the app (StrategyDetails-equivalent
  // rendering, createCustomerPlan) already consumes — see this file's
  // header comment.
  strategyResult: StrategyResult;
  // Parallel to strategyResult.components — role classification is an
  // orchestrator-level concept, not stored on StrategyComponent itself.
  componentRoles: ProductRole[];
  funding: FundingContext;
  timeline: CashFlowPhase[];
  reasonCodes: GoalOrchestratorReasonCode[];
}

export interface GoalOrchestratorInput {
  profile: CustomerFinancialProfile;
  protectionNeed: ProtectionNeedResult;
  goalNeed: GoalNeedResult;
  funding?: FundingContext;
  illustrativeRatesPct?: readonly number[];
}
