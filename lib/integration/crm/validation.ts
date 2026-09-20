// Runtime validation for every externally-sourced integration shape —
// DESIGN ONLY, pure functions, no fetch/Supabase/cookies. Nothing here
// is wired to a real transport yet; these are the checks a future
// Planner server route would run on whatever the CRM (or a URL query
// string) actually sends, because "TypeScript says the JSON matches the
// interface" is never proof that untrusted external data is safe.
//
// Every validator REPORTS problems — none of them repair, coerce, or
// invent a value to make invalid data pass, mirroring
// lib/customerPlan/customerPlanValidation.ts's existing convention.

import {
  ALLOWED_CRM_ORIGINS,
  CrmHandoffReference,
  CrmOrigin,
  CrmPlanCompletionAcknowledgement,
  CrmReturnDestination,
  SUPPORTED_CRM_CONTRACT_VERSIONS,
} from "@/lib/integration/crm/types";
import { PlannerPrefill, RawCrmPrefillPayload } from "@/lib/integration/crm/prefill";

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  value: T | null;
}

function ok<T>(value: T): ValidationResult<T> {
  return { valid: true, errors: [], value };
}

function fail<T>(errors: string[]): ValidationResult<T> {
  return { valid: false, errors, value: null };
}

// Supabase Auth user ids and typical Supabase table primary keys are
// UUIDs by convention — the verified CRM contract facts confirm
// `auth.users.id` is the canonical advisor identity and `leads.id` the
// canonical customer identity, but do NOT explicitly restate "and both
// are UUID-formatted". This check assumes the standard Supabase
// convention; see docs/crm-integration-contract.md's open questions —
// if the CRM ever uses a non-UUID key, this regex (and only this
// regex) needs to change.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function isSupportedContractVersion(value: unknown): value is number {
  return typeof value === "number" && SUPPORTED_CRM_CONTRACT_VERSIONS.includes(value);
}

// ---- Handoff reference (untrusted, possibly URL-carried) ---------------

const MAX_HANDOFF_ID_LENGTH = 256;

export function validateCrmHandoffReference(raw: unknown): ValidationResult<CrmHandoffReference> {
  if (raw == null || typeof raw !== "object") return fail(["Handoff reference is not an object."]);
  const candidate = raw as Record<string, unknown>;
  const errors: string[] = [];

  if (!isSupportedContractVersion(candidate.contractVersion)) {
    errors.push(`Unsupported or missing contractVersion: ${String(candidate.contractVersion)}.`);
  }
  if (!isNonEmptyString(candidate.handoffId, MAX_HANDOFF_ID_LENGTH)) {
    errors.push("Missing, empty, or oversized handoffId.");
  }
  // Defense in depth: an opaque handoffId should never itself look like
  // a Supabase UUID primary key — if it does, something upstream is
  // leaking an internal identifier where an opaque token belongs.
  if (typeof candidate.handoffId === "string" && isUuid(candidate.handoffId)) {
    errors.push("handoffId must be an opaque single-use reference, not a raw database identifier.");
  }

  if (errors.length > 0) return fail(errors);
  return ok({ contractVersion: candidate.contractVersion as number, handoffId: candidate.handoffId as string });
}

// ---- Prefill payload (untrusted) ----------------------------------------

const MAX_NAME_LENGTH = 200;
const MAX_PHONE_LENGTH = 32;
const MAX_OCCUPATION_LENGTH = 200;
const MAX_FAMILY_SIZE = 30;
const MAX_MONTHLY_INCOME = 1_000_000_000; // sanity ceiling only, not a business rule

function isValidIsoDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now();
}

