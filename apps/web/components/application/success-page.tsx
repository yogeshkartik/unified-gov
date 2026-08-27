"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, Landmark } from "lucide-react";
import { api } from "@/src/lib/api";
import { saveApplication } from "@/src/lib/application-store";
import type { ApplicationPreview } from "@/src/types";
import { ApplicationProgress } from "@/components/application/application-progress";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";

export function SuccessPage({ applicationId }: { applicationId: string }) {
  const searchParams = useSearchParams();
  const [preview, setPreview] = useState<ApplicationPreview>();
  const [error, setError] = useState(false);
  useEffect(() => { api.getPreview(applicationId).then((loadedPreview) => { setPreview(loadedPreview); const reference = searchParams.get("reference"); if (reference) saveApplication({ id: applicationId, service_id: String(loadedPreview.service.id), service_name: String(loadedPreview.service.name), status: "SUBMITTED", fee: loadedPreview.fee, currency: loadedPreview.currency, created_at: new Date().toISOString(), government_reference_number: reference }); }).catch(() => setError(true)); }, [applicationId, searchParams]);
  if (error) return <ErrorState>Your application was submitted, but its summary could not be loaded.</ErrorState>;
  if (!preview) return <LoadingState label="Loading submission confirmation…" />;
  const reference = searchParams.get("reference");
  return <div className="mx-auto max-w-2xl space-y-6"><ApplicationProgress currentStep={5} /><Card><CardHeader><div className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground"><CheckCircle2 className="size-6" aria-hidden="true" /></div><CardTitle className="mt-2 text-2xl">Application submitted successfully</CardTitle><p className="text-sm leading-6 text-muted-foreground">Your synthetic demo application has been submitted to the local mock government provider.</p></CardHeader><CardContent className="space-y-6"><div className="rounded-lg bg-muted p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Application reference number</p><p className="mt-1 break-all font-mono text-lg font-semibold">{reference ?? "Available in this submission session"}</p></div><dl className="space-y-4 text-sm"><div className="flex gap-3"><Landmark className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><dt className="font-medium">Service</dt><dd className="mt-1 text-muted-foreground">{String(preview.service.name ?? "Service")}</dd></div></div><div className="flex gap-3"><FileText className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><dt className="font-medium">Status</dt><dd className="mt-1 text-muted-foreground">Submitted</dd></div></div></dl><p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">This is a prototype submission. No live government system was contacted.</p><div className="flex flex-col gap-3 sm:flex-row"><LinkButton href="/dashboard" size="lg">Go to dashboard</LinkButton><LinkButton href="/services" variant="outline" size="lg">Explore more services</LinkButton></div></CardContent></Card></div>;
}
