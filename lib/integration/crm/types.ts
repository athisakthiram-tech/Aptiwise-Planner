// Aptiwise CRM <-> Aptiwise Planner integration contract — PLANNER SIDE,
// DESIGN ONLY. Nothing in lib/integration/crm/** performs a fetch, opens
// a Supabase client, reads a cookie, or calls any network API. Every
// type/function here is pure and exists so the shape of the future
// handoff/prefill/completion payloads can be agreed with the CRM team
// (Codex) and unit-tested before either side builds real transport.
//
// See docs/crm-integration-contract.md for the full design rationale,
// security model, and open questions. This file intentionally documents
// only what is described there — it does not invent CRM schema details
// beyond the verified contract facts supplied for this task.

// ---- Contract version -------------------------------------------------
//
// Deliberately independent of CustomerPlan.schemaVersion
// (lib/customerPlan/types.ts). The integration contract (what shape a
// handoff/prefill/completion payload has) and the CustomerPlan snapshot
// schema (what a saved proposal looks like) solve different problems
// and must be able to change on independent timelines — see the "TWO
// INDEPENDENT VERSIONS" section of the contract doc.
export const CRM_INTEGRATION_CONTRACT_VERSION = 1 as const;

export type CrmIntegrationContractVersion = typeof CRM_INTEGRATION_CONTRACT_VERSION;

// The single source of truth for "is this a contract version Planner
// still understands" — validation.ts checks against this, never a
// hardcoded literal duplicated elsewhere.
export const SUPPORTED_CRM_CONTRACT_VERSIONS: readonly number[] = [CRM_INTEGRATION_CONTRACT_VERSION];

// ---- Untrusted handoff reference (may appear in a URL) -----------------
//
// This is the ONLY CRM-integration shape that may ever appear in a
// browser URL/query string. It carries NO identity of its own — no
// advisorId, no leadId, no name, no phone, no token. `handoffId` is an
// opaque, short-lived, single-use reference that only means something
// once Planner's future server exchanges it with the CRM's future
// server. A client component must never treat this as a verified
// identity — see VerifiedCrmContext below for what that requires.
export interface CrmHandoffReference {
  contractVersion: number;
  // Opaque — a random single-use token/reference id, not a database
  // primary key, not a JWT, not derived from advisorId/leadId in any
  // guessable way. Never phone, name, DOB, or income.
  handoffId: string;
}

// ---- Verified CRM context (only exists after future server exchange) --
//
// A VerifiedCrmContext must NEVER be constructed from browser input.
// It only exists after a future Planner server route exchanges a
// CrmHandoffReference with the CRM's server, and the CRM has
// independently revalidated:
//   - the advisor's own Supabase session is still valid,
//   - `leads.advisor_id = auth.users.id` for the lead the handoff names,
//   - the handoff has not expired,
//   - the handoff has not already been consumed.
// See docs/crm-integration-contract.md's "HANDOFF SECURITY MODEL".
export interface VerifiedCrmContext {
  contractVersion: number;
  // = auth.users.id, per the verified CRM contract facts. Trusted only
  // because a future server-to-server exchange vouches for it — never
  // because a client sent it.
  advisorId: string;
  // = leads.id, per the verified CRM contract facts. Ownership
  // (leads.advisor_id = advisorId) has already been checked by the CRM
  // before this context exists.
  leadId: string;
  // When the CRM originally issued the handoff (ISO-8601) — lets
  // Planner apply its own additional staleness check independent of the
  // CRM's own expiry enforcement.
  issuedAt: string;
  // When Planner's server completed the exchange/verification
  // (ISO-8601).
  verifiedAt: string;
  // Where "← Return to Customer" should navigate — never built from
  // client-supplied input (see CrmReturnDestination below).
  returnDestination: CrmReturnDestination;
}

// ---- Safe return-to-CRM destination ------------------------------------
//
// Deliberately NOT a raw URL string. `crmOrigin` is a literal drawn from
// a small, hardcoded allowlist (today, exactly one value) — never
// accepted as free text from a client, a query parameter, or the CRM
// payload itself, so a compromised/misbehaving handoff response can
// never redirect an advisor to an attacker-controlled origin. See
// validation.ts's buildCrmReturnUrl, the only place this is turned into
// a string, and only from a value that has already passed this type.
export type CrmOrigin = "https://aptiwise.org";

export const ALLOWED_CRM_ORIGINS: readonly CrmOrigin[] = ["https://aptiwise.org"];

export interface CrmReturnDestination {
  crmOrigin: CrmOrigin;
  // Same leadId as the enclosing VerifiedCrmContext — repeated here so
  // CrmReturnDestination is meaningful on its own wherever it travels
  // (e.g. serialized into CustomerPlan's optional source metadata).
  leadId: string;
}

// ---- Planner completion acknowledgement (Planner -> CRM) ---------------
//
// Sent AFTER a CustomerPlan has been created (and, in a future stage,
// persisted). Deliberately NOT the CustomerPlan itself — see
// docs/crm-integration-contract.md's "PLAN SNAPSHOT vs COMPLETION
// ACKNOWLEDGEMENT" distinction. The CRM never needs to understand LIC
// engine internals, product identity, or financial figures merely to
// know a proposal now exists for this lead.
export interface CrmPlanCompletionAcknowledgement {
  contractVersion: number;
  leadId: string;
  advisorId: string;
  // = CustomerPlan.id (lib/customerPlan/types.ts) — also doubles as the
  // idempotency key: resending the same planId must be a safe no-op on
  // the CRM's side, never a duplicate.
  planId: string;
  // = CustomerPlan.schemaVersion at creation time — lets the CRM store
  // "which CustomerPlan shape was this" without parsing the plan.
  planSchemaVersion: number;
  // = CustomerPlan.createdAt (ISO-8601).
  createdAt: string;
  status: "created";
}
