"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Landmark } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/ui/data-state";
import { LinkButton } from "@/components/ui/button";
import { useCitizenAuth } from "@/components/providers/citizen-auth";

export function PortalAccess({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, session } = useCitizenAuth();
  const publicServiceRoute = pathname === "/services" || pathname.startsWith("/services/");
  useEffect(() => {
    const loggingOut = window.sessionStorage.getItem("unified-gov-logout-notice") === "true";
    if (ready && !session && !publicServiceRoute && !loggingOut) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
  }, [pathname, publicServiceRoute, ready, router, session]);
  if (!ready) return <LoadingState label="Checking your session…" />;
  if (!session && publicServiceRoute) return <div className="min-h-screen"><header className="flex min-h-16 items-center justify-between border-b border-primary/10 bg-card px-4 sm:px-8"><Link href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Landmark className="size-4" /></span>Unified Services</Link><LinkButton href="/login" size="sm">Sign in</LinkButton></header><main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main></div>;
  if (!session) return <LoadingState label="Redirecting to sign in…" />;
  return <AppShell>{children}</AppShell>;
}
