export type Locale = "en" | "ta" | "hi";

export interface LocaleOption {
  code: Locale;
  label: string;
}

// Order shown in the language switcher.
export const LOCALES: LocaleOption[] = [
  { code: "en", label: "English" },
  { code: "ta", label: "தமிழ்" },
  { code: "hi", label: "हिन्दी" },
];

export const DEFAULT_LOCALE: Locale = "en";
