// Version boundary for CustomerPlan's on-disk (localStorage) shape.
// There is only one schema version today, so there is nothing to migrate
// FROM yet — this module exists so a future schema change has a single,
// obvious place to add a migration step rather than scattering
// version-sniffing logic across customerPlanStorage.ts.
//
// Deliberately NOT over-engineered: no migration framework, no chained
// transformer registry — just the version check plus a documented slot
// for the next migration function when schema version 2 exists.

import { CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION, CustomerPlan } from "@/lib/customerPlan/types";
import { validateCustomerPlan } from "@/lib/customerPlan/customerPlanValidation";

export type MigrationOutcome =
  | { status: "current"; plan: CustomerPlan }
  | { status: "unsupported_version"; version: unknown }
  | { status: "invalid"; errors: string[] };

// When schema version 2 is introduced, add a branch here that upgrades a
// v1 plan into the v2 shape (never mutating the caller's object) before
// falling through to validation — e.g.:
//
//   if (raw.schemaVersion === 1) {
//     const upgraded = upgradeV1ToV2(raw);
//     return finish(upgraded);
//   }
export function migrateCustomerPlan(candidate: unknown): MigrationOutcome {
  if (candidate == null || typeof candidate !== "object") {
    return { status: "invalid", errors: ["Plan is not an object."] };
  }

  const version = (candidate as { schemaVersion?: unknown }).schemaVersion;
  if (version !== CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION) {
    return { status: "unsupported_version", version };
  }

  const validation = validateCustomerPlan(candidate);
  if (!validation.valid) {
    return { status: "invalid", errors: validation.errors };
  }

  return { status: "current", plan: candidate as CustomerPlan };
}
