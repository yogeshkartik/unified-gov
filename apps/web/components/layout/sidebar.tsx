"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/components/layout/navigation";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useCitizenPreferences();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex min-h-16 items-center gap-3 border-b border-sidebar-border px-6 font-semibold text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm"><Landmark className="size-4" aria-hidden="true" /></span>
        <span>{t("appShortName")}</span>
      </Link>
      <nav className="flex-1 space-y-1 p-3" aria-label={t("appNavigation")}>
        {navigationItems.map(({ href, labelKey, icon: Icon }) => {
          const selected = pathname === href;
          return <Link key={href} href={href} aria-current={selected ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
            <Icon className="size-4" aria-hidden="true" /> {t(labelKey)}
          </Link>;
        })}
      </nav>
    </aside>
  );
}
