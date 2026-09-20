// Planner-side prefill model — DESIGN ONLY, pure functions. See
// docs/crm-integration-contract.md sections 2, 3 and 7 for the field-by-
// field mapping rationale (why address/policyNotes are excluded, why
// age is always derived from DOB rather than trusted as sent, etc).

import { CustomerFinancialProfile, UNKNOWN_CUSTOMER_PROFILE } from "@/lib/planning/customerProfile";

// ---- What Planner actually wants from a CRM customer (lead) record ----
//
// Deliberately NOT every field the CRM has. `address` and `policyNotes`
// are excluded entirely (see the contract doc's data-minimization
// table) — they are never sent by a future CRM integration and so have
// no place here at all, not even as an optional/unused field.
export interface PlannerPrefill {
  customerName?: string | null;
  phone?: string | null;
  // ISO-8601 calendar date ("YYYY-MM-DD"), never a full timestamp — a
  // birth date has no meaningful time-of-day component.
  dateOfBirth?: string | null;
  occupation?: string | null;
  familySize?: number | null;
  monthlyIncome?: number | null;
}

// The raw, UNTRUSTED shape a future exchange response might send before
// validation.ts has checked it. Every field is `unknown` on purpose —
// this module never assumes external JSON matches PlannerPrefill just
// because a TypeScript type says so (see validation.ts).
export interface RawCrmPrefillPayload {
  name?: unknown;
  phone?: unknown;
  dateOfBirth?: unknown;
  occupation?: unknown;
  familySize?: unknown;
  monthlyIncome?: unknown;
}

// ---- DOB -> age ---------------------------------------------------------
//
// Never trusts an "age" field sent by the CRM even if one existed —
// Planner always derives age itself from dateOfBirth, at an EXPLICIT
// planning date supplied by the caller (never an implicit `new Date()`
// inside this pure function, so the result is deterministic and
// testable). Handles the birthday boundary: someone born 2000-09-20 is
// still 24 on 2026-09-19 and turns 25 on 2026-09-20.
//
// Returns null (never a fabricated/rounded guess) for an unparsable
// date, a date in the future relative to `asOfIso`, or an implausible
// age (>119) that more likely indicates a data-entry error than a real
// birth date.
export function deriveAgeFromDateOfBirth(dateOfBirthIso: string, asOfIso: string): number | null {
  const dob = parseIsoDateOnly(dateOfBirthIso);
  const asOf = parseIsoDateOnly(asOfIso);
  if (!dob || !asOf) return null;
  if (dob.getTime() > asOf.getTime()) return null;

  let age = asOf.getUTCFullYear() - dob.getUTCFullYear();
  const hasHadBirthdayThisYear =
    asOf.getUTCMonth() > dob.getUTCMonth() ||
    (asOf.getUTCMonth() === dob.getUTCMonth() && asOf.getUTCDate() >= dob.getUTCDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  if (age < 0 || age > 119) return null;
  return age;
}

function parseIsoDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ---- Prefill -> planning profile seed -----------------------------------
//
// Produces a PARTIAL CustomerFinancialProfile seed — never a complete
// profile, and never anything the CRM doesn't actually provide. Every
// field CRM doesn't structure today (goal, existing coverage,
// liabilities, investments, planning budget, risk preference) is
// deliberately left untouched here — see the contract doc's "FIELDS
// PLANNER MUST COLLECT" section. Merging this seed with
// UNKNOWN_CUSTOMER_PROFILE (never a fabricated default) is the caller's
// job, exactly like buildProfileFromGoalInput already does for the
// standalone wizard.
export function mapPrefillToProfileSeed(
  prefill: PlannerPrefill,
  asOfIso: string
): Partial<CustomerFinancialProfile> {
  const seed: Partial<CustomerFinancialProfile> = {};

  if (prefill.dateOfBirth) {
    const age = deriveAgeFromDateOfBirth(prefill.dateOfBirth, asOfIso);
    // A DOB that fails to derive a plausible age stays unknown — never
    // falls back to 0 or to a value the CRM never actually sent.
    if (age != null) seed.age = age;
  }

  // "Family size" (CRM) and "numberOfDependants" (Planner) are NOT the
  // same concept without confirmation — family size commonly includes
  // the customer (and sometimes a spouse), while numberOfDependants
  // means people financially dependent on the customer excluding
  // themselves. This mapping is intentionally NOT performed
  // automatically here; see the contract doc's CRM -> PLANNER MAPPING
  // table (REQUIRES_USER_CONFIRMATION) and Step 3's UI, which is where
  // an advisor confirming this value belongs.
  if (prefill.monthlyIncome != null) {
    seed.annualIncome = prefill.monthlyIncome * 12;
  }

  return seed;
}

// Re-exported so callers don't need a second import just to spread a
// safe "nothing known yet" baseline alongside a prefill seed.
export { UNKNOWN_CUSTOMER_PROFILE };
