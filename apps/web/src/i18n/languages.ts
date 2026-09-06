export const supportedLanguages = [
  ["en", "English", "English"], ["hi", "Hindi", "हिन्दी"], ["kn", "Kannada", "ಕನ್ನಡ"], ["te", "Telugu", "తెలుగు"], ["ta", "Tamil", "தமிழ்"], ["bn", "Bengali", "বাংলা"],
] as const satisfies readonly (readonly [string, string, string])[];

export type Language = (typeof supportedLanguages)[number][0];
export function isSupportedLanguage(value: string): value is Language { return supportedLanguages.some(([code]) => code === value); }
export function languageLabel(code: Language) { const language = supportedLanguages.find(([languageCode]) => languageCode === code)!; return language[1] === language[2] ? language[1] : `${language[1]} — ${language[2]}`; }
