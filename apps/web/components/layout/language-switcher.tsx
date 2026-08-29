"use client";

import { ChevronDown, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export function LanguageSwitcher({ showLabel = false }: { showLabel?: boolean }) {
  const { language, setLanguage, t } = useCitizenPreferences();
  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="sm" aria-label={t("language")}>
        <Languages aria-hidden="true" />
        <span className={showLabel ? "inline" : "hidden sm:inline"}>{t(language === "en" ? "english" : "hindi")}</span>
        <ChevronDown className={showLabel ? "block" : "hidden sm:block"} aria-hidden="true" />
      </Button>
      <DropdownMenu aria-label={t("language")} className="w-40" onAction={(key) => setLanguage(String(key) as "en" | "hi")}>
        <DropdownMenuItem id="en">{t("english")}</DropdownMenuItem>
        <DropdownMenuItem id="hi">{t("hindi")}</DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}
