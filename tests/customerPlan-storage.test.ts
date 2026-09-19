import { describe, it, expect, beforeEach } from "vitest";
import { UNKNOWN_CUSTOMER_PROFILE, CustomerFinancialProfile } from "@/lib/planning/customerProfile";
import { calculateProtectionNeed } from "@/lib/planning/protectionNeeds";
import { calculateGoalNeed } from "@/lib/planning/goalNeeds";
import { generateStrategies } from "@/lib/planning/strategyGenerator";
import { createCustomerPlan } from "@/lib/customerPlan/createCustomerPlan";
import { createCustomerPlanStorage, KeyValueStorage } from "@/lib/customerPlan/customerPlanStorage";
import { CustomerPlan } from "@/lib/customerPlan/types";

// A minimal in-memory KeyValueStorage fake — this project's tests run
// under a plain Node environment with no real `window.localStorage`.
function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
}

function profile(overrides: Partial<CustomerFinancialProfile> = {}): CustomerFinancialProfile {
  return { ...UNKNOWN_CUSTOMER_PROFILE, ...overrides };
}

function buildPlan(overrides: { name?: string | null } = {}): CustomerPlan {
  const p = profile({
    age: 30,
    monthlyBudget: 15000,
    yearsToGoal: 20,
    goalType: "child_education",
    targetGoalAmount: 3000000,
    existingInvestments: 400000,
    outstandingLiabilities: 1000000,
    existingLifeCover: 0,
    riskComfort: "medium",
  });
  const protectionNeed = calculateProtectionNeed({ profile: p });
  const goalNeed = calculateGoalNeed({ targetGoal: p.targetGoalAmount, currentResources: p.existingInvestments });
  const strategies = generateStrategies({ profile: p, protectionNeed, goalNeed });
  const strategy = strategies.find(
    (s) => s.family === "protection_investment" && s.components[0].product?.planNumber === "894"
  )!;
  return createCustomerPlan({
    customerProfile: p,
    protectionNeed,
    goalNeed,
    selectedStrategy: strategy,
    locale: "en",
    customer: { name: overrides.name },
  });
}

describe("customerPlanStorage — save/load/list/delete", () => {
  let backend: KeyValueStorage;

  beforeEach(() => {
    backend = createMemoryStorage();
  });

  it("saves and loads a plan byte-for-byte", () => {
    const storage = createCustomerPlanStorage(backend);
    const plan = buildPlan({ name: "Test Customer" });
    expect(storage.saveDraft(plan)).toBe(true);
    const loaded = storage.loadDraft(plan.id);
    expect(loaded).toEqual(plan);
  });

  it("lists saved drafts as lightweight summaries", () => {
    const storage = createCustomerPlanStorage(backend);
    const planA = buildPlan({ name: "Customer A" });
    const planB = buildPlan({ name: "Customer B" });
    storage.saveDraft(planA);
    storage.saveDraft(planB);
    const drafts = storage.listDrafts();
    expect(drafts.map((d) => d.id).sort()).toEqual([planA.id, planB.id].sort());
    expect(drafts.find((d) => d.id === planA.id)?.customerName).toBe("Customer A");
  });

  it("deletes a draft and removes it from the list", () => {
    const storage = createCustomerPlanStorage(backend);
    const plan = buildPlan();
    storage.saveDraft(plan);
    expect(storage.deleteDraft(plan.id)).toBe(true);
    expect(storage.loadDraft(plan.id)).toBeNull();
    expect(storage.listDrafts()).toEqual([]);
  });

  it("updates only proposal metadata, leaving calculated fields untouched", () => {
    const storage = createCustomerPlanStorage(backend);
    const plan = buildPlan({ name: "Original Name" });
    storage.saveDraft(plan);
    const updated = storage.updateDraftMetadata(plan.id, { name: "Updated Name", phone: "9999999999" });
    expect(updated).not.toBeNull();
    expect(updated!.customer.name).toBe("Updated Name");
    expect(updated!.customer.phone).toBe("9999999999");
    expect(updated!.selectedStrategy).toEqual(plan.selectedStrategy);
    expect(updated!.financialPicture).toEqual(plan.financialPicture);
    // createdAt is immutable; updatedAt is a fresh timestamp (not
    // asserted to differ down to the millisecond, to avoid clock-tick
    // flakiness — the meaningful invariant is that createdAt never moves).
    expect(updated!.createdAt).toBe(plan.createdAt);
    expect(Date.parse(updated!.updatedAt)).toBeGreaterThanOrEqual(Date.parse(plan.updatedAt));
  });
});

describe("customerPlanStorage — resilience", () => {
  it("returns null for malformed JSON without throwing", () => {
    const backend = createMemoryStorage();
    backend.setItem("aptiwise.customerPlan.v1.index", JSON.stringify(["broken-id"]));
    backend.setItem("aptiwise.customerPlan.v1.plan.broken-id", "{ this is not valid JSON");
    const storage = createCustomerPlanStorage(backend);
    expect(() => storage.loadDraft("broken-id")).not.toThrow();
    expect(storage.loadDraft("broken-id")).toBeNull();
  });

  it("returns null for an unsupported schema version without throwing", () => {
    const backend = createMemoryStorage();
    const plan = buildPlan();
    backend.setItem("aptiwise.customerPlan.v1.index", JSON.stringify([plan.id]));
    backend.setItem("aptiwise.customerPlan.v1.plan." + plan.id, JSON.stringify({ ...plan, schemaVersion: 999 }));
    const storage = createCustomerPlanStorage(backend);
    expect(storage.loadDraft(plan.id)).toBeNull();
  });

  it("skips a corrupted draft in listDrafts without dropping the valid ones", () => {
    const backend = createMemoryStorage();
    const storage = createCustomerPlanStorage(backend);
    const good = buildPlan({ name: "Good Customer" });
    storage.saveDraft(good);
    // Manually inject a corrupted second entry into the index.
    backend.setItem("aptiwise.customerPlan.v1.index", JSON.stringify([good.id, "corrupted-id"]));
    backend.setItem("aptiwise.customerPlan.v1.plan.corrupted-id", "not json at all {{{");

    const drafts = storage.listDrafts();
    expect(drafts.length).toBe(1);
    expect(drafts[0].id).toBe(good.id);
  });

  it("never crashes the caller when storage is entirely unavailable", () => {
    const storage = createCustomerPlanStorage(null);
    expect(storage.isAvailable()).toBe(false);
    expect(() => storage.saveDraft(buildPlan())).not.toThrow();
    expect(storage.saveDraft(buildPlan())).toBe(false);
    expect(storage.loadDraft("anything")).toBeNull();
    expect(storage.listDrafts()).toEqual([]);
    expect(storage.deleteDraft("anything")).toBe(false);
    expect(storage.updateDraftMetadata("anything", { name: "x" })).toBeNull();
  });

  it("reports availability correctly for a working backend", () => {
    const storage = createCustomerPlanStorage(createMemoryStorage());
    expect(storage.isAvailable()).toBe(true);
  });
});
