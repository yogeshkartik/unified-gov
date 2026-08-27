"use client";

import { Accessibility, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AccessibilityMenu() {
  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="sm" aria-label="Accessibility options (placeholder)">
        <Accessibility aria-hidden="true" />
        <span className="hidden lg:inline">Accessibility</span>
        <ChevronDown className="hidden lg:block" aria-hidden="true" />
      </Button>
      <DropdownMenu aria-label="Accessibility options placeholder" className="w-52">
        <DropdownMenuItem id="text-size" isDisabled>Text size controls — coming soon</DropdownMenuItem>
        <DropdownMenuItem id="contrast" isDisabled>High contrast — coming soon</DropdownMenuItem>
        <DropdownMenuItem id="motion" isDisabled>Reduce motion — coming soon</DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}
