import type { ReactNode } from "react";
import { AccessibilityMenu } from "@/components/layout/accessibility-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PrototypeBanner } from "@/components/layout/prototype-banner";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <div className="lg:pl-64">
        <MobileNav />
        <div className="hidden min-h-16 items-center justify-end gap-1 border-b border-border bg-card px-4 sm:px-6 lg:flex">
          <LanguageSwitcher />
          <AccessibilityMenu />
          <div className="ml-2 border-l border-border pl-3 text-right text-sm"><p className="font-medium">Demo Citizen</p><p className="text-xs text-muted-foreground">Synthetic account</p></div>
        </div>
        <PrototypeBanner />
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
