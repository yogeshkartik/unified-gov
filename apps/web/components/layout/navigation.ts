import type { LucideIcon } from "lucide-react";
import { FileText, FolderOpen, LayoutDashboard, UserRound } from "lucide-react";

export interface NavigationItem {
  href: string;
  labelKey: "dashboard" | "profile" | "services" | "applications" | "documents" | "settings";
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/profile", labelKey: "profile", icon: UserRound },
  { href: "/services", labelKey: "services", icon: FileText },
  { href: "/applications", labelKey: "applications", icon: FolderOpen },
  { href: "/documents", labelKey: "documents", icon: FileText },
];
