"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AccessibilityMenu } from "@/components/layout/accessibility-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useCitizenAuth } from "@/components/providers/citizen-auth";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { signOut } = useCitizenAuth();
  function logout() { signOut(); window.sessionStorage.setItem("unified-gov-logout-notice", "true"); router.replace("/"); }
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <div className="lg:pl-64">
        <MobileNav />
        <div className="hidden min-h-16 items-center justify-end gap-1 border-b border-primary/10 bg-card/90 px-4 shadow-sm backdrop-blur sm:px-6 lg:flex">
          <LanguageSwitcher />
          <AccessibilityMenu />
          <div className="ml-2 border-l border-border pl-3 text-right text-sm"><p className="font-medium">Rahul Kumar</p><p className="text-xs text-muted-foreground">Citizen account</p></div>
          <Button variant="ghost" size="sm" onPress={logout}><LogOut aria-hidden="true" />Logout</Button>
        </div>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
