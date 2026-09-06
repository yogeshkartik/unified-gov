"use client";

import { Check, Contrast, Languages, Type } from "lucide-react";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { languageLabel, supportedLanguages } from "@/src/i18n/languages";

const sizes = ["small", "default", "large"] as const;

export function SettingsPage() {
  const preferences = useCitizenPreferences();
  return <div className="mx-auto max-w-3xl space-y-5"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Languages className="size-4 text-primary" aria-hidden="true" />{preferences.t("language")}</CardTitle><p className="text-sm text-muted-foreground">{preferences.t("languageDescription")}</p></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">{supportedLanguages.map(([code]) => <button key={code} type="button" onClick={() => preferences.setLanguage(code)} aria-pressed={preferences.language === code} className={`flex min-h-12 items-center justify-between rounded-lg border px-4 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${preferences.language === code ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>{languageLabel(code)}{preferences.language === code ? <Check className="size-4" aria-hidden="true" /> : null}</button>)}</div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Type className="size-4 text-primary" aria-hidden="true" />{preferences.t("textSize")}</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-3">{sizes.map((size) => <button key={size} type="button" onClick={() => preferences.setTextSize(size)} aria-pressed={preferences.textSize === size} className={`min-h-11 rounded-lg border px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${preferences.textSize === size ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>{preferences.t(size)}</button>)}</div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Contrast className="size-4 text-primary" aria-hidden="true" />{preferences.t("accessibility")}</CardTitle></CardHeader><CardContent className="space-y-5"><label className="flex min-h-11 items-center gap-3 text-sm"><Checkbox isSelected={preferences.highContrast} onChange={preferences.setHighContrast} />{preferences.t("highContrast")}</label><label className="flex min-h-11 items-center gap-3 text-sm"><Checkbox isSelected={preferences.reduceMotion} onChange={preferences.setReduceMotion} />{preferences.t("reduceMotion")}</label></CardContent></Card></div>;
}
