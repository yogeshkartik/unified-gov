"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import en from "@/src/i18n/en.json";
import hi from "@/src/i18n/hi.json";
import ta from "@/src/i18n/ta.json";

type Language = "en" | "hi" | "ta";
type TextSize = "small" | "default" | "large";
type TranslationKey = keyof typeof en;
const dictionaries = { en, hi, ta };
const storageKey = "unified-gov-preferences";

interface Preferences {
  language: Language;
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  setLanguage: (language: Language) => void;
  setTextSize: (size: TextSize) => void;
  setHighContrast: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  t: (key: TranslationKey) => string;
}

const PreferencesContext = createContext<Preferences | null>(null);

export function CitizenPreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [textSize, setTextSize] = useState<TextSize>("default");
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { try { const saved: Partial<Pick<Preferences, "language" | "textSize" | "highContrast" | "reduceMotion">> = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}"); if (saved.language) setLanguage(saved.language); if (saved.textSize) setTextSize(saved.textSize); if (typeof saved.highContrast === "boolean") setHighContrast(saved.highContrast); if (typeof saved.reduceMotion === "boolean") setReduceMotion(saved.reduceMotion); } catch {} finally { setReady(true); } }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (!ready) return; document.documentElement.lang = language; document.documentElement.dataset.textSize = textSize; document.documentElement.classList.toggle("high-contrast", highContrast); document.documentElement.classList.toggle("reduce-motion", reduceMotion); window.localStorage.setItem(storageKey, JSON.stringify({ language, textSize, highContrast, reduceMotion })); }, [highContrast, language, ready, reduceMotion, textSize]);
  return <PreferencesContext.Provider value={{ language, textSize, highContrast, reduceMotion, setLanguage, setTextSize, setHighContrast, setReduceMotion, t: (key) => dictionaries[language][key] }}>{children}</PreferencesContext.Provider>;
}

export function useCitizenPreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error("useCitizenPreferences must be used inside CitizenPreferencesProvider");
  return preferences;
}
