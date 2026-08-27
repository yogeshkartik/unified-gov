"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Landmark } from "lucide-react";
import { api } from "@/src/lib/api";
import { getStoredApplications } from "@/src/lib/application-store";
import type { ApplicationEngineResponse, GovernmentServiceDetail } from "@/src/types";
import { ApplicationTimeline } from "@/components/application/application-timeline";
import { ApplicationStatusBadge } from "@/components/application/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";

function nextRoute(application: ApplicationEngineResponse) {
  if (application.missing_fields.length > 0) return "additional";
  if (application.status === "DRAFT" || application.status === "CONSENT_REQUIRED") return "consent";
  if (application.status === "PAYMENT_REQUIRED") return "payment";
  return "preview";
}

export function ApplicationDetailPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [data, setData] = useState<{ application: ApplicationEngineResponse; service: GovernmentServiceDetail }>();
  const [error, setError] = useState(false);
  useEffect(() => { api.getApplication(applicationId).then(async (application) => setData({ application, service: await api.getService(application.service_id) })).catch(() => setError(true)); }, [applicationId]);
  if (error) return <ErrorState>This application could not be loaded. It may no longer be available in the demo API.</ErrorState>;
  if (!data) return <LoadingState label="Loading application details…" />;
  const stored = getStoredApplications().find((item) => item.id === applicationId);
  return <div className="mx-auto max-w-3xl space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-medium text-primary">Application</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{data.service.name}</h1><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Landmark className="size-4" aria-hidden="true" />{data.service.department}</p></div><ApplicationStatusBadge status={data.application.status} /></div>{stored?.government_reference_number ? <Card><CardContent className="pt-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reference number</p><p className="mt-1 font-mono font-semibold">{stored.government_reference_number}</p></CardContent></Card> : null}<div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Application details</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Created {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(data.application.created_at))}</p><p className="text-sm text-muted-foreground">Fee: {data.service.fee > 0 ? `${data.service.currency} ${data.service.fee}` : "Free"}</p><Button onPress={() => router.push(`/applications/${applicationId}/${nextRoute(data.application)}`)}>Continue application</Button></CardContent></Card><Card><CardHeader><CardTitle>Application timeline</CardTitle></CardHeader><CardContent><ApplicationTimeline status={data.application.status} /></CardContent></Card></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-primary" aria-hidden="true" />Additional information</CardTitle></CardHeader><CardContent>{Object.keys(data.application.answers).length === 0 ? <p className="text-sm text-muted-foreground">No service-specific information has been saved.</p> : <dl className="grid gap-4 sm:grid-cols-2">{Object.entries(data.application.answers).map(([key, value]) => <div key={key}><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{key.replaceAll("_", " ")}</dt><dd className="mt-1 text-sm">{String(value)}</dd></div>)}</dl>}</CardContent></Card></div>;
}
