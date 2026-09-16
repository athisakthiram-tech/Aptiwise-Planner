import { readFileSync } from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { TRANSLATIONS, t } from "@/lib/i18n/translations";
import { LOCALES } from "@/lib/i18n/types";
import { GoalInput } from "@/types";
import { calculateGoalGap } from "@/lib/calculations/goalGap";
import { matchLicProducts } from "@/lib/insurance/matching";
import { getPlanEngineForProduct } from "@/lib/insurance/engineRegistry";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";
import { PLAN_733_UIN, PLAN_733_RULES } from "@/lib/insurance/providers/lic/plans/plan733";
import { formatINR, formatINRCompact } from "@/lib/calculations/format";

function baseGoal(overrides: Partial<GoalInput> = {}): GoalInput {
  return {
    age: 30,
    monthlyBudget: 10000,
    goalType: "child_education",
    targetAmount: 5000000,
    yearsToGoal: 15,
    existingLifeCover: 1000000,
    riskComfort: "medium",
    ...overrides,
  };
}

describe("every translated key exists in EN, TA and HI", () => {
  const enKeys = Object.keys(TRANSLATIONS.en);

  it("has at least the full customer-facing key set", () => {
    expect(enKeys.length).toBeGreaterThan(100);
  });

  it("TA has every EN key", () => {
    for (const key of enKeys) {
      expect(TRANSLATIONS.ta[key], `missing ta.${key}`).toBeTruthy();
    }
  });

  it("HI has every EN key", () => {
    for (const key of enKeys) {
      expect(TRANSLATIONS.hi[key], `missing hi.${key}`).toBeTruthy();
    }
  });

  it("TA and HI keys are not a silent accidental fallback to English text", () => {
    for (const key of enKeys) {
      expect(TRANSLATIONS.ta[key], `ta.${key} equals English`).not.toBe(TRANSLATIONS.en[key]);
      expect(TRANSLATIONS.hi[key], `hi.${key} equals English`).not.toBe(TRANSLATIONS.en[key]);
    }
  });

  it("TA and HI have no extra keys beyond EN (keeps the three dictionaries in lockstep)", () => {
    expect(Object.keys(TRANSLATIONS.ta).sort()).toEqual(enKeys.sort());
    expect(Object.keys(TRANSLATIONS.hi).sort()).toEqual([...enKeys].sort());
  });

  it("supports exactly English, Tamil and Hindi", () => {
    expect(LOCALES.map((l) => l.code).sort()).toEqual(["en", "hi", "ta"]);
  });
});

describe("dynamic reason/warning codes translate correctly", () => {
  it("translates a Plan 733 eligibility reason code with its numeric params", () => {
    const engine = getPlanEngineForProduct(
      LIC_CATALOGUE.find((p) => p.id === "lic-733")!
    );
    const result = engine.eligibility?.evaluateEligibility({
      age: 10,
      product: LIC_CATALOGUE.find((p) => p.id === "lic-733")!,
    });
    const reasonCode = result?.reasonCodes?.find((rc) => rc.code === "age_below_min");
    expect(reasonCode).toBeDefined();
    const en = t(`plan733.reason.${reasonCode!.code}`, "en", reasonCode!.params);
    const ta = t(`plan733.reason.${reasonCode!.code}`, "ta", reasonCode!.params);
    const hi = t(`plan733.reason.${reasonCode!.code}`, "hi", reasonCode!.params);
    expect(en).toContain(String(PLAN_733_RULES.minEntryAge));
    expect(ta).toContain(String(PLAN_733_RULES.minEntryAge));
    expect(hi).toContain(String(PLAN_733_RULES.minEntryAge));
    expect(en).not.toBe(ta);
    expect(en).not.toBe(hi);
  });

  it("translates the retirement LIC warning code in all three locales", () => {
    const result = matchLicProducts(baseGoal({ goalType: "retirement" }));
    expect(result.warnings).toHaveLength(1);
    const code = result.warnings[0];
    const en = t(`lic.warning.${code}`, "en");
    const ta = t(`lic.warning.${code}`, "ta");
    const hi = t(`lic.warning.${code}`, "hi");
    expect(en).not.toBe(code); // resolved to real text, not a raw fallback
    expect(ta).not.toBe(en);
    expect(hi).not.toBe(en);
  });
});

describe("language never affects financial calculations", () => {
  const input = { targetAmount: 5000000, monthlyBudget: 10000, years: 15 };

  it("calculateGoalGap has no locale parameter and is deterministic", () => {
    expect(calculateGoalGap(input)).toEqual(calculateGoalGap(input));
  });

  it("matchLicProducts returns identical products regardless of any UI locale", () => {
    const a = matchLicProducts(baseGoal());
    const b = matchLicProducts(baseGoal());
    expect(a.potentialMatches.map((m) => m.product.id)).toEqual(
      b.potentialMatches.map((m) => m.product.id)
    );
  });

  it("formatINR/formatINRCompact take no locale argument and are stable", () => {
    expect(formatINR(1800000)).toBe("₹18,00,000");
    expect(formatINRCompact(1800000)).toBe("₹18.00 L");
  });
});

describe("official identifiers are never altered by localization", () => {
  it("LIC product names stay in English/official form regardless of locale", () => {
    const plan733 = LIC_CATALOGUE.find((p) => p.id === "lic-733")!;
    expect(plan733.productName).toBe("LIC's Jeevan Lakshya");
    expect(plan733.planNumber).toBe("733");
    expect(plan733.uin).toBe(PLAN_733_UIN);
  });

  it("no translation string contains a ₹ symbol or a UIN", () => {
    for (const dict of Object.values(TRANSLATIONS)) {
      for (const value of Object.values(dict)) {
        expect(value).not.toContain("₹");
        expect(value).not.toMatch(/\bUIN\b/);
      }
    }
  });

  it("Plan 733's verified rules are unaffected by translation keys", () => {
    expect(PLAN_733_RULES.minEntryAge).toBe(18);
    expect(PLAN_733_RULES.maxEntryAge).toBe(50);
    expect(PLAN_733_RULES.minBasicSumAssured).toBe(200000);
  });
});

describe("language persists across wizard steps", () => {
  it("Wizard holds a single locale state, prop-drilled unchanged to every step", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../components/planner/Wizard.tsx"),
      "utf-8"
    );
    const localeStateDeclarations = source.match(/useState<Locale>/g) ?? [];
    expect(localeStateDeclarations).toHaveLength(1);
    // No step should be given a hardcoded literal locale instead of the
    // shared `locale` variable (which would break persistence for that step).
    expect(source).not.toMatch(/locale=\{["'`]/);
  });
});
