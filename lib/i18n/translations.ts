// Minimal in-repo translation table. No external i18n dependency.
//
// Only presentation strings live here — never financial logic, LIC
// identifiers, plan numbers, or ₹ values. Numbers are always formatted by
// lib/calculations/format.ts (Indian digit grouping), independent of
// locale, and interpolated into these strings via `vars`.

import { Locale } from "@/lib/i18n/types";

type TranslationDict = Record<string, string>;

const en: TranslationDict = {
  "common.back": "Back",
  "common.continue": "Continue",
  "common.startOver": "Start Over",
  "common.notGuaranteed": "Illustration only — not guaranteed returns",
  "common.perMonthSuffix": "/month",
  "goalGap.title": "Your Goal",
  "goalGap.neededIn": "needed in {years} years",
  "goalGap.canSetAside": "You can set aside",
  "goalGap.yourContributions": "Your own contributions",
  "goalGap.journeyTitle": "What could the journey look like?",
  "goalGap.illustration": "{rate}% illustration",
  "goalGap.ofGoal": "{percent}% of goal",
  "goalGap.goalLabel": "Goal",
  "goalGap.illustrativeValue": "Illustrative value",
  "goalGap.potentialGap": "Potential goal gap",
  "goalGap.surplus": "Above your goal",
  "goalGap.youContribute": "You contribute",
  "goalGap.illustrativeGrowth": "Illustrative growth",
  "goalGap.chooseScenario": "Choose a scenario to explore",
};

const ta: TranslationDict = {
  "common.back": "பின்செல்",
  "common.continue": "தொடரவும்",
  "common.startOver": "மீண்டும் தொடங்கு",
  "common.notGuaranteed":
    "இது ஒரு கணக்கீட்டு எடுத்துக்காட்டு மட்டுமே — வருமானத்திற்கு உத்தரவாதம் இல்லை",
  "common.perMonthSuffix": "/மாதம்",
  "goalGap.title": "உங்கள் இலக்கு",
  "goalGap.neededIn": "{years} ஆண்டுகளில் தேவை",
  "goalGap.canSetAside": "நீங்கள் ஒதுக்கக்கூடியது",
  "goalGap.yourContributions": "உங்கள் சொந்த பங்களிப்பு",
  "goalGap.journeyTitle": "இந்த பயணம் எப்படி இருக்கக்கூடும்?",
  "goalGap.illustration": "{rate}% கணக்கீடு",
  "goalGap.ofGoal": "இலக்கின் {percent}%",
  "goalGap.goalLabel": "இலக்கு",
  "goalGap.illustrativeValue": "கணக்கீட்டு மதிப்பு",
  "goalGap.potentialGap": "இலக்கை அடைய தேவையான கூடுதல் தொகை",
  "goalGap.surplus": "இலக்கை விட அதிகம்",
  "goalGap.youContribute": "நீங்கள் அளிக்கும் தொகை",
  "goalGap.illustrativeGrowth": "கணக்கீட்டு வளர்ச்சி",
  "goalGap.chooseScenario": "ஆராய ஒரு காட்சியைத் தேர்ந்தெடுக்கவும்",
};

const hi: TranslationDict = {
  "common.back": "पीछे",
  "common.continue": "आगे बढ़ें",
  "common.startOver": "फिर से शुरू करें",
  "common.notGuaranteed": "यह केवल गणना का उदाहरण है — रिटर्न की गारंटी नहीं है",
  "common.perMonthSuffix": "/माह",
  "goalGap.title": "आपका लक्ष्य",
  "goalGap.neededIn": "{years} वर्षों में आवश्यक",
  "goalGap.canSetAside": "आप हर माह इतना अलग रख सकते हैं",
  "goalGap.yourContributions": "आपका स्वयं का योगदान",
  "goalGap.journeyTitle": "यह सफर कैसा दिख सकता है?",
  "goalGap.illustration": "{rate}% उदाहरण",
  "goalGap.ofGoal": "लक्ष्य का {percent}%",
  "goalGap.goalLabel": "लक्ष्य",
  "goalGap.illustrativeValue": "अनुमानित मूल्य",
  "goalGap.potentialGap": "लक्ष्य तक पहुँचने के लिए संभावित कमी",
  "goalGap.surplus": "लक्ष्य से अधिक",
  "goalGap.youContribute": "आपका योगदान",
  "goalGap.illustrativeGrowth": "अनुमानित वृद्धि",
  "goalGap.chooseScenario": "जानने के लिए एक परिदृश्य चुनें",
};

export const TRANSLATIONS: Record<Locale, TranslationDict> = { en, ta, hi };

export function t(
  key: string,
  locale: Locale,
  vars?: Record<string, string | number>
): string {
  const template = TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
    template
  );
}
