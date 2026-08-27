import type { LucideIcon } from "lucide-react";
import { FileText, FolderOpen, LayoutDashboard, Settings, UserRound } from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  unavailable?: boolean;
}

export const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: UserRound },
  { href: "/services", label: "Government Services", icon: FileText },
  { href: "/applications", label: "My Applications", icon: FolderOpen, unavailable: true },
  { href: "/settings", label: "Settings", icon: Settings, unavailable: true },
];
