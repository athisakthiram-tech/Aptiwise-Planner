import { describe, it, expect } from "vitest";
import { TRANSLATIONS, t } from "@/lib/i18n/translations";
import { Locale, LOCALES } from "@/lib/i18n/types";

const LOCALE_CODES: Locale[] = LOCALES.map((l) => l.code);

const CUSTOMER_PLAN_KEYS = Object.keys(TRANSLATIONS.en).filter((k) => k.startsWith("customerPlan."));

describe("customerPlan i18n — every key resolves to real text in EN/TA/HI", () => {
  it("has a non-trivial customerPlan.* key set", () => {
    expect(CUSTOMER_PLAN_KEYS.length).toBeGreaterThan(20);
  });

  for (const locale of LOCALE_CODES) {
    it(`resolves every customerPlan.* key in ${locale}`, () => {
      for (const key of CUSTOMER_PLAN_KEYS) {
        expect(t(key, locale), `${key} missing/unresolved in ${locale}`).not.toBe(key);
      }
    });
  }
});

describe("customerPlan i18n — never calls the plan/structure recommended/best/winner/optimal", () => {
  const FORBIDDEN = ["best", "recommended", "winner", "optimal", "ideal", "perfect for you", "top choice", "#1"];

  it("scans every customerPlan.* EN value for forbidden ranking/recommendation words", () => {
    for (const key of CUSTOMER_PLAN_KEYS) {
      const value = t(key, "en").toLowerCase();
      for (const forbidden of FORBIDDEN) {
        expect(value, `"${key}" = "${value}" contains forbidden word "${forbidden}"`).not.toContain(forbidden);
      }
    }
  });

  it("the proposal is only ever called 'Selected structure' or 'Customer Plan', never a recommendation", () => {
    expect(t("customerPlan.title", "en")).toBe("Customer Plan");
    expect(t("customerPlan.selectedStructure", "en")).toBe("Selected structure");
  });
});

describe("customerPlan i18n — local-device draft storage notice (Section 19)", () => {
  it("says the draft is saved on this device, not secure cloud storage", () => {
    expect(t("customerPlan.draftSavedOnDevice", "en")).toBe("Draft saved on this device.");
    const note = t("customerPlan.draftSavedNote", "en").toLowerCase();
    expect(note).toContain("this browser");
    expect(note).toContain("not in secure cloud");
  });

  it("the notice is genuinely translated (not a silent English fallback) in TA/HI", () => {
    for (const key of ["customerPlan.draftSavedOnDevice", "customerPlan.draftSavedNote"]) {
      expect(t(key, "ta")).not.toBe(t(key, "en"));
      expect(t(key, "hi")).not.toBe(t(key, "en"));
    }
  });
});

describe("customerPlan i18n — investment illustration disclosure never overstates returns", () => {
  it("the illustrative-investment disclosure never says expected/predicted/likely return", () => {
    const en = t("customerPlan.disclosure.illustrative_investment_values", "en").toLowerCase();
    expect(en).toContain("illustration");
    for (const forbidden of ["expected return", "likely return", "predicted return"]) {
      expect(en).not.toContain(forbidden);
    }
  });
});
