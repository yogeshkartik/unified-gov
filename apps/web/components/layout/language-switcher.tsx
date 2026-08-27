"use client";

import { ChevronDown, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="sm" aria-label="Choose language (placeholder)">
        <Languages aria-hidden="true" />
        <span className="hidden sm:inline">English</span>
        <ChevronDown className="hidden sm:block" aria-hidden="true" />
      </Button>
      <DropdownMenu aria-label="Language selection placeholder" className="w-40">
        <DropdownMenuItem id="english">English (current)</DropdownMenuItem>
        <DropdownMenuItem id="hindi" isDisabled>हिन्दी — coming soon</DropdownMenuItem>
        <DropdownMenuItem id="tamil" isDisabled>தமிழ் — coming soon</DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}
