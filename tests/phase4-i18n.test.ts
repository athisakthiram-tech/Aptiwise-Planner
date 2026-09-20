// Phase 4 — localization coverage for the new combination-engine-driven
// advisor screens. Proves every new key resolves to REAL, genuinely
// translated text in English, Tamil and Hindi (never a silent English
// fallback), and that no key ever uses ranking/winner language.

import { describe, it, expect } from "vitest";
import { TRANSLATIONS, t } from "@/lib/i18n/translations";
import { Locale, LOCALES } from "@/lib/i18n/types";

const LOCALE_CODES: Locale[] = LOCALES.map((l) => l.code);

const PHASE4_PREFIXES = ["advisor.goal.", "advisor.screen2.", "advisor.role2.", "advisor.characteristic.", "advisor.screen3.", "advisor.screen4.", "advisor.script.", "advisor.disclosure."];

const PHASE4_KEYS = Object.keys(TRANSLATIONS.en).filter((k) => PHASE4_PREFIXES.some((p) => k.startsWith(p)));

describe("Phase 4 i18n — new advisor screen keys", () => {
  it("has a non-trivial Phase 4 key set", () => {
    expect(PHASE4_KEYS.length).toBeGreaterThan(50);
  });

  for (const locale of LOCALE_CODES) {
    it(`resolves every Phase 4 key to real text in ${locale}`, () => {
      for (const key of PHASE4_KEYS) {
        const value = t(key, locale);
        expect(value, `${key} missing/unresolved in ${locale}`).not.toBe(key);
        expect(value.trim().length, `${key} is empty in ${locale}`).toBeGreaterThan(0);
      }
    });
  }

  it("Tamil and Hindi are genuinely translated, not a silent copy of English", () => {
    for (const key of PHASE4_KEYS) {
      const en = t(key, "en");
      const ta = t(key, "ta");
      const hi = t(key, "hi");
      expect(ta, `${key}'s Tamil text equals English — looks untranslated`).not.toBe(en);
      expect(hi, `${key}'s Hindi text equals English — looks untranslated`).not.toBe(en);
    }
  });

  it("never uses ranking/winner/recommendation language in any locale", () => {
    const forbidden = ["best", "winner", "recommended", "optimal", "ideal", "#1", "top plan"];
    for (const locale of LOCALE_CODES) {
      for (const key of PHASE4_KEYS) {
        const value = t(key, locale).toLowerCase();
        for (const word of forbidden) {
          expect(value, `${key} in ${locale} contains "${word}"`).not.toContain(word);
        }
      }
    }
  });

  it("never mixes a currency symbol or the literal word UIN into a translation (identifiers stay untranslated, hardcoded in the component)", () => {
    for (const key of PHASE4_KEYS) {
      for (const locale of LOCALE_CODES) {
        const value = t(key, locale);
        expect(value).not.toContain("₹");
        expect(value).not.toMatch(/\bUIN\b/);
      }
    }
  });

  it("the goal picker relabels Marriage as Child Marriage and adds Regular Income, distinct from the old wizard's goals.type.* set", () => {
    expect(t("advisor.goal.marriage", "en")).toBe("Child Marriage");
    expect(t("advisor.goal.regular_income", "en")).toBe("Regular Income");
    expect(t("advisor.goal.wealth", "en")).toBe("Wealth Creation");
  });

  it("risk preference now reads Stable/Balanced/Growth", () => {
    expect(t("advisor.screen1.riskConservative", "en")).toBe("Stable");
    expect(t("advisor.screen1.riskBalanced", "en")).toBe("Balanced");
    expect(t("advisor.screen1.riskGrowth", "en")).toBe("Growth");
  });

  it("provenance language never leaks the backend enum vocabulary", () => {
    const provenanceKeys = ["advisor.screen3.guaranteedContractual", "advisor.screen3.planningEstimate", "advisor.screen3.historicalData", "advisor.screen3.illustrationNotGuaranteed"];
    for (const key of provenanceKeys) {
      for (const locale of LOCALE_CODES) {
        const value = t(key, locale);
        for (const enumWord of ["VERIFIED", "DERIVED", "ESTIMATED", "HISTORICAL", "ILLUSTRATIVE"]) {
          expect(value).not.toContain(enumWord);
        }
      }
    }
  });
});
