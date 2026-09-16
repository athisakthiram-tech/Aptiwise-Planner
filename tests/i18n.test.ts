import { describe, it, expect } from "vitest";
import { TRANSLATIONS, t } from "@/lib/i18n/translations";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/types";

const GOAL_GAP_KEYS = [
  "common.back",
  "common.continue",
  "common.startOver",
  "common.notGuaranteed",
  "common.perMonthSuffix",
  "goalGap.title",
  "goalGap.neededIn",
  "goalGap.canSetAside",
  "goalGap.yourContributions",
  "goalGap.journeyTitle",
  "goalGap.illustration",
  "goalGap.ofGoal",
  "goalGap.goalLabel",
  "goalGap.illustrativeValue",
  "goalGap.potentialGap",
  "goalGap.surplus",
  "goalGap.youContribute",
  "goalGap.illustrativeGrowth",
  "goalGap.chooseScenario",
];

describe("translation coverage", () => {
  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("supports exactly English, Tamil and Hindi", () => {
    expect(LOCALES.map((l) => l.code).sort()).toEqual(["en", "hi", "ta"]);
  });

  it("has every Goal Gap key present in en, ta and hi", () => {
    for (const key of GOAL_GAP_KEYS) {
      expect(TRANSLATIONS.en[key]).toBeTruthy();
      expect(TRANSLATIONS.ta[key]).toBeTruthy();
      expect(TRANSLATIONS.hi[key]).toBeTruthy();
    }
  });

  it("produces a different string per locale for the same key", () => {
    const en = t("common.notGuaranteed", "en");
    const ta = t("common.notGuaranteed", "ta");
    const hi = t("common.notGuaranteed", "hi");
    expect(en).not.toBe(ta);
    expect(en).not.toBe(hi);
    expect(ta).not.toBe(hi);
  });

  it("interpolates variables into the translated template", () => {
    expect(t("goalGap.neededIn", "en", { years: 15 })).toBe("needed in 15 years");
    expect(t("goalGap.neededIn", "hi", { years: 15 })).toContain("15");
    expect(t("goalGap.ofGoal", "ta", { percent: 68 })).toContain("68");
  });

  it("falls back to English then the key itself for an unknown key", () => {
    expect(t("does.not.exist", "ta")).toBe("does.not.exist");
  });

  it("never mixes LIC identifiers or currency symbols into translations", () => {
    for (const dict of Object.values(TRANSLATIONS)) {
      for (const value of Object.values(dict)) {
        expect(value).not.toContain("₹");
        expect(value).not.toMatch(/\bUIN\b/);
      }
    }
  });
});
