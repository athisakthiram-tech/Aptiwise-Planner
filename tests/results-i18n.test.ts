import { describe, it, expect } from "vitest";
import { t } from "@/lib/i18n/translations";
import { Locale, LOCALES } from "@/lib/i18n/types";
import {
  ALL_STRATEGY_REASON_CODES,
  FAMILY_META,
  reasonCodeI18nKey,
  categoryI18nKey,
} from "@/lib/planning/resultsViewModel";
import { InsuranceCategory } from "@/types/insurance";

const ALL_CATEGORIES: InsuranceCategory[] = [
  "term_protection",
  "savings_endowment",
  "whole_life",
  "money_back_child",
  "pension",
  "market_linked_ulip",
  "micro_insurance",
];

const LOCALE_CODES: Locale[] = LOCALES.map((l) => l.code);

function resolves(key: string, locale: Locale): boolean {
  return t(key, locale) !== key;
}

describe("Results i18n — EN/TA/HI completeness for every reason code", () => {
  for (const locale of LOCALE_CODES) {
    it(`resolves every StrategyReasonCode to real text in ${locale}`, () => {
      for (const code of ALL_STRATEGY_REASON_CODES) {
        expect(resolves(reasonCodeI18nKey(code), locale), `${reasonCodeI18nKey(code)} missing in ${locale}`).toBe(true);
      }
    });
  }
});

describe("Results i18n — EN/TA/HI completeness for every insurance category label", () => {
  for (const locale of LOCALE_CODES) {
    it(`resolves every InsuranceCategory to real text in ${locale}`, () => {
      for (const category of ALL_CATEGORIES) {
        expect(resolves(categoryI18nKey(category), locale)).toBe(true);
      }
    });
  }
});

describe("Results i18n — EN/TA/HI completeness for every strategy family", () => {
  for (const locale of LOCALE_CODES) {
    it(`resolves every family's title and blurb in ${locale}`, () => {
      for (const meta of Object.values(FAMILY_META)) {
        expect(resolves(meta.titleKey, locale)).toBe(true);
        expect(resolves(meta.blurbKey, locale)).toBe(true);
      }
    });
  }
});

describe("Results i18n — status badge keys resolve in every locale", () => {
  const statusKeys = [
    "results.status.verified",
    "results.status.illustrative",
    "results.status.partial",
    "results.status.conditional",
    "results.status.unavailable",
    "results.status.notApplicable",
  ];
  for (const locale of LOCALE_CODES) {
    it(`resolves every status key in ${locale}`, () => {
      for (const key of statusKeys) {
        expect(resolves(key, locale)).toBe(true);
      }
    });
  }
});

describe("Results i18n — critical budget-safety copy resolves in every locale", () => {
  const budgetKeys = [
    "results.budget.premiumRequiresVerification",
    "results.budget.cannotVerifyTotal",
    "results.budget.investmentBeforeAdjustment",
    "results.budget.investmentUsesFullBudgetNote",
    "results.budget.withinBudget",
    "results.budget.verifiedUsed",
  ];
  for (const locale of LOCALE_CODES) {
    it(`resolves every budget-safety key in ${locale}`, () => {
      for (const key of budgetKeys) {
        expect(resolves(key, locale)).toBe(true);
      }
    });
  }
});

describe("Results i18n — investment disclaimer wording (Section 15)", () => {
  it("uses the existing 'illustration only, not guaranteed' disclaimer text, never 'expected/likely/predicted return'", () => {
    const en = t("results.warning.illustration_only_not_guaranteed_returns", "en");
    expect(en.toLowerCase()).toContain("illustration");
    expect(en.toLowerCase()).toContain("not guaranteed");
    for (const forbidden of ["expected return", "likely return", "predicted return"]) {
      expect(en.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("never labels any investment rate scenario as preferred/best across the shared SIP disclaimer", () => {
    const en = t("sip.disclaimer", "en");
    expect(en.toLowerCase()).not.toContain("best");
    expect(en.toLowerCase()).not.toContain("recommended");
  });
});

describe("Results i18n — no ranking/recommendation wording anywhere in new results.* strings (EN)", () => {
  const FORBIDDEN = ["best", "recommended", "ideal", "winner", "top choice", "#1", "perfect for you"];

  it("scans every results.* EN value for forbidden ranking/recommendation words", () => {
    // Re-derive the same key set the app actually uses, rather than a
    // hand-maintained duplicate list, so this test can't silently drift.
    const keys = [
      ...ALL_STRATEGY_REASON_CODES.map(reasonCodeI18nKey),
      ...ALL_CATEGORIES.map(categoryI18nKey),
      ...Object.values(FAMILY_META).flatMap((m) => [m.titleKey, m.blurbKey]),
      "results.explore.title",
      "results.explore.subtitle",
      "results.compare.title",
      "results.compare.selectPrompt",
    ];
    for (const key of keys) {
      const value = t(key, "en").toLowerCase();
      for (const forbidden of FORBIDDEN) {
        expect(value, `"${key}" = "${value}" contains forbidden word "${forbidden}"`).not.toContain(forbidden);
      }
    }
  });
});
