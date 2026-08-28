"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Search, Trash2 } from "lucide-react";
import { api } from "@/src/lib/api";
import { getStoredApplications, removeStoredApplication } from "@/src/lib/application-store";
import type { ApplicationEngineResponse, ApplicationStatus, CitizenApplicationSummary } from "@/src/types";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";

type Filter = "Recent" | "Draft" | "Submitted";
type ApplicationListItem = CitizenApplicationSummary & {
  department: string;
  updated_at: string;
  engine?: ApplicationEngineResponse;
};

const actionableStatuses: ApplicationStatus[] = [
  "DRAFT",
  "ADDITIONAL_INFO_REQUIRED",
  "CONSENT_REQUIRED",
  "READY_FOR_REVIEW",
  "PAYMENT_REQUIRED",
];

function isDraft(status: ApplicationStatus) {
  return actionableStatuses.includes(status);
}

function citizenStatus(status: ApplicationStatus) {
  if (isDraft(status)) return "Draft";
  if (status === "SUBMITTED") return "Submitted";
  if (status === "PROCESSING") return "Processing";
  if (status === "COMPLETED") return "Completed";
  if (status === "REJECTED") return "Rejected";
  return "Cancelled";
}

function resumeRoute(application: ApplicationEngineResponse) {
  if (application.missing_fields.length > 0) return "additional";
  if (application.status === "DRAFT" || application.status === "CONSENT_REQUIRED") return "consent";
  if (application.status === "PAYMENT_REQUIRED") return "payment";
  return "preview";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

export function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationListItem[]>();
  const [filter, setFilter] = useState<Filter>("Draft");
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string>();
  const [deleteError, setDeleteError] = useState<string>();
  const [pendingDelete, setPendingDelete] = useState<ApplicationListItem>();

  useEffect(() => {
    const stored = getStoredApplications();
    Promise.all(stored.map(async (summary): Promise<ApplicationListItem> => {
      try {
        const application = await api.getApplication(summary.id);
        const service = await api.getService(application.service_id);
        return {
          ...summary,
          service_name: service.name,
          status: application.status,
          fee: service.fee,
          currency: service.currency,
          department: service.department,
          updated_at: application.updated_at,
          engine: application,
        };
      } catch {
        return { ...summary, department: "Government service", updated_at: summary.created_at };
      }
    })).then(setApplications);
  }, []);

  const visibleApplications = useMemo(() => applications?.filter((application) => {
    const matchesFilter = filter === "Recent" ? true : filter === "Draft" ? isDraft(application.status) : application.status === "SUBMITTED";
    const searchText = `${application.service_name} ${application.department} ${application.government_reference_number ?? ""}`.toLowerCase();
    return matchesFilter && searchText.includes(query.trim().toLowerCase());
  }).sort((first, second) => new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime()) ?? [], [applications, filter, query]);

  async function deleteDraft(application: ApplicationListItem) {
    setDeletingId(application.id);
    setDeleteError(undefined);
    try {
      await api.deleteApplication(application.id);
      removeStoredApplication(application.id);
      setApplications((current) => current?.filter((item) => item.id !== application.id));
      setPendingDelete(undefined);
    } catch {
      setDeleteError("We could not delete this draft. Please try again.");
    } finally {
      setDeletingId(undefined);
    }
  }

  function openApplication(application: ApplicationListItem) {
    if (isDraft(application.status) && application.engine) {
      router.push(`/applications/${application.id}/${resumeRoute(application.engine)}`);
      return;
    }
    router.push(`/applications/${application.id}`);
  }

  function emptyState() {
    if (query.trim()) return <EmptyState><p className="font-medium text-foreground">No applications found</p><p className="mt-1">Try changing your search or filter.</p></EmptyState>;
    if (filter === "Draft") return <EmptyState><p className="font-medium text-foreground">No draft applications</p><p className="mt-1">Applications you haven&apos;t submitted yet will appear here.</p><LinkButton href="/services" className="mt-4">Browse Government Services</LinkButton></EmptyState>;
    if (filter === "Submitted") return <EmptyState><p className="font-medium text-foreground">No submitted applications</p><p className="mt-1">Your completed applications will appear here.</p></EmptyState>;
    return <EmptyState><p className="font-medium text-foreground">No applications yet</p><p className="mt-1">Browse government services to start an application.</p><LinkButton href="/services" className="mt-4">Browse Government Services</LinkButton></EmptyState>;
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block sm:max-w-sm sm:flex-1"><span className="sr-only">Search applications</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search applications" className="min-h-11 pl-9" /></label>
      <div className="flex flex-wrap gap-2" aria-label="Filter applications"><button type="button" onClick={() => setFilter("Recent")} aria-pressed={filter === "Recent"} className={`min-h-10 rounded-full border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filter === "Recent" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}>Recent</button><button type="button" onClick={() => setFilter("Draft")} aria-pressed={filter === "Draft"} className={`min-h-10 rounded-full border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filter === "Draft" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}>Draft</button><button type="button" onClick={() => setFilter("Submitted")} aria-pressed={filter === "Submitted"} className={`min-h-10 rounded-full border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filter === "Submitted" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}>Submitted</button></div>
    </div>
    {deleteError ? <p role="alert" className="text-sm text-destructive">{deleteError}</p> : null}
    {!applications ? <LoadingState label="Loading your applications…" /> : visibleApplications.length === 0 ? emptyState() : <div className="space-y-3">{visibleApplications.map((application) => <Card key={application.id} className="border-l-4 border-l-primary py-3 sm:flex-row sm:items-center sm:gap-4"><CardHeader className="min-w-0 flex-1 px-4 sm:py-1"><div className="flex flex-wrap items-center gap-2"><CardTitle className="truncate">{application.service_name}</CardTitle><Badge variant={application.status === "SUBMITTED" ? "default" : application.status === "REJECTED" || application.status === "CANCELLED" ? "destructive" : "secondary"}>{citizenStatus(application.status)}</Badge>{application.status === "DRAFT" ? <Button type="button" variant="destructive" size="xs" aria-label={`Delete ${application.service_name} draft`} onPress={() => setPendingDelete(application)} isDisabled={deletingId === application.id}><Trash2 aria-hidden="true" />Delete</Button> : null}</div><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Landmark className="size-4" aria-hidden="true" />{application.department}</p></CardHeader><CardContent className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 text-sm sm:flex-none sm:py-1">{application.government_reference_number ? <p className="font-mono text-xs font-semibold text-muted-foreground">{application.government_reference_number}</p> : null}<p className="text-muted-foreground">{formatDate(application.updated_at)}</p><p className="font-medium">{application.fee > 0 ? `${application.currency} ${application.fee}` : "Free"}</p></CardContent><div className="px-4 sm:py-1"><Button type="button" className="w-full sm:w-auto" onPress={() => openApplication(application)}>{isDraft(application.status) ? "Continue application" : "View application"}</Button></div></Card>)}</div>}
    <Dialog isOpen={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(undefined); }}><DialogHeader><DialogTitle>Delete draft?</DialogTitle><DialogDescription>This will permanently delete the draft for {pendingDelete?.service_name}. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><DialogClose type="button">Cancel</DialogClose><Button type="button" variant="destructive" onPress={() => { if (pendingDelete) void deleteDraft(pendingDelete); }} isDisabled={!pendingDelete || deletingId === pendingDelete.id}>{deletingId ? "Deleting…" : "Delete"}</Button></DialogFooter></Dialog>
  </div>;
}
