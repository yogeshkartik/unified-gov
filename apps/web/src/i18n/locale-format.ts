import type { Language } from "@/src/i18n/languages";

const localeByLanguage: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  kn: "kn-IN",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
};

export function localeFor(language: Language) {
  return localeByLanguage[language];
}
