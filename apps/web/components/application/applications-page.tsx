"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import { getStoredApplications } from "@/src/lib/application-store";
import type { CitizenApplicationSummary } from "@/src/types";
import { ApplicationStatusBadge } from "@/components/application/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/data-state";

export function ApplicationsPage() {
  const [applications, setApplications] = useState<CitizenApplicationSummary[]>([]);
  useEffect(() => { const timer = window.setTimeout(() => setApplications(getStoredApplications()), 0); return () => window.clearTimeout(timer); }, []);
  if (applications.length === 0) return <EmptyState>No applications have been created in this browser yet. Start from Government Services to create a demo application.</EmptyState>;
  return <div className="grid gap-4">{applications.map((application) => <Card key={application.id}><CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>{application.service_name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Created {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(application.created_at))}</p></div><ApplicationStatusBadge status={application.status} /></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{application.fee > 0 ? `${application.currency} ${application.fee}` : "Free service"}{application.government_reference_number ? ` · ${application.government_reference_number}` : ""}</p><Link href={`/applications/${application.id}`} className="min-h-10 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View application <FolderOpen className="ml-1 inline size-4" aria-hidden="true" /></Link></CardContent></Card>)}</div>;
}
