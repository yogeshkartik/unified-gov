"use client";

import Link from "next/link";
import { useState } from "react";
import { Landmark, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { navigationItems } from "@/components/layout/navigation";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useCitizenPreferences();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex min-h-16 w-full items-center justify-between border-b border-border bg-card px-4 shadow-sm lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"><Landmark className="size-4" aria-hidden="true" /></span>
        Unified Services
      </Link>
      <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button variant="outline" size="icon" aria-label="Open navigation menu"><Menu aria-hidden="true" /></Button>
        <Dialog className="top-0 left-0 h-full max-w-[min(20rem,calc(100%-2rem))] -translate-x-0 -translate-y-0 rounded-none p-0 sm:max-w-sm" showCloseButton>
          <DialogHeader className="border-b border-border p-5 pr-12">
            <DialogTitle>Navigation</DialogTitle>
            <DialogDescription>Browse your citizen services portal.</DialogDescription>
          </DialogHeader>
          <nav className="space-y-1 p-3" aria-label="Mobile navigation">
            {navigationItems.map(({ href, labelKey, icon: Icon }) => <Link key={href} href={href} onClick={() => setIsOpen(false)} aria-current={pathname === href ? "page" : undefined} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon className="size-4" aria-hidden="true" />{t(labelKey)}</Link>)}
          </nav>
        </Dialog>
      </DialogTrigger>
    </header>
  );
}
