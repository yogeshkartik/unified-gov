"use client";

import Link from "next/link";
import { useState } from "react";
import { Landmark, LogOut, Menu, Settings, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AccessibilityMenu } from "@/components/layout/accessibility-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { navigationItems } from "@/components/layout/navigation";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

interface MobileNavProps {
  name: string;
  email: string;
  photoUrl?: string;
  onLogout: () => void;
}

export function MobileNav({ name, email, photoUrl, onLogout }: MobileNavProps) {
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
        <Dialog className="top-0 left-0 h-full w-[86vw] max-w-80 -translate-x-0 -translate-y-0 gap-0 rounded-none p-0 data-entering:slide-in-from-left-4 data-exiting:slide-out-to-left-4 motion-reduce:data-entering:animate-none motion-reduce:data-exiting:animate-none sm:w-80 [&_[data-slot=dialog]]:grid [&_[data-slot=dialog]]:h-full [&_[data-slot=dialog]]:grid-rows-[auto_1fr_auto] [&_[data-slot=dialog]]:gap-0" showCloseButton>
          <DialogHeader className="flex-row items-center gap-2 border-b border-border px-4 py-3 pr-12">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"><Landmark className="size-4" aria-hidden="true" /></span>
            <DialogTitle>Unified Services</DialogTitle>
          </DialogHeader>
          <nav className="space-y-1 overflow-y-auto p-3" aria-label="Mobile navigation">
            {navigationItems.map(({ href, labelKey, icon: Icon }) => {
              const selected = pathname === href;
              return <Link key={href} href={href} onClick={() => setIsOpen(false)} aria-current={selected ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted")}> <Icon className="size-4" aria-hidden="true" />{t(labelKey)}</Link>;
            })}
          </nav>
          <div className="space-y-3 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-1">
              <LanguageSwitcher showLabel />
              <AccessibilityMenu showLabel />
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Avatar size="sm" className="size-9">
                <AvatarImage src={photoUrl} alt={`${name}'s profile photo`} />
                <AvatarFallback><UserRound className="size-4" aria-hidden="true" /></AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/settings" onClick={() => setIsOpen(false)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted"><Settings className="size-4" aria-hidden="true" />Settings</Link>
              <Button type="button" variant="destructive" className="min-h-10" onPress={() => { setIsOpen(false); onLogout(); }}><LogOut aria-hidden="true" />Log out</Button>
            </div>
          </div>
        </Dialog>
      </DialogTrigger>
    </header>
  );
}
