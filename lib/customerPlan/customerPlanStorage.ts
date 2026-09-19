// Browser-local draft persistence for CustomerPlan — Section 12/13's
// "local device draft" storage, not a CRM and not cloud storage. Every
// component talks to drafts through this abstraction, never to
// `localStorage` directly, so:
//
//  - a corrupted or unsupported-schema draft can never crash the app —
//    it's simply skipped;
//  - one bad draft never takes down the rest of the list;
//  - storage being unavailable (SSR, private browsing, disabled storage)
//    degrades to "no drafts" instead of throwing.
//
// Nothing here ever repairs a corrupted plan's financial data — a
// corrupted entry is dropped from view, never silently "fixed".

import { CustomerPlan, CustomerPlanDraftSummary } from "@/lib/customerPlan/types";
import { migrateCustomerPlan } from "@/lib/customerPlan/customerPlanMigration";

// A minimal Web Storage-shaped interface — lets tests inject an
// in-memory fake instead of depending on a real `window.localStorage`
// (this project's tests run under a plain Node environment).
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

const NAMESPACE = "aptiwise.customerPlan.v1";
const INDEX_KEY = `${NAMESPACE}.index`;

function planKey(id: string): string {
  return `${NAMESPACE}.plan.${id}`;
}

// Probes real access (not just presence) — some browsers expose
// `window.localStorage` but throw on first use (private mode, quota, or
// storage disabled by policy).
function resolveDefaultBackend(): KeyValueStorage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const probeKey = "__aptiwise_storage_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

function readIndex(backend: KeyValueStorage): string[] {
  try {
    const raw = backend.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(backend: KeyValueStorage, ids: string[]) {
  backend.setItem(INDEX_KEY, JSON.stringify(ids));
}

function toSummary(plan: CustomerPlan): CustomerPlanDraftSummary {
  return {
    id: plan.id,
    customerName: plan.customer.name,
    goalType: plan.financialPicture.goal.goalType,
    family: plan.selectedStrategy.family,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

// Loads and migrates/validates one draft; returns null (never throws)
// for missing, malformed-JSON, unsupported-schema-version, or otherwise
// invalid entries — the caller decides what "not available" means for
// its use case (skip it in a list, or report "not found" for a direct
// open).
function readPlan(backend: KeyValueStorage, id: string): CustomerPlan | null {
  const raw = backend.getItem(planKey(id));
  if (raw == null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const outcome = migrateCustomerPlan(parsed);
  return outcome.status === "current" ? outcome.plan : null;
}

export interface CustomerPlanStorage {
  isAvailable(): boolean;
  saveDraft(plan: CustomerPlan): boolean;
  loadDraft(id: string): CustomerPlan | null;
  listDrafts(): CustomerPlanDraftSummary[];
  deleteDraft(id: string): boolean;
  updateDraftMetadata(id: string, metadata: { name?: string | null; phone?: string | null }): CustomerPlan | null;
}

// `backend` is optional for production call sites (resolves the real
// browser storage, or null if genuinely unavailable); tests pass an
// explicit in-memory fake, or `null` to simulate "storage unavailable".
export function createCustomerPlanStorage(backend?: KeyValueStorage | null): CustomerPlanStorage {
  const resolved = backend === undefined ? resolveDefaultBackend() : backend;

  function isAvailable(): boolean {
    return resolved != null;
  }

  function saveDraft(plan: CustomerPlan): boolean {
    if (!resolved) return false;
    try {
      resolved.setItem(planKey(plan.id), JSON.stringify(plan));
      const ids = readIndex(resolved);
      if (!ids.includes(plan.id)) {
        writeIndex(resolved, [...ids, plan.id]);
      }
      return true;
    } catch {
      return false;
    }
  }

  function loadDraft(id: string): CustomerPlan | null {
    if (!resolved) return null;
    return readPlan(resolved, id);
  }

  function listDrafts(): CustomerPlanDraftSummary[] {
    if (!resolved) return [];
    const ids = readIndex(resolved);
    const summaries: CustomerPlanDraftSummary[] = [];
    for (const id of ids) {
      const plan = readPlan(resolved, id);
      // A corrupted/unsupported individual draft is silently omitted
      // from the list — its storage entry is left untouched (never
      // auto-deleted, never auto-repaired).
      if (plan) summaries.push(toSummary(plan));
    }
    return summaries;
  }

  function deleteDraft(id: string): boolean {
    if (!resolved) return false;
    try {
      resolved.removeItem(planKey(id));
      writeIndex(resolved, readIndex(resolved).filter((existingId) => existingId !== id));
      return true;
    } catch {
      return false;
    }
  }

  function updateDraftMetadata(
    id: string,
    metadata: { name?: string | null; phone?: string | null }
  ): CustomerPlan | null {
    if (!resolved) return null;
    const plan = readPlan(resolved, id);
    if (!plan) return null;

    // Only proposal identity may change after creation — every
    // calculated field is copied through untouched (Section 17: editable
    // vs. snapshotted data).
    const updated: CustomerPlan = {
      ...plan,
      customer: {
        name: metadata.name !== undefined ? (metadata.name?.trim() ? metadata.name.trim() : null) : plan.customer.name,
        phone: metadata.phone !== undefined ? (metadata.phone?.trim() ? metadata.phone.trim() : null) : plan.customer.phone,
      },
      updatedAt: new Date().toISOString(),
    };

    if (!saveDraft(updated)) return null;
    return updated;
  }

  return { isAvailable, saveDraft, loadDraft, listDrafts, deleteDraft, updateDraftMetadata };
}
