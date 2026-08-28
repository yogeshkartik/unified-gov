"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, Ellipsis, Eye, Landmark, Search, Trash2 } from "lucide-react";
import { api } from "@/src/lib/api";
import { getStoredApplications, removeStoredApplication } from "@/src/lib/application-store";
import type { ApplicationEngineResponse, ApplicationStatus, CitizenApplicationSummary } from "@/src/types";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";

type Filter = "All" | "Draft" | "Submitted";
type ApplicationListItem = CitizenApplicationSummary & {
  department: string;
  updated_at: string;
  engine?: ApplicationEngineResponse;
};

const actionableStatuses: ApplicationStatus[] = ["DRAFT", "ADDITIONAL_INFO_REQUIRED", "CONSENT_REQUIRED", "READY_FOR_REVIEW", "PAYMENT_REQUIRED"];

function isDraft(status: ApplicationStatus) {
  return actionableStatuses.includes(status);
}

function statusLabel(status: ApplicationStatus) {
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

function ApplicationRow({ application, onOpen, onViewDetails, onDelete }: { application: ApplicationListItem; onOpen: (application: ApplicationListItem) => void; onViewDetails: (application: ApplicationListItem) => void; onDelete: (application: ApplicationListItem) => void }) {
  const draft = isDraft(application.status);
  const canDelete = application.status === "DRAFT";
  const viewLabel = draft ? "Continue" : "View";
  const badge = draft
    ? <Badge variant="secondary" className="bg-amber-100 text-amber-900">Draft</Badge>
    : <Badge variant="outline" className={application.status === "SUBMITTED" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : undefined}>{statusLabel(application.status)}</Badge>;

  return <article className={`grid gap-3 px-5 py-5 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-6 ${draft ? "bg-amber-50/30" : ""}`}>
    <div className="min-w-0"><p className="text-base font-medium text-foreground sm:text-sm">{application.service_name}</p><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Landmark className="size-4 shrink-0" aria-hidden="true" />{application.department}</p></div>
    <div className="flex items-center gap-2">{badge}</div>
    <div className="flex items-baseline justify-between gap-3 sm:block"><p className="text-xs text-muted-foreground sm:hidden">{application.status === "SUBMITTED" ? "Submitted" : "Updated"}</p><p className="text-sm text-muted-foreground">{formatDate(application.updated_at)}</p></div>
    <div className="flex items-center justify-between gap-2 sm:justify-end"><Button type="button" variant={draft ? "link" : "ghost"} size="sm" className={draft ? "text-primary" : "text-muted-foreground"} onPress={() => onOpen(application)}>{viewLabel}{draft ? <ArrowRight aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}</Button>{canDelete ? <DropdownMenuTrigger><Button type="button" variant="ghost" size="icon-sm" aria-label={`More actions for ${application.service_name}`}><Ellipsis aria-hidden="true" /></Button><DropdownMenu placement="bottom end"><DropdownMenuItem onAction={() => onViewDetails(application)}><Eye aria-hidden="true" />View details</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onAction={() => onDelete(application)}><Trash2 aria-hidden="true" />Delete draft</DropdownMenuItem></DropdownMenu></DropdownMenuTrigger> : null}</div>
  </article>;
}

function ApplicationList({ applications, onOpen, onViewDetails, onDelete }: { applications: ApplicationListItem[]; onOpen: (application: ApplicationListItem) => void; onViewDetails: (application: ApplicationListItem) => void; onDelete: (application: ApplicationListItem) => void }) {
  return <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-label="Applications"><div className="hidden grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-6 border-b px-5 py-3 text-xs font-medium text-muted-foreground sm:grid"><span>Application</span><span>Status</span><span>Updated</span><span className="sr-only">Action</span></div>{applications.map((application, index) => <div key={application.id} className={index > 0 ? "border-t" : undefined}><ApplicationRow application={application} onOpen={onOpen} onViewDetails={onViewDetails} onDelete={onDelete} /></div>)}</section>;
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
        return { ...summary, service_name: service.name, status: application.status, fee: service.fee, currency: service.currency, department: service.department, updated_at: application.updated_at, engine: application };
      } catch {
        return { ...summary, department: "Government service", updated_at: summary.created_at };
      }
    })).then(setApplications);
  }, []);

  const sortedApplications = useMemo(() => applications?.filter((application) => {
    const matchesFilter = filter === "All" ? true : filter === "Draft" ? isDraft(application.status) : application.status === "SUBMITTED";
    const searchText = `${application.service_name} ${application.department} ${application.government_reference_number ?? ""}`.toLowerCase();
    return matchesFilter && searchText.includes(query.trim().toLowerCase());
  }).sort((first, second) => new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime()) ?? [], [applications, filter, query]);
  const draftApplications = sortedApplications.filter((application) => isDraft(application.status));
  const historyApplications = sortedApplications.filter((application) => !isDraft(application.status));
  const counts = useMemo(() => ({ all: applications?.length ?? 0, draft: applications?.filter((application) => isDraft(application.status)).length ?? 0, submitted: applications?.filter((application) => application.status === "SUBMITTED").length ?? 0 }), [applications]);

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

  function viewDetails(application: ApplicationListItem) {
    router.push(`/applications/${application.id}`);
  }

  function emptyState() {
    if (query.trim()) return <EmptyState><p className="font-medium text-foreground">No applications found</p><p className="mt-1">Try changing your search or filter.</p></EmptyState>;
    if (filter === "Draft") return <EmptyState><p className="font-medium text-foreground">No draft applications</p><p className="mt-1">You don&apos;t have any applications waiting for completion.</p><LinkButton href="/services" className="mt-4">Browse Government Services</LinkButton></EmptyState>;
    if (filter === "Submitted") return <EmptyState><p className="font-medium text-foreground">No submitted applications</p><p className="mt-1">Submitted applications will appear here.</p></EmptyState>;
    return <EmptyState><p className="font-medium text-foreground">No applications yet</p><p className="mt-1">Browse government services to start your first application.</p><LinkButton href="/services" className="mt-4">Browse Government Services</LinkButton></EmptyState>;
  }

  const filterButton = (value: Filter, label: string, count: number) => <button type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-10 rounded-full border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}>{label} <span className="tabular-nums">{count}</span></button>;

  return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="relative block sm:max-w-sm sm:flex-1"><span className="sr-only">Search applications</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search applications" className="min-h-11 pl-9" /></label><div className="flex flex-wrap gap-2" aria-label="Filter applications">{filterButton("All", "All", counts.all)}{filterButton("Draft", "Draft", counts.draft)}{filterButton("Submitted", "Submitted", counts.submitted)}</div></div>{deleteError ? <p role="alert" className="text-sm text-destructive">{deleteError}</p> : null}{!applications ? <LoadingState label="Loading your applications…" /> : sortedApplications.length === 0 ? emptyState() : filter === "All" && draftApplications.length > 0 ? <div className="space-y-7"><section className="space-y-3"><h2 className="text-base font-semibold">Needs your attention</h2><ApplicationList applications={draftApplications} onOpen={openApplication} onViewDetails={viewDetails} onDelete={setPendingDelete} /></section>{historyApplications.length > 0 ? <section className="space-y-3"><h2 className="text-base font-semibold">Application history</h2><ApplicationList applications={historyApplications} onOpen={openApplication} onViewDetails={viewDetails} onDelete={setPendingDelete} /></section> : null}</div> : <ApplicationList applications={sortedApplications} onOpen={openApplication} onViewDetails={viewDetails} onDelete={setPendingDelete} />}<Dialog isOpen={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(undefined); }}><DialogHeader><DialogTitle>Delete draft?</DialogTitle><DialogDescription>This will permanently delete the draft for {pendingDelete?.service_name}. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><DialogClose type="button">Cancel</DialogClose><Button type="button" variant="destructive" onPress={() => { if (pendingDelete) void deleteDraft(pendingDelete); }} isDisabled={!pendingDelete || deletingId === pendingDelete.id}>{deletingId ? "Deleting…" : "Delete"}</Button></DialogFooter></Dialog></div>;
}
