// Integration audit regression tests (Tasks 2/3/4/13/14) — these guard
// against the specific bugs this audit found from silently coming back:
// the old Step 12 screen, its "coming next" placeholders, and the
// legacy hardcoded strategy-allocation percentage leaking into the new,
// engine-backed customer planning journey.

import { existsSync, readFileSync } from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { TRANSLATIONS } from "@/lib/i18n/translations";

const ROOT = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return readFileSync(path.resolve(ROOT, relativePath), "utf-8");
}

describe("Task 2/13 — the obsolete Step 12 screen is gone, not just hidden", () => {
  it("Step8Final.tsx no longer exists in the codebase", () => {
    expect(existsSync(path.resolve(ROOT, "components/planner/Step8Final.tsx"))).toBe(false);
  });

  it("Wizard.tsx no longer imports or renders Step8Final (a code comment documenting the removal is fine)", () => {
    const wizardSrc = read("components/planner/Wizard.tsx");
    expect(wizardSrc).not.toMatch(/import\s*\{\s*Step8Final/);
    expect(wizardSrc).not.toMatch(/<Step8Final/);
  });

  it("Wizard.tsx's final step is PlannerResults, and TOTAL_STEPS is 12", () => {
    const wizardSrc = read("components/planner/Wizard.tsx");
    expect(wizardSrc).toMatch(/TOTAL_STEPS\s*=\s*12/);
    expect(wizardSrc).toMatch(/step === 12 && <PlannerResults/);
  });

  it("no 'coming next'/'not available in this preview' placeholder text remains in any locale", () => {
    for (const [locale, dict] of Object.entries(TRANSLATIONS)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.toLowerCase(), `${locale}.${key} still contains a 'coming next' placeholder`).not.toContain(
          "coming next"
        );
        expect(value.toLowerCase(), `${locale}.${key} still contains a preview placeholder`).not.toContain(
          "not available in this preview"
        );
      }
    }
  });

  it("no 'finalPlan.*' translation keys remain (Step8Final's dedicated, now-dead key namespace)", () => {
    const finalPlanKeys = Object.keys(TRANSLATIONS.en).filter((k) => k.startsWith("finalPlan."));
    expect(finalPlanKeys).toEqual([]);
  });
});

describe("Task 4 — the legacy hardcoded strategy-allocation percentage never reaches the new customer planning journey", () => {
  const NEW_JOURNEY_DIRS = ["components/planner/results", "components/customerPlan", "lib/customerPlan", "lib/planning"];

  it("growthAllocationPct (lib/recommendations/strategies.ts's static illustrative split) is never referenced anywhere in the new engine-backed journey", () => {
    for (const dir of NEW_JOURNEY_DIRS) {
      const dirPath = path.resolve(ROOT, dir);
      if (!existsSync(dirPath)) continue;
      const files = walk(dirPath).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
      for (const file of files) {
        const src = readFileSync(file, "utf-8");
        expect(src, `${path.relative(ROOT, file)} references growthAllocationPct`).not.toMatch(/growthAllocationPct/);
      }
    }
  });

  it("getStrategyById (the old 3-item STRATEGIES catalog lookup) is never referenced anywhere in the new engine-backed journey", () => {
    for (const dir of NEW_JOURNEY_DIRS) {
      const dirPath = path.resolve(ROOT, dir);
      if (!existsSync(dirPath)) continue;
      const files = walk(dirPath).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
      for (const file of files) {
        const src = readFileSync(file, "utf-8");
        expect(src, `${path.relative(ROOT, file)} references getStrategyById`).not.toMatch(/getStrategyById/);
      }
    }
  });
});

function walk(dir: string): string[] {
  const { readdirSync, statSync } = require("fs") as typeof import("fs");
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}
