// Section 12 — a safe, deterministic filename for the downloadable
// proposal, built only from what the frozen CustomerPlan already knows.
// Kept in English/ASCII words for the goal segment (matching the task's
// own worked example) since a filename must stay safe across every OS
// regardless of the proposal's own display language; the customer's
// name is kept as-is (Unicode-safe) with only genuinely unsafe
// characters stripped.

import { CustomerPlan } from "@/lib/customerPlan/types";
import { GoalType } from "@/types";

const GOAL_SEGMENT_EN: Record<GoalType, string> = {
  child_education: "Child-Education",
  home: "Home",
  marriage: "Marriage",
  retirement: "Retirement",
  wealth: "Wealth",
  family_protection: "Family-Protection",
};

const MAX_SEGMENT_LENGTH = 40;
const MAX_BASENAME_LENGTH = 120;

// Strips control characters and every character reserved/forbidden in
// filenames on Windows/macOS/Linux, collapses whitespace to a single
// hyphen, and trims stray separators — but never strips non-ASCII
// letters, so a Tamil/Hindi customer name stays intact.
function sanitizeSegment(raw: string): string {
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return cleaned.slice(0, MAX_SEGMENT_LENGTH);
}

export function buildProposalFilename(plan: CustomerPlan, options?: { extension?: string }): string {
  const extension = (options?.extension ?? "pdf").replace(/^\.+/, "");
  const datePart = /^\d{4}-\d{2}-\d{2}/.test(plan.createdAt) ? plan.createdAt.slice(0, 10) : new Date(plan.createdAt).toISOString().slice(0, 10);

  const rawName = plan.customer.name?.trim();
  const goalType = plan.financialPicture.goal.goalType;
  const goalSegment = goalType ? GOAL_SEGMENT_EN[goalType] : "Plan";

  const base = rawName
    ? `Aptiwise_${sanitizeSegment(rawName) || "Customer"}_${goalSegment}_${datePart}`
    : `Aptiwise_Customer_Plan_${datePart}`;

  const truncatedBase = base.length > MAX_BASENAME_LENGTH ? base.slice(0, MAX_BASENAME_LENGTH).replace(/[-_]+$/, "") : base;

  return `${truncatedBase}.${extension}`;
}
