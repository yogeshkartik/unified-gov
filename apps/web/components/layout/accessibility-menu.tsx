"use client";

import { Accessibility, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export function AccessibilityMenu({ showLabel = false }: { showLabel?: boolean }) {
  const { highContrast, reduceMotion, setHighContrast, setReduceMotion, t } = useCitizenPreferences();
  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="sm" aria-label={t("accessibility")}>
        <Accessibility aria-hidden="true" />
        <span className={showLabel ? "inline" : "hidden lg:inline"}>{t("accessibility")}</span>
        <ChevronDown className={showLabel ? "block" : "hidden lg:block"} aria-hidden="true" />
      </Button>
      <DropdownMenu aria-label={t("accessibility")} className="w-52" onAction={(key) => { if (key === "contrast") setHighContrast(!highContrast); if (key === "motion") setReduceMotion(!reduceMotion); }}>
        <DropdownMenuItem id="contrast">{t("highContrast")}: {highContrast ? "On" : "Off"}</DropdownMenuItem>
        <DropdownMenuItem id="motion">{t("reduceMotion")}: {reduceMotion ? "On" : "Off"}</DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}