export function validateCrmPrefillPayload(raw: unknown): ValidationResult<PlannerPrefill> {
  if (raw == null || typeof raw !== "object") return fail(["Prefill payload is not an object."]);
  const candidate = raw as RawCrmPrefillPayload;
  const errors: string[] = [];
  const prefill: PlannerPrefill = {};

  if (candidate.name !== undefined && candidate.name !== null) {
    if (!isNonEmptyString(candidate.name, MAX_NAME_LENGTH)) errors.push("name is empty or oversized.");
    else prefill.customerName = candidate.name;
  }

  if (candidate.phone !== undefined && candidate.phone !== null) {
    if (!isNonEmptyString(candidate.phone, MAX_PHONE_LENGTH)) errors.push("phone is empty or oversized.");
    else prefill.phone = candidate.phone;
  }

  if (candidate.dateOfBirth !== undefined && candidate.dateOfBirth !== null) {
    if (!isValidIsoDateOnly(candidate.dateOfBirth)) errors.push("dateOfBirth is not a valid past ISO calendar date.");
    else prefill.dateOfBirth = candidate.dateOfBirth;
  }

  if (candidate.occupation !== undefined && candidate.occupation !== null) {
    if (!isNonEmptyString(candidate.occupation, MAX_OCCUPATION_LENGTH)) errors.push("occupation is empty or oversized.");
    else prefill.occupation = candidate.occupation;
  }

  if (candidate.familySize !== undefined && candidate.familySize !== null) {
    const size = candidate.familySize;
    if (typeof size !== "number" || !Number.isFinite(size) || !Number.isInteger(size) || size < 1 || size > MAX_FAMILY_SIZE) {
      errors.push("familySize must be a finite integer between 1 and 30.");
    } else {
      prefill.familySize = size;
    }
  }

  if (candidate.monthlyIncome !== undefined && candidate.monthlyIncome !== null) {
    const income = candidate.monthlyIncome;
    if (typeof income !== "number" || !Number.isFinite(income) || income < 0 || income > MAX_MONTHLY_INCOME) {
      errors.push("monthlyIncome must be a finite, non-negative number within a sane range.");
    } else {
      prefill.monthlyIncome = income;
    }
  }

  if (errors.length > 0) return fail(errors);
  return ok(prefill);
}

// ---- Return destination --------------------------------------------------

export function validateCrmReturnDestination(raw: unknown): ValidationResult<CrmReturnDestination> {
  if (raw == null || typeof raw !== "object") return fail(["Return destination is not an object."]);
  const candidate = raw as Record<string, unknown>;
  const errors: string[] = [];

  const isAllowedOrigin = (value: unknown): value is CrmOrigin =>
    typeof value === "string" && (ALLOWED_CRM_ORIGINS as readonly string[]).includes(value);

  if (!isAllowedOrigin(candidate.crmOrigin)) {
    errors.push(`crmOrigin must be one of the allowlisted CRM origins, got: ${String(candidate.crmOrigin)}.`);
  }
  if (!isUuid(candidate.leadId)) {
    errors.push("leadId is missing or not a valid identifier.");
  }

  if (errors.length > 0) return fail(errors);
  return ok({ crmOrigin: candidate.crmOrigin as CrmOrigin, leadId: candidate.leadId as string });
}

// The ONLY place a CrmReturnDestination becomes a URL string — always
// built from an already-validated, allowlisted origin plus a verified
// leadId, never from a raw string handed in by a caller. There is no
// "buildCrmReturnUrl(url: string)" overload; that is deliberate.
export function buildCrmReturnUrl(destination: CrmReturnDestination): string {
  return `${destination.crmOrigin}/leads/${encodeURIComponent(destination.leadId)}`;
}

// ---- Completion acknowledgement (Planner -> CRM) -------------------------

export function validateCrmPlanCompletionAcknowledgement(
  raw: unknown
): ValidationResult<CrmPlanCompletionAcknowledgement> {
  if (raw == null || typeof raw !== "object") return fail(["Completion acknowledgement is not an object."]);
  const candidate = raw as Record<string, unknown>;
  const errors: string[] = [];

  if (!isSupportedContractVersion(candidate.contractVersion)) {
    errors.push(`Unsupported or missing contractVersion: ${String(candidate.contractVersion)}.`);
  }
  if (!isUuid(candidate.leadId)) errors.push("leadId is missing or not a valid identifier.");
  if (!isUuid(candidate.advisorId)) errors.push("advisorId is missing or not a valid identifier.");
  if (!isNonEmptyString(candidate.planId, 100)) errors.push("planId is missing, empty, or oversized.");
  if (typeof candidate.planSchemaVersion !== "number" || !Number.isFinite(candidate.planSchemaVersion)) {
    errors.push("planSchemaVersion must be a finite number.");
  }
  if (!isNonEmptyString(candidate.createdAt, 40) || Number.isNaN(Date.parse(candidate.createdAt as string))) {
    errors.push("createdAt is missing or not a valid ISO timestamp.");
  }
  if (candidate.status !== "created") {
    errors.push(`Unsupported status: ${String(candidate.status)}.`);
  }

  if (errors.length > 0) return fail(errors);
  return ok({
    contractVersion: candidate.contractVersion as number,
    leadId: candidate.leadId as string,
    advisorId: candidate.advisorId as string,
    planId: candidate.planId as string,
    planSchemaVersion: candidate.planSchemaVersion as number,
    createdAt: candidate.createdAt as string,
    status: "created",
  });
}
