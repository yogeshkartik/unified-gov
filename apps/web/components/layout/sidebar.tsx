"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/components/layout/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex min-h-16 items-center gap-3 border-b border-border px-6 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Landmark className="size-4" aria-hidden="true" /></span>
        <span>Unified Services</span>
      </Link>
      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {navigationItems.map(({ href, label, icon: Icon, unavailable }) => {
          const selected = pathname === href;
          return unavailable ? (
            <span key={href} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground" aria-disabled="true">
              <Icon className="size-4" aria-hidden="true" /> {label}<span className="ml-auto text-[10px]">Soon</span>
            </span>
          ) : (
            <Link key={href} href={href} aria-current={selected ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="size-4" aria-hidden="true" /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-xs leading-5 text-muted-foreground">Demo citizen account<br />Synthetic data only</div>
    </aside>
  );
}
