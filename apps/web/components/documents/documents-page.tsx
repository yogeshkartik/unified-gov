"use client";

import { useEffect, useState } from "react";
import { FileBadge2, FileText, Landmark } from "lucide-react";
import { api } from "@/src/lib/api";
import type { Document, MockDigiLockerDocument } from "@/src/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/data-state";

export function DocumentsPage() {
  const [data, setData] = useState<{ documents: Document[]; digilocker: MockDigiLockerDocument[] }>();
  const [error, setError] = useState(false);
  useEffect(() => { Promise.all([api.getDocuments(), api.getDigiLockerDocuments()]).then(([documents, digilocker]) => setData({ documents, digilocker })).catch(() => setError(true)); }, []);
  if (error) return <ErrorState>Documents are unavailable. Start the demo API and try again.</ErrorState>;
  if (!data) return <LoadingState label="Loading your documents…" />;
  return <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-primary" aria-hidden="true" />My documents</CardTitle><p className="text-sm text-muted-foreground">Documents already known to your demo profile.</p></CardHeader><CardContent>{data.documents.length === 0 ? <EmptyState>No profile documents are available.</EmptyState> : <ul className="space-y-3">{data.documents.map((document) => <li key={document.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"><div><p className="text-sm font-medium">{document.name}</p><p className="mt-1 text-xs text-muted-foreground">{document.document_type.replaceAll("_", " ")}</p></div><span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">Profile</span></li>)}</ul>}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="size-4 text-primary" aria-hidden="true" />Mock DigiLocker</CardTitle><p className="text-sm text-muted-foreground">Synthetic documents only — no live DigiLocker connection.</p></CardHeader><CardContent><ul className="space-y-3">{data.digilocker.map((document) => <li key={document.id} className="flex items-start gap-3 rounded-lg border border-border p-3"><FileBadge2 className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><p className="text-sm font-medium">{document.name}</p><p className="mt-1 text-xs text-muted-foreground">{document.issuer}</p></div></li>)}</ul></CardContent></Card></div>;
}
