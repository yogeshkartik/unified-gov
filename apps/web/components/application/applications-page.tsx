"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FolderOpen, Trash2 } from "lucide-react";
import { api } from "@/src/lib/api";
import { getStoredApplications, removeStoredApplication } from "@/src/lib/application-store";
import type { CitizenApplicationSummary } from "@/src/types";
import { ApplicationStatusBadge } from "@/components/application/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/data-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ApplicationsPage() {
  const [applications, setApplications] = useState<CitizenApplicationSummary[]>([]);
  const [deletingId, setDeletingId] = useState<string>();
  const [deleteError, setDeleteError] = useState<string>();
  const [pendingDelete, setPendingDelete] = useState<CitizenApplicationSummary>();
  useEffect(() => { const timer = window.setTimeout(() => setApplications(getStoredApplications()), 0); return () => window.clearTimeout(timer); }, []);
  async function deleteDraft(application: CitizenApplicationSummary) {
    setDeletingId(application.id);
    setDeleteError(undefined);
    try {
      await api.deleteApplication(application.id);
      removeStoredApplication(application.id);
      setApplications((current) => current.filter((item) => item.id !== application.id));
      setPendingDelete(undefined);
    } catch {
      setDeleteError("We could not delete this draft. Please try again.");
    } finally {
      setDeletingId(undefined);
    }
  }
  if (applications.length === 0) return <EmptyState>No applications have been created yet. Start from Government Services to create an application.</EmptyState>;
  return <><div className="grid gap-4">{deleteError ? <p role="alert" className="text-sm text-destructive">{deleteError}</p> : null}{applications.map((application) => <Card key={application.id}><CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>{application.service_name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Created {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(application.created_at))}</p></div><div className="flex items-center gap-2"><ApplicationStatusBadge status={application.status} />{application.status === "DRAFT" ? <Button variant="destructive" size="sm" onPress={() => setPendingDelete(application)} isDisabled={deletingId === application.id}><Trash2 aria-hidden="true" />Delete</Button> : null}</div></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{application.fee > 0 ? `${application.currency} ${application.fee}` : "Free service"}{application.government_reference_number ? ` · ${application.government_reference_number}` : ""}</p><Link href={`/applications/${application.id}`} className="min-h-10 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View application <FolderOpen className="ml-1 inline size-4" aria-hidden="true" /></Link></CardContent></Card>)}</div><Dialog isOpen={Boolean(pendingDelete)} onOpenChange={(isOpen) => { if (!isOpen) setPendingDelete(undefined); }}><DialogHeader><DialogTitle>Delete draft?</DialogTitle><DialogDescription>This will permanently delete the draft for {pendingDelete?.service_name}. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><DialogClose>Cancel</DialogClose><Button variant="destructive" onPress={() => { if (pendingDelete) void deleteDraft(pendingDelete); }} isDisabled={!pendingDelete || deletingId === pendingDelete.id}>{deletingId ? "Deleting…" : "Delete"}</Button></DialogFooter></Dialog></>;
}
