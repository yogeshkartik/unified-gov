"use client";

import { ChevronDown, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useCitizenPreferences();
  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="sm" aria-label={t("language")}>
        <Languages aria-hidden="true" />
        <span className="hidden sm:inline">{t(language === "en" ? "english" : language === "hi" ? "hindi" : "tamil")}</span>
        <ChevronDown className="hidden sm:block" aria-hidden="true" />
      </Button>
      <DropdownMenu aria-label={t("language")} className="w-40" onAction={(key) => setLanguage(String(key) as "en" | "hi" | "ta")}>
        <DropdownMenuItem id="en">{t("english")}</DropdownMenuItem>
        <DropdownMenuItem id="hi">{t("hindi")}</DropdownMenuItem>
        <DropdownMenuItem id="ta">{t("tamil")}</DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}
