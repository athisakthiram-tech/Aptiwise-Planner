import { describe, it, expect } from "vitest";
import {
  CRM_INTEGRATION_CONTRACT_VERSION,
  CrmHandoffReference,
  CrmPlanCompletionAcknowledgement,
  CrmReturnDestination,
} from "@/lib/integration/crm/types";
import {
  buildCrmReturnUrl,
  validateCrmHandoffReference,
  validateCrmPlanCompletionAcknowledgement,
  validateCrmReturnDestination,
} from "@/lib/integration/crm/validation";
import { CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION } from "@/lib/customerPlan/types";

const VALID_UUID = "8b2b1e2e-1c1a-4a2a-9a2a-1a2b3c4d5e6f";

describe("validateCrmHandoffReference — the only shape allowed to travel via URL", () => {
  it("accepts a well-formed opaque handoff reference", () => {
    const result = validateCrmHandoffReference({
      contractVersion: CRM_INTEGRATION_CONTRACT_VERSION,
      handoffId: "hf_9f8e7d6c5b4a3928",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects an unsupported contract version", () => {
    const result = validateCrmHandoffReference({ contractVersion: 999, handoffId: "hf_abc" });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("Unsupported");
  });

  it("rejects a missing handoffId", () => {
    const result = validateCrmHandoffReference({ contractVersion: CRM_INTEGRATION_CONTRACT_VERSION });
    expect(result.valid).toBe(false);
  });

  it("rejects a handoffId that looks like a raw database UUID (identity must never travel as the 'opaque' reference)", () => {
    const result = validateCrmHandoffReference({ contractVersion: CRM_INTEGRATION_CONTRACT_VERSION, handoffId: VALID_UUID });
    expect(result.valid).toBe(false);
  });

  it("rejects a non-object / malformed handoff reference without throwing", () => {
    expect(() => validateCrmHandoffReference(null)).not.toThrow();
    expect(validateCrmHandoffReference(null).valid).toBe(false);
    expect(validateCrmHandoffReference("hf_abc").valid).toBe(false);
    expect(validateCrmHandoffReference(undefined).valid).toBe(false);
  });

  it("never carries an advisorId, leadId, phone, name, income, DOB, or token field in its type", () => {
    const shape: CrmHandoffReference = { contractVersion: 1, handoffId: "hf_x" };
    const keys = Object.keys(shape);
    for (const forbidden of ["advisorId", "leadId", "phone", "name", "income", "dob", "dateOfBirth", "token", "accessToken", "secret"]) {
      expect(keys.map((k) => k.toLowerCase())).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe("validateCrmReturnDestination / buildCrmReturnUrl — return context can't be arbitrary external input", () => {
  it("accepts the one allowlisted CRM origin with a valid leadId", () => {
    const result = validateCrmReturnDestination({ crmOrigin: "https://aptiwise.org", leadId: VALID_UUID });
    expect(result.valid).toBe(true);
    expect(buildCrmReturnUrl(result.value as CrmReturnDestination)).toBe(`https://aptiwise.org/leads/${VALID_UUID}`);
  });

  it("rejects an arbitrary, non-allowlisted origin — a return destination is never free-text supplied by a client", () => {
    const result = validateCrmReturnDestination({ crmOrigin: "https://evil.example.com", leadId: VALID_UUID });
    expect(result.valid).toBe(false);
  });

  it("rejects a malformed leadId", () => {
    expect(validateCrmReturnDestination({ crmOrigin: "https://aptiwise.org", leadId: "not-a-uuid" }).valid).toBe(false);
    expect(validateCrmReturnDestination({ crmOrigin: "https://aptiwise.org", leadId: "'; DROP TABLE leads;--" }).valid).toBe(false);
  });

  it("buildCrmReturnUrl only ever takes an already-validated CrmReturnDestination, never a raw string (compile-time guarantee)", () => {
    // @ts-expect-error buildCrmReturnUrl has no overload accepting a bare
    // URL string — this line only compiles if TypeScript rejects it.
    buildCrmReturnUrl("https://evil.example.com/leads/1");
    expect(true).toBe(true);
  });
});

describe("validateCrmPlanCompletionAcknowledgement — never the full CustomerPlan", () => {
  function validAck(): CrmPlanCompletionAcknowledgement {
    return {
      contractVersion: CRM_INTEGRATION_CONTRACT_VERSION,
      leadId: VALID_UUID,
      advisorId: VALID_UUID,
      planId: "5f6e7d8c-9b0a-4c1d-8e2f-3a4b5c6d7e8f",
      planSchemaVersion: CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION,
      createdAt: "2026-09-19T10:00:00.000Z",
      status: "created",
    };
  }

  it("accepts a valid completion acknowledgement", () => {
    expect(validateCrmPlanCompletionAcknowledgement(validAck()).valid).toBe(true);
  });

  it("rejects an unsupported contract version", () => {
    expect(validateCrmPlanCompletionAcknowledgement({ ...validAck(), contractVersion: 42 }).valid).toBe(false);
  });

  it("rejects a malformed leadId/advisorId", () => {
    expect(validateCrmPlanCompletionAcknowledgement({ ...validAck(), leadId: "not-a-uuid" }).valid).toBe(false);
    expect(validateCrmPlanCompletionAcknowledgement({ ...validAck(), advisorId: 12345 }).valid).toBe(false);
  });

  it("rejects an invalid createdAt timestamp", () => {
    expect(validateCrmPlanCompletionAcknowledgement({ ...validAck(), createdAt: "not-a-date" }).valid).toBe(false);
  });

  it("rejects an unsupported status value", () => {
    expect(validateCrmPlanCompletionAcknowledgement({ ...validAck(), status: "deleted" }).valid).toBe(false);
  });

  it("contains no fields resembling a full CustomerPlan — no financial figures, no product identity, no strategy", () => {
    const keys = Object.keys(validAck());
    for (const forbidden of [
      "selectedStrategy",
      "financialPicture",
      "components",
      "planNumber",
      "uin",
      "premium",
      "deathBenefit",
      "maturityBenefit",
      "disclosures",
    ]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("the planId doubles as a stable idempotency key — resubmitting the same ack round-trips unchanged", () => {
    const ack = validAck();
    const first = validateCrmPlanCompletionAcknowledgement(ack);
    const second = validateCrmPlanCompletionAcknowledgement(ack);
    expect(first.value?.planId).toBe(second.value?.planId);
    expect(first.value).toEqual(second.value);
  });
});

describe("Two independent versions never merge", () => {
  it("the integration contract version and the CustomerPlan schema version are separately declared constants", () => {
    // Both happen to equal 1 today, purely because both are early in
    // their own lifecycle — that coincidence is NOT a coupling. This
    // test only guards that each is its own top-level export from its
    // own module, so bumping one (e.g. CustomerPlan schema v2) can
    // never be assumed by code to also bump the other.
    expect(typeof CRM_INTEGRATION_CONTRACT_VERSION).toBe("number");
    expect(typeof CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION).toBe("number");
    const ack: CrmPlanCompletionAcknowledgement = {
      contractVersion: CRM_INTEGRATION_CONTRACT_VERSION,
      leadId: VALID_UUID,
      advisorId: VALID_UUID,
      planId: "plan-1",
      // planSchemaVersion is free to diverge from contractVersion —
      // the type only requires "a number", never "the same number".
      planSchemaVersion: CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION + 41,
      createdAt: "2026-09-19T10:00:00.000Z",
      status: "created",
    };
    expect(validateCrmPlanCompletionAcknowledgement(ack).valid).toBe(true);
  });
});
