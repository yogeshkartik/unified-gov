import type { ReactNode } from "react";
import { PortalAccess } from "@/components/layout/portal-access";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalAccess>{children}</PortalAccess>;
}
