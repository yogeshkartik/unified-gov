"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { AccessibilityMenu } from "@/components/layout/accessibility-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCitizenAuth } from "@/components/providers/citizen-auth";
import { api } from "@/src/lib/api";
import type { CitizenProfile, Document } from "@/src/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { signOut } = useCitizenAuth();
  const [profile, setProfile] = useState<CitizenProfile>();
  const [profilePhoto, setProfilePhoto] = useState<Document>();

  const loadAccount = useCallback(async () => {
    try {
      const [nextProfile, documents] = await Promise.all([
        api.getProfile(),
        api.getDocuments(),
      ]);
      setProfile(nextProfile);
      setProfilePhoto(
        documents.find((document) => document.document_type === "PROFILE_PHOTO"),
      );
    } catch {
      // The account menu keeps its synthetic fallback while the API is unavailable.
    }
  }, []);

  useEffect(() => {
    const refresh = () => void loadAccount();
    const initial = window.setTimeout(refresh, 0);
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 2000);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
    };
  }, [loadAccount]);

  function navigate(path: string) {
    router.push(path);
  }

  function logout() {
    signOut();
    window.sessionStorage.setItem("unified-gov-logout-notice", "true");
    router.replace("/");
  }

  const name = profile?.full_name ?? "Rahul Kumar";
  const email = profile?.email ?? "rahul.kumar@example.com";
  const photoUrl = profilePhoto
    ? `${apiBaseUrl}/api/profile/documents/${profilePhoto.id}/file?v=${encodeURIComponent(profilePhoto.updated_at)}`
    : undefined;

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <div className="lg:pl-64">
        <MobileNav />
        <div className="sticky top-16 z-30 flex min-h-14 items-center justify-end gap-1 border-b border-primary/10 bg-card px-3 shadow-sm sm:px-6 lg:top-0 lg:z-40 lg:min-h-16">
          <LanguageSwitcher />
          <AccessibilityMenu />
          <span className="mx-2 h-8 w-px bg-border" aria-hidden="true" />
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              className="max-w-52 gap-2 px-2"
              aria-label={`Open account menu for ${name}`}
            >
              <Avatar size="sm" className="size-8">
                <AvatarImage src={photoUrl} alt={`${name}'s profile photo`} />
                <AvatarFallback>
                  <UserRound className="size-4" aria-hidden="true" />
                  <span className="sr-only">Profile avatar</span>
                </AvatarFallback>
              </Avatar>
              <span className="hidden truncate font-medium xl:inline">{name}</span>
              <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
            </Button>
            <DropdownMenu placement="bottom end" className="w-64">
              <DropdownMenuLabel className="px-2 py-2">
                <span className="block truncate text-sm font-medium text-foreground">{name}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onAction={() => navigate("/settings")}>
                <Settings aria-hidden="true" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onAction={logout}>
                <LogOut aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenu>
          </DropdownMenuTrigger>
        </div>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
